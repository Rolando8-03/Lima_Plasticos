// Control Financiero - Lima Plásticos
(function(){
  function groupByDay(invoices, baseDate) {
    const target = baseDate ? new Date(baseDate) : null;
    const fmt = d => d.toISOString().slice(0,10);
    return invoices.filter(inv => !target || fmt(new Date(inv.fecha)) === fmt(target));
  }

  function getISOWeek(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
    return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  }

  function groupByWeek(invoices, baseDate) {
    const target = baseDate ? new Date(baseDate) : new Date();
    const targetYear = target.getFullYear();
    const targetWeek = getISOWeek(target);
    return invoices.filter(inv => {
      const d = new Date(inv.fecha);
      return d.getFullYear() === targetYear && getISOWeek(d) === targetWeek;
    });
  }

  function groupByMonth(invoices, baseDate) {
    const target = baseDate ? new Date(baseDate) : new Date();
    return invoices.filter(inv => {
      const d = new Date(inv.fecha);
      return d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth();
    });
  }

  function renderReport(list) {
    const ventas = list.reduce((a,b)=> a + b.total_venta, 0);
    const ganancia = list.reduce((a,b)=> a + b.ganancia, 0);
    const items = list.reduce((a,b)=> a + b.items.reduce((x,y)=> x+y.cantidad, 0), 0);
    const ticket = list.length ? ventas / list.length : 0;

    document.getElementById('rep-ventas').textContent = ventas.toFixed(2);
    document.getElementById('rep-ganancia').textContent = ganancia.toFixed(2);
    document.getElementById('rep-items').textContent = items.toString();
    document.getElementById('rep-ticket').textContent = ticket.toFixed(2);

    const tbody = document.querySelector('#tabla-reporte-detalle tbody');
    tbody.innerHTML = '';
    for (const inv of list) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${new Date(inv.fecha).toLocaleString()}</td>
        <td>${inv.id}</td>
        <td>${inv.items.reduce((a,b)=>a+b.cantidad,0)}</td>
        <td>${inv.total_venta.toFixed(2)}</td>
        <td>${inv.ganancia.toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    }
  }

  function init() {
    const fechaInput = document.getElementById('reporte-fecha');
    fechaInput.valueAsDate = new Date();

    document.getElementById('btn-generar-reporte').addEventListener('click', () => {
      const rango = document.getElementById('reporte-rango').value;
      const fecha = fechaInput.value;
      const invoices = LP.billing.getInvoices();
      let list = [];
      if (rango === 'dia') list = groupByDay(invoices, fecha);
      else if (rango === 'semana') list = groupByWeek(invoices, fecha);
      else list = groupByMonth(invoices, fecha);
      renderReport(list);
    });

    // initial render
    const invoices = LP.billing.getInvoices();
    renderReport(groupByDay(invoices, new Date()));
  }

  window.LP = window.LP || {};
  LP.reports = { init };
})();