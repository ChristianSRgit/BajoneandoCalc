const { json, getToken, isValidToken } = require('./_shared');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const token = getToken(event);

  if (!isValidToken(token)) {
    return json(401, { error: 'Token inválido' });
  }

  return json(200, { ok: true });
};
