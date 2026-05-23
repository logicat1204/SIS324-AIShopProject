-- Limpiar tablas existentes para asegurar consistencia en el entorno de desarrollo
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- 1. Crear tabla de Usuarios (Users)
CREATE TABLE public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL, -- Almacenará la contraseña (con hash en producción)
    role TEXT NOT NULL CHECK (role IN ('cliente', 'vendedor', 'admin')),
    full_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Crear tabla de Tiendas (Stores)
CREATE TABLE public.stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    website TEXT,
    status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aprobado', 'rechazado')),
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Crear tabla de Productos (Products)
CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    category TEXT NOT NULL,
    image_url TEXT,
    stock INTEGER DEFAULT 0,
    attributes JSONB DEFAULT '{}'::jsonb, -- Para colores, tallas, etc.
    status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'aprobado', 'rechazado')),
    rejection_reason TEXT,
    delivery_options JSONB DEFAULT '{"delivery": true, "pickup": true}'::jsonb, -- Configurable por vendedor
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Crear tabla de Órdenes (Orders)
CREATE TABLE public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    total_price NUMERIC(10, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('compra_qr', 'reserva_recojo')),
    status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'completado', 'cancelado')),
    qr_code_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Insertar Datos de Prueba Iniciales
-- Contraseñas simples para desarrollo (se verifican de forma sencilla en backend)
INSERT INTO public.users (id, email, password_hash, role, full_name)
VALUES
-- Administrador Único
('a1111111-1111-1111-1111-111111111111', 'admin@sucreshop.com', 'admin123', 'admin', 'Administrador Principal'),
-- Vendedores
('b2222222-2222-2222-2222-222222222222', 'carlos@vendedor.com', 'vendedor123', 'vendedor', 'Carlos Vendedor Sombreros'),
('b3333333-3333-3333-3333-333333333333', 'maria@vendedor.com', 'vendedor123', 'vendedor', 'María Tecnología Sucre'),
-- Clientes
('c4444444-4444-4444-4444-444444444444', 'juan@cliente.com', 'cliente123', 'cliente', 'Juan Pérez');

-- Insertar Tiendas de Prueba (Una aprobada y otra pendiente)
INSERT INTO public.stores (id, seller_id, name, description, website, status)
VALUES
(
    '550e8400-e29b-41d4-a716-446655440000',
    'b2222222-2222-2222-2222-222222222222',
    'Sombreros Artesanales Sucre',
    'Artesanías típicas de Sucre y sombreros de paja tradicionales.',
    'https://sombreros-sucre.com',
    'aprobado'
),
(
    '660e8400-e29b-41d4-a716-446655440001',
    'b3333333-3333-3333-3333-333333333333',
    'Electro Mundo Sucre',
    'Celulares, laptops y gadgets de última generación.',
    'https://electromundo.com',
    'pendiente'
);

-- Insertar Productos de Prueba (Uno aprobado y otros pendientes/aprobados)
INSERT INTO public.products (id, store_id, name, description, price, category, image_url, stock, attributes, status, delivery_options)
VALUES
(
    'd1111111-1111-1111-1111-111111111111',
    '550e8400-e29b-41d4-a716-446655440000',
    'Sombrero de Paja Sucreño Premium',
    'Sombrero clásico de ala ancha tejido a mano por artesanos locales, ideal para el sol.',
    120.00,
    'ropa',
    'https://images.unsplash.com/photo-1533827432537-70133748f5c8?auto=format&fit=crop&q=80&w=400',
    10,
    '{"color": "beige", "size": "M"}'::jsonb,
    'aprobado',
    '{"delivery": true, "pickup": true}'::jsonb
),
(
    'd2222222-2222-2222-2222-222222222222',
    '550e8400-e29b-41d4-a716-446655440000',
    'Bolso de Cuero Tejido',
    'Hermoso bolso elaborado con cuero nacional y costuras artesanales.',
    250.00,
    'accesorios',
    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=400',
    5,
    '{"color": "café"}'::jsonb,
    'pendiente',
    '{"delivery": false, "pickup": true}'::jsonb -- Solo recojo en tienda!
),
(
    'd3333333-3333-3333-3333-333333333333',
    '660e8400-e29b-41d4-a716-446655440001',
    'Smartphone Xiaomi Redmi Note 13',
    '128GB de almacenamiento, 8GB de RAM. Increíble cámara de 108MP.',
    1600.00,
    'tecnologia',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=400',
    15,
    '{"color": "azul", "storage": "128GB"}'::jsonb,
    'pendiente',
    '{"delivery": true, "pickup": false}'::jsonb -- Solo delivery!
);
