exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
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
        body: JSON.stringify({ error: 'Falta configurar GOOGLE_SCRIPT_URL en Netlify' })
      };
    }

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token: secretToken || undefined,
        ...venta
      })
    });

    const responseText = await response.text();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: 'Google Script devolvió error',
          detail: responseText
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, detail: responseText })
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
