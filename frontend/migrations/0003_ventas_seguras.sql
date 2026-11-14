
-- 0003_ventas_seguras.sql
-- Validar los detalles de venta antes de descontar stock.

CREATE TRIGGER IF NOT EXISTS validar_detalle_venta
BEFORE INSERT ON ventas_detalle
BEGIN
  SELECT CASE
    WHEN NEW.cantidad IS NULL
      OR typeof(NEW.cantidad) <> 'integer'
      OR NEW.cantidad <= 0
      OR NEW.precioUnitario IS NULL
      OR NEW.precioUnitario < 0
      OR NEW.subtotal IS NULL
      OR NEW.subtotal < 0
    THEN RAISE(ABORT, 'DETALLE_INVALIDO')
  END;

  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1
      FROM ventas
      WHERE id = NEW.ventaId
        AND tienda_id = NEW.tienda_id
    )
    THEN RAISE(ABORT, 'VENTA_TIENDA_INVALIDA')
  END;

  SELECT CASE
    WHEN NOT EXISTS (
      SELECT 1
      FROM productos
      WHERE id = NEW.productoId
        AND tienda_id = NEW.tienda_id
        AND stock >= NEW.cantidad
    )
    THEN RAISE(ABORT, 'STOCK_INSUFICIENTE')
  END;
END;

-- Descontar existencias al insertar un detalle válido.
CREATE TRIGGER IF NOT EXISTS aplicar_detalle_venta
AFTER INSERT ON ventas_detalle
BEGIN
  UPDATE productos
  SET stock = stock - NEW.cantidad,
      actualizado_en = CURRENT_TIMESTAMP
  WHERE id = NEW.productoId
    AND tienda_id = NEW.tienda_id
    AND stock >= NEW.cantidad;

  SELECT CASE
    WHEN changes() <> 1
    THEN RAISE(ABORT, 'VENTA_STOCK_UPDATE_FAILED')
  END;
END;
