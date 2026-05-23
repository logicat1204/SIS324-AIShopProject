import os
import json
import time
import hmac
import hashlib
import base64
from typing import Optional
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware

from models import (
    SearchQuery, StoreCreate, ProductCreate, 
    UserRegister, UserLogin, Token, ApprovalAction, OrderCreate
)
from gemini_service import parse_search_query
from database import supabase

app = FastAPI(
    title="SucreShop API",
    description="Backend API for SucreShop e-commerce platform with Role Management",
    version="2.0.0"
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SISTEMA DE AUTENTICACIÓN JWT PERSONALIZADO (HMAC-SHA256) ---
JWT_SECRET = "sucreshop_jwt_super_secret_key_2026_bolivia"

def create_access_token(data: dict) -> str:
    payload = {
        **data,
        "exp": time.time() + 86400  # Expira en 24 horas
    }
    payload_bytes = json.dumps(payload).encode('utf-8')
    payload_b64 = base64.urlsafe_b64encode(payload_bytes).decode('utf-8')
    
    signature = hmac.new(JWT_SECRET.encode('utf-8'), payload_b64.encode('utf-8'), hashlib.sha256).digest()
    signature_b64 = base64.urlsafe_b64encode(signature).decode('utf-8')
    
    return f"{payload_b64}.{signature_b64}"

def verify_access_token(token: str) -> Optional[dict]:
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return None
        payload_b64, signature_b64 = parts[0], parts[1]
        
        expected_sig = hmac.new(JWT_SECRET.encode('utf-8'), payload_b64.encode('utf-8'), hashlib.sha256).digest()
        expected_sig_b64 = base64.urlsafe_b64encode(expected_sig).decode('utf-8')
        
        if not hmac.compare_digest(signature_b64, expected_sig_b64):
            return None
            
        payload_bytes = base64.urlsafe_b64decode(payload_b64.encode('utf-8'))
        payload = json.loads(payload_bytes.decode('utf-8'))
        
        if payload.get("exp", 0) < time.time():
            return None  # Expirado
            
        return payload
    except Exception:
        return None

def get_current_user(authorization: str = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autorizado: Token de sesión faltante.")
    token = authorization.split(" ")[1]
    user_data = verify_access_token(token)
    if not user_data:
        raise HTTPException(status_code=401, detail="Sesión inválida o expirada.")
    return user_data

# --- ENDPOINTS RAÍZ Y SALUD ---

@app.get("/")
def read_root():
    return {"message": "Bienvenido a SucreShop API v2.0 - Sistema de Roles Activo"}

@app.get("/api/health")
def health_check():
    return {"status": "ok", "version": "2.0.0"}

# --- ENDPOINTS DE AUTENTICACIÓN ---

@app.post("/api/auth/register", response_model=dict)
def register_user(user: UserRegister):
    if supabase is None:
        raise HTTPException(status_code=500, detail="Base de datos no configurada.")
    
    # Verificar si el usuario ya existe
    existing = supabase.table("users").select("id").eq("email", user.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado.")
    
    # Registrar el usuario
    try:
        res = supabase.table("users").insert({
            "email": user.email,
            "password_hash": user.password,  # Contraseña simple para desarrollo
            "role": user.role,
            "full_name": user.full_name
        }).execute()
        
        return {"message": "Usuario registrado exitosamente. Ahora puedes iniciar sesión."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en registro: {str(e)}")

@app.post("/api/auth/login", response_model=Token)
def login_user(credentials: UserLogin):
    if supabase is None:
        raise HTTPException(status_code=500, detail="Base de datos no configurada.")
    
    res = supabase.table("users").select("*").eq("email", credentials.email).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Credenciales incorrectas.")
    
    user = res.data[0]
    if user["password_hash"] != credentials.password:
        raise HTTPException(status_code=400, detail="Credenciales incorrectas.")
    
    # Generar Token
    user_payload = {
        "id": user["id"],
        "email": user["email"],
        "role": user["role"],
        "full_name": user["full_name"]
    }
    token = create_access_token(user_payload)
    
    return Token(
        access_token=token,
        token_type="bearer",
        user=user_payload
    )

# --- ENDPOINTS PÚBLICOS DE TIENDAS Y PRODUCTOS ---

@app.get("/api/stores")
def get_stores(authorization: str = Header(None)):
    """
    Retorna tiendas. Si es vendedor logueado, retorna las suyas.
    Si es público/cliente, retorna solo las aprobadas.
    """
    if supabase is None:
        raise HTTPException(status_code=500, detail="Base de datos no configurada.")
    
    # Verificar si hay sesión
    user = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        user = verify_access_token(token)
        
    if user and user["role"] == "vendedor":
        # Retornar todas las tiendas de este vendedor
        res = supabase.table("stores").select("*").eq("seller_id", user["id"]).execute()
        return res.data
    else:
        # Cliente o invitado: solo aprobadas
        res = supabase.table("stores").select("*").eq("status", "aprobado").execute()
        return res.data

@app.get("/api/products")
def get_products(store_id: Optional[str] = None, authorization: str = Header(None)):
    """
    Retorna productos. Si es vendedor dueño de la tienda, ve todos (incluso pendientes/rechazados).
    Si es cliente/invitado, ve solo los aprobados.
    """
    if supabase is None:
        raise HTTPException(status_code=500, detail="Base de datos no configurada.")
    
    # Verificar si hay sesión
    user = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        user = verify_access_token(token)

    query = supabase.table("products").select("*, stores(name, id, status, seller_id)")
    
    if store_id:
        query = query.eq("store_id", store_id)
        
    res = query.execute()
    products = res.data
    
    # Filtrar según roles
    filtered_products = []
    for p in products:
        store = p.get("stores", {})
        # Si es vendedor y es dueño de la tienda de este producto
        if user and user["role"] == "vendedor" and store.get("seller_id") == user["id"]:
            filtered_products.append(p)
        else:
            # Cliente o Invitado: solo si el producto está aprobado Y la tienda está aprobada
            if p["status"] == "aprobado" and store.get("status") == "aprobado":
                filtered_products.append(p)
                
    return filtered_products

# --- GESTIÓN DE TIENDAS Y PRODUCTOS (VENDEDORES) ---

@app.post("/api/stores")
def create_store(store: StoreCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "vendedor":
        raise HTTPException(status_code=403, detail="Acceso denegado: Se requiere rol de vendedor.")
    
    if supabase is None:
        raise HTTPException(status_code=500, detail="Base de datos no configurada.")
        
    try:
        res = supabase.table("stores").insert({
            "seller_id": current_user["id"],
            "name": store.name,
            "description": store.description,
            "logo_url": store.logo_url,
            "website": store.website,
            "status": "pendiente"  # Requiere aprobación del Admin
        }).execute()
        return {"message": "Solicitud de creación de tienda enviada al administrador.", "store": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creando tienda: {str(e)}")

@app.post("/api/products")
def create_product(product: ProductCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "vendedor":
        raise HTTPException(status_code=403, detail="Acceso denegado: Se requiere rol de vendedor.")
    
    if supabase is None:
        raise HTTPException(status_code=500, detail="Base de datos no configurada.")
        
    # Verificar que la tienda exista, pertenezca al vendedor y esté aprobada
    store_check = supabase.table("stores").select("*").eq("id", product.store_id).execute()
    if not store_check.data:
        raise HTTPException(status_code=404, detail="La tienda especificada no existe.")
    
    store = store_check.data[0]
    if store["seller_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="No tienes permisos para agregar productos en esta tienda.")
    
    if store["status"] != "aprobado":
        raise HTTPException(status_code=400, detail="No puedes agregar productos a una tienda que aún no está aprobada.")

    try:
        res = supabase.table("products").insert({
            "store_id": product.store_id,
            "name": product.name,
            "description": product.description,
            "price": product.price,
            "category": product.category,
            "image_url": product.image_url,
            "stock": product.stock,
            "attributes": product.attributes or {},
            "delivery_options": product.delivery_options or {"delivery": True, "pickup": True},
            "status": "pendiente"  # Requiere aprobación del Admin
        }).execute()
        return {"message": "Solicitud de publicación de producto enviada al administrador.", "product": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creando producto: {str(e)}")

# --- ENDPOINTS DEL ADMINISTRADOR (APROBACIONES) ---

@app.get("/api/admin/pending-stores")
def get_pending_stores(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado: Se requiere rol de administrador.")
        
    res = supabase.table("stores").select("*, users(full_name, email)").eq("status", "pendiente").execute()
    return res.data

@app.get("/api/admin/pending-products")
def get_pending_products(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado: Se requiere rol de administrador.")
        
    res = supabase.table("products").select("*, stores(name, id)").eq("status", "pendiente").execute()
    return res.data

@app.post("/api/admin/approve-store/{store_id}")
def approve_store(store_id: str, action: ApprovalAction, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado: Se requiere rol de administrador.")
        
    if action.status not in ["aprobado", "rechazado"]:
        raise HTTPException(status_code=400, detail="Estado inválido. Debe ser 'aprobado' o 'rechazado'.")
        
    if action.status == "rechazado" and not action.rejection_reason:
        raise HTTPException(status_code=400, detail="Debes proporcionar una razón para el rechazo.")
        
    try:
        res = supabase.table("stores").update({
            "status": action.status,
            "rejection_reason": action.rejection_reason if action.status == "rechazado" else None
        }).eq("id", store_id).execute()
        
        return {"message": f"Tienda {action.status} exitosamente.", "store": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar tienda: {str(e)}")

@app.post("/api/admin/approve-product/{product_id}")
def approve_product(product_id: str, action: ApprovalAction, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado: Se requiere rol de administrador.")
        
    if action.status not in ["aprobado", "rechazado"]:
        raise HTTPException(status_code=400, detail="Estado inválido. Debe ser 'aprobado' o 'rechazado'.")
        
    if action.status == "rechazado" and not action.rejection_reason:
        raise HTTPException(status_code=400, detail="Debes proporcionar una razón para el rechazo.")
        
    try:
        res = supabase.table("products").update({
            "status": action.status,
            "rejection_reason": action.rejection_reason if action.status == "rechazado" else None
        }).eq("id", product_id).execute()
        
        return {"message": f"Producto {action.status} exitosamente.", "product": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al actualizar producto: {str(e)}")

# --- ENDPOINTS DE COMPRAS Y RESERVAS (CLIENTES) ---

@app.post("/api/orders")
def create_order(order: OrderCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "cliente":
        raise HTTPException(status_code=403, detail="Acceso denegado: Solo los clientes pueden comprar o reservar.")
        
    if supabase is None:
        raise HTTPException(status_code=500, detail="Base de datos no configurada.")
        
    # Validar que el producto existe y tiene stock
    prod_check = supabase.table("products").select("*").eq("id", order.product_id).execute()
    if not prod_check.data:
        raise HTTPException(status_code=404, detail="El producto especificado no existe.")
        
    product = prod_check.data[0]
    
    if product["status"] != "aprobado":
        raise HTTPException(status_code=400, detail="No puedes adquirir un producto que no está aprobado.")
        
    if product["stock"] < order.quantity:
        raise HTTPException(status_code=400, detail="Stock insuficiente para la cantidad solicitada.")
        
    # Validar opciones de entrega configuradas por el vendedor
    deliv_opts = product.get("delivery_options", {"delivery": True, "pickup": True})
    if order.type == "compra_qr" and not deliv_opts.get("delivery", True):
        raise HTTPException(status_code=400, detail="Este producto no acepta envíos a domicilio (solo recojo).")
    if order.type == "reserva_recojo" and not deliv_opts.get("pickup", True):
        raise HTTPException(status_code=400, detail="Este producto no acepta recojo en tienda (solo delivery).")

    total_price = float(product["price"]) * order.quantity
    
    # Generar QR dinámico simulado para pago QR
    qr_code_url = None
    if order.type == "compra_qr":
        # Un código QR simulado apuntando a una URL de transacción
        qr_code_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=sucreshop-pay-{current_user['id']}-{int(time.time())}"

    try:
        # Descontar stock
        new_stock = product["stock"] - order.quantity
        supabase.table("products").update({"stock": new_stock}).eq("id", product["id"]).execute()
        
        # Registrar Orden
        res = supabase.table("orders").insert({
            "customer_id": current_user["id"],
            "product_id": order.product_id,
            "quantity": order.quantity,
            "total_price": total_price,
            "type": order.type,
            "status": "completado" if order.type == "compra_qr" else "pendiente", # Las reservas se completan al recoger
            "qr_code_url": qr_code_url
        }).execute()
        
        return {
            "message": "Órden procesada con éxito." if order.type == "compra_qr" else "Reserva registrada con éxito.",
            "order": res.data[0]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar la orden: {str(e)}")

@app.get("/api/orders")
def get_orders(current_user: dict = Depends(get_current_user)):
    if supabase is None:
        raise HTTPException(status_code=500, detail="Base de datos no configurada.")
        
    if current_user["role"] == "cliente":
        # Cliente: ver sus propias compras/reservas
        res = supabase.table("orders").select("*, products(name, image_url, store_id, stores(name))").eq("customer_id", current_user["id"]).execute()
        return res.data
    elif current_user["role"] == "vendedor":
        # Vendedor: ver órdenes hechas a sus tiendas
        # Primero obtenemos sus tiendas
        stores_res = supabase.table("stores").select("id").eq("seller_id", current_user["id"]).execute()
        store_ids = [s["id"] for s in stores_res.data]
        if not store_ids:
            return []
            
        # Obtenemos órdenes uniendo con productos de sus tiendas
        res = supabase.table("orders").select("*, products(name, image_url, store_id, stores(name))").execute()
        # Filtramos en memoria para simplicidad
        vendedor_orders = []
        for o in res.data:
            if o.get("products") and o["products"]["store_id"] in store_ids:
                vendedor_orders.append(o)
        return vendedor_orders
    else:
        # Administrador: ver todas las órdenes de la plataforma
        res = supabase.table("orders").select("*, products(name, image_url, stores(name)), users(full_name, email)").execute()
        return res.data

# --- BÚSQUEDA GENERAL DE PRODUCTOS CON INTELIGENCIA ARTIFICIAL (IA) ---

@app.post("/api/search")
def search_products(query: SearchQuery, authorization: str = Header(None)):
    """
    Búsqueda en lenguaje natural interpretada por la IA de Gemini.
    Filtra automáticamente por aprobación para invitados/clientes.
    """
    if supabase is None:
        raise HTTPException(status_code=500, detail="Base de datos no configurada.")

    # Verificar si hay sesión
    user = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        user = verify_access_token(token)

    # 1. Interpretar la búsqueda con Gemini
    parsed_filters = parse_search_query(query.query)
    
    # 2. Construir la consulta a Supabase relacionando tiendas
    db_query = supabase.table("products").select("*, stores(name, id, status, seller_id)")
    
    # Aplicar filtros si la IA detectó alguno
    if parsed_filters.get("category"):
        db_query = db_query.ilike("category", f"%{parsed_filters['category']}%")
    
    if parsed_filters.get("max_price"):
        db_query = db_query.lte("price", parsed_filters["max_price"])

    # Ejecutar la consulta base
    try:
        response = db_query.execute()
        results = response.data
    except Exception as e:
        print(f"Error consultando DB en búsqueda: {e}")
        results = []

    # Filtrar en memoria para atributos complejos y reglas de aprobación de roles
    final_results = []
    for item in results:
        store = item.get("stores") or {}
        
        # Filtrado de roles y estados de aprobación
        # Un vendedor ve todo de su propia tienda. Un cliente/invitado solo ve aprobado+aprobado
        is_owner = user and user["role"] == "vendedor" and store.get("seller_id") == user["id"]
        
        if not is_owner:
            if item["status"] != "aprobado" or store.get("status") != "aprobado":
                continue # Ocultar
        
        formatted_item = {
            "id": item["id"],
            "name": item["name"],
            "store_name": store.get("name", "Tienda Desconocida"),
            "price": item["price"],
            "category": item["category"],
            "image_url": item["image_url"],
            "stock": item["stock"],
            "status": item["status"],
            "delivery_options": item.get("delivery_options", {"delivery": True, "pickup": True}),
            "attributes": item.get("attributes", {})
        }
        
        # Filtro de color (si la IA lo detectó)
        if parsed_filters.get("color"):
            attr = formatted_item["attributes"]
            if type(attr) is dict and attr.get("color"):
                if parsed_filters["color"].lower() not in attr.get("color").lower():
                    continue # Salta este producto
        
        final_results.append(formatted_item)

    return {
        "filters_applied": parsed_filters,
        "results": final_results
    }
