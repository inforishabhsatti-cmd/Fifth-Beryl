from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth, firestore, storage as firebase_storage
import razorpay
import base64
import json
import time 
import cloudinary
import cloudinary.uploader
import cloudinary.api
from pymongo import ASCENDING, DESCENDING
import math

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL') 
db = client[os.environ['DB_NAME']]

# Firebase Admin initialization
firebase_config = os.environ.get('FIREBASE_ADMIN_CREDENTIALS')
if firebase_config:
    cred = credentials.Certificate(json.loads(base64.b64decode(firebase_config)))
    firebase_admin.initialize_app(cred)
else:
    print("Warning: Firebase credentials not configured")

# Razorpay client (test mode)
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

security = HTTPBearer()

# Auth dependency
async def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        decoded_token = firebase_auth.verify_id_token(credentials.credentials)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid authentication: {str(e)}")

# Admin-only dependency
async def verify_admin(user: dict = Depends(verify_firebase_token)):
    if not ADMIN_EMAIL:
        raise HTTPException(status_code=500, detail="Admin email not configured")
    
    if user.get('email') != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Admin access required")
    
    return user

# Models
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

class UserProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str = Field(alias="_id")
    email: str
    name: str
    shipping_address: Optional[ShippingAddress] = Field(default_factory=ShippingAddress)
    wishlist: List[str] = Field(default_factory=list) # <-- NEW: Add wishlist field
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    
class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    shipping_address: Optional[ShippingAddress] = None

# --- NEW: Model for updating wishlist ---
class WishlistUpdate(BaseModel):
    product_id: str
# --- END NEW ---


# Product Routes
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

# Review Routes
@api_router.post("/reviews", response_model=Review)
async def create_review(review: ReviewCreate, user: dict = Depends(verify_firebase_token)): 
    review_obj = Review(
        **review.model_dump(),
        user_id=user['uid'],
        user_name=user.get('name', user.get('email', 'Anonymous'))
    )
    doc = review_obj.model_dump()
    await db.reviews.insert_one(doc)
    return review_obj

@api_router.get("/reviews/{product_id}", response_model=List[Review])
async def get_product_reviews(product_id: str):
    reviews = await db.reviews.find({"product_id": product_id}, {"_id": 0}).to_list(1000)
    return reviews

# Order Routes
@api_router.post("/orders/create-razorpay-order")
async def create_razorpay_order(order_data: OrderCreate, user: dict = Depends(verify_firebase_token)): 
    order_obj = Order(
        **order_data.model_dump(),
        user_id=user['uid'],
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
async def verify_payment(payment: PaymentVerification, user: dict = Depends(verify_firebase_token)): 
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
async def get_my_orders(user: dict = Depends(verify_firebase_token)): 
    orders = await db.orders.find({"user_id": user['uid']}, {"_id": 0}).to_list(1000)
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

# Analytics Routes
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

# Landing Page Settings
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

# Cloudinary Signature Endpoint
class UploadSignature(BaseModel):
    timestamp: int
    signature: str

@api_router.get("/upload-signature", response_model=UploadSignature)
async def get_upload_signature(user: dict = Depends(verify_admin)):
    timestamp = int(time.time())
    signature = cloudinary.utils.api_sign_request(
        {"timestamp": timestamp},
        os.environ.get('CLOUDINARY_API_SECRET')
    )
    return {"timestamp": timestamp, "signature": signature}

# User Profile Endpoints
@api_router.get("/profile", response_model=UserProfile)
async def get_user_profile(user: dict = Depends(verify_firebase_token)):
    user_id = user['uid']
    profile = await db.users.find_one({"_id": user_id})
    
    if not profile:
        new_profile = {
            "_id": user_id,
            "email": user.get('email'),
            "name": user.get('name', 'New User'),
            "shipping_address": ShippingAddress().model_dump(),
            "wishlist": [], # <-- NEW: Ensure new profiles have a wishlist
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_profile)
        return new_profile
        
    return profile

@api_router.put("/profile", response_model=UserProfile)
async def update_user_profile(profile_data: UserProfileUpdate, user: dict = Depends(verify_firebase_token)):
    user_id = user['uid']
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

# --- NEW: Wishlist Endpoints ---
@api_router.post("/profile/wishlist", response_model=UserProfile)
async def add_to_wishlist(data: WishlistUpdate, user: dict = Depends(verify_firebase_token)):
    """
    Add a product to the user's wishlist.
    """
    user_id = user['uid']
    product_id = data.product_id
    
    # Use $addToSet to add the product_id only if it's not already in the array
    await db.users.update_one(
        {"_id": user_id},
        {"$addToSet": {"wishlist": product_id}}
    )
    
    updated_profile = await db.users.find_one({"_id": user_id})
    return updated_profile

@api_router.delete("/profile/wishlist/{product_id}", response_model=UserProfile)
async def remove_from_wishlist(product_id: str, user: dict = Depends(verify_firebase_token)):
    """
    Remove a product from the user's wishlist.
    """
    user_id = user['uid']
    
    # Use $pull to remove the product_id from the array
    await db.users.update_one(
        {"_id": user_id},
        {"$pull": {"wishlist": product_id}}
    )
    
    updated_profile = await db.users.find_one({"_id": user_id})
    return updated_profile
# --- END NEW ---

# Health check
@api_router.get("/")
async def root():
    return {"message": "Fifth Beryl API is running"}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()