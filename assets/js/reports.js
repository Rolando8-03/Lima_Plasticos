// Control Financiero - Lima Plásticos
(function(){
  function formatDay(date) {
    const d = new Date(date);
    return d.toISOString().slice(0,10);
  }

  function filterByDay(invoices, dayDate) {
    const target = dayDate ? formatDay(dayDate) : formatDay(new Date());
    return invoices.filter(inv => formatDay(inv.fecha) === target);
  }

  function buildProductRows(invoices) {
    const map = new Map();
    invoices.forEach(inv => {
      inv.items.forEach(it => {
        const desc = `${it.descripcion}`;
        const key = `${formatDay(inv.fecha)}|${desc}|${it.precio_venta}`;
        const prev = map.get(key) || { fecha: formatDay(inv.fecha), desc, precio: it.precio_venta, cantidad: 0 };
        prev.cantidad += it.cantidad;
        map.set(key, prev);
      });
    });
    return Array.from(map.values()).map(r => ({
      fecha: r.fecha,
      desc: r.desc,
      precio: r.precio,
      cantidad: r.cantidad,
      total: r.cantidad * r.precio
    }));
  }

  function renderReport(list) {
    const ventas = list.reduce((a,b)=> a + b.total_venta, 0);
    const ganancia = list.reduce((a,b)=> a + b.ganancia, 0);
    const items = list.reduce((a,b)=> a + b.items.reduce((x,y)=> x+y.cantidad, 0), 0);

    document.getElementById('rep-ventas').textContent = ventas.toFixed(2);
    document.getElementById('rep-ganancia').textContent = ganancia.toFixed(2);
    document.getElementById('rep-items').textContent = items.toString();

    const tbody = document.querySelector('#tabla-reporte-detalle tbody');
    tbody.innerHTML = '';
    const rows = buildProductRows(list);
    for (const r of rows) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.fecha}</td>
        <td>${r.desc}</td>
        <td>${r.precio.toFixed(2)}</td>
        <td>${r.cantidad}</td>
        <td>${r.total.toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    }
  }

  function refreshDaily() {
    const fechaInput = document.getElementById('reporte-fecha');
    const selected = fechaInput?.value ? new Date(fechaInput.value) : new Date();
    const today = new Date();
    const sameDay = formatDay(selected) === formatDay(today);
    if (!sameDay) return; // si se seleccionó otro día, no actualizamos
    const invoices = LP.billing.getInvoices();
    const todayList = filterByDay(invoices, today);
    renderReport(todayList);
  }

  function init() {
    const fechaInput = document.getElementById('reporte-fecha');
    if (fechaInput) {
      fechaInput.valueAsDate = new Date();
      fechaInput.addEventListener('change', () => {
        const invoices = LP.billing.getInvoices();
        const list = fechaInput.value ? filterByDay(invoices, new Date(fechaInput.value)) : [];
        renderReport(list);
      });
    }
    const btn = document.getElementById('btn-generar-reporte');
    if (btn) btn.addEventListener('click', () => {
      const invoices = LP.billing.getInvoices();
      const value = document.getElementById('reporte-fecha')?.value;
      const list = value ? filterByDay(invoices, new Date(value)) : [];
      renderReport(list);
      exportReportToExcel(list, value);
    });
    // Render inicial: hoy
    const invoices = LP.billing.getInvoices();
    const todayList = filterByDay(invoices, new Date());
    renderReport(todayList);
  }

  function exportReportToExcel(invoicesList, value) {
    // Export only the detail table (same info shown on screen)
    const rows = buildProductRows(invoicesList);
    const headers = ['Fecha','Producto','Precio unitario','Cantidad','Total venta'];
    const aoa = [headers];
    rows.forEach(r => aoa.push([r.fecha, r.desc, r.precio, r.cantidad, r.total]));

    const wsDetalle = XLSX.utils.aoa_to_sheet(aoa);
    // Auto fit columns
    const colWidths = headers.map((h, idx) => {
      const maxLen = aoa.reduce((m, row) => {
        const v = row[idx] == null ? '' : String(row[idx]);
        return Math.max(m, v.length);
      }, String(h).length);
      return { wch: Math.min(Math.max(maxLen + 2, 8), 40) };
    });
    wsDetalle['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, wsDetalle, 'Detalle');

    const day = value ? new Date(value) : new Date();
    const pad = n => String(n).padStart(2,'0');
    const stamp = `${day.getFullYear()}${pad(day.getMonth()+1)}${pad(day.getDate())}`;
    XLSX.writeFile(wb, `Control_Financiero_Detalle_${stamp}.xlsx`);
  }

  window.LP = window.LP || {};
  LP.reports = { init, refreshDaily };
})();