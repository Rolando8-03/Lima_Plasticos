# Lima Plásticos (Web)

Proyecto web que replica Inventario, Facturación y Control Financiero del proyecto Python, sin login ni clientes.

## Estructura
- `index.html`: App principal con tres secciones.
- `assets/css/styles.css`: Estilos.
- `assets/js/app.js`: Navegación y utilidades de almacenamiento.
- `assets/js/inventory.js`: Inventario (alta, listado, búsqueda, import/export Excel).
- `assets/js/billing.js`: Facturación (crear factura, ajustar stock, listado de facturas).
- `assets/js/reports.js`: Control financiero (ventas y ganancias por día/semana/mes).

## Inventario
Campos por producto:
- categoría: fijo `1`.
- tipo, tamaño, marca, color.
- cantidad.
- precio_compra, precio_venta.
- código: generado automáticamente como `LP-000001`, `LP-000002`, ...

Acciones:
- Agregar producto.
- Buscar en tabla.
- Exportar a Excel.
- Importar desde Excel.

Formato Excel esperado para importar (primera hoja): columnas `categoria`, `tipo`, `tamano`, `marca`, `color`, `cantidad`, `precio_compra`, `precio_venta`.

## Facturación
- Agregar líneas por `código` y `cantidad`.
- Registra la factura: descuenta stock del inventario.
- Calcula `total_venta` y `ganancia` (venta - compra).
- Lista facturas con fecha, total e items.

## Control Financiero
Genera métricas por rango:
- Ventas totales, Ganancia total.
- Items vendidos.
- Ticket promedio.
- Detalle de facturas del periodo.

## Cómo ejecutar
Opción rápida: abrir `Proyecto_Plasticos/index.html` en el navegador.

O con un servidor local:
1) Con Python (si tienes Python instalado):
```powershell
cd "c:\Users\rolan\Music\Proyecto_Plasticos"
python -m http.server 8080
```
Luego abre `http://localhost:8080`.

2) Con cualquier servidor estático (Node, etc.), sirve la carpeta y abre el `index.html`.

## Datos y persistencia
- Se guardan en `localStorage` del navegador (`lp_inventory`, `lp_invoices`).
- No hay login ni clientes, acorde al requerimiento.

## Notas
- Se usa SheetJS vía CDN para importar/exportar Excel.
- Si requieres exportar CSV además de Excel, puedo añadirlo.
