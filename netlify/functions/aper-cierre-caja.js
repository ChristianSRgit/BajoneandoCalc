exports.handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Método no permitido' })
    };
  }

  try {
    const data = JSON.parse(event.body || '{}');

    // Validar campos básicos para caja
    const requiredFields = ['tipo', 'wallet', 'efectivo'];
    const faltantes = requiredFields.filter(f => data[f] === undefined || data[f] === null);
    
    if (faltantes.length) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Faltan campos obligatorios', faltantes })
      };
    }

    const scriptUrl = process.env.GOOGLE_SCRIPT_URL_CAJA;
    const secretToken = process.env.GOOGLE_SCRIPT_TOKEN; // Opcional, si se usa

    if (!scriptUrl) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Falta configurar GOOGLE_SCRIPT_URL_CAJA en Netlify' })
      };
    }

    const payload = {
      token: secretToken || undefined,
      fecha: new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }),
      ...data
    };

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Google Script devolvió error', detail: responseText })
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ ok: true, detail: responseText })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Error inesperado', detail: error.message })
    };
  }
};
