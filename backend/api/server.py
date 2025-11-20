# backend/api/server.py
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, UploadFile, File, Request, Query
import re
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordBearer
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import razorpay
import base64
import json
import time 
import cloudinary
import cloudinary.uploader
import cloudinary.api
from pymongo import ASCENDING, DESCENDING
import math

# --- IMPORTS FOR SECURITY ---
# REMOVED: fastapi_limiter, redis.asyncio.Redis (from previous step's fix)
from jose import JWTError, jwt
from passlib.context import CryptContext
import httpx
# --- END IMPORTS ---


ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# --- Auth & Security Configuration ---
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-fallback-secret-key-please-change-me')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days
FRONTEND_URL = os.environ.get('REACT_APP_URL', 'http://localhost:3000')

# REMOVED: REDIS_URL configuration

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
security = HTTPBearer()
# --- END AUTH CONFIG ---


# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL') 
db = client[os.environ['DB_NAME']]

# Razorpay client
razorpay_client = razorpay.Client(auth=(os.environ.get('RAZORPAY_KEY_ID', 'rzp_test_key'), os.environ.get('RAZORPAY_KEY_SECRET', 'rzp_test_secret')))

# Configure Cloudinary
cloudinary.config(
    cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key = os.environ.get('CLOUDINARY_API_KEY'),
    api_secret = os.environ.get('CLOUDINARY_API_SECRET')
)

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# --- Startup Event: Initialize Rate Limiter ---
@app.on_event("startup")
async def startup_event():
    # Rate Limiting initialization is currently skipped to bypass Redis dependency.
    try:
        # Placeholder for future Redis connection
        logger.info("Rate Limiting initialization skipped.")
    except Exception as e:
        logger.error(f"Failed to initialize Rate Limiting: {e}")

# --- Password & JWT Helper Functions ---

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def hash_password(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def generate_slug(name: str) -> str:
    """Generates a URL-friendly slug from the product name."""
    name = name.lower()
    # Remove non-alphanumeric characters (except spaces and hyphens)
    name = re.sub(r'[^a-z0-9\s-]', '', name).strip()
    # Replace spaces with hyphens
    name = re.sub(r'[\s]+', '-', name)
    return name

# --- END HELPERS ---


# --- Auth dependency ---

class TokenData(BaseModel):
    user_id: Optional[str] = None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id)
    except JWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"_id": token_data.user_id})
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# --- Admin-only dependency ---
async def verify_admin(current_user: dict = Depends(get_current_user)):
    if not ADMIN_EMAIL:
        raise HTTPException(status_code=500, detail="Admin email not configured")
    
    if current_user.get('email') != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return current_user

# --- END DEPENDENCIES ---


# --- ALL MODELS ---

class ProductImage(BaseModel):
    url: str
    alt: str = ""

class ProductVariant(BaseModel):
    color: str
    color_code: str
    sizes: Dict[str, int]

class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    mrp: Optional[float] = None
    price: float
    slug: str # ADDED: URL-friendly slug
    fit: str = Field(..., description="Shirt fit type.") # ADDED: Fit field
    images: List[ProductImage]
    variants: List[ProductVariant]
    category: str = "shirts"
    featured: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PaginatedProducts(BaseModel):
    products: List[Product]
    total_products: int
    total_pages: int
    current_page: int

class ProductCreate(BaseModel):
    name: str = Field(..., min_length=3, max_length=100) # VALIDATION ADDED
    description: str = Field(..., min_length=10) # VALIDATION ADDED
    mrp: Optional[float] = Field(None, gt=0, description="Maximum Retail Price, must be positive.") # VALIDATION ADDED
    price: float = Field(..., gt=0, description="Sale Price, must be positive.") # VALIDATION ADDED
    fit: str = Field(..., pattern="^(Slim Fit|Regular Fit|Relaxed Fit|Tailored Fit)$") # ADDED: Fit field with validation
    images: List[ProductImage]
    variants: List[ProductVariant]
    category: str = "shirts"
    featured: bool = False
    
# NEW MODELS: Coupon Management
class Coupon(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    code: str
    discount_type: str = Field(..., pattern="^(fixed|percentage)$") # "fixed" or "percentage"
    discount_value: float
    min_purchase: float = 0.0
    expiry_date: Optional[str] = None
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    
class CouponCreate(BaseModel):
    code: str = Field(..., min_length=3, max_length=15, pattern="^[A-Z0-9]+$") # VALIDATION ADDED
    discount_type: str = Field(..., pattern="^(fixed|percentage)$")
    discount_value: float = Field(..., gt=0) # VALIDATION ADDED
    min_purchase: float = Field(0.0, ge=0) # VALIDATION ADDED
    expiry_date: Optional[str] = None

class CouponValidation(BaseModel):
    code: str
    total_amount: float
    
class CouponResponse(BaseModel):
    code: str
    discount_type: str
    discount_value: float
    discount_amount: float
    new_total: float
    message: str

class Review(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    user_id: str
    user_name: str
    rating: int = Field(..., ge=1, le=5) # VALIDATION ADDED
    comment: str = Field(..., min_length=10, max_length=500) # VALIDATION ADDED
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ReviewCreate(BaseModel):
    product_id: str
    rating: int
    comment: str

class OrderItem(BaseModel):
    product_id: str
    product_name: str
    color: str
    size: str
    quantity: int
    price: float

class ShippingAddress(BaseModel):
    name: str = ""
    phone: str = ""
    address_line1: str = ""
    address_line2: Optional[str] = ""
    city: str = ""
    state: str = ""
    postal_code: str = ""
    country: str = "India"

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_email: str
    items: List[OrderItem]
    shipping_address: ShippingAddress
    total_amount: float
    discount_amount: float = 0.0
    final_amount: float = Field(..., description="Total amount after discount")
    coupon_code: Optional[str] = None
    tracking_number: Optional[str] = None
    courier: Optional[str] = None
    status: str = Field("pending", pattern="^(pending|processing|shipped|delivered|cancelled|abandoned)$") # MODIFIED: Added abandoned
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class OrderUpdateAdmin(BaseModel):
    status: str = Field(..., pattern="^(pending|processing|shipped|delivered|cancelled|abandoned)$") # MODIFIED: Added abandoned
    tracking_number: Optional[str] = None
    courier: Optional[str] = None


class OrderCreate(BaseModel):
    items: List[OrderItem]
    shipping_address: ShippingAddress
    total_amount: float
    coupon_code: Optional[str] = None

class PaymentVerification(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    order_id: str

class LandingPageSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "landing_page"
    hero_media: Optional[str] = None
    hero_media_type: str = "image"
    hero_title: str = "Welcome to Fifth Beryl"
    hero_subtitle: str = "Elevate your style with our premium collection of handcrafted shirts."
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class LandingPageUpdate(BaseModel):
    hero_media: Optional[str] = None
    hero_media_type: str = "image"
    hero_title: Optional[str] = None
    hero_subtitle: Optional[str] = None
    
class UploadSignature(BaseModel):
    timestamp: int
    signature: str

class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str = Field(..., min_length=8) # VALIDATION ADDED

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str = Field(alias="_id")
    email: str
    name: str
    shipping_address: Optional[ShippingAddress] = Field(default_factory=ShippingAddress)
    wishlist: List[str] = Field(default_factory=list)
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    
class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    shipping_address: Optional[ShippingAddress] = None

class WishlistUpdate(BaseModel):
    product_id: str
    
# NEW MODEL: Ticker Settings
class TickerSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "ticker_settings"
    text: str = "Free Shipping on all orders above ₹999! | Use code: WELCOME10 for 10% off."
    is_active: bool = True
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    
class TickerUpdate(BaseModel):
    text: Optional[str] = None
    is_active: Optional[bool] = None
    
class CleanupRequest(BaseModel):
    collections: List[str] = Field(..., description="List of collection names to clear.")

# --- END MODELS ---


# --- Coupon Helper Function ---
async def apply_coupon_discount(total_amount: float, code: str):
    coupon = await db.coupons.find_one({"code": code.upper()})
    
    if not coupon or not coupon.get('is_active', True):
        return total_amount, 0.0, None, "Coupon not found or inactive"
    
    # Check expiry
    expiry_date_str = coupon.get('expiry_date')
    if expiry_date_str:
        try:
            expiry_date = datetime.fromisoformat(expiry_date_str)
            if datetime.now(timezone.utc) > expiry_date:
                return total_amount, 0.0, None, "Coupon expired"
        except ValueError:
            pass # Ignore invalid date format

    # Check minimum purchase
    min_purchase = coupon.get('min_purchase', 0.0)
    if total_amount < min_purchase:
        return total_amount, 0.0, None, f"Minimum purchase of ₹{min_purchase:.2f} required"

    discount_type = coupon.get('discount_type', 'fixed')
    discount_value = coupon.get('discount_value', 0.0)
    
    discount_amount = 0.0
    
    if discount_type == 'fixed':
        discount_amount = discount_value
    elif discount_type == 'percentage':
        discount_amount = total_amount * (discount_value / 100.0)
        
    final_amount = max(0.0, total_amount - discount_amount)
    
    return final_amount, discount_amount, coupon, "Coupon applied successfully"


# --- Ticker Routes ---
ticker_router = APIRouter(prefix="/api/ticker")

@ticker_router.get("/", response_model=TickerSettings)
async def get_ticker_settings():
    settings = await db.ticker_settings.find_one({"id": "ticker_settings"}, {"_id": 0})
    if not settings:
        default_settings = TickerSettings()
        await db.ticker_settings.insert_one(default_settings.model_dump())
        return default_settings.model_dump()
    return settings

@ticker_router.put("/", response_model=TickerSettings)
async def update_ticker_settings(settings: TickerUpdate, user: dict = Depends(verify_admin)):
    update_data = {k: v for k, v in settings.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.ticker_settings.update_one(
        {"id": "ticker_settings"},
        {"$set": update_data},
        upsert=True
    )
    updated_settings = await db.ticker_settings.find_one({"id": "ticker_settings"}, {"_id": 0})
    return updated_settings


# --- Coupon Routes ---
coupon_router = APIRouter(prefix="/api/coupons")

@coupon_router.post("/validate", response_model=CouponResponse)
async def validate_coupon(data: CouponValidation):
    total_amount = data.total_amount
    code = data.code.upper()
    
    final_amount, discount_amount, coupon, message = await apply_coupon_discount(total_amount, code)

    response_data = {
        "code": code,
        "discount_type": coupon.get('discount_type', 'fixed') if coupon else 'fixed',
        "discount_value": coupon.get('discount_value', 0.0) if coupon else 0.0,
        "discount_amount": discount_amount,
        "new_total": final_amount,
        "message": message
    }
    
    if not coupon:
        raise HTTPException(status_code=404, detail=message)
        
    return response_data
    
@coupon_router.post("/", response_model=Coupon)
async def create_coupon(coupon: CouponCreate, user: dict = Depends(verify_admin)):
    existing = await db.coupons.find_one({"code": coupon.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")
    
    coupon_obj = Coupon(**coupon.model_dump())
    coupon_obj.code = coupon_obj.code.upper()
    doc = coupon_obj.model_dump()
    await db.coupons.insert_one(doc)
    return coupon_obj

@coupon_router.get("/", response_model=List[Coupon])
async def get_all_coupons(user: dict = Depends(verify_admin)):
    coupons = await db.coupons.find({}, {"_id": 0}).to_list(1000)
    return coupons

@coupon_router.delete("/{coupon_id}")
async def delete_coupon(coupon_id: str, user: dict = Depends(verify_admin)):
    result = await db.coupons.delete_one({"id": coupon_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return {"message": "Coupon deleted successfully"}


# --- Auth Routes (Register, Login) ---

auth_router = APIRouter(prefix="/api/auth")

@auth_router.post("/register", response_model=UserProfile) # RATE LIMIT REMOVED
async def register_user(user: UserCreate):
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pass = hash_password(user.password)
    user_id = str(uuid.uuid4())
    
    new_profile = {
        "_id": user_id,
        "email": user.email.lower(),
        "name": user.name,
        "hashed_password": hashed_pass,
        "shipping_address": ShippingAddress().model_dump(),
        "wishlist": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(new_profile)
    return new_profile

@auth_router.post("/login", response_model=Token) # RATE LIMIT REMOVED
async def login_for_access_token(form_data: UserLogin):
    user = await db.users.find_one({"email": form_data.email.lower()})
    if not user or not user.get("hashed_password") or not verify_password(form_data.password, user.get("hashed_password")):
        raise HTTPException(
            status_code=401,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user["_id"]})
    return {"access_token": access_token, "token_type": "bearer"}

# Removed: /google/login and /google/callback endpoints

# --- END AUTH ROUTES ---


# --- Product Routes ---
@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate, user: dict = Depends(verify_admin)): 
    product_dict = product.model_dump()
    product_dict['slug'] = generate_slug(product_dict['name']) # ADDED: Generate slug
    product_obj = Product(**product_dict)
    doc = product_obj.model_dump()
    await db.products.insert_one(doc)
    return product_obj

@api_router.get("/products", response_model=PaginatedProducts)
async def get_products(
    search: Optional[str] = None, 
    sort: Optional[str] = 'name',
    page: int = 1,
    limit: int = 12
):
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    if sort == 'price-low':
        sort_criteria = [("price", ASCENDING)]
    elif sort == 'price-high':
        sort_criteria = [("price", DESCENDING)]
    else:
        sort_criteria = [("name", ASCENDING)]
    total_products = await db.products.count_documents(query)
    total_pages = math.ceil(total_products / limit)
    skip = (page - 1) * limit
    products = await db.products.find(query, {"_id": 0}).sort(sort_criteria).skip(skip).limit(limit).to_list(limit)
    return {
        "products": products,
        "total_products": total_products,
        "total_pages": total_pages,
        "current_page": page
    }

@api_router.get("/products/featured", response_model=List[Product])
async def get_featured_products():
    products = await db.products.find({"featured": True}, {"_id": 0}).to_list(100)
    return products

# NEW ENDPOINT: Get recommendations (Simulated)
@api_router.get("/products/recommendations/{product_id}", response_model=List[Product])
async def get_product_recommendations(product_id: str):
    # This simulates "Customers Also Bought" by returning up to 4 other featured products
    # excluding the current product ID.
    recommendations = await db.products.find(
        {"featured": True, "id": {"$ne": product_id}}, 
        {"_id": 0}
    ).limit(4).to_list(4)
    return recommendations


@api_router.get("/products/{slug_or_id}", response_model=Product)
async def get_product(slug_or_id: str):
    # Try finding by ID (UUID) for existing links first
    product = await db.products.find_one({"id": slug_or_id}, {"_id": 0})
    if not product:
        # Then try finding by the new slug
        product = await db.products.find_one({"slug": slug_or_id}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product: ProductCreate, user: dict = Depends(verify_admin)): 
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = product.model_dump()
    update_data['slug'] = generate_slug(update_data['name']) # Re-generate slug on update
    
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    updated_product = await db.products.find_one({"id": product_id}, {"_id": 0})
    return updated_product

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, user: dict = Depends(verify_admin)): 
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

# --- Review Routes ---
@api_router.post("/reviews", response_model=Review) # RATE LIMIT REMOVED
async def create_review(review: ReviewCreate, user: dict = Depends(get_current_user)): 
    review_obj = Review(
        **review.model_dump(),
        user_id=user['_id'],
        user_name=user.get('name', user.get('email', 'Anonymous'))
    )
    doc = review_obj.model_dump()
    await db.reviews.insert_one(doc)
    return review_obj

@api_router.get("/reviews/{product_id}", response_model=List[Review])
async def get_product_reviews(product_id: str):
    reviews = await db.reviews.find({"product_id": product_id}, {"_id": 0}).to_list(1000)
    return reviews

# --- Order Routes ---
@api_router.post("/orders/create-razorpay-order")
async def create_razorpay_order(order_data: OrderCreate, user: dict = Depends(get_current_user)): 
    
    total_amount = order_data.total_amount
    final_amount = total_amount
    discount_amount = 0.0
    coupon_code = order_data.coupon_code
    
    # 1. Apply Coupon Discount if provided
    if coupon_code:
        final_amount, discount_amount, coupon, message = await apply_coupon_discount(total_amount, coupon_code)
        if not coupon:
            # If coupon is invalid, proceed without it
            coupon_code = None 
            discount_amount = 0.0
            final_amount = total_amount
    
    # Ensure final amount is not negative
    final_amount = max(0.0, final_amount)
    
    order_obj = Order(
        **order_data.model_dump(),
        user_id=user['_id'],
        user_email=user.get('email', ''),
        total_amount=total_amount, # Original total
        discount_amount=discount_amount, # Applied discount
        final_amount=final_amount, # Final amount to be paid
        coupon_code=coupon_code # Used coupon code
    )
    
    # Razorpay amount must be in paise (final_amount)
    razorpay_order = razorpay_client.order.create({
        "amount": int(final_amount * 100),
        "currency": "INR",
        "payment_capture": 1
    })
    order_obj.razorpay_order_id = razorpay_order['id']
    doc = order_obj.model_dump()
    await db.orders.insert_one(doc)
    return {
        "order_id": order_obj.id,
        "razorpay_order_id": razorpay_order['id'],
        "amount": razorpay_order['amount'],
        "currency": razorpay_order['currency'] 
    }

@api_router.post("/orders/verify-payment")
async def verify_payment(payment: PaymentVerification, user: dict = Depends(get_current_user)): 
    try:
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': payment.razorpay_order_id,
            'razorpay_payment_id': payment.razorpay_payment_id,
            'razorpay_signature': payment.razorpay_signature
        })
        await db.orders.update_one(
            {"id": payment.order_id},
            {"$set": {
                "payment_id": payment.razorpay_payment_id,
                "status": "processing",
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
        order = await db.orders.find_one({"id": payment.order_id})
        if order:
            for item in order['items']:
                product = await db.products.find_one({"id": item['product_id']})
                if product:
                    for variant in product['variants']:
                        if variant['color'] == item['color']:
                            if item['size'] in variant['sizes']:
                                variant['sizes'][item['size']] = max(0, variant['sizes'][item['size']] - item['quantity'])
                    await db.products.update_one(
                        {"id": item['product_id']},
                        {"$set": {"variants": product['variants']}}
                    )
        return {"success": True, "message": "Payment verified successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Payment verification failed: {str(e)}")

@api_router.get("/orders/my-orders", response_model=List[Order])
async def get_my_orders(user: dict = Depends(get_current_user)): 
    orders = await db.orders.find({"user_id": user['_id']}, {"_id": 0}).to_list(1000)
    orders.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    return orders

@api_router.get("/orders", response_model=List[Order])
async def get_all_orders(user: dict = Depends(verify_admin)): 
    orders = await db.orders.find({}, {"_id": 0}).to_list(1000)
    orders.sort(key=lambda x: x.get('created_at', ''), reverse=True)
    return orders

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, update_data: OrderUpdateAdmin, user: dict = Depends(verify_admin)): 
    # Use OrderUpdateAdmin model
    valid_statuses = ["pending", "processing", "shipped", "delivered", "cancelled", "abandoned"] # MODIFIED
    if update_data.status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    update_fields = {
        "status": update_data.status,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Only set tracking fields if status is 'shipped' or provided
    if update_data.status == 'shipped' or update_data.tracking_number is not None or update_data.courier is not None:
        update_fields['tracking_number'] = update_data.tracking_number
        update_fields['courier'] = update_data.courier

    await db.orders.update_one(
        {"id": order_id},
        {"$set": update_fields}
    )
    return {"message": "Order status and tracking updated successfully"}

# NEW ENDPOINT: Check Abandoned Carts
@api_router.post("/admin/check-abandoned-carts")
async def check_abandoned_carts(user: dict = Depends(verify_admin)):
    """
    Identifies and marks 'pending' orders older than 2 hours as 'abandoned'.
    Returns a list of newly abandoned orders for email processing.
    """
    time_limit = datetime.now(timezone.utc) - timedelta(hours=2)
    time_limit_iso = time_limit.isoformat()
    
    # 1. Find orders that are still 'pending' and older than the time limit
    query = {
        "status": "pending",
        "created_at": {"$lte": time_limit_iso}
    }
    
    # 2. Update these orders to 'abandoned'
    update_data = {
        "$set": {
            "status": "abandoned",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    }
    
    # Fetch the orders first (for email data)
    abandoned_orders = await db.orders.find(query, {"_id": 0}).to_list(1000)
    
    # Then update the status in the database
    if abandoned_orders:
        order_ids = [order['id'] for order in abandoned_orders]
        await db.orders.update_many({"id": {"$in": order_ids}}, update_data)
        
    return {
        "message": f"Found and marked {len(abandoned_orders)} orders as abandoned.",
        "abandoned_orders": abandoned_orders
    }


# --- Analytics Routes ---
@api_router.get("/analytics/dashboard")
async def get_dashboard_analytics(user: dict = Depends(verify_admin)): 
    total_orders = await db.orders.count_documents({})
    total_revenue = 0
    orders = await db.orders.find({"status": {"$in": ["processing", "shipped", "delivered"]}}, {"_id": 0}).to_list(10000)
    for order in orders:
        total_revenue += order.get('final_amount', 0)
    total_products = await db.products.count_documents({})
    recent_orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).limit(10).to_list(10)
    status_counts = {}
    all_orders = await db.orders.find({}, {"_id": 0}).to_list(10000)
    for order in all_orders:
        status = order.get('status', 'unknown')
        status_counts[status] = status_counts.get(status, 0) + 1
    return {
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "total_products": total_products,
        "recent_orders": recent_orders,
        "status_counts": status_counts
    }

@api_router.get("/analytics/inventory")
async def get_inventory_analytics(user: dict = Depends(verify_admin)): 
    products = await db.products.find({}, {"_id": 0}).to_list(1000)
    inventory_data = []
    for product in products:
        total_stock = 0
        for variant in product.get('variants', []):
            for size, stock in variant.get('sizes', {}).items():
                total_stock += stock
        inventory_data.append({
            "id": product['id'],
            "name": product['name'],
            "total_stock": total_stock,
            "variants": product.get('variants', [])
        })
    return inventory_data

# --- Landing Page Routes ---
@api_router.get("/landing-page")
async def get_landing_page_settings():
    settings = await db.landing_page.find_one({"id": "landing_page"}, {"_id": 0})
    if not settings:
        default_settings = LandingPageSettings()
        return default_settings.model_dump()
    return settings

@api_router.put("/landing-page")
async def update_landing_page_settings(settings: LandingPageUpdate, user: dict = Depends(verify_admin)): 
    update_data = {k: v for k, v in settings.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.landing_page.update_one(
        {"id": "landing_page"},
        {"$set": update_data},
        upsert=True
    )
    updated_settings = await db.landing_page.find_one({"id": "landing_page"}, {"_id": 0})
    return updated_settings

# --- Cloudinary Signature Route ---
@api_router.get("/upload-signature", response_model=UploadSignature)
async def get_upload_signature(user: dict = Depends(verify_admin)):
    timestamp = int(time.time())
    signature = cloudinary.utils.api_sign_request(
        {"timestamp": timestamp},
        os.environ.get('CLOUDINARY_API_SECRET')
    )
    return {"timestamp": timestamp, "signature": signature}

# --- User Profile Endpoints ---
@api_router.get("/profile", response_model=UserProfile)
async def get_user_profile(user: dict = Depends(get_current_user)):
    return user

@api_router.put("/profile", response_model=UserProfile)
async def update_user_profile(profile_data: UserProfileUpdate, user: dict = Depends(get_current_user)):
    user_id = user['_id']
    update_data = {k: v for k, v in profile_data.model_dump().items() if v is not None}
    update_fields = {}
    if 'name' in update_data:
        update_fields['name'] = update_data['name']
    if 'shipping_address' in update_data:
        update_fields['shipping_address'] = update_data['shipping_address']
    if not update_fields:
        raise HTTPException(status_code=400, detail="No valid fields to update")

    await db.users.update_one(
        {"_id": user_id},
        {"$set": update_fields}
    )
    updated_profile = await db.users.find_one({"_id": user_id})
    if not updated_profile:
        raise HTTPException(status_code=404, detail="User profile not found after update")
    return updated_profile

# --- Wishlist Endpoints ---
@api_router.post("/profile/wishlist", response_model=UserProfile)
async def add_to_wishlist(data: WishlistUpdate, user: dict = Depends(get_current_user)):
    user_id = user['_id']
    product_id = data.product_id
    
    await db.users.update_one(
        {"_id": user_id},
        {"$addToSet": {"wishlist": product_id}}
    )
    
    updated_profile = await db.users.find_one({"_id": user_id})
    return updated_profile

@api_router.delete("/profile/wishlist/{product_id}", response_model=UserProfile)
async def remove_from_wishlist(product_id: str, user: dict = Depends(get_current_user)):
    user_id = user['_id']
    
    await db.users.update_one(
        {"_id": user_id},
        {"$pull": {"wishlist": product_id}}
    )
    
    updated_profile = await db.users.find_one({"_id": user_id})
    return updated_profile

# --- Admin Cleanup Endpoint ---
@api_router.post("/admin/cleanup")
async def cleanup_collections(cleanup_data: CleanupRequest, user: dict = Depends(verify_admin)):
    """Deletes all documents from specified collections."""
    results = {}
    valid_collections = ["products", "orders", "reviews", "coupons"]
    
    for collection_name in cleanup_data.collections:
        if collection_name not in valid_collections:
            results[collection_name] = "Skipped (Invalid collection name)"
            continue
            
        try:
            result = await db[collection_name].delete_many({})
            results[collection_name] = f"Success: Deleted {result.deleted_count} documents."
        except Exception as e:
            results[collection_name] = f"Failure: {str(e)}"
            
    return {"message": "Cleanup complete.", "details": results}

# --- Health check ---
@api_router.get("/")
async def root():
    return {"message": "Fifth Beryl API is running"}

# Add the CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the routers
app.include_router(api_router)
app.include_router(auth_router)
app.include_router(coupon_router)
app.include_router(ticker_router)


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()