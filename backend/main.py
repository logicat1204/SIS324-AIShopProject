from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import SearchQuery, Store, Product
from gemini_service import parse_search_query
from database import supabase

app = FastAPI(
    title="SucreShop API",
    description="Backend API for SucreShop e-commerce platform",
    version="1.0.0"
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En producción se debería especificar la URL del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Bienvenido a SucreShop API"}

@app.get("/api/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/search")
def search_products(query: SearchQuery):
    """
    Recibe una consulta en lenguaje natural, usa la IA para extraer filtros
    y luego realiza la búsqueda en la base de datos de Supabase.
    """
    if supabase is None:
        raise HTTPException(status_code=500, detail="Base de datos no configurada.")

    # 1. Interpretar la búsqueda con Gemini
    parsed_filters = parse_search_query(query.query)
    
    # 2. Construir la consulta a Supabase relacionando tiendas
    db_query = supabase.table("products").select("*, stores(name, id)")
    
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
        print(f"Error consultando DB: {e}")
        results = []

    # Filtrar en memoria para cosas complejas dentro de JSONB (ej: color)
    # Ya que ilike en un jsonb es más complejo vía REST
    final_results = []
    for item in results:
        # Formateamos el objeto para el frontend
        formatted_item = {
            "id": item["id"],
            "name": item["name"],
            "store_name": item["stores"]["name"] if item.get("stores") else "Tienda Desconocida",
            "price": item["price"],
            "category": item["category"],
            "image_url": item["image_url"],
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

