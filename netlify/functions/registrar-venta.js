exports.handler = async (event) => {
    const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  try {
    const venta = JSON.parse(event.body || '{}');

    const requiredFields = [
      'nroPedido',
      'fecha',
      'canal',
      'cantidadHamburguesas',
      'productos',
      'montoBruto',
      'montoNeto',
      'metodoDePago'
    ];

    const faltantes = requiredFields.filter((field) => venta[field] === undefined || venta[field] === null);
    if (faltantes.length) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Faltan campos obligatorios',
          faltantes
        })
      };
    }

    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    const secretToken = process.env.GOOGLE_SCRIPT_TOKEN;

    if (!scriptUrl) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Falta configurar GOOGLE_SCRIPT_URL en Netlify' })
      };
    }

 const payload = {
      token: secretToken || undefined,
      ...venta
    };

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    const contentType = response.headers.get('content-type') || '';

    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Google Script devolvió error',
          detail: responseText
        })
      };
    }

    if (contentType.includes('text/html')) {
      return {
        statusCode: 502,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Google Script respondió HTML en lugar de JSON',
          hint: 'Revisá que GOOGLE_SCRIPT_URL sea la URL /exec pública del Web App y no /dev.',
          detail: responseText.slice(0, 300)
        })
      };
    }

    let parsedResponse = null;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (_) {
      // Si no viene JSON, devolvemos detalle en la respuesta para debug.
    }

    if (parsedResponse && parsedResponse.ok === false) {
      return {
        statusCode: 502,
        headers: corsHeaders,
        body: JSON.stringify({
          error: 'Google Script respondió ok=false',
          detail: parsedResponse
        })
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true, detail: parsedResponse || responseText })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Error inesperado al registrar la venta',
        detail: error.message
      })
    };
  }
};
