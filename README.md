# BajoneandoCalc

## Integración con Google Sheets (Netlify)

Esta versión envía cada venta a una Netlify Function que luego reenvía los datos a Google Apps Script.

### Variables de entorno en Netlify

Configurar en **Site configuration → Environment variables**:

- `GOOGLE_SCRIPT_URL` → URL del Web App de Apps Script.
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

---

## Prueba local (sin deploy en Netlify)

> Importante: para que `/.netlify/functions/registrar-venta` funcione localmente, **no** abras `index.html` directo en el navegador. Levantá el proyecto con `netlify dev`.

### 1) Requisitos

- Node.js 18+ (ideal 20+)
- Netlify CLI instalada

```bash
npm i -g netlify-cli
```

### 2) Variables de entorno locales

Creá un archivo `.env` en la raíz del proyecto con:



> Si tu Apps Script no valida token, podés omitir `GOOGLE_SCRIPT_TOKEN`.

### 3) Levantar entorno local con functions

Desde la raíz del repo:

```bash
netlify dev
```

Netlify CLI va a:
- servir el frontend
- montar la función en `/.netlify/functions/registrar-venta`
- inyectar las variables del `.env`

### 4) Prueba rápida de la función (sin UI)

Con `netlify dev` corriendo, en otra terminal ejecutá:

```bash
curl -i -X POST http://localhost:8888/.netlify/functions/registrar-venta \
  -H "Content-Type: application/json" \
  -d '{
    "nroPedido": "1234",
    "fecha": "2026-01-01",
    "canal": "WhatsApp",
    "cantidadHamburguesas": 2,
    "productos": "Cuarto smash simple, Papas noisette x100gr",
    "montoBruto": 20000,
    "montoNeto": 18000,
    "metodoDePago": "efectivo"
  }'
```

Resultado esperado:
- status `200` si Apps Script respondió OK
- status `500` con mensaje claro si falta `GOOGLE_SCRIPT_URL`
- status `400` si faltan campos obligatorios

### 5) Prueba end-to-end desde la web

1. Abrí la URL local que te muestra `netlify dev` (normalmente `http://localhost:8888`).
2. Cargá un pedido real.
3. Completá número de pedido (últimos 4 dígitos).
4. Presioná **Imprimir ticket**.
5. Verificá en DevTools (Network) un `POST` exitoso a `/.netlify/functions/registrar-venta`.
6. Confirmá que la fila se escribió en tu Google Sheet con el orden de columnas correcto.

### 6) Errores comunes

- **404 en `/.netlify/functions/...`**: estás sirviendo el HTML con otro server (por ejemplo `python -m http.server`) en vez de `netlify dev`.
- **500 `Falta configurar GOOGLE_SCRIPT_URL`**: faltan variables en `.env` o no reiniciaste `netlify dev`.
- **200 en función pero no aparece fila**: revisar logs y validaciones en Google Apps Script (incluyendo token si aplica).
