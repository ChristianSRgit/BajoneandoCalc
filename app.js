// ==============================
// CONFIGURACIÓN Y ESTADO
// ==============================

const PRODUCTOS_VALIDOS_SHEETS = [
  "Cuarto VEGGIE simple", "Big VEGGIE simple", "Cuarto VEGGIE doble", "Big VEGGIE doble",
  "Simple con queso", "Cuarto simple", "Big simple", "Cuarto doble", "Big doble",
  "Cheddar doble", "Cheddar Bacon", "Cheddar triple", "PROMO-2 Cuartos simples",
  "PROMO-2 Big Dobles", "PROMO-3 Simple con queso", "Papas simples", "Papas dobles",
  "Papas Galaxia", "Chicken POPS 10u", "Chicken POPS 20u", "Extra cheddar",
  "Extra Bacon", "Extra carne", "Extra Sweet BBQ", "Extra Honey mustard",
  "Extra Spicy mayo", "Extra tasty", "Extra Ketchup", "Extra Mostaza",
  "Extra Mayonesa", "Gaseosa lata Coca", "Coca ZERO 600ml", "Oreo smash"
];

let pedido = [];
let hamburguesaActiva = null;
let itemActivoParaNotas = null;
let precioFinalManual = null;

// ==============================
// INICIALIZACIÓN
// ==============================

document.addEventListener('DOMContentLoaded', async () => {
  const accesoOk = await validarAcceso();
  if (!accesoOk) {
    document.body.innerHTML = '<div style="padding:40px;text-align:center"><h2>Acceso restringido</h2></div>';
    return;
  }

  bindEventos();
  UI.renderPedido(pedido, precioFinalManual);
});

async function validarAcceso() {
  if (sessionStorage.getItem('calculadora_ok') === '1') return true;
  const password = prompt('Ingresá la contraseña');
  if (!password) return false;
  
  const ok = await API.validarPassword(password);
  if (ok) sessionStorage.setItem('calculadora_ok', '1');
  return ok;
}

// ==============================
// BINDINGS
// ==============================

function bindEventos() {
  // Botones de productos
  document.querySelectorAll('#botones button').forEach(btn => {
    btn.onclick = () => {
      agregarItem({
        tipo: btn.dataset.tipo,
        rol: btn.dataset.rol || null,
        nombre: btn.dataset.nombre,
        precio: Number(btn.dataset.precio),
        cantidadHamburguesas: Number(btn.dataset.hamburguesas || 0)
      });
    };
  });

  // Acciones generales
  document.getElementById('btnAgregarManual').onclick = agregarManual;
  document.getElementById('agregarDelivery').onclick = agregarDelivery;
  document.getElementById('btnModificarFinal').onclick = modificarPrecioFinal;
  document.getElementById('btnBorrarUltimo').onclick = borrarUltimo;
  document.getElementById('btnVaciar').onclick = vaciarPedido;
  document.getElementById('btnImprimir').onclick = imprimirTicket;
  document.getElementById('btnAgregarNota').onclick = agregarNota;

  // Historial
  document.getElementById('btnAbrirHistorial').onclick = () => {
    UI.historialPanel.classList.remove('cerrado');
    UI.renderHistorial(obtenerHistorial(), reimprimirTicket);
  };
  document.getElementById('btnCerrarHistorial').onclick = () => UI.historialPanel.classList.add('cerrado');

  // Caja
  document.getElementById('btnAbrirApertura').onclick = () => UI.abrirModalCaja('apertura');
  document.getElementById('btnAbrirCierre').onclick = () => UI.abrirModalCaja('cierre');
  document.getElementById('btnCancelarCaja').onclick = () => UI.cerrarModalCaja();
  document.getElementById('btnConfirmarCaja').onclick = confirmarCaja;
}

// ==============================
// LÓGICA DE NEGOCIO
// ==============================

function agregarItem(item) {
  precioFinalManual = null;
  if (item.tipo === 'hamburguesa') {
    const nueva = { ...item, extras: [], notas: [] };
    pedido.push(nueva);
    hamburguesaActiva = nueva;
    itemActivoParaNotas = nueva;
  } else if (item.tipo === 'extra' && item.rol === 'modificador' && hamburguesaActiva) {
    hamburguesaActiva.extras.push({ nombre: item.nombre, precio: item.precio });
  } else {
    const nuevo = { ...item, notas: [] };
    pedido.push(nuevo);
    hamburguesaActiva = null;
    itemActivoParaNotas = nuevo;
  }
  UI.renderPedido(pedido, precioFinalManual);
}

function agregarManual() {
  const input = document.getElementById('precioManual');
  const valor = Number(input.value);
  if (!valor) return;
  agregarItem({ tipo: 'manual', nombre: 'Precio manual', precio: Math.round(valor) });
  input.value = '';
}

function agregarDelivery() {
  const input = document.getElementById('precioDelivery');
  const valor = Number(input.value);
  if (!valor) return;
  agregarItem({ tipo: 'delivery', nombre: 'Delivery', precio: Math.round(valor) });
  input.value = '';
}

function modificarPrecioFinal() {
  const valor = prompt('Ingresá el precio final manual');
  if (valor === null) return;
  precioFinalManual = Math.round(Number(valor)) || null;
  UI.renderPedido(pedido, precioFinalManual);
}

function borrarUltimo() {
  pedido.pop();
  precioFinalManual = null;
  hamburguesaActiva = pedido.slice().reverse().find(i => i.tipo === 'hamburguesa') || null;
  UI.renderPedido(pedido, precioFinalManual);
}

function vaciarPedido() {
  pedido = [];
  hamburguesaActiva = null;
  itemActivoParaNotas = null;
  precioFinalManual = null;
  document.getElementById('numeroPedido').value = '';
  UI.renderPedido(pedido, precioFinalManual);
}

function agregarNota() {
  const input = document.getElementById('notaTexto');
  const texto = input.value.trim();
  if (!texto || !itemActivoParaNotas) return;
  itemActivoParaNotas.notas.push(texto);
  input.value = '';
  UI.renderPedido(pedido, precioFinalManual);
}

// ==============================
// IMPRESIÓN Y TICKET
// ==============================

async function imprimirTicket() {
  const numeroPedido = document.getElementById('numeroPedido').value.trim();
  if (pedido.length === 0 || !numeroPedido) {
    alert('Falta pedido o número de WhatsApp');
    return;
  }

  const totals = UI.calcularTotales(pedido);
  const totalFinal = precioFinalManual ?? totals.totalConDescuento;
  const { fecha, hora } = obtenerFechaHora();

  const ticket = {
    id: numeroPedido,
    fecha, hora,
    items: JSON.parse(JSON.stringify(pedido)),
    total: totals.total,
    totalFinal,
    medioPago: obtenerMedioPago(),
    tipoEntrega: obtenerTipoEntrega()
  };

  guardarTicket(ticket);
  abrirVentanaImpresion(ticket);

  // Enviar a Sheets
  const payload = {
    nroPedido: ticket.id,
    fecha: new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Argentina/Buenos_Aires' }),
    canal: 'whatsapp',
    cantidadHamburguesas: pedido.reduce((acc, i) => acc + (i.cantidadHamburguesas || 0), 0),
    productos: pedido.filter(i => PRODUCTOS_VALIDOS_SHEETS.includes(i.nombre)).map(i => i.nombre).join(', '),
    montoBruto: ticket.total,
    montoNeto: ticket.totalFinal,
    metodoDePago: ticket.medioPago,
    tipoEntrega: ticket.tipoEntrega
  };

  API.enviarVenta(payload);
  vaciarPedido();
}

function abrirVentanaImpresion(ticket) {
  const win = window.open('', 'PRINT', 'height=600,width=400');
  let itemsHtml = '';
  ticket.items.forEach(i => {
    itemsHtml += `<div>${i.nombre} - $${i.precio.toLocaleString()}</div>`;
    if (i.extras) i.extras.forEach(e => itemsHtml += `<div style="margin-left:10px">+ ${e.nombre}</div>`);
    if (i.notas) i.notas.forEach(n => itemsHtml += `<div style="margin-left:10px">* ${n}</div>`);
  });

  const html = `
    <html>
    <body style="font-family:monospace; font-size: 20px; width: 300px;">
      <div style="text-align:center;">
        <strong>SMASH</strong><br>
        Pedido #${ticket.id}<br>
        ${ticket.fecha} ${ticket.hora}<br>
        ${ticket.medioPago.toUpperCase()} - ${ticket.tipoEntrega.toUpperCase()}
      </div>
      <hr>
      ${itemsHtml}
      <hr>
      <div>TOTAL: $${ticket.total.toLocaleString()}</div>
      <div style="font-size:24px; font-weight:bold;">FINAL: $${ticket.totalFinal.toLocaleString()}</div>
    </body>
    </html>
  `;
  win.document.write(html);
  win.document.close();
  win.print();
  win.close();
}

function reimprimirTicket(ticket) {
  abrirVentanaImpresion(ticket);
}

// ==============================
// CAJA
// ==============================

async function confirmarCaja() {
  const data = UI.obtenerDatosCaja();
  if (data.wallet === 0 && data.efectivo === 0 && !data.observaciones) {
    alert('Ingresá al menos un monto');
    return;
  }

  try {
    const btn = document.getElementById('btnConfirmarCaja');
    btn.disabled = true;
    btn.innerText = 'Enviando...';

    await API.enviarCaja(data);
    
    alert('Caja registrada con éxito');
    UI.cerrarModalCaja();
  } catch (err) {
    alert('Error al registrar caja: ' + err.message);
  } finally {
    const btn = document.getElementById('btnConfirmarCaja');
    btn.disabled = false;
    btn.innerText = 'Confirmar';
  }
}

// ==============================
// HELPERS
// ==============================

function obtenerFechaHora() {
  const now = new Date();
  const options = { timeZone: 'America/Argentina/Buenos_Aires' };
  return {
    fecha: now.toLocaleDateString('es-AR', options),
    hora: now.toLocaleTimeString('es-AR', { ...options, hour: '2-digit', minute: '2-digit' })
  };
}

function obtenerMedioPago() {
  return document.querySelector('input[name="medioPago"]:checked').value;
}

function obtenerTipoEntrega() {
  return document.querySelector('input[name="tipoEntrega"]:checked').value;
}

function guardarTicket(t) {
  const h = obtenerHistorial();
  h.push(t);
  localStorage.setItem('historialTickets', JSON.stringify(h.slice(-50)));
}

function obtenerHistorial() {
  return JSON.parse(localStorage.getItem('historialTickets')) || [];
}
