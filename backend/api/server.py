# backend/api/server.py
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, UploadFile, File, Request, Query
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
# (Firebase imports are correctly removed)
import razorpay
import base64
import json
import time 
import cloudinary
import cloudinary.uploader
import cloudinary.api
from pymongo import ASCENDING, DESCENDING
import math

# --- NEW IMPORTS FOR CUSTOM AUTH ---
from jose import JWTError, jwt
from passlib.context import CryptContext
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from google_auth_oauthlib.flow import Flow as GoogleFlow
import httpx
# --- END NEW IMPORTS ---


ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# --- NEW: Auth & Security Configuration ---
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-fallback-secret-key-please-change-me')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

GOOGLE_CLIENT_ID = os.environ.get('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.environ.get('GOOGLE_CLIENT_SECRET')
GOOGLE_REDIRECT_URI = os.environ.get('GOOGLE_REDIRECT_URI', 'http://localhost:8000/api/auth/google/callback')
FRONTEND_URL = os.environ.get('REACT_APP_URL', 'http://localhost:3000')


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
security = HTTPBearer()
# --- END NEW AUTH CONFIG ---


# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL') 
db = client[os.environ['DB_NAME']]

# (Firebase init code removed)

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


# --- NEW: Password & JWT Helper Functions ---

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

# --- END NEW HELPERS ---


# --- REWRITTEN: Auth dependency ---

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
        raise credentials_exception
    return user

# --- REWRITTEN: Admin-only dependency ---
async def verify_admin(current_user: dict = Depends(get_current_user)):
    if not ADMIN_EMAIL:
        raise HTTPException(status_code=500, detail="Admin email not configured")
    
    if current_user.get('email') != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return current_user

# --- END REWRITTEN DEPENDENCIES ---


# --- ALL MODELS (FIX) ---
# (This is the block that was missing)

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
    price: float
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
    name: str
    description: str
    price: float
    images: List[ProductImage]
    variants: List[ProductVariant]
    category: str = "shirts"
    featured: bool = False

class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    user_id: str
    user_name: str
    rating: int
    comment: str
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
    payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    status: str = "pending"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class OrderCreate(BaseModel):
    items: List[OrderItem]
    shipping_address: ShippingAddress
    total_amount: float

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
# --- END OF MISSING MODELS ---


# --- UPDATED & NEW: User & Auth Models ---
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserCreate(UserBase):
    password: str

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
# --- END UPDATED USER MODELS ---


# --- NEW: Auth Routes (Register, Login, Google) ---

auth_router = APIRouter(prefix="/api/auth")

@auth_router.post("/register", response_model=UserProfile)
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

@auth_router.post("/login", response_model=Token)
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

@auth_router.get("/google/login")
async def google_login(request: Request):
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google Auth not configured")

    flow = GoogleFlow.from_client_config(
        client_config={
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [GOOGLE_REDIRECT_URI],
            }
        },
        scopes=["openid", "https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"],
        redirect_uri=GOOGLE_REDIRECT_URI
    )
    authorization_url, state = flow.authorization_url(
        access_type='offline',
        prompt='consent'
    )
    request.app.state.google_oauth_state = state
    return RedirectResponse(authorization_url)

@auth_router.get("/google/callback")
async def google_auth_callback(request: Request, code: str = Query(...), state: str = Query(...)):
    if state != request.app.state.google_oauth_state:
        raise HTTPException(status_code=401, detail="Invalid Google OAuth state")

    flow = GoogleFlow.from_client_config(
        client_config={
            "web": {
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [GOOGLE_REDIRECT_URI],
            }
        },
        scopes=["openid", "https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"],
        redirect_uri=GOOGLE_REDIRECT_URI
    )
    
    try:
        flow.fetch_token(code=code)
        credentials = flow.credentials
        id_info = id_token.verify_oauth2_token(
            credentials.id_token, google_requests.Request(), GOOGLE_CLIENT_ID
        )
        
        email = id_info.get('email')
        name = id_info.get('name', 'Google User')
        
        if not email:
            raise HTTPException(status_code=400, detail="Email not provided by Google")

        user = await db.users.find_one({"email": email})
        
        if not user:
            user_id = str(uuid.uuid4())
            new_profile = {
                "_id": user_id,
                "email": email.lower(),
                "name": name,
                "hashed_password": None, 
                "shipping_address": ShippingAddress().model_dump(),
                "wishlist": [],
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(new_profile)
            user = new_profile
        
        access_token = create_access_token(data={"sub": user["_id"]})
        
        response = RedirectResponse(url=f"{FRONTEND_URL}/auth/callback?token={access_token}")
        return response

    except Exception as e:
        logging.error(f"Google OAuth Error: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to authenticate with Google: {str(e)}")

# --- END NEW AUTH ROUTES ---


# --- Product Routes ---
@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate, user: dict = Depends(verify_admin)): 
    product_obj = Product(**product.model_dump())
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

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product: ProductCreate, user: dict = Depends(verify_admin)): 
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    update_data = product.model_dump()
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
@api_router.post("/reviews", response_model=Review)
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
    order_obj = Order(
        **order_data.model_dump(),
        user_id=user['_id'],
        user_email=user.get('email', '')
    )
    razorpay_order = razorpay_client.order.create({
        "amount": int(order_data.total_amount * 100),
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
async def update_order_status(order_id: str, status: str, user: dict = Depends(verify_admin)): 
    valid_statuses = ["pending", "processing", "shipped", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status")
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {
            "status": status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    return {"message": "Order status updated successfully"}

# --- Analytics Routes ---
@api_router.get("/analytics/dashboard")
async def get_dashboard_analytics(user: dict = Depends(verify_admin)): 
    total_orders = await db.orders.count_documents({})
    total_revenue = 0
    orders = await db.orders.find({"status": {"$in": ["processing", "shipped", "delivered"]}}, {"_id": 0}).to_list(10000)
    for order in orders:
        total_revenue += order.get('total_amount', 0)
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
        raise HTTPException(status_code=4404, detail="User profile not found after update")
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


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()