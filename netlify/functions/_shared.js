function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  };
}

function getToken(event) {
  const tokenFromHeader = event.headers?.['x-auth-token'] || event.headers?.['X-Auth-Token'];

  if (tokenFromHeader) {
    return tokenFromHeader;
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    return payload.token || '';
  } catch (error) {
    return '';
  }
}

function isValidToken(token) {
  const expectedToken = process.env.APP_AUTH_TOKEN || '';
  return Boolean(token) && Boolean(expectedToken) && token === expectedToken;
}

module.exports = {
  json,
  getToken,
  isValidToken
};
