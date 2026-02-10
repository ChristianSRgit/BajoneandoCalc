const { json } = require('./_shared');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const appPassword = process.env.APP_PASSWORD || '';
  const authToken = process.env.APP_AUTH_TOKEN || '';

  if (!appPassword || !authToken) {
    return json(500, { error: 'APP_PASSWORD / APP_AUTH_TOKEN no configurados en entorno' });
  }

  let password = '';

  try {
    const parsed = JSON.parse(event.body || '{}');
    password = parsed.password || '';
  } catch (error) {
    return json(400, { error: 'JSON inválido' });
  }

  if (password !== appPassword) {
    return json(401, { error: 'No autorizado' });
  }

  return json(200, { token: authToken });
};
