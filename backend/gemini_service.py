import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    # Usamos un modelo de última generación disponible en el entorno
    model = genai.GenerativeModel('gemini-2.5-flash')

def parse_search_query(user_query: str) -> dict:
    """
    Usa Gemini API para interpretar la intención de búsqueda del usuario y 
    convertirla en un JSON estructurado con filtros.
    """
    if not GEMINI_API_KEY:
        # Fallback básico si no hay API key
        return {
            "category": None,
            "color": None,
            "size": None,
            "max_price": None,
            "keywords": user_query.split()
        }
        
    prompt = f"""
    Eres un asistente de e-commerce. Un usuario está buscando productos usando lenguaje natural.
    Analiza la siguiente búsqueda: "{user_query}"
    
    Devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura y tipos de datos:
    {{
        "category": "nombre de la categoría principal (ej: ropa, tecnologia, calzado) o null si no aplica",
        "color": "color mencionado o null",
        "size": "talla o tamaño mencionado o null",
        "max_price": número o null si no menciona "barato" o un límite,
        "keywords": ["palabra_clave_1", "palabra_clave_2"]
    }}
    
    No incluyas markdown (como ```json) en la respuesta, solo el texto en formato JSON.
    """
    try:
        response = model.generate_content(prompt)
        # Limpiamos posible markdown de la respuesta
        text_response = response.text.replace("```json", "").replace("```", "").strip()
        parsed_data = json.loads(text_response)
        return parsed_data
    except Exception as e:
        print(f"Error parseando con IA: {e}")
        return {
            "category": None,
            "color": None,
            "size": None,
            "max_price": None,
            "keywords": user_query.split()
        }
