# BajoneandoCalc

## Integración con Google Sheets (Netlify)

Esta versión envía cada venta a una Netlify Function que luego reenvía los datos a Google Apps Script.

### Variables de entorno en Netlify

Configurar en **Site configuration → Environment variables**:

- `GOOGLE_SCRIPT_URL` → URL del Web App de Apps Script.
  - Valor sugerido: `https://script.google.com/macros/s/AKfycbyiaRHGd2o7-5emAf79RqwnFVjAouKN0jA8T9utgVnsQ2G5I7jsL9YAQ7DVeEFY_c_grw/exec`
- `GOOGLE_SCRIPT_TOKEN` → (opcional) token/contraseña para validar origen en Apps Script.

### Formato enviado

Se envían las columnas respetando el formato solicitado:

1. `nroPedido`
2. `fecha`
3. `canal`
4. `cantidadHamburguesas`
5. `productos`
6. `montoBruto`
7. `montoNeto`
8. `metodoDePago`
