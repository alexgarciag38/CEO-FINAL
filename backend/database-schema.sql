-- CEO Final Database Schema
-- This file contains the complete database schema for the executive dashboard

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales data table
CREATE TABLE IF NOT EXISTS public.sales_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    product TEXT NOT NULL,
    revenue DECIMAL(12,2) NOT NULL,
    quantity INTEGER NOT NULL,
    category TEXT NOT NULL,
    date DATE NOT NULL,
    client TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial data table
CREATE TABLE IF NOT EXISTS public.financial_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'investment')),
    amount DECIMAL(12,2) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- KPIs table
CREATE TABLE IF NOT EXISTS public.kpis (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    value DECIMAL(15,2) NOT NULL,
    change DECIMAL(5,2),
    change_type TEXT CHECK (change_type IN ('increase', 'decrease', 'neutral')),
    format TEXT NOT NULL CHECK (format IN ('currency', 'percentage', 'number')),
    icon TEXT,
    module TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Marketing data table
CREATE TABLE IF NOT EXISTS public.marketing_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    campaign_name TEXT NOT NULL,
    channel TEXT NOT NULL,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    cost DECIMAL(10,2) DEFAULT 0,
    revenue DECIMAL(12,2) DEFAULT 0,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CRM data table
CREATE TABLE IF NOT EXISTS public.crm_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    client_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    status TEXT NOT NULL CHECK (status IN ('lead', 'prospect', 'customer', 'inactive')),
    value DECIMAL(12,2),
    last_contact DATE,
    next_followup DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HR data table
CREATE TABLE IF NOT EXISTS public.hr_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    employee_name TEXT NOT NULL,
    position TEXT NOT NULL,
    department TEXT NOT NULL,
    salary DECIMAL(10,2),
    hire_date DATE NOT NULL,
    performance_score DECIMAL(3,2),
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'terminated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Strategic data table
CREATE TABLE IF NOT EXISTS public.strategic_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    objective TEXT NOT NULL,
    description TEXT,
    target_value DECIMAL(15,2),
    current_value DECIMAL(15,2) DEFAULT 0,
    target_date DATE,
    status TEXT NOT NULL CHECK (status IN ('planning', 'in_progress', 'completed', 'cancelled')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CSV upload logs table
CREATE TABLE IF NOT EXISTS public.csv_uploads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    filename TEXT NOT NULL,
    table_name TEXT NOT NULL,
    rows_processed INTEGER DEFAULT 0,
    rows_failed INTEGER DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
    error_log TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sales_data_user_id ON public.sales_data(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_data_date ON public.sales_data(date);
CREATE INDEX IF NOT EXISTS idx_financial_data_user_id ON public.financial_data(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_data_date ON public.financial_data(date);
CREATE INDEX IF NOT EXISTS idx_kpis_user_id ON public.kpis(user_id);
CREATE INDEX IF NOT EXISTS idx_kpis_module ON public.kpis(module);
CREATE INDEX IF NOT EXISTS idx_marketing_data_user_id ON public.marketing_data(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_data_user_id ON public.crm_data(user_id);
CREATE INDEX IF NOT EXISTS idx_hr_data_user_id ON public.hr_data(user_id);
CREATE INDEX IF NOT EXISTS idx_strategic_data_user_id ON public.strategic_data(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.csv_uploads ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Sales data policies
CREATE POLICY "Users can view own sales data" ON public.sales_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sales data" ON public.sales_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sales data" ON public.sales_data
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sales data" ON public.sales_data
    FOR DELETE USING (auth.uid() = user_id);

-- Financial data policies
CREATE POLICY "Users can view own financial data" ON public.financial_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own financial data" ON public.financial_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own financial data" ON public.financial_data
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own financial data" ON public.financial_data
    FOR DELETE USING (auth.uid() = user_id);

-- KPIs policies
CREATE POLICY "Users can view own KPIs" ON public.kpis
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own KPIs" ON public.kpis
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own KPIs" ON public.kpis
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own KPIs" ON public.kpis
    FOR DELETE USING (auth.uid() = user_id);

-- Marketing data policies
CREATE POLICY "Users can view own marketing data" ON public.marketing_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own marketing data" ON public.marketing_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own marketing data" ON public.marketing_data
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own marketing data" ON public.marketing_data
    FOR DELETE USING (auth.uid() = user_id);

-- CRM data policies
CREATE POLICY "Users can view own CRM data" ON public.crm_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own CRM data" ON public.crm_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own CRM data" ON public.crm_data
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own CRM data" ON public.crm_data
    FOR DELETE USING (auth.uid() = user_id);

-- HR data policies
CREATE POLICY "Users can view own HR data" ON public.hr_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own HR data" ON public.hr_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own HR data" ON public.hr_data
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own HR data" ON public.hr_data
    FOR DELETE USING (auth.uid() = user_id);

-- Strategic data policies
CREATE POLICY "Users can view own strategic data" ON public.strategic_data
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own strategic data" ON public.strategic_data
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own strategic data" ON public.strategic_data
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own strategic data" ON public.strategic_data
    FOR DELETE USING (auth.uid() = user_id);

-- CSV uploads policies
CREATE POLICY "Users can view own CSV uploads" ON public.csv_uploads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own CSV uploads" ON public.csv_uploads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_data_updated_at BEFORE UPDATE ON public.sales_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_data_updated_at BEFORE UPDATE ON public.financial_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kpis_updated_at BEFORE UPDATE ON public.kpis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketing_data_updated_at BEFORE UPDATE ON public.marketing_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_data_updated_at BEFORE UPDATE ON public.crm_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hr_data_updated_at BEFORE UPDATE ON public.hr_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_strategic_data_updated_at BEFORE UPDATE ON public.strategic_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

