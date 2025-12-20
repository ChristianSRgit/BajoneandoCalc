// ==============================
// ESTADO GLOBAL DEL PEDIDO
// ==============================

let pedido = [];
let hamburguesaActiva = null;

// ==============================
// INICIALIZACIÓN
// ==============================

document.addEventListener('DOMContentLoaded', () => {
  bindBotones();
  bindAcciones();
  render();
});

// ==============================
// BINDINGS
// ==============================

function bindBotones() {
  const botones = document.querySelectorAll('#botones button');

  botones.forEach(btn => {
    btn.addEventListener('click', () => {
      const tipo = btn.dataset.tipo;
      const rol = btn.dataset.rol || null;
      const nombre = btn.dataset.nombre;
      const precio = Number(btn.dataset.precio);

      agregarItem({ tipo, rol, nombre, precio });
    });
  });
}

function bindAcciones() {
  document.getElementById('btnAgregarManual')
    .addEventListener('click', agregarManual);

  document.getElementById('btnCalcular')
    .addEventListener('click', calcularParticular);

  document.getElementById('btnBorrarUltimo')
    .addEventListener('click', borrarUltimo);

  document.getElementById('btnVaciar')
    .addEventListener('click', vaciarPedido);
    
  document.getElementById('btnImprimir')
    .addEventListener('click', imprimirTicket);
  
  document.getElementById('btnAbrirHistorial')
    .addEventListener('click', abrirHistorial);

  document.getElementById('btnCerrarHistorial')
    .addEventListener('click', cerrarHistorial);

}

// ==============================
// LÓGICA DE NEGOCIO
// ==============================

function agregarItem(item) {
  switch (item.tipo) {

    case 'hamburguesa':
      agregarHamburguesa(item);
      break;

    case 'extra':
      manejarExtra(item);
      break;

    case 'promo':
    case 'papa':
      agregarItemSimple(item);
      break;
  }

  render();
}

function agregarHamburguesa(item) {
  const nueva = {
    tipo: 'hamburguesa',
    nombre: item.nombre,
    precio: item.precio,
    extras: []
  };

  pedido.push(nueva);
  hamburguesaActiva = nueva;
}

function manejarExtra(item) {
  // Extra modificador → intenta adjuntarse
  if (item.rol === 'modificador' && hamburguesaActiva) {
    hamburguesaActiva.extras.push({
      nombre: item.nombre,
      precio: item.precio
    });
    return;
  }

  // Extra producto → ítem independiente
  agregarItemSimple(item);
}

function agregarItemSimple(item) {
  pedido.push({
    tipo: item.tipo,
    nombre: item.nombre,
    precio: item.precio
  });

  // Cierra cualquier contexto de hamburguesa
  hamburguesaActiva = null;
}

// ==============================
// ACCIONES
// ==============================

function agregarManual() {
  const input = document.getElementById('precioManual');
  const valor = Number(input.value);

  if (!valor || valor <= 0) return;

  pedido.push({
    tipo: 'manual',
    nombre: 'Precio manual',
    precio: Math.round(valor)
  });

  hamburguesaActiva = null;
  input.value = '';
  render();
}

function borrarUltimo() {
  if (pedido.length === 0) return;

  pedido.pop();

  // Recalcular hamburguesa activa
  hamburguesaActiva = null;
  for (let i = pedido.length - 1; i >= 0; i--) {
    if (pedido[i].tipo === 'hamburguesa') {
      hamburguesaActiva = pedido[i];
      break;
    }
  }

  render();
}

function vaciarPedido() {
  pedido = [];
  hamburguesaActiva = null;
  render();
}

function abrirHistorial() {
  document.getElementById('historialPanel').classList.remove('cerrado');
  renderHistorial();
}

function cerrarHistorial() {
  document.getElementById('historialPanel').classList.add('cerrado');
}


// ==============================
// CÁLCULOS
// ==============================

function calcularParticular() {
  const input = document.getElementById('precioManual');
  const valor = Number(input.value);

  if (!valor || valor <= 0) {
    document.getElementById('resultado').innerText =
      'Ingresá un número válido';
    return;
  }

  const final = Math.round(valor * 0.9);

  document.getElementById('resultado').innerText =
    `Original: $${valor.toLocaleString()} | 10% OFF: $${final.toLocaleString()}`;
}

// ==============================
// RENDER
// ==============================

function render() {
  const lista = document.getElementById('lista');
  const resultado = document.getElementById('resultado');

  if (pedido.length === 0) {
    lista.innerHTML = '<div class="muted">No hay items</div>';
    resultado.innerText = 'Original: - | 10% OFF: -';
    return;
  }

  let html = '';
  let total = 0;

  pedido.forEach(item => {
    if (item.tipo === 'hamburguesa') {
      html += `<strong>${item.nombre}</strong> — $${item.precio.toLocaleString()}<br>`;
      total += item.precio;

      item.extras.forEach(extra => {
        html += `&nbsp;&nbsp;+ ${extra.nombre} — $${extra.precio.toLocaleString()}<br>`;
        total += extra.precio;
      });

    } else {
      html += `${item.nombre} — $${item.precio.toLocaleString()}<br>`;
      total += item.precio;
    }
  });

  const descuento = Math.round(total * 0.9);

  html += `
    <div class="total">
      Total: <strong>$${total.toLocaleString()}</strong>
    </div>
    <div class="final">
      $${descuento.toLocaleString()} con 10% OFF
    </div>
  `;

  lista.innerHTML = html;
  resultado.innerText =
    `Original: $${total.toLocaleString()} | 10% OFF: $${descuento.toLocaleString()}`;
}

function renderHistorial() {
  const contenedor = document.getElementById('historialLista');
  const historial = obtenerHistorial();

  if (historial.length === 0) {
    contenedor.innerHTML = '<div class="muted">No hay tickets</div>';
    return;
  }

  contenedor.innerHTML = '';

  historial.slice().reverse().forEach(ticket => {
    const div = document.createElement('div');
    div.className = 'ticket-item';

    div.innerHTML = `
      <div class="ticket-id">Pedido #${ticket.id}</div>
      <div class="ticket-meta">${ticket.fecha} ${ticket.hora}</div>
      <div class="ticket-meta">$${ticket.totalConDescuento.toLocaleString()}</div>
    `;

    div.addEventListener('click', () => {
      reimprimirTicket(ticket);
    });

    contenedor.appendChild(div);
  });
}

function obtenerFechaHora() {
  const now = new Date();

  const fecha = now.toLocaleDateString('es-AR');
  const hora = now.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return { fecha, hora };
}

function obtenerNumeroPedido() {
  const input = document.getElementById('numeroPedido');
  const valor = input.value.trim();

  if (!valor || valor.length < 3) return null;

  return valor;
}

function construirTicket(numeroPedido) {
  const { fecha, hora } = obtenerFechaHora();

  let total = 0;

  pedido.forEach(item => {
    total += item.precio;
    if (item.tipo === 'hamburguesa') {
      item.extras.forEach(extra => {
        total += extra.precio;
      });
    }
  });

  return {
    id: numeroPedido,
    fecha,
    hora,
    items: JSON.parse(JSON.stringify(pedido)), // snapshot
    total,
    totalConDescuento: Math.round(total * 0.9)
  };
}

function guardarTicket(ticket) {
  const historial = obtenerHistorial();
  historial.push(ticket);
  localStorage.setItem('historialTickets', JSON.stringify(historial));
}

function obtenerHistorial() {
  return JSON.parse(localStorage.getItem('historialTickets')) || [];
}

// ==============================
// IMPRESIÓN DE TICKET
// ==============================
function imprimirTicket() {
  if (pedido.length === 0) return;

  const numeroPedido = obtenerNumeroPedido();
  if (!numeroPedido) {
    alert('Ingresá los últimos 4 dígitos de WhatsApp');
    return;
  }

    const { fecha, hora } = obtenerFechaHora();

  let html = `
    <html>
    <head>
      <title>Ticket</title>
      <style>
        body {
          font-family: monospace;
          font-size: 12px;
          margin: 0;
          padding: 10px;
          width: 80mm;
        }
        .center { text-align: center; }
        .line { border-top: 1px dashed #000; margin: 6px 0; }
        .item { margin-bottom: 4px; }
        .extra { margin-left: 10px; }
        .total { font-weight: bold; margin-top: 8px; }
        .header { margin-bottom: 6px; }
      </style>
    </head>
    <body>

      <div class="center header">
        <strong>SMASH</strong><br>
        Pedido #${numeroPedido}<br>
        ${fecha} ${hora}
      </div>

      <div class="line"></div>
  `;


  let total = 0;

  pedido.forEach(item => {
    if (item.tipo === 'hamburguesa') {
      html += `<div class="item">${item.nombre}</div>`;
      total += item.precio;

      item.extras.forEach(extra => {
        html += `<div class="extra">+ ${extra.nombre}</div>`;
        total += extra.precio;
      });

    } else {
      html += `<div class="item">${item.nombre}</div>`;
      total += item.precio;
    }
  });

  const final = Math.round(total * 0.9);

  html += `
      <div class="line"></div>
      <div class="total">TOTAL: $${total.toLocaleString()}</div>
      <div class="total">10% OFF: $${final.toLocaleString()}</div>

      <div class="line"></div>
      <div class="center">Gracias</div>
    </body>
    </html>
  `;
  const ticket = construirTicket(numeroPedido);
  guardarTicket(ticket);

  const win = window.open('', 'PRINT', 'height=600,width=400');
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
  win.close();
    
    // Reset estado
vaciarPedido();
document.getElementById('numeroPedido').value = '';

}

function reimprimirTicket(ticket) {
  let html = `
    <html>
    <head>
      <title>Ticket</title>
      <style>
        body {
          font-family: monospace;
          font-size: 12px;
          margin: 0;
          padding: 10px;
          width: 80mm;
        }
        .center { text-align: center; }
        .line { border-top: 1px dashed #000; margin: 6px 0; }
        .item { margin-bottom: 4px; }
        .extra { margin-left: 10px; }
        .total { font-weight: bold; margin-top: 8px; }
      </style>
    </head>
    <body>
      <div class="center">
        <strong>SMASH</strong><br>
        Pedido #${ticket.id}<br>
        ${ticket.fecha} ${ticket.hora}
      </div>

      <div class="line"></div>
  `;

  ticket.items.forEach(item => {
    if (item.tipo === 'hamburguesa') {
      html += `<div class="item">${item.nombre}</div>`;
      item.extras.forEach(extra => {
        html += `<div class="extra">+ ${extra.nombre}</div>`;
      });
    } else {
      html += `<div class="item">${item.nombre}</div>`;
    }
  });

  html += `
      <div class="line"></div>
      <div class="total">TOTAL: $${ticket.total.toLocaleString()}</div>
      <div class="total">10% OFF: $${ticket.totalConDescuento.toLocaleString()}</div>
      <div class="line"></div>
      <div class="center">Reimpresión</div>
    </body>
    </html>
  `;

  const win = window.open('', 'PRINT', 'height=600,width=400');
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
  win.close();
}

