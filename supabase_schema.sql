-- ========================================================
-- WOLF CAR CATALOG - SUPABASE DATABASE SCHEMA
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/kavbbdjfoldqhbnzegvg/sql
-- ========================================================

-- 1. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    car_model TEXT,
    header_title TEXT,
    main_car_image_url TEXT,
    description TEXT,
    "order" INTEGER DEFAULT 0,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    barcode TEXT,
    price NUMERIC DEFAULT 0,
    old_price NUMERIC,
    currency TEXT DEFAULT 'QAR',
    image_url TEXT,
    description TEXT,
    image_transform JSONB,
    data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for ultra-fast query performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_categories_order ON public.categories("order");

-- 3. Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY,
    data JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Activity Logs Table
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id TEXT PRIMARY KEY,
    type TEXT,
    description TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_name TEXT,
    user_role TEXT,
    data JSONB
);

-- 5. Deleted Products (Trash) Table
CREATE TABLE IF NOT EXISTS public.deleted_products (
    id TEXT PRIMARY KEY,
    deleted_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_by TEXT,
    data JSONB
);

-- ========================================================
-- ENABLE ROW LEVEL SECURITY (RLS) & ALLOW PUBLIC ACCESS
-- ========================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deleted_products ENABLE ROW LEVEL SECURITY;

-- Allow anon public read/write access policies
DROP POLICY IF EXISTS "Allow public all on categories" ON public.categories;
CREATE POLICY "Allow public all on categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on products" ON public.products;
CREATE POLICY "Allow public all on products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on settings" ON public.settings;
CREATE POLICY "Allow public all on settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on activity_logs" ON public.activity_logs;
CREATE POLICY "Allow public all on activity_logs" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on deleted_products" ON public.deleted_products;
CREATE POLICY "Allow public all on deleted_products" ON public.deleted_products FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
