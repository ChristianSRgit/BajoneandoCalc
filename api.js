const API = {
  getRegistrarVentaUrl() {
    const configuredUrl = window.localStorage.getItem('registrarVentaUrl');
    if (configuredUrl) return configuredUrl;

    const host = window.location.hostname;
    const isLocal = host === '127.0.0.1' || host === 'localhost';

    return isLocal 
      ? 'http://localhost:8888/.netlify/functions/registrar-venta'
      : '/.netlify/functions/registrar-venta';
  },

  getAperCierreCajaUrl() {
    const host = window.location.hostname;
    const isLocal = host === '127.0.0.1' || host === 'localhost';

    return isLocal 
      ? 'http://localhost:8888/.netlify/functions/aper-cierre-caja'
      : '/.netlify/functions/aper-cierre-caja';
  },

  async enviarVenta(payload) {
    if (!payload) return;
    try {
      const response = await fetch(this.getRegistrarVentaUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(`Error al registrar venta (${response.status})`);
      }
      console.log('✅ Venta enviada', result);
      return result;
    } catch (error) {
      console.error('❌ Error API Venta', error);
      throw error;
    }
  },

  async enviarCaja(payload) {
    try {
      const response = await fetch(this.getAperCierreCajaUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(`Error al registrar caja (${response.status})`);
      }
      console.log('✅ Caja enviada', result);
      return result;
    } catch (error) {
      console.error('❌ Error API Caja', error);
      throw error;
    }
  },

  async validarPassword(password) {
    try {
      const res = await fetch('/.netlify/functions/validar-calculadora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      return res.ok;
    } catch (err) {
      return false;
    }
  }
};
