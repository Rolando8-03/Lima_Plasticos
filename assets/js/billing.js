// Facturación - Lima Plásticos
(function(){
  const KEY_INVOICES = 'lp_invoices';

  function getInvoices() { return LP.storage.get(KEY_INVOICES, []); }
  function setInvoices(list) { LP.storage.set(KEY_INVOICES, list); }

  function renderCurrentInvoiceLines(lines) {
    const tbody = document.querySelector('#tabla-factura-detalle tbody');
    tbody.innerHTML = '';
    let total = 0;
    lines.forEach((ln, idx) => {
      const subtotal = ln.cantidad * ln.precio_venta;
      total += subtotal;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${ln.codigo}</td>
        <td>${ln.descripcion}</td>
        <td>${ln.cantidad}</td>
        <td>${ln.precio_venta.toFixed(2)}</td>
        <td>${subtotal.toFixed(2)}</td>
        <td><button type="button" class="remove-line" data-idx="${idx}">Eliminar</button></td>`;
      tr.querySelector('.remove-line').addEventListener('click', () => {
        lines.splice(idx, 1);
        renderCurrentInvoiceLines(lines);
      });
      tbody.appendChild(tr);
    });
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
      tr.addEventListener('dblclick', () => abrirModalDetalleFactura(inv));
      tbody.appendChild(tr);
    }
  }

  let currentInvoiceForModal = null;

  function abrirModalDetalleFactura(inv) {
    const tbody = document.querySelector('#tabla-detalle-factura-modal tbody');
    const totalEl = document.getElementById('modal-total-factura');
    if (!tbody || !totalEl) return;
    tbody.innerHTML = '';
    let total = 0;
    inv.items.forEach(it => {
      const subtotal = it.cantidad * it.precio_venta;
      total += subtotal;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${it.codigo}</td>
        <td>${it.descripcion}</td>
        <td>${it.cantidad}</td>
        <td>${it.precio_venta.toFixed(2)}</td>
        <td>${subtotal.toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    });
    totalEl.textContent = total.toFixed(2);
    currentInvoiceForModal = inv;
    document.getElementById('modal-detalle-factura').classList.remove('hidden');
  }

  function cerrarModalDetalleFactura() {
    document.getElementById('modal-detalle-factura').classList.add('hidden');
  }

  function addLineFromInputs(lines) {
    const codigo = document.getElementById('fac-codigo').value.trim();
    const cantidad = Number(document.getElementById('fac-cantidad').value);
    if (!codigo) { alert('Seleccione un producto de la lista'); return; }
    if (!Number.isInteger(cantidad) || cantidad <= 0) { alert('Ingrese una cantidad entera válida'); return; }
    const p = LP.inventory.findByCode(codigo);
    if (!p) { alert('Producto no encontrado'); return; }
    if (p.cantidad < cantidad) { alert('Stock insuficiente'); return; }
    lines.push({
      codigo,
      descripcion: `${p.categoria} ${p.tipo} ${p.tamano}`.trim(),
      cantidad,
      precio_venta: Number(p.precio_venta),
      precio_compra: Number(p.precio_compra)
    });
    renderCurrentInvoiceLines(lines);
    document.getElementById('fac-codigo').value = '';
    document.getElementById('fac-cantidad').value = '';
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
    if (LP.reports && LP.reports.refreshDaily) LP.reports.refreshDaily();
    return inv;
  }

  function matchesField(p, field, q) {
    const val = (field === 'general')
      ? `${p.codigo} ${p.categoria} ${p.tipo} ${p.tamano} ${p.marca} ${p.color}`
      : String(p[field] || '');
    return val.toLowerCase().includes(q);
  }

  function renderSearchResults(field, query) {
    const tbody = document.querySelector('#fac-resultados tbody');
    tbody.innerHTML = '';
    const items = LP.inventory.getInventory();
    const q = (query || '').trim().toLowerCase();
    if (!q) return; // no mostrar nada si no se busca
    for (const p of items) {
      if (q && !matchesField(p, field, q)) continue;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.codigo}</td>
        <td>${p.categoria} ${p.tipo} ${p.tamano}</td>
        <td>${p.cantidad}</td>
        <td>${Number(p.precio_venta).toFixed(2)}</td>
        <td><button type="button" class="select-product">Seleccionar</button></td>
      `;
      tr.querySelector('.select-product').addEventListener('click', () => {
        if (p.cantidad <= 0) { alert('Sin stock disponible'); return; }
        document.getElementById('fac-codigo').value = p.codigo;
        document.getElementById('fac-cantidad').focus();
      });
      tbody.appendChild(tr);
    }
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
        // limpiar campos y búsquedas
        document.getElementById('fac-codigo').value = '';
        document.getElementById('fac-cantidad').value = '';
        document.getElementById('fac-buscar').value = '';
        renderSearchResults('general','');
        // generar PDF
        generarPdf(inv);
      }
    });
    document.getElementById('btn-limpiar-factura').addEventListener('click', () => {
      currentLines = [];
      renderCurrentInvoiceLines(currentLines);
    });

    // Buscar productos en facturación
    document.getElementById('fac-btn-buscar').addEventListener('click', () => {
      const field = document.getElementById('fac-buscar-por').value;
      const query = document.getElementById('fac-buscar').value;
      renderSearchResults(field, query);
    });
    // Render inicial vacía
    renderSearchResults('general', '');

    renderCurrentInvoiceLines(currentLines);
    renderInvoicesTable();

    const btnCerrar = document.getElementById('btn-cerrar-detalle');
    if (btnCerrar) btnCerrar.addEventListener('click', cerrarModalDetalleFactura);
    const btnImprimir = document.getElementById('btn-imprimir-detalle');
    if (btnImprimir) btnImprimir.addEventListener('click', () => imprimirDetalleFactura(currentInvoiceForModal));
  }

  function imprimirDetalleFactura(inv) {
    if (!inv) return;
    const w = window.open('', '_blank');
    if (!w) return;
    const fecha = new Date(inv.fecha).toLocaleString();
    const rows = inv.items.map(it => `
      <tr>
        <td>${it.codigo}</td>
        <td>${it.descripcion}</td>
        <td>${it.cantidad}</td>
        <td>${it.precio_venta.toFixed(2)}</td>
        <td>${(it.cantidad*it.precio_venta).toFixed(2)}</td>
      </tr>
    `).join('');
    w.document.write(`
      <html>
        <head>
          <title>Factura ${inv.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; }
            h1 { font-size: 18px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
            thead { background: #f0f0f0; }
            .total { text-align: right; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Factura #${inv.id}</h1>
          <div>Fecha: ${fecha}</div>
          <br />
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Descripción</th>
                <th>Cantidad</th>
                <th>Precio Venta</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" class="total">Total</td>
                <td>${inv.total_venta.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
          <script>
            window.onload = function(){ window.print(); window.close(); };
          <\/script>
        </body>
      </html>
    `);
    w.document.close();
  }

  function generarPdf(inv) {
    if (!window.jspdf || !window.jspdf.jsPDF) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text(`Factura #${inv.id}`, 10, 10);
    doc.text(`Fecha: ${new Date(inv.fecha).toLocaleString()}`, 10, 18);
    let y = 28;
    doc.text('Código', 10, y);
    doc.text('Descripción', 40, y);
    doc.text('Cant.', 120, y);
    doc.text('P. Venta', 140, y);
    doc.text('Subtotal', 170, y);
    y += 6;
    inv.items.forEach(it => {
      const subtotal = it.cantidad * it.precio_venta;
      doc.text(it.codigo, 10, y);
      doc.text(it.descripcion, 40, y);
      doc.text(String(it.cantidad), 120, y);
      doc.text(it.precio_venta.toFixed(2), 140, y);
      doc.text(subtotal.toFixed(2), 170, y);
      y += 6;
    });
    y += 4;
    doc.text(`Total: ${inv.total_venta.toFixed(2)}`, 10, y);
    doc.save(`factura_${inv.id}.pdf`);
  }

  window.LP = window.LP || {};
  LP.billing = { init, getInvoices };
})();