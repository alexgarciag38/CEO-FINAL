-- Finanzas: Pagos manuales (Postgres / Supabase)
-- Ejecutar en el editor SQL de Supabase

-- Extensiones necesarias
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
EXCEPTION WHEN others THEN NULL; END $$;

-- Tablas base
CREATE TABLE IF NOT EXISTS categorias_financieras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL DEFAULT auth.uid(),
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Ingreso','Egreso','Ambos')),
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subcategorias_financieras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL DEFAULT auth.uid(),
  categoria_id UUID NOT NULL REFERENCES categorias_financieras(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  activa BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL DEFAULT auth.uid(),
  nombre TEXT NOT NULL,
  rfc TEXT,
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pagos programados (tabla operativa)
CREATE TABLE IF NOT EXISTS financial_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL DEFAULT auth.uid(),
  tipo TEXT NOT NULL CHECK (tipo IN ('Ingreso','Egreso','Transferencia')),
  categoria_id UUID NOT NULL REFERENCES categorias_financieras(id),
  subcategoria_id UUID REFERENCES subcategorias_financieras(id),
  fiscal BOOLEAN DEFAULT FALSE,
  descripcion TEXT NOT NULL CHECK (length(descripcion) >= 10 AND length(descripcion) <= 500),
  proveedor_id UUID REFERENCES proveedores(id),
  forma_pago TEXT NOT NULL CHECK (forma_pago IN ('Efectivo','Transferencia','Cheque','Tarjeta')),
  monto NUMERIC(15,2) NOT NULL CHECK (monto > 0),
  fecha_programada DATE NOT NULL,
  frecuencia TEXT NOT NULL DEFAULT 'Único' CHECK (frecuencia IN ('Único','Semanal','Quincenal','Mensual','Anual')),
  pagado BOOLEAN DEFAULT FALSE,
  fecha_efectiva_pago DATE,
  fecha_inicial_serie DATE,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Historial de pagos realizados (nueva tabla)
CREATE TABLE IF NOT EXISTS financial_payments_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pago_programado_id UUID REFERENCES financial_payments(id) ON DELETE SET NULL,
  usuario_id UUID NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Ingreso','Egreso','Transferencia')),
  categoria_id UUID NOT NULL REFERENCES categorias_financieras(id),
  subcategoria_id UUID REFERENCES subcategorias_financieras(id),
  fiscal BOOLEAN DEFAULT FALSE,
  descripcion TEXT NOT NULL,
  proveedor_id UUID REFERENCES proveedores(id),
  forma_pago TEXT NOT NULL CHECK (forma_pago IN ('Efectivo','Transferencia','Cheque','Tarjeta')),
  monto NUMERIC(15,2) NOT NULL,
  fecha_programada DATE NOT NULL,
  fecha_efectiva_pago DATE NOT NULL,
  frecuencia TEXT CHECK (frecuencia IN ('Único','Semanal','Quincenal','Mensual','Anual')),
  notas TEXT,
  moved_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_financial_payments_fecha_programada ON financial_payments (fecha_programada);
CREATE INDEX IF NOT EXISTS idx_financial_payments_tipo ON financial_payments (tipo);
CREATE INDEX IF NOT EXISTS idx_financial_payments_pagado ON financial_payments (pagado);

CREATE INDEX IF NOT EXISTS idx_financial_payments_history_fecha_efectiva ON financial_payments_history (fecha_efectiva_pago);
CREATE INDEX IF NOT EXISTS idx_financial_payments_history_tipo ON financial_payments_history (tipo);
CREATE INDEX IF NOT EXISTS idx_financial_payments_history_categoria ON financial_payments_history (categoria_id);

-- Triggers de updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_financial_payments_updated ON financial_payments;
CREATE TRIGGER trg_financial_payments_updated
BEFORE UPDATE ON financial_payments
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Reglas de negocio como constraints
DO $$ BEGIN
  ALTER TABLE financial_payments
    ADD CONSTRAINT chk_pagado_con_fecha CHECK (NOT pagado OR fecha_efectiva_pago IS NOT NULL);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE financial_payments
    ADD CONSTRAINT chk_frecuencia_con_fecha_serie CHECK (
      (frecuencia = 'Único' AND fecha_inicial_serie IS NULL) OR 
      (frecuencia <> 'Único' AND fecha_inicial_serie IS NOT NULL)
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add columns for movement, scope and text categories if not exist
DO $$ BEGIN
  ALTER TABLE financial_payments ADD COLUMN IF NOT EXISTS movimiento TEXT CHECK (movimiento IN ('Ingreso','Egreso'));
  ALTER TABLE financial_payments ADD COLUMN IF NOT EXISTS scope_tipo TEXT; -- PERSONAL/MANUCAR/CARBOX
  ALTER TABLE financial_payments ADD COLUMN IF NOT EXISTS categoria_nombre TEXT;
  ALTER TABLE financial_payments ADD COLUMN IF NOT EXISTS subcategoria_nombre TEXT;
  ALTER TABLE financial_payments ADD COLUMN IF NOT EXISTS proveedor_cliente TEXT;
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE financial_payments_history ADD COLUMN IF NOT EXISTS movimiento TEXT CHECK (movimiento IN ('Ingreso','Egreso'));
  ALTER TABLE financial_payments_history ADD COLUMN IF NOT EXISTS scope_tipo TEXT;
  ALTER TABLE financial_payments_history ADD COLUMN IF NOT EXISTS categoria_nombre TEXT;
  ALTER TABLE financial_payments_history ADD COLUMN IF NOT EXISTS subcategoria_nombre TEXT;
  ALTER TABLE financial_payments_history ADD COLUMN IF NOT EXISTS proveedor_cliente TEXT;
EXCEPTION WHEN others THEN NULL; END $$;

-- Update trigger to copy new columns
CREATE OR REPLACE FUNCTION move_payment_to_history() RETURNS trigger AS $$
DECLARE
  next_date DATE;
BEGIN
  IF NEW.pagado = true AND COALESCE(OLD.pagado, false) = false THEN
    INSERT INTO financial_payments_history (
      pago_programado_id, usuario_id, movimiento, scope_tipo,
      tipo, categoria_id, subcategoria_id, categoria_nombre, subcategoria_nombre,
      fiscal, descripcion, proveedor_id, proveedor_cliente, forma_pago, monto,
      fecha_programada, fecha_efectiva_pago, frecuencia, notas
    ) VALUES (
      NEW.id, NEW.usuario_id, NEW.movimiento, NEW.scope_tipo,
      NEW.tipo, NEW.categoria_id, NEW.subcategoria_id, NEW.categoria_nombre, NEW.subcategoria_nombre,
      NEW.fiscal, NEW.descripcion, NEW.proveedor_id, NEW.proveedor_cliente, NEW.forma_pago, NEW.monto,
      NEW.fecha_programada, NEW.fecha_efectiva_pago, NEW.frecuencia, NEW.notas
    );

    IF NEW.frecuencia = 'Único' THEN
      DELETE FROM financial_payments WHERE id = NEW.id;
      RETURN NULL;
    ELSE
      next_date := CASE NEW.frecuencia
        WHEN 'Semanal' THEN (NEW.fecha_programada + INTERVAL '7 days')::date
        WHEN 'Quincenal' THEN (NEW.fecha_programada + INTERVAL '15 days')::date
        WHEN 'Mensual' THEN (NEW.fecha_programada + INTERVAL '1 month')::date
        WHEN 'Anual' THEN (NEW.fecha_programada + INTERVAL '1 year')::date
        ELSE NEW.fecha_programada
      END;
      UPDATE financial_payments
      SET pagado = false,
          fecha_efectiva_pago = NULL,
          fecha_programada = next_date
      WHERE id = NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_move_payment_to_history ON financial_payments;
CREATE TRIGGER trg_move_payment_to_history
AFTER UPDATE OF pagado, fecha_efectiva_pago ON financial_payments
FOR EACH ROW EXECUTE FUNCTION move_payment_to_history();

-- Ampliar listas permitidas para forma_pago y frecuencia
DO $$ BEGIN
  ALTER TABLE financial_payments DROP CONSTRAINT IF EXISTS financial_payments_forma_pago_check;
  ALTER TABLE financial_payments DROP CONSTRAINT IF EXISTS financial_payments_frecuencia_check;
  ALTER TABLE financial_payments
    ADD CONSTRAINT chk_forma_pago_values CHECK (
      forma_pago IN (
        'Efectivo','Transferencia','Terminal','Cheque','Debito automatico',
        'TDC Costco JANA BNX','TDC Roja CARLOS BNX','TDC Costco CARLOS BNX',
        'TDC Clasica CARLOS Inbursa','TDC Walmart CARLOS Inbursa','TDD Manucar INBURSA',
        'TDD Carlos INBURSA','TDD Jana INBURSA','TDD INBURSA Manucar',
        'DEBITO MERCADO PAGO MANUCAR','Otro'
      )
    );
  ALTER TABLE financial_payments
    ADD CONSTRAINT chk_frecuencia_values CHECK (
      frecuencia IN ('Único','Diario','Semanal','Quincenal','Mensual','Bimestral','Trimestral','Semestral','Anual')
    );
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE financial_payments_history DROP CONSTRAINT IF EXISTS financial_payments_history_forma_pago_check;
  ALTER TABLE financial_payments_history DROP CONSTRAINT IF EXISTS financial_payments_history_frecuencia_check;
  ALTER TABLE financial_payments_history
    ADD CONSTRAINT chk_hist_forma_pago_values CHECK (
      forma_pago IN (
        'Efectivo','Transferencia','Terminal','Cheque','Debito automatico',
        'TDC Costco JANA BNX','TDC Roja CARLOS BNX','TDC Costco CARLOS BNX',
        'TDC Clasica CARLOS Inbursa','TDC Walmart CARLOS Inbursa','TDD Manucar INBURSA',
        'TDD Carlos INBURSA','TDD Jana INBURSA','TDD INBURSA Manucar',
        'DEBITO MERCADO PAGO MANUCAR','Otro'
      )
    );
  ALTER TABLE financial_payments_history
    ADD CONSTRAINT chk_hist_frecuencia_values CHECK (
      frecuencia IN ('Único','Diario','Semanal','Quincenal','Mensual','Bimestral','Trimestral','Semestral','Anual')
    );
EXCEPTION WHEN others THEN NULL; END $$;

-- RLS
ALTER TABLE categorias_financieras ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategorias_financieras ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_payments_history ENABLE ROW LEVEL SECURITY;

-- Categorías
DROP POLICY IF EXISTS categorias_read_own ON categorias_financieras;
CREATE POLICY categorias_read_own ON categorias_financieras FOR SELECT USING (usuario_id = auth.uid());
DROP POLICY IF EXISTS categorias_insert_own ON categorias_financieras;
CREATE POLICY categorias_insert_own ON categorias_financieras FOR INSERT WITH CHECK (usuario_id = auth.uid());
DROP POLICY IF EXISTS categorias_update_own ON categorias_financieras;
CREATE POLICY categorias_update_own ON categorias_financieras FOR UPDATE USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());
DROP POLICY IF EXISTS categorias_delete_own ON categorias_financieras;
CREATE POLICY categorias_delete_own ON categorias_financieras FOR DELETE USING (usuario_id = auth.uid());

-- Subcategorías
DROP POLICY IF EXISTS subcategorias_read_own ON subcategorias_financieras;
CREATE POLICY subcategorias_read_own ON subcategorias_financieras FOR SELECT USING (usuario_id = auth.uid());
DROP POLICY IF EXISTS subcategorias_insert_own ON subcategorias_financieras;
CREATE POLICY subcategorias_insert_own ON subcategorias_financieras FOR INSERT WITH CHECK (usuario_id = auth.uid());
DROP POLICY IF EXISTS subcategorias_update_own ON subcategorias_financieras;
CREATE POLICY subcategorias_update_own ON subcategorias_financieras FOR UPDATE USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());
DROP POLICY IF EXISTS subcategorias_delete_own ON subcategorias_financieras;
CREATE POLICY subcategorias_delete_own ON subcategorias_financieras FOR DELETE USING (usuario_id = auth.uid());

-- Proveedores
DROP POLICY IF EXISTS proveedores_read_own ON proveedores;
CREATE POLICY proveedores_read_own ON proveedores FOR SELECT USING (usuario_id = auth.uid());
DROP POLICY IF EXISTS proveedores_insert_own ON proveedores;
CREATE POLICY proveedores_insert_own ON proveedores FOR INSERT WITH CHECK (usuario_id = auth.uid());
DROP POLICY IF EXISTS proveedores_update_own ON proveedores;
CREATE POLICY proveedores_update_own ON proveedores FOR UPDATE USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());
DROP POLICY IF EXISTS proveedores_delete_own ON proveedores;
CREATE POLICY proveedores_delete_own ON proveedores FOR DELETE USING (usuario_id = auth.uid());

-- Pagos
DROP POLICY IF EXISTS payments_read_own ON financial_payments;
CREATE POLICY payments_read_own ON financial_payments FOR SELECT USING (usuario_id = auth.uid());
DROP POLICY IF EXISTS payments_insert_own ON financial_payments;
CREATE POLICY payments_insert_own ON financial_payments FOR INSERT WITH CHECK (usuario_id = auth.uid());
DROP POLICY IF EXISTS payments_update_own ON financial_payments;
CREATE POLICY payments_update_own ON financial_payments FOR UPDATE USING (usuario_id = auth.uid()) WITH CHECK (usuario_id = auth.uid());
DROP POLICY IF EXISTS payments_delete_own ON financial_payments;
CREATE POLICY payments_delete_own ON financial_payments FOR DELETE USING (usuario_id = auth.uid());

-- Historial RLS
DROP POLICY IF EXISTS payments_history_read_own ON financial_payments_history;
CREATE POLICY payments_history_read_own ON financial_payments_history FOR SELECT USING (usuario_id = auth.uid());
DROP POLICY IF EXISTS payments_history_delete_own ON financial_payments_history;
CREATE POLICY payments_history_delete_own ON financial_payments_history FOR DELETE USING (usuario_id = auth.uid());

-- Comentario: Validar RFC, fechas históricas y reglas adicionales se manejan en frontend y/o funciones