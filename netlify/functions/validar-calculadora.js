// /.netlify/functions/validar-calculadora.js
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405 };
  }

  const { password } = JSON.parse(event.body || '{}');

  if (!password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ ok: false })
    };
  }

  if (password !== process.env.CALCULADORA_PASSWORD) {
    return {
      statusCode: 401,
      body: JSON.stringify({ ok: false })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true })
  };
};
