// Facturación - Lima Plásticos
(function(){
  const KEY_INVOICES = 'lp_invoices';

  function getInvoices() { return LP.storage.get(KEY_INVOICES, []); }
  function setInvoices(list) { LP.storage.set(KEY_INVOICES, list); }

  function renderCurrentInvoiceLines(lines) {
    const tbody = document.querySelector('#tabla-factura-detalle tbody');
    tbody.innerHTML = '';
    let total = 0;
    for (const ln of lines) {
      const subtotal = ln.cantidad * ln.precio_venta;
      total += subtotal;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${ln.codigo}</td>
        <td>${ln.descripcion}</td>
        <td>${ln.cantidad}</td>
        <td>${ln.precio_venta.toFixed(2)}</td>
        <td>${subtotal.toFixed(2)}</td>`;
      tbody.appendChild(tr);
    }
    document.getElementById('factura-total').textContent = total.toFixed(2);
  }

  function renderInvoicesTable() {
    const tbody = document.querySelector('#tabla-facturas tbody');
    tbody.innerHTML = '';
    const list = getInvoices();
    for (const inv of list) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${inv.id}</td>
        <td>${new Date(inv.fecha).toLocaleString()}</td>
        <td>${inv.items.reduce((a,b)=>a+b.cantidad,0)}</td>
        <td>${inv.total_venta.toFixed(2)}</td>
        <td>${inv.ganancia.toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    }
  }

  function addLineFromInputs(lines) {
    const codigo = document.getElementById('fac-codigo').value.trim();
    const cantidad = Number(document.getElementById('fac-cantidad').value);
    if (!codigo || !cantidad || cantidad <= 0) return;
    const p = LP.inventory.findByCode(codigo);
    if (!p) { alert('Producto no encontrado'); return; }
    if (p.cantidad < cantidad) { alert('Stock insuficiente'); return; }
    lines.push({
      codigo,
      descripcion: `${p.tipo} ${p.tamano} ${p.marca} ${p.color}`.trim(),
      cantidad,
      precio_venta: Number(p.precio_venta),
      precio_compra: Number(p.precio_compra)
    });
    renderCurrentInvoiceLines(lines);
    document.getElementById('fac-codigo').value = '';
    document.getElementById('fac-cantidad').value = '';
    document.getElementById('fac-codigo').focus();
  }

  function commitInvoice(lines) {
    if (!lines.length) return;
    // Adjust stock first
    for (const ln of lines) {
      const ok = LP.inventory.adjustStock(ln.codigo, -ln.cantidad);
      if (!ok) { alert('Error ajustando stock'); return; }
    }
    const fecha = new Date().toISOString();
    const list = getInvoices();
    const id = (list[list.length-1]?.id ?? 0) + 1;
    const total_venta = lines.reduce((a,b)=> a + b.cantidad*b.precio_venta, 0);
    const total_compra = lines.reduce((a,b)=> a + b.cantidad*b.precio_compra, 0);
    const inv = { id, fecha, items: lines, total_venta, ganancia: total_venta - total_compra };
    list.push(inv);
    setInvoices(list);
    renderInvoicesTable();
    return inv;
  }

  function init() {
    let currentLines = [];

    document.getElementById('btn-agregar-linea').addEventListener('click', () => addLineFromInputs(currentLines));
    document.getElementById('btn-registrar-factura').addEventListener('click', () => {
      const inv = commitInvoice(currentLines);
      if (inv) {
        alert('Factura registrada');
        currentLines = [];
        renderCurrentInvoiceLines(currentLines);
      }
    });
    document.getElementById('btn-limpiar-factura').addEventListener('click', () => {
      currentLines = [];
      renderCurrentInvoiceLines(currentLines);
    });

    renderCurrentInvoiceLines(currentLines);
    renderInvoicesTable();
  }

  window.LP = window.LP || {};
  LP.billing = { init, getInvoices };
})();