/*
  # Funciones para el módulo independiente

  1. Funciones de gestión
    - crear_modulo_independiente
    - asignar_inversor_modulo
    - asignar_partner_modulo
    - remover_inversor_modulo
    - remover_partner_modulo

  2. Funciones de calendario
    - crear_mes_modulo
    - editar_mes_modulo
    - eliminar_mes_modulo
    - obtener_mes_actual_modulo

  3. Funciones de ganancias
    - procesar_ganancias_modulo
    - obtener_configuracion_ganancias_modulo
    - guardar_configuracion_ganancias_modulo

  4. Funciones de consulta
    - obtener_inversores_modulo
    - obtener_partners_modulo
    - verificar_acceso_modulo
*/

-- Función para crear un nuevo módulo independiente
CREATE OR REPLACE FUNCTION crear_modulo_independiente(
  p_nombre text,
  p_descripcion text DEFAULT NULL,
  p_admin_id uuid DEFAULT NULL
)
RETURNS TABLE(success boolean, message text, modulo_id uuid) 
SECURITY DEFINER
AS $$
DECLARE
  v_modulo_id uuid;
BEGIN
  -- Crear el módulo
  INSERT INTO modulos_independientes (nombre, descripcion, creado_por)
  VALUES (p_nombre, p_descripcion, p_admin_id)
  RETURNING id INTO v_modulo_id;
  
  -- Crear configuración por defecto
  INSERT INTO modulo_configuracion_ganancias (modulo_id, porcentaje_partners, porcentaje_inversores, descripcion, creado_por)
  VALUES (v_modulo_id, 30, 70, 'Configuración inicial del módulo', p_admin_id);
  
  RETURN QUERY SELECT true, 'Módulo creado exitosamente', v_modulo_id;
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Error al crear el módulo: ' || SQLERRM, NULL::uuid;
END;
$$ LANGUAGE plpgsql;

-- Función para asignar inversor a módulo
CREATE OR REPLACE FUNCTION asignar_inversor_modulo(
  p_modulo_id uuid,
  p_inversor_id uuid,
  p_admin_id uuid DEFAULT NULL
)
RETURNS TABLE(success boolean, message text) 
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el módulo existe
  IF NOT EXISTS (SELECT 1 FROM modulos_independientes WHERE id = p_modulo_id AND activo = true) THEN
    RETURN QUERY SELECT false, 'El módulo no existe o no está activo';
    RETURN;
  END IF;
  
  -- Verificar que el inversor existe
  IF NOT EXISTS (SELECT 1 FROM inversores WHERE id = p_inversor_id) THEN
    RETURN QUERY SELECT false, 'El inversor no existe';
    RETURN;
  END IF;
  
  -- Asignar inversor (ON CONFLICT para evitar duplicados)
  INSERT INTO modulo_inversores (modulo_id, inversor_id, asignado_por, activo)
  VALUES (p_modulo_id, p_inversor_id, p_admin_id, true)
  ON CONFLICT (modulo_id, inversor_id) 
  DO UPDATE SET activo = true, fecha_asignacion = now(), asignado_por = p_admin_id;
  
  RETURN QUERY SELECT true, 'Inversor asignado exitosamente al módulo';
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Error al asignar inversor: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Función para asignar partner a módulo
CREATE OR REPLACE FUNCTION asignar_partner_modulo(
  p_modulo_id uuid,
  p_partner_id uuid,
  p_admin_id uuid DEFAULT NULL
)
RETURNS TABLE(success boolean, message text) 
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el módulo existe
  IF NOT EXISTS (SELECT 1 FROM modulos_independientes WHERE id = p_modulo_id AND activo = true) THEN
    RETURN QUERY SELECT false, 'El módulo no existe o no está activo';
    RETURN;
  END IF;
  
  -- Verificar que el partner existe
  IF NOT EXISTS (SELECT 1 FROM partners WHERE id = p_partner_id AND activo = true) THEN
    RETURN QUERY SELECT false, 'El partner no existe o no está activo';
    RETURN;
  END IF;
  
  -- Asignar partner (ON CONFLICT para evitar duplicados)
  INSERT INTO modulo_partners (modulo_id, partner_id, asignado_por, activo)
  VALUES (p_modulo_id, p_partner_id, p_admin_id, true)
  ON CONFLICT (modulo_id, partner_id) 
  DO UPDATE SET activo = true, fecha_asignacion = now(), asignado_por = p_admin_id;
  
  RETURN QUERY SELECT true, 'Partner asignado exitosamente al módulo';
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Error al asignar partner: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Función para remover inversor de módulo
CREATE OR REPLACE FUNCTION remover_inversor_modulo(
  p_modulo_id uuid,
  p_inversor_id uuid
)
RETURNS TABLE(success boolean, message text) 
SECURITY DEFINER
AS $$
BEGIN
  -- Desactivar la asignación
  UPDATE modulo_inversores 
  SET activo = false 
  WHERE modulo_id = p_modulo_id AND inversor_id = p_inversor_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'El inversor no está asignado a este módulo';
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, 'Inversor removido exitosamente del módulo';
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Error al remover inversor: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Función para remover partner de módulo
CREATE OR REPLACE FUNCTION remover_partner_modulo(
  p_modulo_id uuid,
  p_partner_id uuid
)
RETURNS TABLE(success boolean, message text) 
SECURITY DEFINER
AS $$
BEGIN
  -- Desactivar la asignación
  UPDATE modulo_partners 
  SET activo = false 
  WHERE modulo_id = p_modulo_id AND partner_id = p_partner_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'El partner no está asignado a este módulo';
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, 'Partner removido exitosamente del módulo';
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Error al remover partner: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Función para crear mes en módulo
CREATE OR REPLACE FUNCTION crear_mes_modulo(
  p_modulo_id uuid,
  p_numero_mes integer,
  p_nombre_mes text,
  p_fecha_inicio date,
  p_fecha_fin date,
  p_admin_id uuid DEFAULT NULL
)
RETURNS TABLE(success boolean, message text) 
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar que el módulo existe
  IF NOT EXISTS (SELECT 1 FROM modulos_independientes WHERE id = p_modulo_id AND activo = true) THEN
    RETURN QUERY SELECT false, 'El módulo no existe o no está activo';
    RETURN;
  END IF;
  
  -- Verificar que no existe un mes con el mismo número
  IF EXISTS (SELECT 1 FROM modulo_meses WHERE modulo_id = p_modulo_id AND numero_mes = p_numero_mes) THEN
    RETURN QUERY SELECT false, 'Ya existe un mes con ese número en este módulo';
    RETURN;
  END IF;
  
  -- Crear el mes
  INSERT INTO modulo_meses (modulo_id, numero_mes, nombre_mes, fecha_inicio, fecha_fin)
  VALUES (p_modulo_id, p_numero_mes, p_nombre_mes, p_fecha_inicio, p_fecha_fin);
  
  RETURN QUERY SELECT true, 'Mes creado exitosamente en el módulo';
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Error al crear mes: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener mes actual del módulo
CREATE OR REPLACE FUNCTION obtener_mes_actual_modulo(p_modulo_id uuid)
RETURNS TABLE(
  id uuid,
  numero_mes integer,
  nombre_mes text,
  fecha_inicio date,
  fecha_fin date,
  procesado boolean
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT m.id, m.numero_mes, m.nombre_mes, m.fecha_inicio, m.fecha_fin, m.procesado
  FROM modulo_meses m
  WHERE m.modulo_id = p_modulo_id
  ORDER BY m.numero_mes DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar acceso de usuario a módulo
CREATE OR REPLACE FUNCTION verificar_acceso_modulo(
  p_modulo_id uuid,
  p_usuario_id uuid,
  p_tipo_usuario text
)
RETURNS boolean 
SECURITY DEFINER
AS $$
BEGIN
  IF p_tipo_usuario = 'inversor' THEN
    RETURN EXISTS (
      SELECT 1 FROM modulo_inversores 
      WHERE modulo_id = p_modulo_id AND inversor_id = p_usuario_id AND activo = true
    );
  ELSIF p_tipo_usuario = 'partner' THEN
    RETURN EXISTS (
      SELECT 1 FROM modulo_partners 
      WHERE modulo_id = p_modulo_id AND partner_id = p_usuario_id AND activo = true
    );
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener inversores del módulo
CREATE OR REPLACE FUNCTION obtener_inversores_modulo(p_modulo_id uuid)
RETURNS TABLE(
  id uuid,
  nombre text,
  apellido text,
  email text,
  total numeric,
  fecha_asignacion timestamptz,
  activo boolean
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT i.id, i.nombre, i.apellido, i.email, i.total, mi.fecha_asignacion, mi.activo
  FROM modulo_inversores mi
  JOIN inversores i ON mi.inversor_id = i.id
  WHERE mi.modulo_id = p_modulo_id
  ORDER BY mi.fecha_asignacion DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener partners del módulo
CREATE OR REPLACE FUNCTION obtener_partners_modulo(p_modulo_id uuid)
RETURNS TABLE(
  id uuid,
  nombre text,
  username text,
  fecha_asignacion timestamptz,
  activo boolean
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.nombre, p.username, mp.fecha_asignacion, mp.activo
  FROM modulo_partners mp
  JOIN partners p ON mp.partner_id = p.id
  WHERE mp.modulo_id = p_modulo_id
  ORDER BY mp.fecha_asignacion DESC;
END;
$$ LANGUAGE plpgsql;

-- Función para obtener configuración de ganancias del módulo
CREATE OR REPLACE FUNCTION obtener_configuracion_ganancias_modulo(p_modulo_id uuid)
RETURNS TABLE(
  porcentaje_partners numeric,
  porcentaje_inversores numeric,
  descripcion text,
  fecha_creacion timestamptz
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT mcg.porcentaje_partners, mcg.porcentaje_inversores, mcg.descripcion, mcg.fecha_creacion
  FROM modulo_configuracion_ganancias mcg
  WHERE mcg.modulo_id = p_modulo_id
  ORDER BY mcg.fecha_creacion DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Función para procesar ganancias del módulo
CREATE OR REPLACE FUNCTION procesar_ganancias_modulo(
  p_modulo_id uuid,
  p_porcentaje_ganancia numeric,
  p_admin_id uuid DEFAULT NULL,
  p_usar_configuracion_personalizada boolean DEFAULT false,
  p_porcentaje_partners_custom numeric DEFAULT NULL,
  p_porcentaje_inversores_custom numeric DEFAULT NULL
)
RETURNS TABLE(success boolean, message text) 
SECURITY DEFINER
AS $$
DECLARE
  v_mes_actual record;
  v_total_inversion numeric := 0;
  v_ganancia_bruta numeric;
  v_porcentaje_partners numeric;
  v_porcentaje_inversores numeric;
  v_ganancia_partners numeric;
  v_ganancia_inversores numeric;
  v_config record;
  v_inversor record;
  v_partner record;
  v_partners_activos integer;
  v_ganancia_por_partner numeric;
BEGIN
  -- Obtener mes actual del módulo
  SELECT INTO v_mes_actual * FROM obtener_mes_actual_modulo(p_modulo_id) LIMIT 1;
  
  IF v_mes_actual IS NULL THEN
    RETURN QUERY SELECT false, 'No hay meses configurados en este módulo';
    RETURN;
  END IF;
  
  IF v_mes_actual.procesado THEN
    RETURN QUERY SELECT false, 'El mes actual ya está procesado';
    RETURN;
  END IF;
  
  -- Calcular total de inversión desde transacciones del módulo
  SELECT COALESCE(SUM(
    CASE 
      WHEN tipo = 'deposito' THEN monto
      WHEN tipo = 'retiro' THEN -monto
      WHEN tipo = 'ganancia' THEN monto
      ELSE 0
    END
  ), 0) INTO v_total_inversion
  FROM modulo_transacciones
  WHERE modulo_id = p_modulo_id;
  
  IF v_total_inversion <= 0 THEN
    RETURN QUERY SELECT false, 'No hay inversión total en este módulo';
    RETURN;
  END IF;
  
  -- Calcular ganancia bruta
  v_ganancia_bruta := (p_porcentaje_ganancia * v_total_inversion) / 100;
  
  -- Obtener configuración de distribución
  IF p_usar_configuracion_personalizada THEN
    v_porcentaje_partners := p_porcentaje_partners_custom;
    v_porcentaje_inversores := p_porcentaje_inversores_custom;
  ELSE
    SELECT INTO v_config * FROM obtener_configuracion_ganancias_modulo(p_modulo_id) LIMIT 1;
    v_porcentaje_partners := COALESCE(v_config.porcentaje_partners, 30);
    v_porcentaje_inversores := COALESCE(v_config.porcentaje_inversores, 70);
  END IF;
  
  -- Calcular distribución
  v_ganancia_partners := (v_ganancia_bruta * v_porcentaje_partners) / 100;
  v_ganancia_inversores := (v_ganancia_bruta * v_porcentaje_inversores) / 100;
  
  -- Contar partners activos en el módulo
  SELECT COUNT(*) INTO v_partners_activos
  FROM modulo_partners mp
  JOIN partners p ON mp.partner_id = p.id
  WHERE mp.modulo_id = p_modulo_id AND mp.activo = true AND p.activo = true;
  
  v_ganancia_por_partner := CASE WHEN v_partners_activos > 0 THEN v_ganancia_partners / v_partners_activos ELSE 0 END;
  
  -- Procesar ganancias para inversores asignados al módulo
  FOR v_inversor IN 
    SELECT i.id, i.total
    FROM modulo_inversores mi
    JOIN inversores i ON mi.inversor_id = i.id
    WHERE mi.modulo_id = p_modulo_id AND mi.activo = true
  LOOP
    DECLARE
      v_ganancia_proporcional numeric;
    BEGIN
      -- Calcular ganancia proporcional
      v_ganancia_proporcional := (v_ganancia_inversores * v_inversor.total) / v_total_inversion;
      
      -- Crear transacción de ganancia en el módulo
      INSERT INTO modulo_transacciones (modulo_id, inversor_id, usuario_tipo, monto, tipo, descripcion, mes_id)
      VALUES (p_modulo_id, v_inversor.id, 'inversor', v_ganancia_proporcional, 'ganancia', 
              'Ganancia mensual - ' || v_mes_actual.nombre_mes, v_mes_actual.id);
      
      -- Crear notificación
      INSERT INTO modulo_notificaciones (modulo_id, usuario_id, tipo_usuario, titulo, mensaje, tipo_notificacion)
      VALUES (p_modulo_id, v_inversor.id, 'inversor', 
              'Ganancia Procesada - ' || v_mes_actual.nombre_mes,
              'Se ha procesado tu ganancia mensual de ' || v_ganancia_proporcional::text || ' USD',
              'success');
    END;
  END LOOP;
  
  -- Procesar ganancias para partners asignados al módulo
  FOR v_partner IN 
    SELECT p.id
    FROM modulo_partners mp
    JOIN partners p ON mp.partner_id = p.id
    WHERE mp.modulo_id = p_modulo_id AND mp.activo = true AND p.activo = true
  LOOP
    DECLARE
      v_ganancia_proporcional_partner numeric;
      v_ganancia_total_partner numeric;
      v_saldo_partner numeric := 0;
    BEGIN
      -- Calcular saldo actual del partner en el módulo
      SELECT COALESCE(SUM(
        CASE 
          WHEN tipo = 'deposito' THEN monto
          WHEN tipo = 'retiro' THEN -monto
          WHEN tipo = 'ganancia' THEN monto
          ELSE 0
        END
      ), 0) INTO v_saldo_partner
      FROM modulo_transacciones
      WHERE modulo_id = p_modulo_id AND partner_id = v_partner.id;
      
      -- Calcular ganancia proporcional del partner
      v_ganancia_proporcional_partner := CASE WHEN v_total_inversion > 0 THEN (v_ganancia_inversores * v_saldo_partner) / v_total_inversion ELSE 0 END;
      
      -- Ganancia total = proporcional + parte exclusiva
      v_ganancia_total_partner := v_ganancia_proporcional_partner + v_ganancia_por_partner;
      
      -- Crear transacción de ganancia en el módulo
      INSERT INTO modulo_transacciones (modulo_id, partner_id, usuario_tipo, monto, tipo, descripcion, mes_id)
      VALUES (p_modulo_id, v_partner.id, 'partner', v_ganancia_total_partner, 'ganancia', 
              'Ganancia mensual - ' || v_mes_actual.nombre_mes, v_mes_actual.id);
      
      -- Crear notificación
      INSERT INTO modulo_notificaciones (modulo_id, usuario_id, tipo_usuario, titulo, mensaje, tipo_notificacion)
      VALUES (p_modulo_id, v_partner.id, 'partner', 
              'Ganancia Procesada - ' || v_mes_actual.nombre_mes,
              'Se ha procesado tu ganancia mensual de ' || v_ganancia_total_partner::text || ' USD',
              'success');
    END;
  END LOOP;
  
  -- Marcar mes como procesado
  UPDATE modulo_meses 
  SET procesado = true,
      fecha_procesado = now(),
      procesado_por = p_admin_id,
      total_inversion = v_total_inversion,
      porcentaje_ganancia = p_porcentaje_ganancia,
      ganancia_bruta = v_ganancia_bruta,
      ganancia_partners = v_ganancia_partners,
      ganancia_inversores = v_ganancia_inversores
  WHERE id = v_mes_actual.id;
  
  RETURN QUERY SELECT true, 'Ganancias procesadas exitosamente para el módulo';
EXCEPTION
  WHEN OTHERS THEN
    RETURN QUERY SELECT false, 'Error al procesar ganancias: ' || SQLERRM;
END;
$$ LANGUAGE plpgsql;