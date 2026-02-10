# BajoneandoCalc

Calculadora para armar pedidos, aplicar 10% OFF e imprimir tickets.

## Integración con Google Sheets (backend + secrets)

La integración está hecha en backend (Netlify Functions). El usuario final **no configura** URL de Sheets en UI.

### Variables de entorno requeridas (Netlify / GitHub Secrets)

- `SHEETS_WEBHOOK_URL`: URL de Web App de Apps Script (debe terminar en `/exec`).
- `APP_PASSWORD`: contraseña de acceso a la página.
- `APP_AUTH_TOKEN`: token interno que usa el frontend para llamar funciones protegidas.

Tomá `.env.example` como referencia.

## Columnas exactas soportadas

La integración envía al Apps Script estas columnas exactas:

1. `Nro Pedido`
2. `Fecha`
3. `Canal`
4. `Cant. Hambur`
5. `Productos`
6. `Monto Bruto`
7. `Monto Neto`
8. `Metodo de Pago`

## Flujo

1. El usuario entra a la página y debe ingresar contraseña.
2. Frontend llama `/.netlify/functions/auth-login`.
3. Si valida, se guarda token local y se habilita la app.
4. Al imprimir ticket o usar **Probar envío a Sheets**, frontend llama `/.netlify/functions/registrar-venta`.
5. El backend normaliza payload a esas 8 columnas y reenvía a Google Apps Script usando `SHEETS_WEBHOOK_URL`.

## Sobre el error 405

Si recibís 405 en Sheets, normalmente significa uno de estos problemas:

1. Se está usando URL incorrecta (ej: link de edición de script/sheet en vez del Web App `/exec`).
2. El deployment del Apps Script no está publicado como Web App.
3. Falta `doPost(e)` en Apps Script.
4. Se cambió script pero no se redeployó.

La función `registrar-venta` devuelve un mensaje específico para 405 con estos hints.

## Apps Script mínimo recomendado (con tus columnas)

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.openById('TU_SPREADSHEET_ID').getSheetByName('ventas cash');
  const data = JSON.parse(e.postData.contents || '{}');

  sheet.appendRow([
    data['Nro Pedido'] || '',
    data['Fecha'] || '',
    data['Canal'] || '',
    data['Cant. Hambur'] || 0,
    data['Productos'] || '',
    data['Monto Bruto'] || 0,
    data['Monto Neto'] || 0,
    data['Metodo de Pago'] || ''
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## Publicación Apps Script

- Deploy > New deployment
- Type: Web app
- Execute as: Me
- Who has access: Anyone with the link (o la política que uses)
- Copiar URL `/exec` y guardarla en `SHEETS_WEBHOOK_URL`
