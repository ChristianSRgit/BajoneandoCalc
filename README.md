# BajoneandoCalc

Calculadora para armar pedidos, aplicar 10% OFF e imprimir tickets.

## Registro en Google Sheets

La app puede enviar cada ticket a una hoja de ventas mediante un webhook de Google Apps Script.

### Flujo básico

1. Pegá la URL de tu Web App en **Webhook Google Sheets (Apps Script)**.
2. Tocá **Guardar Sheets**.
3. Usá **Probar envío** para validar conexión sin imprimir un pedido real.
4. Al imprimir un ticket, se hace `POST` automático al webhook.

### ¿Y si mis columnas no tienen el mismo nombre?

No hace falta que los encabezados del Sheet coincidan exactamente con los nombres del payload.
La forma recomendada es mapear del payload a tus columnas dentro del Apps Script.

La app envía varias claves equivalentes para facilitar compatibilidad:

- Pedido: `id`, `pedidoId`, `numeroPedido`
- Fecha: `fechaISO`, `fechaHoraISO`
- Canal: `canal`, `canalVenta`
- Cantidad: `cantidadHamburguesas`, `hamburguesas`
- Productos: `productos`, `productosTexto`, `productosArray`
- Importes: `total`, `subtotal`, `totalConDescuento`, `montoFinal`
- Pago: `medioPago`
- Detalle completo: `items`

### Configuración recomendada en Apps Script

Ejemplo de `doPost(e)` con mapeo por encabezado:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.openById('TU_SPREADSHEET_ID').getSheetByName('Ventas');
  const data = JSON.parse(e.postData.contents || '{}');

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const byHeader = {
    'ID Pedido': data.numeroPedido || data.id,
    'Fecha': data.fechaISO,
    'Canal': data.canal,
    'Hamburguesas': data.cantidadHamburguesas,
    'Productos': data.productos,
    'Total': data.total,
    'Total c/Desc': data.totalConDescuento,
    'Pago': data.medioPago
  };

  const row = headers.map(h => byHeader[h] ?? '');
  sheet.appendRow(row);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### Publicación necesaria

Sí, necesitás configuración extra en Sheets/Apps Script:

- Crear Apps Script vinculado o independiente.
- Publicar como **Web App**.
- Acceso recomendado: **Anyone with the link** (o el alcance que uses).
- Cada vez que cambies el script, volver a **Deploy > Manage deployments > Edit > Deploy**.
