/*
  # Crear módulo de inversiones independiente

  1. Nuevas Tablas
    - `modulos_independientes` - Configuración de módulos
    - `modulo_inversores` - Asignación de inversores a módulos
    - `modulo_partners` - Asignación de partners a módulos
    - `modulo_meses` - Períodos mensuales por módulo
    - `modulo_transacciones` - Transacciones por módulo
    - `modulo_ganancias_semanales` - Ganancias procesadas por módulo
    - `modulo_partner_ganancias` - Ganancias de partners por módulo
    - `modulo_solicitudes` - Solicitudes de inversores por módulo
    - `modulo_partner_solicitudes` - Solicitudes de partners por módulo
    - `modulo_notificaciones` - Notificaciones por módulo
    - `modulo_configuracion_ganancias` - Configuración de distribución por módulo

  2. Seguridad
    - Todas las tablas tienen RLS habilitado
    - Políticas públicas para acceso sin autenticación
    - Funciones públicas para operaciones del módulo

  3. Funciones
    - Gestión de asignaciones
    - Procesamiento de ganancias
    - Manejo de solicitudes
    - Configuración del módulo
*/

-- Tabla principal de módulos independientes
CREATE TABLE IF NOT EXISTS modulos_independientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL DEFAULT 'Módulo Independiente',
  descripcion text,
  activo boolean DEFAULT true,
  fecha_creacion timestamptz DEFAULT now(),
  creado_por uuid REFERENCES admins(id),
  configuracion jsonb DEFAULT '{}'::jsonb
);

-- Asignación de inversores a módulos
CREATE TABLE IF NOT EXISTS modulo_inversores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id uuid NOT NULL REFERENCES modulos_independientes(id) ON DELETE CASCADE,
  inversor_id uuid NOT NULL REFERENCES inversores(id) ON DELETE CASCADE,
  fecha_asignacion timestamptz DEFAULT now(),
  asignado_por uuid REFERENCES admins(id),
  activo boolean DEFAULT true,
  UNIQUE(modulo_id, inversor_id)
);

-- Asignación de partners a módulos
CREATE TABLE IF NOT EXISTS modulo_partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id uuid NOT NULL REFERENCES modulos_independientes(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  fecha_asignacion timestamptz DEFAULT now(),
  asignado_por uuid REFERENCES admins(id),
  activo boolean DEFAULT true,
  UNIQUE(modulo_id, partner_id)
);

-- Períodos mensuales por módulo
CREATE TABLE IF NOT EXISTS modulo_meses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id uuid NOT NULL REFERENCES modulos_independientes(id) ON DELETE CASCADE,
  numero_mes integer NOT NULL,
  nombre_mes text NOT NULL,
  fecha_inicio date NOT NULL,
  fecha_fin date NOT NULL,
  total_inversion numeric(15,2) DEFAULT 0,
  porcentaje_ganancia numeric(5,2) DEFAULT 0,
  ganancia_bruta numeric(15,2) DEFAULT 0,
  ganancia_partners numeric(15,2) DEFAULT 0,
  ganancia_inversores numeric(15,2) DEFAULT 0,
  procesado boolean DEFAULT false,
  fecha_procesado timestamptz,
  procesado_por uuid REFERENCES admins(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(modulo_id, numero_mes)
);

-- Transacciones por módulo
CREATE TABLE IF NOT EXISTS modulo_transacciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id uuid NOT NULL REFERENCES modulos_independientes(id) ON DELETE CASCADE,
  inversor_id uuid REFERENCES inversores(id) ON DELETE CASCADE,
  partner_id uuid REFERENCES partners(id) ON DELETE CASCADE,
  usuario_tipo text NOT NULL CHECK (usuario_tipo IN ('inversor', 'partner')),
  monto numeric(15,2) NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('deposito', 'retiro', 'ganancia')),
  fecha timestamptz DEFAULT now(),
  descripcion text,
  mes_id uuid REFERENCES modulo_meses(id) ON DELETE SET NULL
);

-- Ganancias semanales procesadas por módulo
CREATE TABLE IF NOT EXISTS modulo_ganancias_semanales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id uuid NOT NULL REFERENCES modulos_independientes(id) ON DELETE CASCADE,
  mes_id uuid NOT NULL REFERENCES modulo_meses(id) ON DELETE CASCADE,
  semana_numero integer NOT NULL,
  fecha_inicio date NOT NULL,
  fecha_fin date NOT NULL,
  total_inversion numeric(15,2) DEFAULT 0,
  porcentaje_ganancia numeric(5,2) NOT NULL,
  ganancia_bruta numeric(15,2) NOT NULL,
  ganancia_partners numeric(15,2) NOT NULL,
  ganancia_inversores numeric(15,2) NOT NULL,
  procesado boolean DEFAULT false,
  fecha_procesado timestamptz,
  procesado_por uuid REFERENCES admins(id)
);

-- Ganancias de partners por módulo
CREATE TABLE IF NOT EXISTS modulo_partner_ganancias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id uuid NOT NULL REFERENCES modulos_independientes(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  mes_id uuid NOT NULL REFERENCES modulo_meses(id) ON DELETE CASCADE,
  semana_numero integer NOT NULL,
  ganancia_total numeric(15,2) DEFAULT 0,
  ganancia_comision numeric(15,2) DEFAULT 0,
  ganancia_operador numeric(15,2) DEFAULT 0,
  total_inversores integer DEFAULT 0,
  monto_total_inversores numeric(15,2) DEFAULT 0,
  fecha_calculo timestamptz DEFAULT now()
);

-- Solicitudes de inversores por módulo
CREATE TABLE IF NOT EXISTS modulo_solicitudes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id uuid NOT NULL REFERENCES modulos_independientes(id) ON DELETE CASCADE,
  inversor_id uuid NOT NULL REFERENCES inversores(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('deposito', 'retiro')),
  monto numeric(15,2) NOT NULL,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  motivo_rechazo text,
  fecha_solicitud timestamptz DEFAULT now(),
  fecha_procesado timestamptz,
  procesado_por uuid REFERENCES admins(id),
  notas text
);

-- Solicitudes de partners por módulo
CREATE TABLE IF NOT EXISTS modulo_partner_solicitudes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id uuid NOT NULL REFERENCES modulos_independientes(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('deposito', 'retiro')),
  monto numeric(15,2) NOT NULL,
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  motivo_rechazo text,
  fecha_solicitud timestamptz DEFAULT now(),
  fecha_procesado timestamptz,
  procesado_por uuid REFERENCES admins(id)
);

-- Notificaciones por módulo
CREATE TABLE IF NOT EXISTS modulo_notificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id uuid NOT NULL REFERENCES modulos_independientes(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL,
  tipo_usuario text NOT NULL CHECK (tipo_usuario IN ('inversor', 'partner')),
  titulo text NOT NULL,
  mensaje text NOT NULL,
  tipo_notificacion text DEFAULT 'info' CHECK (tipo_notificacion IN ('info', 'success', 'warning', 'error')),
  leida boolean DEFAULT false,
  fecha_creacion timestamptz DEFAULT now(),
  fecha_leida timestamptz
);

-- Configuración de ganancias por módulo
CREATE TABLE IF NOT EXISTS modulo_configuracion_ganancias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id uuid NOT NULL REFERENCES modulos_independientes(id) ON DELETE CASCADE,
  porcentaje_partners numeric(5,2) NOT NULL DEFAULT 30,
  porcentaje_inversores numeric(5,2) NOT NULL DEFAULT 70,
  descripcion text,
  fecha_creacion timestamptz DEFAULT now(),
  creado_por uuid REFERENCES admins(id),
  UNIQUE(modulo_id)
);

-- Habilitar RLS en todas las tablas
ALTER TABLE modulos_independientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulo_inversores ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulo_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulo_meses ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulo_transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulo_ganancias_semanales ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulo_partner_ganancias ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulo_solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulo_partner_solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulo_notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE modulo_configuracion_ganancias ENABLE ROW LEVEL SECURITY;

-- Políticas públicas para acceso sin autenticación
CREATE POLICY "Acceso público a modulos_independientes" ON modulos_independientes FOR ALL USING (true);
CREATE POLICY "Acceso público a modulo_inversores" ON modulo_inversores FOR ALL USING (true);
CREATE POLICY "Acceso público a modulo_partners" ON modulo_partners FOR ALL USING (true);
CREATE POLICY "Acceso público a modulo_meses" ON modulo_meses FOR ALL USING (true);
CREATE POLICY "Acceso público a modulo_transacciones" ON modulo_transacciones FOR ALL USING (true);
CREATE POLICY "Acceso público a modulo_ganancias_semanales" ON modulo_ganancias_semanales FOR ALL USING (true);
CREATE POLICY "Acceso público a modulo_partner_ganancias" ON modulo_partner_ganancias FOR ALL USING (true);
CREATE POLICY "Acceso público a modulo_solicitudes" ON modulo_solicitudes FOR ALL USING (true);
CREATE POLICY "Acceso público a modulo_partner_solicitudes" ON modulo_partner_solicitudes FOR ALL USING (true);
CREATE POLICY "Acceso público a modulo_notificaciones" ON modulo_notificaciones FOR ALL USING (true);
CREATE POLICY "Acceso público a modulo_configuracion_ganancias" ON modulo_configuracion_ganancias FOR ALL USING (true);

-- Crear módulo por defecto
INSERT INTO modulos_independientes (nombre, descripcion, activo) 
VALUES ('3 Meses', 'Módulo de inversiones a 3 meses', true)
ON CONFLICT DO NOTHING;

-- Crear configuración por defecto para el módulo
INSERT INTO modulo_configuracion_ganancias (modulo_id, porcentaje_partners, porcentaje_inversores, descripcion)
SELECT id, 30, 70, 'Configuración inicial del módulo'
FROM modulos_independientes 
WHERE nombre = '3 Meses'
ON CONFLICT (modulo_id) DO NOTHING;