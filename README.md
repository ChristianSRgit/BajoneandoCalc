# BajoneandoCalc

Calculadora para armar pedidos, aplicar 10% OFF e imprimir tickets.

## Registro en Google Sheets

Ahora la app permite enviar automáticamente cada ticket a una hoja de ventas mediante un **webhook de Google Apps Script**:

1. Publicá tu Apps Script como Web App (acceso para quien tenga el link).
2. Pegá la URL en el campo **"Webhook Google Sheets (Apps Script)"**.
3. Tocá **"Guardar Sheets"**.
4. Al imprimir un ticket, se enviará un `POST` JSON con estos datos:
   - `id`
   - `fechaISO`
   - `canal`
   - `cantidadHamburguesas`
   - `productos`
   - `total`
   - `totalConDescuento`
   - `medioPago`

Si el webhook no está configurado, la impresión funciona igual y no se envía el registro.
