// Inventario - Lima Plásticos
 (function(){
  const KEY_INVENTORY = 'lp_inventory';
  const KEY_NEXT_ID = 'lp_next_product_id';
  const KEY_CATEGORIES = 'lp_categories';
  const KEY_BRANDS = 'lp_brands';
  const KEY_COLORS = 'lp_colors';

  function peekNextCode() {
    return LP.storage.get(KEY_NEXT_ID, 1001) || 1001;
  }

  function nextCode() {
    const next = peekNextCode();
    LP.storage.set(KEY_NEXT_ID, next + 1);
    return String(next);
  }

  function getInventory() { return LP.storage.get(KEY_INVENTORY, []); }
  function setInventory(items) { LP.storage.set(KEY_INVENTORY, items); }

  function productDescription(p) {
    return `${p.tipo} ${p.tamano} ${p.marca} ${p.color}`.trim();
  }

  function getList(key) { return LP.storage.get(key, []); }
  function setList(key, list) { LP.storage.set(key, list); }

  function ensureDefaultLists() {
    if (!LP.storage.get(KEY_CATEGORIES)) setList(KEY_CATEGORIES, ['GENERAL']);
    if (!LP.storage.get(KEY_BRANDS)) setList(KEY_BRANDS, []);
    if (!LP.storage.get(KEY_COLORS)) setList(KEY_COLORS, []);
  }

  function renderSelect(id, list) {
    const sel = document.getElementById(id);
    sel.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Selecciona...';
    sel.appendChild(placeholder);
    for (const v of list) {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v;
      sel.appendChild(opt);
    }
    const add = document.createElement('option');
    add.value = '__new__';
    add.textContent = 'Añadir nueva…';
    sel.appendChild(add);
  }

  function bindAddOption(id, key) {
    const sel = document.getElementById(id);
    sel.addEventListener('change', () => {
      if (sel.value === '__new__') {
        const nombre = prompt('Ingrese nuevo valor');
        if (!nombre) { sel.value = ''; return; }
        const val = nombre.trim().toUpperCase();
        const list = getList(key);
        if (!list.includes(val)) {
          list.push(val);
          setList(key, list);
        }
        renderSelect(id, getList(key));
        sel.value = val;
      }
    });
  }

  function matchesField(p, field, q) {
    const val = (field === 'general')
      ? `${p.codigo} ${p.categoria} ${p.tipo} ${p.tamano} ${p.marca} ${p.color}`
      : String(p[field] || '');
    return val.toLowerCase().includes(q);
  }

  function renderTable(filter='', field='general', selectedCode=null) {
    const tbody = document.querySelector('#tabla-inventario tbody');
    tbody.innerHTML = '';
    const items = getInventory();
    const q = filter.trim().toLowerCase();

    for (const p of items) {
      const ok = !q || matchesField(p, field, q);
      if (!ok) continue;
      const tr = document.createElement('tr');
      if (Number(p.cantidad) <= 5) tr.classList.add('low-stock');
      if (q) tr.classList.add('resaltar');
      if (selectedCode && selectedCode === p.codigo) tr.classList.add('selected-row');
      tr.dataset.codigo = p.codigo;
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
      tr.addEventListener('click', () => selectRow(p.codigo));
      tbody.appendChild(tr);
    }
  }

  function validateInputs(form) {
    const tipo = form.querySelector('#inv-tipo').value.trim();
    const tamano = form.querySelector('#inv-tamano').value.trim();
    const marca = form.querySelector('#inv-marca').value;
    const color = form.querySelector('#inv-color').value;
    const categoria = form.querySelector('#inv-categoria').value;
    const cantidadStr = form.querySelector('#inv-cantidad').value;
    const precioCompraStr = form.querySelector('#inv-precio-compra').value;
    const precioVentaStr = form.querySelector('#inv-precio-venta').value;

    if (!categoria) { alert('Seleccione una categoría'); return null; }
    if (!tipo || !tamano) { alert('Complete tipo y tamaño'); return null; }
    if (!marca) { alert('Seleccione una marca'); return null; }
    if (!color) { alert('Seleccione un color'); return null; }

    const cantidad = Number(cantidadStr);
    if (!Number.isInteger(cantidad) || cantidad < 0) { alert('La cantidad debe ser un entero válido'); return null; }
    const precio_compra = Number(precioCompraStr);
    const precio_venta = Number(precioVentaStr);
    if (!isFinite(precio_compra) || precio_compra < 0) { alert('Precio de compra inválido'); return null; }
    if (!isFinite(precio_venta) || precio_venta < 0) { alert('Precio de venta inválido'); return null; }

    return {
      categoria: categoria.toUpperCase(),
      tipo: tipo.toUpperCase(),
      tamano: tamano.toUpperCase(),
      marca: marca.toUpperCase(),
      color: color.toUpperCase(),
      cantidad,
      precio_compra,
      precio_venta
    };
  }

  function addProduct(form) {
    const val = validateInputs(form);
    if (!val) return;
    const p = {
      codigo: nextCode(),
      categoria: val.categoria,
      tipo: val.tipo,
      tamano: val.tamano,
      marca: val.marca,
      color: val.color,
      cantidad: val.cantidad,
      precio_compra: val.precio_compra,
      precio_venta: val.precio_venta
    };
    const items = getInventory();
    items.push(p);
    setInventory(items);
    alert('Producto agregado');
    selectedCode = null;
    const btn = document.getElementById('btn-editar-stock');
    if (btn) btn.disabled = true;
    renderTable(document.querySelector('#inv-buscar').value, document.getElementById('inv-buscar-por').value, selectedCode);
    form.reset();
    document.getElementById('inv-categoria').value = '';
    document.getElementById('inv-marca').value = '';
    document.getElementById('inv-color').value = '';
    document.getElementById('inv-codigo-next').value = peekNextCode();
  }

  function findByCode(code) {
    const items = getInventory();
    return items.find(p => p.codigo === code) || null;
  }

  function updateProductFields(code, cantidad, precio_compra, precio_venta) {
    const items = getInventory();
    const idx = items.findIndex(p => p.codigo === code);
    if (idx === -1) return false;
    items[idx].cantidad = cantidad;
    items[idx].precio_compra = precio_compra;
    items[idx].precio_venta = precio_venta;
    setInventory(items);
    return true;
  }

  function adjustStock(code, deltaQty) {
    const items = getInventory();
    const idx = items.findIndex(p => p.codigo === code);
    if (idx === -1) return false;
    const newQty = (Number(items[idx].cantidad) + Number(deltaQty));
    if (newQty < 0) return false;
    items[idx].cantidad = newQty;
    setInventory(items);
    renderTable(document.querySelector('#inv-buscar').value, document.getElementById('inv-buscar-por').value, selectedCode);
    return true;
  }

  function exportExcel() {
    const items = getInventory();
    const headers = ['codigo','categoria','tipo','tamano','marca','color','cantidad','precio_compra','precio_venta'];
    const aoa = [headers];
    items.forEach(p => {
      aoa.push([
        p.codigo,
        p.categoria,
        p.tipo,
        p.tamano,
        p.marca,
        p.color,
        p.cantidad,
        p.precio_compra,
        p.precio_venta
      ]);
    });
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    // Auto-ajustar columnas
    const colWidths = headers.map((h, idx) => {
      const maxLen = aoa.reduce((m, row) => {
        const v = row[idx] == null ? '' : String(row[idx]);
        return Math.max(m, v.length);
      }, String(h).length);
      return { wch: Math.min(Math.max(maxLen + 2, 8), 32) };
    });
    ws['!cols'] = colWidths;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
    const now = new Date();
    const pad = n => String(n).padStart(2,'0');
    const ts = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    XLSX.writeFile(wb, `Inventario_Lima_Plasticos_${ts}.xlsx`);
  }

  let selectedCode = null;

  function selectRow(code) {
    selectedCode = code;
    renderTable(document.getElementById('inv-buscar').value, document.getElementById('inv-buscar-por').value, selectedCode);
    const btn = document.getElementById('btn-editar-stock');
    if (btn) btn.disabled = false;
  }

  function openEditModal(code) {
    const p = findByCode(code);
    if (!p) { alert('Producto no encontrado'); return; }
    document.getElementById('edit-codigo').value = p.codigo;
    document.getElementById('edit-cantidad').value = p.cantidad;
    document.getElementById('edit-precio-compra').value = Number(p.precio_compra).toFixed(2);
    document.getElementById('edit-precio-venta').value = Number(p.precio_venta).toFixed(2);
    document.getElementById('modal-editar').classList.remove('hidden');
  }

  function closeEditModal() {
    document.getElementById('modal-editar').classList.add('hidden');
  }

  function init() {
    ensureDefaultLists();
    // Render selects
    renderSelect('inv-categoria', getList(KEY_CATEGORIES));
    renderSelect('inv-marca', getList(KEY_BRANDS));
    renderSelect('inv-color', getList(KEY_COLORS));
    bindAddOption('inv-categoria', KEY_CATEGORIES);
    bindAddOption('inv-marca', KEY_BRANDS);
    bindAddOption('inv-color', KEY_COLORS);

    // Show next code
    const nextCodeInput = document.getElementById('inv-codigo-next');
    if (nextCodeInput) nextCodeInput.value = peekNextCode();

    // Bind form
    const form = document.getElementById('form-inventario');
    form.addEventListener('submit', (e) => { e.preventDefault(); addProduct(form); });
    document.getElementById('btn-exportar-excel').addEventListener('click', exportExcel);
    document.getElementById('btn-buscar').addEventListener('click', () => {
      const q = document.getElementById('inv-buscar').value;
      const field = document.getElementById('inv-buscar-por').value;
      renderTable(q, field, selectedCode);
    });

    // Modal bindings
    document.getElementById('btn-cancelar-editar').addEventListener('click', closeEditModal);
    document.getElementById('form-editar').addEventListener('submit', (e) => {
      e.preventDefault();
      const codigo = document.getElementById('edit-codigo').value;
      const cantidad = Number(document.getElementById('edit-cantidad').value);
      const pc = Number(document.getElementById('edit-precio-compra').value);
      const pv = Number(document.getElementById('edit-precio-venta').value);
      if (!Number.isInteger(cantidad) || cantidad < 0) { alert('La cantidad debe ser un entero válido'); return; }
      if (!isFinite(pc) || pc < 0) { alert('Precio de compra inválido'); return; }
      if (!isFinite(pv) || pv < 0) { alert('Precio de venta inválido'); return; }
      const ok = updateProductFields(codigo, cantidad, pc, pv);
      if (!ok) { alert('Error al actualizar'); return; }
      closeEditModal();
      renderTable(document.getElementById('inv-buscar').value, document.getElementById('inv-buscar-por').value, selectedCode);
      alert('Producto actualizado');
    });

    // Editar stock solo al seleccionar
    const btnEditar = document.getElementById('btn-editar-stock');
    btnEditar.addEventListener('click', () => {
      if (!selectedCode) { alert('Seleccione un producto para editar'); return; }
      openEditModal(selectedCode);
    });

    renderTable('', 'general', selectedCode);
  }

  // Expose module
  window.LP = window.LP || {};
  LP.inventory = { init, getInventory, setInventory, findByCode, adjustStock };
})();