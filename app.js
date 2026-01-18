// ==============================
// Productos válidos para Sheets
// ==============================

const PRODUCTOS_VALIDOS_SHEETS = [ //VERIFICAR CON LOS NOMBRES EN HTML CADA BURGA Y EXTRA, SI NO SE CARGAN BIEN, VA A DAR ERROR
  "Cuarto smash simple",
  "Cuarto smash doble",
  "Big smash simple",
  "Big smash doble",
  "cheddar simple",
  "Cheddar doble smash",
  "Cheddar triple smash",
  "Doble Cheddar Bacon",
  "Papas noisette x100gr",
  "Doble papas noicette",
  "Galaxia de papas 500gr",
  "Cancelado por PEYA",
  "Promo 2 cuarto smash simple",
  "Promo 2 big smash doble",
  "Promo 2 big smash Simple",
  "Promo 2 Doble Cheddar Bacon",
  "Oreo Smash",
  "Coca Lata 354ml",
  "Extra cheddar",
  "Extra Medallon",
  "Extra bacon",
  "Promo 3 cheddar simple",
  "Dip Mayonesa",
  "Dip Ketchup",
  "Dip Mostaza",
  "Extra Salsa tasty",
  "Extra papas",
  "Coca 600ml"
];


// ==============================
// ESTADO GLOBAL DEL PEDIDO
// ==============================

let pedido = [];
let hamburguesaActiva = null;
let itemActivoParaNotas = null;


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
      const cantidadHamburguesas = Number(btn.dataset.hamburguesas || 0);

      agregarItem({ tipo, rol, nombre, precio, cantidadHamburguesas });
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
  
  document.getElementById('btnAgregarNota')
  .addEventListener('click', agregarNota);


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
  contarHamburguesasPedido(); // 👈 DEBUG
  render();
}

function agregarHamburguesa(item) {
  const nueva = {
  tipo: 'hamburguesa',
  nombre: item.nombre,
  precio: item.precio,
  cantidadHamburguesas: 1,
  extras: [],
  notas: []
};


  pedido.push(nueva);
  hamburguesaActiva = nueva;
  itemActivoParaNotas = nueva;
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
  const nuevo = {
    tipo: item.tipo,
    nombre: item.nombre,
    precio: item.precio,
    cantidadHamburguesas: item.cantidadHamburguesas || 0
  };

  if (item.tipo === 'promo') {
    nuevo.notas = [];
    itemActivoParaNotas = nuevo;
  } else {
    itemActivoParaNotas = null;
  }

  pedido.push(nuevo);
  hamburguesaActiva = null;
}

function obtenerMedioPago() {
  const seleccionado = document.querySelector(
    'input[name="medioPago"]:checked'
  );

  return seleccionado ? seleccionado.value : 'efectivo';
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

function agregarNota() {
  const input = document.getElementById('notaTexto');
  const texto = input.value.trim();

  if (!texto) return;

  if (!itemActivoParaNotas) {
    alert('No hay un ítem activo para agregar la nota');
    return;
  }

  itemActivoParaNotas.notas.push(texto);
  input.value = '';
  render();
}

function contarHamburguesasPedido() {
  const total = pedido.reduce((acc, item) => {
    return acc + (item.cantidadHamburguesas || 0);
  }, 0);

  console.group('🍔 Conteo de hamburguesas');
  pedido.forEach((item, index) => {
    console.log(
      `${index + 1}. ${item.nombre}`,
      '→',
      item.cantidadHamburguesas || 0
    );
  });
  console.log('TOTAL HAMBURGUESAS:', total);
  console.groupEnd();

  return total;
}

function construirPayloadVenta() {
  const numeroPedido = obtenerNumeroPedido();
  if (!numeroPedido) return null;

  const fecha = new Date();
  const fechaISO = fecha.toISOString().split('T')[0];

  const productos = pedido
    .filter(item => PRODUCTOS_VALIDOS_SHEETS.includes(item.nombre))
    .map(item => item.nombre)
    .join(', ');

  const cantidadHamburguesas = contarHamburguesasPedido();

  const total = pedido.reduce((acc, item) => {
    acc += item.precio;
    if (item.extras) {
      item.extras.forEach(e => acc += e.precio);
    }
    return acc;
  }, 0);

  const totalConDescuento = Math.round(total * 0.9);

  const medioPago = obtenerMedioPago();

  const payload = {
    id: numeroPedido,
    fechaISO,
    canal: 'WhatsApp',
    cantidadHamburguesas,
    productos,
    total,
    totalConDescuento,
    medioPago
  };

  console.group('📦 Payload venta');
  console.log(payload);
  console.groupEnd();

  return payload;
}

function obtenerMedioPago() {
  const seleccionado = document.querySelector(
    'input[name="medioPago"]:checked'
  );

  return seleccionado ? seleccionado.value : 'efectivo';
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

    if (item.notas && item.notas.length) {
      item.notas.forEach(nota => {
        html += `&nbsp;&nbsp;* ${nota}<br>`;
      });
}


    } else {
            html += `<strong>${item.nombre}</strong> — $${item.precio.toLocaleString()}<br>`;
            total += item.precio;

      if (item.notas && item.notas.length) {
        item.notas.forEach(nota => {
          html += `&nbsp;&nbsp;* ${nota}<br>`;
        });
      }
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
  const medioPago = obtenerMedioPago();

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
    medioPago,
    items: JSON.parse(JSON.stringify(pedido)),
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
          font-size: 30px;
          margin: 0;
          padding: 0px;
          width: 150mm;
          height: auto;
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
        ${fecha} ${hora}<br>
        <strong>${obtenerMedioPago().toUpperCase()}</strong>
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

    if (item.notas && item.notas.length) {
      item.notas.forEach(nota => {
      html += `<div class="extra">* ${nota}</div>`;
  });
}


    } else {
            html += `<div class="item">${item.nombre}</div>`;
            total += item.precio;

        if (item.notas && item.notas.length) {
        item.notas.forEach(nota => {
        html += `<div class="extra">* ${nota}</div>`;
        });
  }
}

  });

  const final = Math.round(total * 0.9);

  html += `
      <div class="line"></div>
      <div class="total">TOTAL: $${total.toLocaleString()}</div>
      <div class="total">10% OFF: $${final.toLocaleString()}</div>

      <div class="line"></div>
      <div class="center">Gracias</div>
      <img src="../smash.png" class="ticket-img" alt="SMASH">
    </body>
    </html>
  `;
  const ticket = construirTicket(numeroPedido);
  guardarTicket(ticket);

  const win = window.open('', 'PRINT', 'height=600,width=400');
  win.document.write(html);
  win.document.close();
  win.focus();
  const payloadVenta = construirPayloadVenta();
  win.print();
  win.close();
    
    // Reset estado
vaciarPedido();
  document.getElementById('numeroPedido').value = '';
  document.querySelector('input[value="efectivo"]').checked = true;


}

function reimprimirTicket(ticket) {
  let html = `
    <html>
    <head>
      <title>Ticket</title>
      <style>
        body {
          font-family: monospace;
          font-size: 30px;
          margin: 0;
          padding: 0px;
          width: 150mm;
          height: auto;
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
        ${ticket.fecha} ${ticket.hora}<br>
        <strong>${ticket.medioPago.toUpperCase()}</strong>
      </div>

      <div class="line"></div>
  `;

  ticket.items.forEach(item => {
    if (item.tipo === 'hamburguesa') {
      html += `<div class="item">${item.nombre}</div>`;
      item.extras.forEach(extra => {
        html += `<div class="extra">+ ${extra.nombre}</div>`;
      });
    if (item.notas && item.notas.length) {
      item.notas.forEach(nota => {
        html += `<div class="extra">* ${nota}</div>`;
  });
}

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

  const win = window.open('', 'PRINT', 'height=400,width=400');
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
  win.close();
}

