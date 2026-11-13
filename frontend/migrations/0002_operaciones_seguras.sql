
-- Rechazar operaciones que no correspondan
-- al stock actual y a la tienda del producto.

CREATE TRIGGER IF NOT EXISTS validar_operacion_inventario
BEFORE INSERT ON operaciones_inventario
BEGIN
  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1
      FROM productos
      WHERE id = NEW.producto_id
        AND tienda_id = NEW.tienda_id
        AND stock = NEW.stock_anterior
        AND NEW.stock_nuevo =
          CASE
            WHEN NEW.tipo = 'ENTRADA'
              THEN stock + NEW.cantidad
            WHEN NEW.tipo = 'SALIDA'
              THEN stock - NEW.cantidad
            ELSE -1
          END
        AND NEW.stock_nuevo >= 0
    )
    THEN RAISE(ABORT, 'STOCK_CONFLICT')
  END;
END;

-- Una inserción válida aplica el ajuste
-- dentro de la misma operación SQL.

CREATE TRIGGER IF NOT EXISTS aplicar_operacion_inventario
AFTER INSERT ON operaciones_inventario
BEGIN
  UPDATE productos
  SET stock = NEW.stock_nuevo,
      actualizado_en = CURRENT_TIMESTAMP
  WHERE id = NEW.producto_id
    AND tienda_id = NEW.tienda_id
    AND stock = NEW.stock_anterior;

  SELECT CASE
    WHEN changes() <> 1
    THEN RAISE(ABORT, 'STOCK_UPDATE_FAILED')
  END;
END;
