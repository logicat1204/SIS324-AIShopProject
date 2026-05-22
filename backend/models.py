from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class Store(BaseModel):
    id: Optional[str] = None
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    social_links: Optional[Dict[str, str]] = None
    website: Optional[str] = None

class Product(BaseModel):
    id: Optional[str] = None
    store_id: str
    name: str
    description: str
    price: float
    category: str
    image_url: Optional[str] = None
    stock: int
    attributes: Optional[Dict[str, Any]] = None # Para colores, tallas, etc.

class SearchQuery(BaseModel):
    query: str
