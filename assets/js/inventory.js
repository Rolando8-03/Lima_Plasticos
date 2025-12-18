// Inventario - Lima Plásticos
(function(){
  const KEY_INVENTORY = 'lp_inventory';
  const KEY_NEXT_ID = 'lp_next_product_id';

  function nextCode() {
    const next = (LP.storage.get(KEY_NEXT_ID, 1) || 1);
    LP.storage.set(KEY_NEXT_ID, next + 1);
    return `LP-${String(next).padStart(6,'0')}`;
  }

  function getInventory() { return LP.storage.get(KEY_INVENTORY, []); }
  function setInventory(items) { LP.storage.set(KEY_INVENTORY, items); }

  function productDescription(p) {
    return `${p.tipo} ${p.tamano} ${p.marca} ${p.color}`.trim();
  }

  function renderTable(filter='') {
    const tbody = document.querySelector('#tabla-inventario tbody');
    tbody.innerHTML = '';
    const items = getInventory();
    const q = filter.trim().toLowerCase();

    for (const p of items) {
      const matches = !q || [p.codigo, p.tipo, p.tamano, p.marca, p.color].some(x => String(x).toLowerCase().includes(q));
      if (!matches) continue;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${p.codigo}</td>
        <td>${p.categoria}</td>
        <td>${p.tipo}</td>
        <td>${p.tamano}</td>
        <td>${p.marca}</td>
        <td>${p.color}</td>
        <td>${p.cantidad}</td>
        <td>${Number(p.precio_compra).toFixed(2)}</td>
        <td>${Number(p.precio_venta).toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    }
  }

  function addProduct(form) {
    const p = {
      codigo: nextCode(),
      categoria: '1',
      tipo: form.querySelector('#inv-tipo').value.trim(),
      tamano: form.querySelector('#inv-tamano').value.trim(),
      marca: form.querySelector('#inv-marca').value.trim(),
      color: form.querySelector('#inv-color').value.trim(),
      cantidad: Number(form.querySelector('#inv-cantidad').value),
      precio_compra: Number(form.querySelector('#inv-precio-compra').value),
      precio_venta: Number(form.querySelector('#inv-precio-venta').value)
    };
    const items = getInventory();
    items.push(p);
    setInventory(items);
    renderTable(document.querySelector('#inv-buscar').value);
    form.reset();
    form.querySelector('#inv-categoria').value = '1';
  }

  function findByCode(code) {
    const items = getInventory();
    return items.find(p => p.codigo === code) || null;
  }

  function adjustStock(code, deltaQty) {
    const items = getInventory();
    const idx = items.findIndex(p => p.codigo === code);
    if (idx === -1) return false;
    const newQty = (Number(items[idx].cantidad) + Number(deltaQty));
    if (newQty < 0) return false;
    items[idx].cantidad = newQty;
    setInventory(items);
    renderTable(document.querySelector('#inv-buscar').value);
    return true;
  }

  function exportExcel() {
    const items = getInventory();
    const rows = items.map(p => ({
      codigo: p.codigo,
      categoria: p.categoria,
      tipo: p.tipo,
      tamano: p.tamano,
      marca: p.marca,
      color: p.color,
      cantidad: p.cantidad,
      precio_compra: p.precio_compra,
      precio_venta: p.precio_venta,
      descripcion: productDescription(p)
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    XLSX.writeFile(wb, 'Inventario_Lima_Plasticos.xlsx');
  }

  async function importExcel(file) {
    if (!file) return;
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
    const items = getInventory();
    for (const r of json) {
      const p = {
        codigo: nextCode(),
        categoria: String(r.categoria || '1'),
        tipo: String(r.tipo || '').trim(),
        tamano: String(r.tamano || '').trim(),
        marca: String(r.marca || '').trim(),
        color: String(r.color || '').trim(),
        cantidad: Number(r.cantidad || 0),
        precio_compra: Number(r.precio_compra || 0),
        precio_venta: Number(r.precio_venta || 0)
      };
      items.push(p);
    }
    setInventory(items);
    renderTable(document.querySelector('#inv-buscar').value);
  }

  function init() {
    // Bind form
    const form = document.getElementById('form-inventario');
    form.addEventListener('submit', (e) => { e.preventDefault(); addProduct(form); });
    document.getElementById('btn-exportar-excel').addEventListener('click', exportExcel);
    document.getElementById('input-import-excel').addEventListener('change', (e) => importExcel(e.target.files[0]));
    document.getElementById('inv-buscar').addEventListener('input', (e) => renderTable(e.target.value));

    renderTable();
  }

  // Expose module
  window.LP = window.LP || {};
  LP.inventory = { init, getInventory, setInventory, findByCode, adjustStock };
})();