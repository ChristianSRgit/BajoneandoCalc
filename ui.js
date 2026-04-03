const UI = {
  lista: document.getElementById('lista'),
  stickyResumen: document.getElementById('stickyResumen'),
  stickyTotal: document.getElementById('stickyTotal'),
  historialPanel: document.getElementById('historialPanel'),
  historialLista: document.getElementById('historialLista'),
  modalCaja: document.getElementById('modalCaja'),
  modalCajaTitulo: document.getElementById('modalCajaTitulo'),
  
  renderPedido(pedido, precioFinalManual) {
    if (pedido.length === 0) {
      this.lista.innerHTML = '<div class="muted">No hay items</div>';
      this.stickyResumen.innerText = 'Original: $0';
      this.stickyTotal.innerText = '$0';
      return;
    }

    let html = '';
    pedido.forEach(item => {
      html += `<div><strong>${item.nombre}</strong> — $${item.precio.toLocaleString()}</div>`;
      if (item.extras) {
        item.extras.forEach(extra => {
          html += `<div style="font-size:11px; margin-left:10px">+ ${extra.nombre} — $${extra.precio.toLocaleString()}</div>`;
        });
      }
      if (item.notas) {
        item.notas.forEach(nota => {
          html += `<div style="font-size:11px; margin-left:10px; font-style:italic">* ${nota}</div>`;
        });
      }
    });

    const totals = this.calcularTotales(pedido);
    const finalMostrado = precioFinalManual ?? totals.totalConDescuento;

    this.lista.innerHTML = html;
    this.stickyResumen.innerText = `Original: $${totals.total.toLocaleString()}`;
    this.stickyTotal.innerText = `$${finalMostrado.toLocaleString()}`;
    
    // Auto-scroll al final de la lista
    this.lista.scrollTop = this.lista.scrollHeight;
  },

  calcularTotales(pedido) {
    let total = 0;
    let totalConDctoItems = 0;

    pedido.forEach(item => {
      total += item.precio;
      if (item.tipo !== 'manual' && item.tipo !== 'delivery') {
        totalConDctoItems += item.precio;
      }
      if (item.extras) {
        item.extras.forEach(e => {
          total += e.precio;
          totalConDctoItems += e.precio;
        });
      }
    });

    const resto = total - totalConDctoItems;
    const totalConDescuento = Math.round(totalConDctoItems * 0.9) + resto;

    return { total, totalConDescuento };
  },

  renderHistorial(historial, callbackReimprimir) {
    if (historial.length === 0) {
      this.historialLista.innerHTML = '<div class="muted">No hay tickets</div>';
      return;
    }

    this.historialLista.innerHTML = '';
    historial.slice().reverse().forEach(ticket => {
      const div = document.createElement('div');
      div.className = 'ticket-item';
      div.innerHTML = `
        <div class="ticket-id">Pedido #${ticket.id}</div>
        <div class="ticket-meta">${ticket.fecha} ${ticket.hora}</div>
        <div class="ticket-meta">$${ticket.totalFinal.toLocaleString()}</div>
      `;
      div.onclick = () => callbackReimprimir(ticket);
      this.historialLista.appendChild(div);
    });
  },

  abrirModalCaja(tipo) {
    this.modalCajaTitulo.innerText = tipo === 'apertura' ? 'Apertura de Caja' : 'Cierre de Turno';
    this.modalCaja.dataset.tipo = tipo;
    this.modalCaja.style.display = 'flex';
  },

  cerrarModalCaja() {
    this.modalCaja.style.display = 'none';
    document.getElementById('cajaWallet').value = '';
    document.getElementById('cajaEfectivo').value = '';
    document.getElementById('cajaObs').value = '';
  },

  obtenerDatosCaja() {
    return {
      tipo: this.modalCaja.dataset.tipo,
      wallet: Number(document.getElementById('cajaWallet').value),
      efectivo: Number(document.getElementById('cajaEfectivo').value),
      observaciones: document.getElementById('cajaObs').value
    };
  }
};
