-- Crear tabla de Tiendas (Stores)
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crear tabla de Productos (Products)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    stock INTEGER DEFAULT 0,
    attributes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insertar Tienda de Prueba
INSERT INTO public.stores (id, name, description, website) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440000', 
    'Deportes Extremos Sucre', 
    'Tu tienda de confianza para artículos deportivos en Sucre.',
    'https://deportes-extremos-sucre.com'
) ON CONFLICT DO NOTHING;

INSERT INTO public.stores (id, name, description) 
VALUES (
    '660e8400-e29b-41d4-a716-446655440001', 
    'Electro Mundo', 
    'Lo mejor en tecnología y smartphones.'
) ON CONFLICT DO NOTHING;

-- Insertar Productos de Prueba
INSERT INTO public.products (store_id, name, description, price, category, image_url, stock, attributes)
VALUES 
(
    '550e8400-e29b-41d4-a716-446655440000', 
    'Tenis Nike Runner Pro', 
    'Zapatillas para correr, ultra ligeras.', 
    450.00, 
    'calzado', 
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=400', 
    15, 
    '{"color": "rojo", "size": "42"}'::jsonb
),
(
    '550e8400-e29b-41d4-a716-446655440000', 
    'Balón de Fútbol Adidas', 
    'Balón oficial número 5.', 
    180.50, 
    'deportes', 
    'https://images.unsplash.com/photo-1614632537190-23e4146777db?auto=format&fit=crop&q=80&w=400', 
    30, 
    '{"color": "blanco"}'::jsonb
),
(
    '660e8400-e29b-41d4-a716-446655440001', 
    'Smartphone Galaxy S23', 
    'Teléfono inteligente de última generación.', 
    6500.00, 
    'tecnologia', 
    'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&q=80&w=400', 
    5, 
    '{"color": "negro", "storage": "256GB"}'::jsonb
);
