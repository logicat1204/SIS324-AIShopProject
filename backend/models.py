from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class UserRegister(BaseModel):
    email: str
    password: str
    role: str # 'cliente', 'vendedor', 'admin'
    full_name: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class StoreCreate(BaseModel):
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    website: Optional[str] = None

class ProductCreate(BaseModel):
    store_id: str
    name: str
    description: str
    price: float
    category: str
    image_url: Optional[str] = None
    stock: int
    attributes: Optional[Dict[str, Any]] = None
    delivery_options: Optional[Dict[str, bool]] = {"delivery": True, "pickup": True}

class ApprovalAction(BaseModel):
    status: str # 'aprobado' o 'rechazado'
    rejection_reason: Optional[str] = None

class OrderCreate(BaseModel):
    product_id: str
    quantity: int = 1
    type: str # 'compra_qr' o 'reserva_recojo'

class SearchQuery(BaseModel):
    query: str
