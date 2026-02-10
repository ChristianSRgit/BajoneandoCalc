const { json, getToken, isValidToken } = require('./_shared');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const token = getToken(event);

  if (!isValidToken(token)) {
    return json(401, { error: 'No autorizado' });
  }

  const webhookUrl = process.env.SHEETS_WEBHOOK_URL || '';

  if (!webhookUrl) {
    return json(500, { error: 'SHEETS_WEBHOOK_URL no configurado en entorno' });
  }

  let payload = {};

  try {
    payload = JSON.parse(event.body || '{}');
  } catch (error) {
    return json(400, { error: 'JSON inválido en payload de venta' });
  }

  const payloadParaSheets = {
    'Nro Pedido': payload['Nro Pedido'] ?? payload.numeroPedido ?? payload.id ?? '',
    Fecha: payload.Fecha ?? payload.fecha ?? payload.fechaISO ?? '',
    Canal: payload.Canal ?? payload.canal ?? '',
    'Cant. Hambur': payload['Cant. Hambur'] ?? payload.cantidadHamburguesas ?? 0,
    Productos: payload.Productos ?? payload.productos ?? '',
    'Monto Bruto': payload['Monto Bruto'] ?? payload.total ?? 0,
    'Monto Neto': payload['Monto Neto'] ?? payload.totalConDescuento ?? 0,
    'Metodo de Pago': payload['Metodo de Pago'] ?? payload.medioPago ?? '',

    // Se conserva payload original para debugging/mapeos futuros
    _raw: payload
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payloadParaSheets),
      redirect: 'follow'
    });

    const responseText = await response.text();

    if (!response.ok) {
      const hint = response.status === 405
        ? 'Google Apps Script devolvió 405. Verificá usar URL de Web App terminada en /exec y método doPost(e).'
        : 'Error al escribir en Google Sheets';

      return json(response.status, {
        error: hint,
        upstreamStatus: response.status,
        upstreamBody: responseText
      });
    }

    return json(200, {
      ok: true,
      upstreamStatus: response.status,
      upstreamBody: responseText
    });
  } catch (error) {
    return json(502, {
      error: 'No se pudo contactar Google Apps Script',
      detail: String(error)
    });
  }
};
