// ============================================
// APLICACIÓN PRINCIPAL - BAR LA BODEGA
// ============================================

const APP = {
    salonActual: null,
    mesaActual: null,
    mesasJuntadas: [],
    configSalones: {},
    mesasActivas: {},
    pantallaAnterior: [],
    categoriaActual: null,
    quedarseEnCategoria: false,
    numPersonasPatatas: 1
};

document.addEventListener('DOMContentLoaded', async () => {
    APP.configSalones = storage.cargarConfigSalones();
    APP.mesasActivas = storage.cargarMesasActivas();
    
    // Cargar ingredientes libres desde Supabase
    const ingLibresGuardados = await storage.cargarIngredientesLibres();
    if (ingLibresGuardados && ingLibresGuardados.length > 0) {
        INGREDIENTES_LIBRES.length = 0;
        ingLibresGuardados.forEach(ing => INGREDIENTES_LIBRES.push(ing));
    }
    
    // Cargar categoría libre desde Supabase
    const catLibre = await storage.cargarCategoriaLibre();
    if (catLibre && catLibre.length > 0) {
        CARTA["📝 Categoría Libre"].subcategorias["Productos libres"] = catLibre;
    }
    mostrarInicio();
});

// ============================================
// NAVEGACIÓN
// ============================================

function mostrarInicio() {
    APP.salonActual = null;
    APP.mesaActual = null;
    APP.mesasJuntadas = [];
    APP.pantallaAnterior = [];
    
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="pantalla inicio">
            <div class="header"><h1>🍷 Bar La Bodega</h1></div>
            <p class="subtitulo">Selecciona un salón</p>
            <div class="salones-grid" id="salonesGrid"></div>
            <div class="botones-flotantes"><button class="btn-secundario" onclick="mostrarHistorial()">📋 Historial</button></div>
        </div>
    `;
    
    const grid = document.getElementById('salonesGrid');
    for (const [nombre, config] of Object.entries(APP.configSalones)) {
        const card = document.createElement('div');
        card.className = 'salon-card';
        card.onclick = () => seleccionarSalon(nombre);
        const icono = nombre.includes('🌿') ? '🌿' : nombre.includes('🏠') ? '🏠' : nombre.includes('🍸') ? '🍸' : '🛍️';
        card.innerHTML = `
            <div class="salon-icono">${icono}</div>
            <div class="salon-nombre">${nombre.replace(/[🌿🏠🍸🛍️]\s*/, '')}</div>
            <div class="salon-mesas">${config.tipo === 'personas' ? 'Personas' : config.mesas.length + ' mesas'}</div>
        `;
        grid.appendChild(card);
    }
}

function seleccionarSalon(salon) {
    APP.salonActual = salon;
    APP.pantallaAnterior = ['inicio'];
    const config = APP.configSalones[salon];
    if (config.tipo === 'personas') mostrarPersonas(salon);
    else mostrarMesas(salon);
}

function mostrarPersonas(salon) {
    const app = document.getElementById('app');
    let personas = [];
    for (const [key, value] of Object.entries(APP.mesasActivas)) {
        if (key.startsWith(salon + '_')) personas.push({ key, data: value, nombre: key.replace(salon + '_', '') });
    }
    
    let personasHTML = '';
    if (personas.length === 0) {
        personasHTML = '<p class="vacio">No hay pedidos para llevar</p>';
    } else {
        personasHTML = '<div class="personas-grid">';
        personas.forEach(p => {
            const tienePedido = p.data.productos && p.data.productos.length > 0;
            personasHTML += `
                <div class="persona-card ${tienePedido ? 'persona-ocupada' : 'persona-libre'}" onclick="seleccionarPersona('${p.nombre}')">
                    <div class="mesa-numero">${p.nombre}</div>
                    <div class="mesa-estado">${tienePedido ? '📍 Con pedido' : '✅ Libre'}</div>
                    ${tienePedido ? `<div class="mesa-total">${p.data.total.toFixed(2)}€</div>` : ''}
                </div>
            `;
        });
        personasHTML += '</div>';
    }
    
    app.innerHTML = `
        <div class="pantalla mesas">
            <div class="header"><button class="btn-volver" onclick="mostrarInicio()">←</button><h2>${salon.replace(/[🛍️]\s*/, '')}</h2>
                <div style="display:flex;gap:6px;">
                    <button class="btn-agregar" onclick="modoBorrarPersona()" title="Borrar persona" style="font-size:0.9em;">🗑️</button>
                    <button class="btn-agregar" onclick="agregarPersona()" title="Nueva persona">+</button>
                </div>
            </div>
            <p class="subtitulo">Selecciona una persona o crea una nueva</p>
            ${personasHTML}
        </div>
    `;
}

async function agregarPersona() {
    // Buscar el número más alto usado HOY en Supabase
    let maxNum = 0;
    
    // Primero mirar en las personas activas actuales
    for (const [key] of Object.entries(APP.mesasActivas)) {
        if (key.startsWith(APP.salonActual + '_')) {
            const nombrePersona = key.replace(APP.salonActual + '_', '');
            const num = parseInt(nombrePersona);
            if (!isNaN(num) && num > maxNum) maxNum = num;
        }
    }
    
    // Luego consultar Supabase para ver el número más alto del día de hoy
    try {
        if (storage.supabase) {
            const hoy = new Date();
            const hoyInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0, 0);
            const hoyFin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);
            
            const { data, error } = await storage.supabase
                .from('historial_mesas')
                .select('mesa_nombre')
                .eq('salon', APP.salonActual)
                .gte('fecha_cierre', hoyInicio.toISOString())
                .lte('fecha_cierre', hoyFin.toISOString());
            
            if (!error && data) {
                data.forEach(entry => {
                    const num = parseInt(entry.mesa_nombre);
                    if (!isNaN(num) && num > maxNum) maxNum = num;
                });
            }
        }
    } catch (e) {
        console.warn('Error consultando Supabase para nº persona:', e.message);
    }
    
    // Crear siguiente número
    const siguienteNum = maxNum + 1;
    const nombre = String(siguienteNum);
    
    const key = `${APP.salonActual}_${nombre}`;
    APP.mesasActivas[key] = { productos: [], total: 0, turno: 1, salon: APP.salonActual, mesa: nombre };
    storage.guardarMesasActivas(APP.mesasActivas);
    
    // Entrar directamente en esa persona
    seleccionarPersona(nombre);
}

function seleccionarPersona(nombre) {
    APP.mesaActual = nombre;
    APP.mesasJuntadas = [];
    APP.pantallaAnterior = ['mesas'];
    mostrarPedidoMesa();
}

function eliminarPersona(nombre) {
    if (confirm('¿Eliminar a ' + nombre + '?')) {
        delete APP.mesasActivas[`${APP.salonActual}_${nombre}`];
        storage.guardarMesasActivas(APP.mesasActivas);
        mostrarPersonas(APP.salonActual);
    }
}

function mostrarMesas(salon) {
    const config = APP.configSalones[salon];
    const app = document.getElementById('app');
    
    app.innerHTML = `
        <div class="pantalla mesas">
            <div class="header"><button class="btn-volver" onclick="mostrarInicio()">←</button><h2>${salon.replace(/[🌿🏠🍸]\s*/, '')}</h2>
                <div style="display:flex;gap:6px;">
                    <button class="btn-agregar" onclick="modoEditarMesa()" title="Editar mesas" style="font-size:0.9em;">✏️</button>
                    <button class="btn-agregar" onclick="modoBorrarMesa()" title="Borrar mesas" style="font-size:0.9em;">🗑️</button>
                    <button class="btn-agregar" onclick="agregarMesa()" title="Añadir mesa">+</button>
                </div>
            </div>
            <p class="subtitulo">Selecciona una mesa</p>
            <div class="mesas-grid" id="mesasGrid"></div>
        </div>
    `;
    
    const grid = document.getElementById('mesasGrid');
    config.mesas.forEach(mesa => {
        let mesaActiva = null;
        for (const [key, value] of Object.entries(APP.mesasActivas)) {
            const mesasKey = key.replace(salon + '_', '');
            const partes = mesasKey.split('+');
            if (partes.includes(mesa) && value.productos && value.productos.length > 0) {
                mesaActiva = value;
                break;
            }
        }
        if (!mesaActiva) mesaActiva = APP.mesasActivas[`${salon}_${mesa}`];
        
        const tienePedido = mesaActiva && mesaActiva.productos && mesaActiva.productos.length > 0;
        
        const card = document.createElement('div');
        card.className = `mesa-card ${tienePedido ? 'mesa-ocupada' : 'mesa-libre'}`;
        card.innerHTML = `
            <div class="mesa-numero">${mesa}</div>
            <div class="mesa-estado">${tienePedido ? '📍 Ocupada' : '✅ Libre'}</div>
            ${tienePedido ? `<div class="mesa-total">${mesaActiva.total.toFixed(2)}€</div>` : ''}
            ${tienePedido && mesaActiva.turno > 1 ? `<div class="mesa-turno">T${mesaActiva.turno}</div>` : ''}
        `;
        card.onclick = () => seleccionarMesa(mesa);
        grid.appendChild(card);
    });
}

function renombrarMesa(mesaVieja) {
    const nuevo = prompt('Nuevo nombre:', mesaVieja);
    if (nuevo && nuevo.trim() && nuevo.trim() !== mesaVieja) {
        const mesas = APP.configSalones[APP.salonActual].mesas;
        const idx = mesas.indexOf(mesaVieja);
        if (idx !== -1) { mesas[idx] = nuevo.trim(); storage.guardarConfigSalones(APP.configSalones); mostrarMesas(APP.salonActual); }
    }
}

function eliminarMesa(mesa) {
    if (confirm('¿Eliminar mesa ' + mesa + '?')) {
        const mesas = APP.configSalones[APP.salonActual].mesas;
        const idx = mesas.indexOf(mesa);
        if (idx !== -1) { mesas.splice(idx, 1); storage.guardarConfigSalones(APP.configSalones); mostrarMesas(APP.salonActual); }
    }
}

function seleccionarMesa(mesa) {
    APP.mesaActual = mesa;
    APP.mesasJuntadas = [];
    const salon = APP.salonActual;
    // Buscar si ya está juntada con otras
    for (const [key, value] of Object.entries(APP.mesasActivas)) {
        if (key.startsWith(salon + '_') && key.includes('+') && value.productos && value.productos.length > 0) {
            const partes = key.replace(salon + '_', '').split('+');
            if (partes.includes(mesa)) {
                APP.mesaActual = partes[0];
                APP.mesasJuntadas = partes.slice(1);
                break;
            }
        }
    }
    APP.pantallaAnterior = ['mesas'];
    mostrarPedidoMesa();
}

function volver() {
    if (APP.pantallaAnterior.length === 0) { mostrarInicio(); return; }
    const pantalla = APP.pantallaAnterior.pop();
    if (pantalla === 'inicio') mostrarInicio();
    else if (pantalla === 'mesas') {
        const config = APP.configSalones[APP.salonActual];
        if (config && config.tipo === 'personas') mostrarPersonas(APP.salonActual);
        else mostrarMesas(APP.salonActual);
    }
    else if (pantalla === 'pedido') mostrarPedidoMesa();
    else if (pantalla === 'categorias') mostrarCategorias();
    else if (pantalla === 'subcategorias') mostrarSubcategorias(APP.categoriaActual);
}

function irAInicio() { APP.pantallaAnterior = []; mostrarInicio(); }

// ============================================
// GESTIÓN DE PEDIDOS
// ============================================

function getMesaKey() {
    const salon = APP.salonActual;
    if (APP.mesasJuntadas.length > 0) return `${salon}_${APP.mesaActual}+${APP.mesasJuntadas.join('+')}`;
    return `${salon}_${APP.mesaActual}`;
}

function getMesaData() {
    const key = getMesaKey();
    if (!APP.mesasActivas[key]) {
        APP.mesasActivas[key] = {
            productos: [], total: 0, turno: 1, salon: APP.salonActual,
            mesa: APP.mesaActual + (APP.mesasJuntadas.length > 0 ? '+' + APP.mesasJuntadas.join('+') : '')
        };
    }
    return APP.mesasActivas[key];
}

function guardarMesaData(data) {
    const key = getMesaKey();
    APP.mesasActivas[key] = data;
    storage.guardarMesasActivas(APP.mesasActivas);
}

function mostrarPedidoMesa() {
    const mesaData = getMesaData();
    APP.pantallaAnterior = ['mesas'];
    const app = document.getElementById('app');
    const mesaNombre = APP.mesaActual + (APP.mesasJuntadas.length > 0 ? '+' + APP.mesasJuntadas.join('+') : '');
    
    let productosHTML = '';
    mesaData.productos.forEach((prod, index) => {
        productosHTML += `
            <div class="producto-item">
                <div class="producto-info"><span class="producto-nombre">${prod.nombre}</span>${prod.descripcion ? `<span class="producto-desc">${prod.descripcion}</span>` : ''}</div>
                <div class="producto-cantidad"><button onclick="ajustarCantidad(${index}, -1)">−</button><span>${prod.cantidad}</span><button onclick="ajustarCantidad(${index}, 1)">+</button></div>
                <div class="producto-precio">${(prod.precio * prod.cantidad).toFixed(2)}€</div>
                <button class="btn-eliminar" onclick="eliminarProducto(${index})">🗑️</button>
            </div>
        `;
    });
    
    const config = APP.configSalones[APP.salonActual];
    const esParaLlevar = config && config.tipo === 'personas';
    const titulo = esParaLlevar ? `${APP.salonActual.replace(/[🛍️]\s*/, '')} - ${mesaNombre}` : `${APP.salonActual.replace(/[🌿🏠🍸]\s*/, '')} - M${mesaNombre}`;
    
    let juntadaHTML = '';
    if (APP.mesasJuntadas.length > 0) {
        juntadaHTML = `<div class="mesa-juntada-info">🔗 Mesas juntadas: <span class="mesa-juntada-tag">${APP.mesaActual}</span> ${APP.mesasJuntadas.map(m => `<span class="mesa-juntada-tag">${m}</span>`).join(' + ')}</div>`;
    }
    
    app.innerHTML = `
        <div class="pantalla pedido">
            <div class="header"><button class="btn-volver" onclick="volver()">←</button><h2>${titulo}</h2><button class="btn-home" onclick="irAInicio()">🏠</button></div>
            ${juntadaHTML}
            ${mesaData.turno > 1 ? `<div class="turno-badge">🔄 Turno ${mesaData.turno}</div>` : ''}
            <div class="total-mesa"><span>Total:</span><span class="total-cifra">${mesaData.total.toFixed(2)}€</span></div>
            <div class="productos-lista">${productosHTML || '<p class="vacio">No hay productos aún</p>'}</div>
            <div class="botones-accion">
                <button class="btn-primario btn-grande" onclick="mostrarCategorias()">➕ Añadir producto</button>
                ${!esParaLlevar ? `<button class="btn-secundario" onclick="mostrarJuntarMesa()">🔗 Juntar mesas</button>` : ''}
                ${APP.mesasJuntadas.length > 0 ? `<button class="btn-secundario" onclick="mostrarDesjuntarMesas()">💔 Desjuntar mesas</button>` : ''}
                <button class="btn-pagar" onclick="mostrarPago()" ${mesaData.productos.length === 0 ? 'disabled' : ''}>💳 Pagar</button>
            </div>
        </div>
    `;
}

function mostrarCategorias() {
    APP.pantallaAnterior = ['pedido'];
    APP.quedarseEnCategoria = true;
    const app = document.getElementById('app');
    let categoriasHTML = '';
    
    for (const [categoria, data] of Object.entries(CARTA)) {
        categoriasHTML += `<div class="categoria-card" onclick="mostrarSubcategorias('${categoria.replace(/'/g, "\\'")}')"><div class="categoria-icono">${data.icono}</div><div class="categoria-nombre">${categoria.replace(data.icono + ' ', '')}</div></div>`;
    }
    categoriasHTML += `<div class="categoria-card categoria-libre" onclick="mostrarBocadilloLibre()"><div class="categoria-icono">🥪</div><div class="categoria-nombre">Bocadillo Libre</div></div>`;
    
    app.innerHTML = `<div class="pantalla categorias"><div class="header"><button class="btn-volver" onclick="volverA('pedido')">←</button><h2>Categorías</h2><button class="btn-home" onclick="irAInicio()">🏠</button></div><div class="categorias-grid">${categoriasHTML}</div></div>`;
}

function volverA(destino) { APP.pantallaAnterior = ['mesas']; mostrarPedidoMesa(); }

function mostrarSubcategorias(categoriaKey) {
    APP.categoriaActual = categoriaKey;
    APP.pantallaAnterior = ['categorias'];
    const data = CARTA[categoriaKey];
    const app = document.getElementById('app');
    const esBebidas = categoriaKey === "🥤 Bebidas";
    let subHTML = '';
    
    // Si es Patatas al Montón, ir directamente a la pantalla de personalización
    if (categoriaKey === "🥔 Patatas al Montón") {
        const producto = data.subcategorias["Patatas al Montón"][0];
        mostrarExtrasPersonalizables(producto);
        return;
    }
    
    for (const [subNombre, productos] of Object.entries(data.subcategorias)) {
        if (productos.length === 0) continue;
        const subId = subNombre.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
        
        if (esBebidas) {
            subHTML += `<div class="subcategoria-seccion"><h3 onclick="toggleSubcategoria('${subId}')" id="h3_${subId}">${subNombre} <span style="font-size:0.8em;color:var(--gris)">(${productos.length})</span></h3><div class="productos-subcategoria" id="sub_${subId}">${productos.map(prod => `<div class="producto-card" onclick='seleccionarProducto(${JSON.stringify(categoriaKey)},${JSON.stringify(subNombre)},${JSON.stringify(prod.nombre)})'><span>${prod.nombre}</span><span class="precio-tag">${prod.precio ? prod.precio.toFixed(2)+'€' : 'desde '+(prod.preciosVariante?.[0]||'?')+'€'}</span></div>`).join('')}</div></div>`;
        } else if (categoriaKey === "🥖 Montaditos y Tostadas") {
            subHTML = productos.map(prod => {
                const precioMostrar = prod.tipo === 'fijo' ? prod.precio.toFixed(2) : Math.min(...Object.values(prod.precios)).toFixed(2);
                return `<div class="producto-card" onclick='seleccionarProductoMontadito(${JSON.stringify(prod)})'><span>${prod.nombre}</span><span class="precio-tag">${prod.tipo==='fijo'?precioMostrar+'€':'desde '+precioMostrar+'€'}</span></div>`;
            }).join('');
        } else {
            subHTML += `<div class="subcategoria-seccion"><h3 style="cursor:default;background:var(--vino-oscuro);border-radius:6px;padding:6px 10px;margin:12px 0 8px 0;">${subNombre}</h3><div>${productos.map(prod => `<div class="producto-card" onclick='seleccionarProducto(${JSON.stringify(categoriaKey)},${JSON.stringify(subNombre)},${JSON.stringify(prod.nombre)})'><span>${prod.nombre}</span><span class="precio-tag">${prod.precio?prod.precio.toFixed(2)+'€':'desde '+(prod.precioBase||prod.preciosVariante?.[0]||'?')+'€'}</span></div>`).join('')}</div></div>`;
        }
    }
    
    if (categoriaKey === "📝 Categoría Libre") {
        subHTML += `<button class="btn-secundario" style="margin:10px;width:auto" onclick="gestionarCategoriaLibre()">✏️ Gestionar productos libres</button>`;
    }
    
    app.innerHTML = `<div class="pantalla subcategorias"><div class="header"><button class="btn-volver" onclick="mostrarCategorias()">←</button><h2>${categoriaKey}</h2><button class="btn-home" onclick="irAInicio()">🏠</button></div><div class="subcategorias-lista">${subHTML}</div></div>`;
}

function toggleSubcategoria(subId) {
    const sub = document.getElementById('sub_' + subId);
    const h3 = document.getElementById('h3_' + subId);
    if (sub) { sub.classList.toggle('visible'); if (h3) h3.classList.toggle('abierto'); }
}

// ============================================
// MONTADITOS
// ============================================

function seleccionarProductoMontadito(prod) {
    if (prod.tipo === 'fijo') {
        agregarProducto({ nombre: prod.nombre, precio: prod.precio, cantidad: 1, descripcion: prod.formatoFijo || '' });
        if (APP.quedarseEnCategoria) mostrarSubcategorias("🥖 Montaditos y Tostadas");
        else mostrarPedidoMesa();
        return;
    }
    
    APP.pantallaAnterior = ['subcategorias'];
    const app = document.getElementById('app');
    const formatos = prod.formatos;
    
    let formatosHTML = formatos.map(f => {
        const precio = prod.precios[f];
        const extraSG = (f === "Bocadillo" || f === "Medio Bocadillo") ? 1.5 : 1;
        return `<div class="formato-item" onclick='seleccionarFormatoMontadito("${prod.nombre}","${f}",${precio},${extraSG})'><span>${f}</span><span class="precio-tag">${precio.toFixed(2)}€</span></div>`;
    }).join('');
    
    app.innerHTML = `<div class="pantalla formatos"><div class="header"><button class="btn-volver" onclick="volver()">←</button><h2>${prod.nombre}</h2></div><p class="subtitulo">Selecciona formato:</p><div class="subcategorias-lista"><div class="formatos-lista">${formatosHTML}</div></div></div>`;
}

function seleccionarFormatoMontadito(nombre, formato, precio, extraSG) {
    APP.pantallaAnterior = ['subcategorias'];
    const app = document.getElementById('app');
    app.innerHTML = `<div class="pantalla variantes"><div class="header"><button class="btn-volver" onclick="volver()">←</button><h2>${nombre}</h2></div><div class="extras-form"><p class="subtitulo">Formato: ${formato} - ${precio.toFixed(2)}€</p><label class="extra-item"><input type="checkbox" id="sinGluten" onchange="actualizarPrecioSinGluten(${precio},${extraSG})"><span>Pan sin gluten (+${extraSG.toFixed(2)}€)</span></label><div class="precio-total-extras">Precio: <strong id="precioFinalGluten">${precio.toFixed(2)}€</strong></div><button class="btn-primario" onclick='confirmarSinGluten("${nombre}",${precio},${extraSG},"${formato}")'>Añadir</button></div></div>`;
}

function actualizarPrecioSinGluten(precioBase, extra) {
    document.getElementById('precioFinalGluten').textContent = (document.getElementById('sinGluten').checked ? precioBase + extra : precioBase).toFixed(2) + '€';
}

function confirmarSinGluten(nombre, precioBase, extra, formato) {
    const sinGluten = document.getElementById('sinGluten').checked;
    agregarProducto({ nombre, precio: sinGluten ? precioBase + extra : precioBase, cantidad: 1, descripcion: formato + (sinGluten ? ' - Sin gluten' : '') });
    APP.pantallaAnterior = ['categorias'];
    if (APP.quedarseEnCategoria) mostrarSubcategorias("🥖 Montaditos y Tostadas");
    else mostrarPedidoMesa();
}

// ============================================
// SELECCIÓN DE PRODUCTOS
// ============================================

function seleccionarProducto(categoriaKey, subNombre, productoNombre) {
    const data = CARTA[categoriaKey];
    const producto = data.subcategorias[subNombre].find(p => p.nombre === productoNombre);
    if (!producto) return;
    
    if (producto.esMenu) { agregarMenu(producto); return; }
    if (producto.esPersonalizable) { mostrarExtrasPersonalizables(producto); return; }
    if (producto.extras && producto.extras.length > 0 && !producto.esPersonalizable) { mostrarExtrasSimples(producto); return; }
    if (producto.variantes && producto.variantes.length > 1) { mostrarVariantesProducto(producto); return; }
    
    agregarProducto({ nombre: producto.nombre, precio: producto.precio || producto.preciosVariante[0], cantidad: 1, descripcion: producto.variantes ? producto.variantes[0] : '' });
    if (APP.quedarseEnCategoria) mostrarSubcategorias(categoriaKey);
    else mostrarPedidoMesa();
}

function mostrarVariantesProducto(producto) {
    APP.pantallaAnterior = ['subcategorias'];
    const app = document.getElementById('app');
    app.innerHTML = `<div class="pantalla variantes"><div class="header"><button class="btn-volver" onclick="volver()">←</button><h2>${producto.nombre}</h2></div><p class="subtitulo">Selecciona formato:</p><div class="subcategorias-lista">${producto.variantes.map((v,i) => `<div class="producto-card" onclick='agregarProducto({nombre:"${producto.nombre}",precio:${producto.preciosVariante[i]},cantidad:1,descripcion:"${v}"});volverAPedidoOCategoria();'><span>${v}</span><span class="precio-tag">${producto.preciosVariante[i].toFixed(2)}€</span></div>`).join('')}</div></div>`;
}

function volverAPedidoOCategoria() {
    if (APP.quedarseEnCategoria) { APP.pantallaAnterior = ['categorias']; mostrarSubcategorias(APP.categoriaActual); }
    else { APP.pantallaAnterior = ['mesas']; mostrarPedidoMesa(); }
}

function mostrarExtrasSimples(producto) {
    APP.pantallaAnterior = ['subcategorias'];
    const app = document.getElementById('app');
    app.innerHTML = `<div class="pantalla extras"><div class="header"><button class="btn-volver" onclick="volver()">←</button><h2>${producto.nombre}</h2></div><div class="extras-form"><p class="subtitulo">Precio base: ${producto.precio.toFixed(2)}€</p><div class="extras-lista">${producto.extras.map(extra => `<label class="extra-item"><input type="checkbox" value="${extra.nombre}" data-precio="${extra.precio}"><span>${extra.nombre}</span><span class="precio-tag">+${extra.precio.toFixed(2)}€</span></label>`).join('')}</div><button class="btn-primario" onclick='confirmarExtrasSimples("${producto.nombre}",${producto.precio})'>Añadir</button></div></div>`;
}

function confirmarExtrasSimples(nombreProducto, precioBase) {
    const extrasSel = []; let precioExtra = 0;
    document.querySelectorAll('.extra-item input:checked').forEach(input => { extrasSel.push(input.value); precioExtra += parseFloat(input.dataset.precio); });
    agregarProducto({ nombre: nombreProducto, precio: precioBase + precioExtra, cantidad: 1, descripcion: extrasSel.length > 0 ? 'Con: ' + extrasSel.join(', ') : '' });
    if (APP.quedarseEnCategoria) { APP.pantallaAnterior = ['categorias']; mostrarSubcategorias(APP.categoriaActual); }
    else { APP.pantallaAnterior = ['mesas']; mostrarPedidoMesa(); }
}

// ============================================
// PATATAS AL MONTÓN
// ============================================

function mostrarExtrasPersonalizables(producto) {
    APP.pantallaAnterior = ['categorias'];
    APP.numPersonasPatatas = 1;
    const app = document.getElementById('app');
    
    let extrasHTML = producto.extras.map((extra, idx) => `
        <div class="extra-personalizada">
            <h4>${extra.nombre} (+${extra.precio.toFixed(2)}€ / ${extra.tipo})</h4>
            <div class="extra-opciones" style="display:flex;align-items:center;gap:10px;">
                <span style="color:var(--gris);font-size:0.85em;">Cantidad:</span>
                <button onclick="event.preventDefault(); cambiarExtra(${idx}, -1)" style="width:30px;height:30px;border-radius:50%;background:var(--vino);color:var(--blanco);border:none;font-size:1.1em;cursor:pointer;display:flex;align-items:center;justify-content:center;">−</button>
                <span id="extraCantidad_${idx}" style="min-width:24px;text-align:center;font-weight:bold;font-size:1.1em;">0</span>
                <button onclick="event.preventDefault(); cambiarExtra(${idx}, 1)" style="width:30px;height:30px;border-radius:50%;background:var(--vino);color:var(--blanco);border:none;font-size:1.1em;cursor:pointer;display:flex;align-items:center;justify-content:center;">+</button>
            </div>
        </div>
    `).join('');
    
    app.innerHTML = `<div class="pantalla extras"><div class="header"><button class="btn-volver" onclick="volver()">←</button><h2>${producto.nombre}</h2></div><div class="extras-form"><label>Nº de personas:</label><div class="contador-personas"><button onclick="cambiarPersonasPatatas(-1)">−</button><span id="numPersonasPatatas">1</span><button onclick="cambiarPersonasPatatas(1)">+</button></div><div class="extras-lista">${extrasHTML}</div><div class="precio-total-extras">Precio total: <strong id="precioTotalExtras">${producto.precioBase.toFixed(2)}€</strong></div><button class="btn-primario" onclick='confirmarExtrasPersonalizables(${JSON.stringify(producto)})'>Añadir</button></div></div>`;
}

function cambiarPersonasPatatas(delta) {
    APP.numPersonasPatatas = Math.max(1, APP.numPersonasPatatas + delta);
    document.getElementById('numPersonasPatatas').textContent = APP.numPersonasPatatas;
    const producto = CARTA["🥔 Patatas al Montón"].subcategorias["Patatas al Montón"][0];
    producto.extras.forEach((extra, idx) => {
        const radio = document.querySelector(`input[name="extra_${idx}"]:checked`);
        if (radio && radio.value === 'individual') construirPersonasCheckboxes(idx);
    });
    actualizarPrecioPatatas();
}

function toggleOpcionExtra(idx, opcion) {
    const div = document.getElementById('personasExtra_' + idx);
    if (opcion === 'individual') { div.style.display = 'block'; construirPersonasCheckboxes(idx); }
    else { div.style.display = 'none'; div.innerHTML = ''; }
    actualizarPrecioPatatas();
}

function activarExtra(idx) {
    // Si el usuario empieza a escribir en "Extra", marcar automáticamente "Ninguno"
    const radioNinguno = document.querySelector(`input[name="extra_${idx}"][value="ninguno"]`);
    if (radioNinguno && !radioNinguno.checked) {
        radioNinguno.checked = true;
        toggleOpcionExtra(idx, 'ninguno');
    }
}

function cambiarExtra(idx, delta) {
    const span = document.getElementById('extraCantidad_' + idx);
    let cantidad = parseInt(span.textContent) || 0;
    cantidad = Math.max(0, cantidad + delta);
    span.textContent = cantidad;
    actualizarPrecioPatatas();
}

function construirPersonasCheckboxes(idx) {
    const div = document.getElementById('personasExtra_' + idx);
    let html = '';
    for (let i = 1; i <= APP.numPersonasPatatas; i++) {
        html += `<div class="persona-extra-item"><span>Persona ${i}:</span><input type="checkbox" class="persona-check-${idx}" data-persona="${i}" checked onchange="actualizarPrecioPatatas()"><label>Añadir</label></div>`;
    }
    div.innerHTML = html;
}

function actualizarPrecioPatatas() {
    const producto = CARTA["🥔 Patatas al Montón"].subcategorias["Patatas al Montón"][0];
    let precioTotal = producto.precioBase * APP.numPersonasPatatas;
    
    producto.extras.forEach((extra, idx) => {
        const cantidadEl = document.getElementById('extraCantidad_' + idx);
        const cantidadExtra = parseInt(cantidadEl?.textContent) || 0;
        precioTotal += extra.precio * cantidadExtra;
    });
    
    const precioEl = document.getElementById('precioTotalExtras');
    if (precioEl) precioEl.textContent = precioTotal.toFixed(2) + '€';
}

function confirmarExtrasPersonalizables(producto) {
    let precioTotal = producto.precioBase * APP.numPersonasPatatas;
    const descripciones = [`${APP.numPersonasPatatas} pers.`];
    
    producto.extras.forEach((extra, idx) => {
        const cantidadEl = document.getElementById('extraCantidad_' + idx);
        const cantidadExtra = parseInt(cantidadEl?.textContent) || 0;
        if (cantidadExtra > 0) {
            precioTotal += extra.precio * cantidadExtra;
            descripciones.push(`${extra.nombre}: ${cantidadExtra}`);
        }
    });
    
    agregarProducto({ nombre: 'Patatas al Montón', precio: precioTotal, cantidad: 1, descripcion: descripciones.join(' | ') });
    if (APP.quedarseEnCategoria) { APP.pantallaAnterior = ['categorias']; mostrarSubcategorias("🥔 Patatas al Montón"); }
    else { APP.pantallaAnterior = ['mesas']; mostrarPedidoMesa(); }
}

// ============================================
// MENÚS
// ============================================

function agregarMenu(productoMenu) {
    APP.pantallaAnterior = ['subcategorias'];
    const app = document.getElementById('app');
    app.innerHTML = `<div class="pantalla menu-config"><div class="header"><button class="btn-volver" onclick="volver()">←</button><h2>${productoMenu.nombre}</h2></div><div class="extras-form"><p class="subtitulo">${productoMenu.descripcion} - ${productoMenu.precio.toFixed(2)}€/pers.</p><label>Nº de personas con menú:</label><input type="number" id="numPersonasMenu" value="1" min="1" max="50" onchange="actualizarPrecioMenu(${productoMenu.precio})"><div class="precio-total-extras">Precio total: <strong id="precioTotalMenu">${productoMenu.precio.toFixed(2)}€</strong></div><p style="color:var(--gris);font-size:0.8em;margin-top:10px">Incluye: ${productoMenu.incluye.join(', ')}</p><button class="btn-primario" onclick='confirmarMenu("${productoMenu.nombre}",${productoMenu.precio},${JSON.stringify(productoMenu.incluye)},"${productoMenu.tipoMenu}")'>Añadir</button></div></div>`;
}

function actualizarPrecioMenu(precioU) { document.getElementById('precioTotalMenu').textContent = (precioU * (parseInt(document.getElementById('numPersonasMenu').value) || 1)).toFixed(2) + '€'; }

function confirmarMenu(nombre, precioU, incluye, tipo) {
    const num = parseInt(document.getElementById('numPersonasMenu').value) || 1;
    agregarProducto({ nombre, precio: precioU * num, cantidad: 1, descripcion: `${num} pers. - Incluye: ${incluye.join(', ')} (${tipo})` });
    if (APP.quedarseEnCategoria) { APP.pantallaAnterior = ['categorias']; mostrarSubcategorias("📋 Menús"); }
    else { APP.pantallaAnterior = ['mesas']; mostrarPedidoMesa(); }
}

// ============================================
// BOCADILLO LIBRE
// ============================================

function mostrarBocadilloLibre() {
    APP.pantallaAnterior = ['categorias'];
    const app = document.getElementById('app');
    const formatos = Object.keys(PRECIOS_PAN_BOCADILLO);
    
    app.innerHTML = `<div class="pantalla bocadillo-libre"><div class="header"><button class="btn-volver" onclick="mostrarCategorias()">←</button><h2>Bocadillo Libre</h2></div><div class="extras-form"><h3>1. Elige formato:</h3><select id="formatoBocadillo" onchange="actualizarPrecioBocadilloLibre()" style="width:100%;padding:12px;background:var(--negro-card);border:1px solid var(--vino);color:var(--blanco);border-radius:8px;font-size:1em;">${formatos.map(f => `<option value="${f}">${f}</option>`).join('')}</select><label class="extra-item" style="margin-top:10px"><input type="checkbox" id="sinGlutenBocadillo" onchange="actualizarPrecioBocadilloLibre()"><span>Pan sin gluten</span></label><h3 style="margin-top:15px">2. Elige ingredientes:</h3><div class="extras-lista">${INGREDIENTES_LIBRES.map(ing => `<label class="extra-item"><input type="checkbox" value="${ing.nombre}" data-precio="${ing.precio}" onchange="actualizarPrecioBocadilloLibre()"><span>${ing.nombre}</span><span class="precio-tag">+${ing.precio.toFixed(2)}€</span></label>`).join('')}</div><div class="precio-total-extras">Precio: <strong id="precioBocadilloLibre">0.00€</strong></div><button class="btn-primario" onclick="confirmarBocadilloLibre()">Añadir</button><button class="btn-secundario" style="margin-top:8px" onclick="gestionarIngredientesLibres()">✏️ Gestionar ingredientes</button></div></div>`;
    actualizarPrecioBocadilloLibre();
}

function actualizarPrecioBocadilloLibre() {
    const formato = document.getElementById('formatoBocadillo')?.value || 'Montadito';
    const sinGluten = document.getElementById('sinGlutenBocadillo')?.checked || false;
    const preciosPan = PRECIOS_PAN_BOCADILLO[formato];
    let precioTotal = sinGluten ? preciosPan.sinGluten : preciosPan.normal;
    document.querySelectorAll('.extra-item input[type="checkbox"]:checked').forEach(input => { if (input.dataset.precio) precioTotal += parseFloat(input.dataset.precio); });
    const precioEl = document.getElementById('precioBocadilloLibre');
    if (precioEl) precioEl.textContent = precioTotal.toFixed(2) + '€';
}

function confirmarBocadilloLibre() {
    const formato = document.getElementById('formatoBocadillo').value;
    const sinGluten = document.getElementById('sinGlutenBocadillo').checked;
    const preciosPan = PRECIOS_PAN_BOCADILLO[formato];
    let precio = sinGluten ? preciosPan.sinGluten : preciosPan.normal;
    const ingredientes = [];
    document.querySelectorAll('.extra-item input[type="checkbox"]:checked').forEach(input => { if (input.dataset.precio) { ingredientes.push(input.value); precio += parseFloat(input.dataset.precio); } });
    if (ingredientes.length === 0) { alert('Selecciona al menos un ingrediente'); return; }
    agregarProducto({ nombre: 'Bocadillo Libre', precio, cantidad: 1, descripcion: `${formato}${sinGluten?' SG':''}: ${ingredientes.join(', ')}` });
    if (APP.quedarseEnCategoria) { APP.pantallaAnterior = ['categorias']; mostrarCategorias(); }
    else { APP.pantallaAnterior = ['mesas']; mostrarPedidoMesa(); }
}

// ============================================
// GESTIÓN DE INGREDIENTES LIBRES
// ============================================

function gestionarIngredientesLibres() {
    const app = document.getElementById('app');
    let listaHTML = INGREDIENTES_LIBRES.map((ing, i) => `
        <div class="producto-item">
            <div class="producto-info"><span class="producto-nombre">${ing.nombre}</span><span class="producto-desc">${ing.precio.toFixed(2)}€</span></div>
            <button class="btn-eliminar" onclick="eliminarIngredienteLibre(${i})">🗑️</button>
        </div>
    `).join('');
    
    app.innerHTML = `<div class="pantalla"><div class="header"><button class="btn-volver" onclick="mostrarBocadilloLibre()">←</button><h2>Gestionar Ingredientes</h2></div><div class="extras-form"><h3>Añadir ingrediente:</h3><input type="text" id="nombreIngLibre" placeholder="Nombre" style="width:100%;padding:10px;background:var(--negro-card);border:1px solid var(--vino);color:var(--blanco);border-radius:8px;margin:5px 0"><input type="number" id="precioIngLibre" placeholder="Precio (€)" step="0.01" min="0" style="width:100%;padding:10px;background:var(--negro-card);border:1px solid var(--vino);color:var(--blanco);border-radius:8px;margin:5px 0"><button class="btn-primario" onclick="agregarIngredienteLibre()">Añadir</button><h3 style="margin-top:15px">Ingredientes actuales:</h3><div class="productos-lista">${listaHTML || '<p class="vacio">Sin ingredientes</p>'}</div></div></div>`;
}

async function agregarIngredienteLibre() {
    const nombre = document.getElementById('nombreIngLibre').value.trim();
    const precio = parseFloat(document.getElementById('precioIngLibre').value);
    if (!nombre || isNaN(precio) || precio < 0) { alert('Introduce nombre y precio válidos'); return; }
    INGREDIENTES_LIBRES.push({ nombre, precio });
    storage.guardarIngredientesLibres(INGREDIENTES_LIBRES);
    gestionarIngredientesLibres();
}

async function eliminarIngredienteLibre(index) {
    INGREDIENTES_LIBRES.splice(index, 1);
    storage.guardarIngredientesLibres(INGREDIENTES_LIBRES);
    gestionarIngredientesLibres();
}

// ============================================
// AGREGAR/ELIMINAR PRODUCTOS
// ============================================

function agregarProducto(producto) {
    const mesaData = getMesaData();
    const existente = mesaData.productos.find(p => p.nombre === producto.nombre && p.descripcion === producto.descripcion);
    if (existente) existente.cantidad += producto.cantidad;
    else mesaData.productos.push(producto);
    mesaData.total = mesaData.productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
    guardarMesaData(mesaData);
}

function ajustarCantidad(index, cambio) {
    const mesaData = getMesaData();
    mesaData.productos[index].cantidad += cambio;
    if (mesaData.productos[index].cantidad <= 0) mesaData.productos.splice(index, 1);
    mesaData.total = mesaData.productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
    guardarMesaData(mesaData);
    mostrarPedidoMesa();
}

function eliminarProducto(index) {
    const mesaData = getMesaData();
    mesaData.productos.splice(index, 1);
    mesaData.total = mesaData.productos.reduce((sum, p) => sum + (p.precio * p.cantidad), 0);
    guardarMesaData(mesaData);
    mostrarPedidoMesa();
}

// ============================================
// JUNTAR MESAS (MÚLTIPLES)
// ============================================

function mostrarJuntarMesa() {
    const config = APP.configSalones[APP.salonActual];
    const mesasJuntadas = [APP.mesaActual, ...APP.mesasJuntadas];
    const mesasDisponibles = config.mesas.filter(m => !mesasJuntadas.includes(m));
    
    if (mesasDisponibles.length === 0) { alert('No hay más mesas disponibles para juntar'); return; }
    
    const app = document.getElementById('app');
    
    let juntadasHTML = '';
    if (mesasJuntadas.length > 0) {
        juntadasHTML = `<div class="mesas-juntadas-lista">${mesasJuntadas.map(m => `<span class="mesa-juntada-chip">${m}</span>`).join(' + ')}</div>`;
    }
    
    app.innerHTML = `<div class="pantalla juntar"><div class="header"><button class="btn-volver" onclick="mostrarPedidoMesa()">←</button><h2>Juntar mesas</h2></div><div class="juntar-form">${juntadasHTML}<label>Añadir mesa:</label><select id="mesaJuntar">${mesasDisponibles.map(m => `<option value="${m}">Mesa ${m}</option>`).join('')}</select><button class="btn-primario" onclick="confirmarJuntar()">🔗 Añadir y juntar</button></div></div>`;
}

function confirmarJuntar() {
    const mesaJuntar = document.getElementById('mesaJuntar').value;
    const mesaKeyVieja = getMesaKey();
    const mesaDataVieja = APP.mesasActivas[mesaKeyVieja] || getMesaData();
    
    APP.mesasJuntadas.push(mesaJuntar);
    const mesaKeyNueva = getMesaKey();
    
    // Fusionar datos de la nueva mesa
    const mesaKeyJuntar = `${APP.salonActual}_${mesaJuntar}`;
    if (APP.mesasActivas[mesaKeyJuntar]?.productos?.length > 0) {
        mesaDataVieja.productos = mesaDataVieja.productos.concat(APP.mesasActivas[mesaKeyJuntar].productos);
        mesaDataVieja.total = mesaDataVieja.productos.reduce((s, p) => s + p.precio * p.cantidad, 0);
        delete APP.mesasActivas[mesaKeyJuntar];
    }
    
    APP.mesasActivas[mesaKeyNueva] = mesaDataVieja;
    if (mesaKeyNueva !== mesaKeyVieja) delete APP.mesasActivas[mesaKeyVieja];
    storage.guardarMesasActivas(APP.mesasActivas);
    mostrarPedidoMesa();
}

function mostrarDesjuntarMesas() {
    const app = document.getElementById('app');
    const todasLasMesas = [APP.mesaActual, ...APP.mesasJuntadas];
    
    let mesasHTML = todasLasMesas.map(m => `
        <label class="extra-item" style="justify-content:flex-start">
            <input type="checkbox" value="${m}" checked onchange="actualizarSeleccionDesjuntar()">
            <span>Mesa ${m}</span>
        </label>
    `).join('');
    
    app.innerHTML = `<div class="pantalla juntar"><div class="header"><button class="btn-volver" onclick="mostrarPedidoMesa()">←</button><h2>Desjuntar mesas</h2></div><div class="juntar-form"><p>Selecciona las mesas que quieres <strong>separar</strong>:</p><div class="extras-lista">${mesasHTML}</div><p style="color:var(--rojo);font-size:0.8em;margin:10px 0">⚠️ Las mesas separadas perderán sus productos</p><button class="btn-primario" onclick="confirmarDesjuntar()">💔 Desjuntar seleccionadas</button><button class="btn-secundario" onclick="desjuntarTodas()">💔 Separar todas</button></div></div>`;
}

function actualizarSeleccionDesjuntar() {
    // No hace falta hacer nada, solo para futuro
}

function confirmarDesjuntar() {
    const checks = document.querySelectorAll('.extras-lista input:checked');
    const mesasASeparar = [];
    checks.forEach(c => mesasASeparar.push(c.value));
    
    if (mesasASeparar.length === 0) { alert('Selecciona al menos una mesa para separar'); return; }
    if (mesasASeparar.length === APP.mesasJuntadas.length + 1) {
        // Si selecciona todas, separar todas
        desjuntarTodas();
        return;
    }
    
    const mesaData = getMesaData();
    const todasLasMesas = [APP.mesaActual, ...APP.mesasJuntadas];
    const mesasQueQuedan = todasLasMesas.filter(m => !mesasASeparar.includes(m));
    
    if (mesasQueQuedan.length === 0) { desjuntarTodas(); return; }
    
    // La primera que queda es la nueva principal
    APP.mesaActual = mesasQueQuedan[0];
    APP.mesasJuntadas = mesasQueQuedan.slice(1);
    
    const mesaKeyNueva = getMesaKey();
    APP.mesasActivas[mesaKeyNueva] = mesaData;
    storage.guardarMesasActivas(APP.mesasActivas);
    mostrarPedidoMesa();
}

function desjuntarTodas() {
    const mesaKeyVieja = getMesaKey();
    delete APP.mesasActivas[mesaKeyVieja];
    APP.mesasJuntadas = [];
    storage.guardarMesasActivas(APP.mesasActivas);
    mostrarPedidoMesa();
}

function agregarMesa() {
    const nombre = prompt('Nombre de la nueva mesa:');
    if (nombre && nombre.trim()) {
        APP.configSalones[APP.salonActual].mesas.push(nombre.trim());
        storage.guardarConfigSalones(APP.configSalones);
        mostrarMesas(APP.salonActual);
    }
}

// ============================================
// CATEGORÍA LIBRE
// ============================================

function gestionarCategoriaLibre() {
    const productos = CARTA["📝 Categoría Libre"].subcategorias["Productos libres"];
    let listaHTML = productos.map((p, i) => `
        <div class="producto-item">
            <div class="producto-info"><span class="producto-nombre">${p.nombre}</span><span class="producto-desc">${p.precio.toFixed(2)}€</span></div>
            <div style="display:flex;gap:5px">
                <button class="btn-secundario" style="padding:5px 8px;font-size:0.7em" onclick="modificarProductoLibre(${i})">✏️</button>
                <button class="btn-eliminar" onclick="eliminarProductoLibre(${i})">🗑️</button>
            </div>
        </div>
    `).join('');
    const app = document.getElementById('app');
    app.innerHTML = `<div class="pantalla"><div class="header"><button class="btn-volver" onclick="mostrarSubcategorias('📝 Categoría Libre')">←</button><h2>Gestionar Cat. Libre</h2></div><div class="extras-form"><h3>Añadir producto:</h3><input type="text" id="nombreLibre" placeholder="Nombre" style="width:100%;padding:10px;background:var(--negro-card);border:1px solid var(--vino);color:var(--blanco);border-radius:8px;margin:5px 0"><input type="number" id="precioLibre" placeholder="Precio (€)" step="0.01" min="0" style="width:100%;padding:10px;background:var(--negro-card);border:1px solid var(--vino);color:var(--blanco);border-radius:8px;margin:5px 0"><button class="btn-primario" onclick="agregarProductoLibre()">Añadir</button><h3 style="margin-top:15px">Productos actuales:</h3><div class="productos-lista">${listaHTML || '<p class="vacio">Sin productos</p>'}</div></div></div>`;
}

async function agregarProductoLibre() {
    const nombre = document.getElementById('nombreLibre').value.trim();
    const precio = parseFloat(document.getElementById('precioLibre').value);
    if (!nombre || isNaN(precio) || precio < 0) { alert('Introduce nombre y precio válidos'); return; }
    CARTA["📝 Categoría Libre"].subcategorias["Productos libres"].push({ nombre, precio });
    storage.guardarCategoriaLibre(CARTA["📝 Categoría Libre"].subcategorias["Productos libres"]);
    gestionarCategoriaLibre();
}

async function modificarProductoLibre(index) {
    const productos = CARTA["📝 Categoría Libre"].subcategorias["Productos libres"];
    const prod = productos[index];
    const nuevoNombre = prompt('Nuevo nombre:', prod.nombre);
    if (nuevoNombre === null) return;
    const nuevoPrecio = prompt('Nuevo precio (€):', prod.precio);
    if (nuevoPrecio === null) return;
    const precioNum = parseFloat(nuevoPrecio);
    if (!nuevoNombre.trim() || isNaN(precioNum) || precioNum < 0) { alert('Datos inválidos'); return; }
    productos[index] = { nombre: nuevoNombre.trim(), precio: precioNum };
    storage.guardarCategoriaLibre(productos);
    gestionarCategoriaLibre();
}

async function eliminarProductoLibre(index) {
    CARTA["📝 Categoría Libre"].subcategorias["Productos libres"].splice(index, 1);
    storage.guardarCategoriaLibre(CARTA["📝 Categoría Libre"].subcategorias["Productos libres"]);
    gestionarCategoriaLibre();
}

// ============================================
// PAGOS
// ============================================

let pagoGuardadoActual = null;

function mostrarPago() {
    const mesaData = getMesaData();
    const mesaKey = getMesaKey();
    const pagoGuardado = storage.cargarPagoParcial(mesaKey);
    APP.pantallaAnterior = ['mesas'];
    const app = document.getElementById('app');
    
    let resumenHTML = '<h4>📋 Resumen del pedido</h4>';
    mesaData.productos.forEach(prod => {
        resumenHTML += `<div class="pago-resumen-item"><span>${prod.cantidad}x ${prod.nombre} ${prod.descripcion ? '(' + prod.descripcion + ')' : ''}</span><span>${(prod.precio * prod.cantidad).toFixed(2)}€</span></div>`;
    });
    
    app.innerHTML = `<div class="pantalla pago"><div class="header"><button class="btn-volver" onclick="mostrarPedidoMesa()">←</button><h2>Pagar</h2></div><div class="pago-resumen">${resumenHTML}</div><div class="pago-total">Total a pagar: <strong>${mesaData.total.toFixed(2)}€</strong></div><div class="pago-division"><h3>¿Cómo lo pagan?</h3><div class="metodos-opciones"><label class="metodo-option"><input type="radio" name="tipoPago" value="junto" checked onchange="toggleTipoPago()"> 💳 Lo paga 1 persona todo</label><label class="metodo-option"><input type="radio" name="tipoPago" value="separado" onchange="toggleTipoPago()"> 👥 Dividir entre varias personas</label></div></div><div id="detallePago"></div><button class="btn-guardar-pago" onclick="guardarPagoParcial()">💾 Guardar estado del pago</button><button class="btn-pagar btn-grande" onclick="confirmarPago()">✅ Confirmar pago</button></div>`;
    toggleTipoPago();
    if (pagoGuardado) { pagoGuardadoActual = pagoGuardado; restaurarPagoGuardado(pagoGuardado); }
}

function toggleTipoPago() {
    const tipo = document.querySelector('input[name="tipoPago"]:checked').value;
    const mesaData = getMesaData();
    const detalle = document.getElementById('detallePago');
    if (tipo === 'junto') {
        detalle.innerHTML = `<div class="pago-metodos"><h3>Método de pago</h3><div class="metodos-opciones"><label class="metodo-option"><input type="radio" name="metodoPago" value="efectivo" checked onchange="toggleMetodoUnico()"> 💵 Efectivo</label><label class="metodo-option"><input type="radio" name="metodoPago" value="tarjeta" onchange="toggleMetodoUnico()"> 💳 Tarjeta</label><label class="metodo-option"><input type="radio" name="metodoPago" value="mixto" onchange="toggleMetodoUnico()"> 🔄 Efectivo + Tarjeta</label></div><div id="metodoUnicoDetalle"></div></div>`;
        toggleMetodoUnico();
    } else {
        detalle.innerHTML = `<div class="pago-division"><label>Nº de personas:</label><input type="number" id="numPersonasPago" value="${pagoGuardadoActual ? pagoGuardadoActual.numPersonas || 2 : 2}" min="1" max="50" onchange="actualizarDivisionPago()"><div id="divisionDetalle"></div></div>`;
        actualizarDivisionPago();
    }
}

function toggleMetodoUnico() {
    const metodo = document.querySelector('input[name="metodoPago"]:checked')?.value || 'efectivo';
    const mesaData = getMesaData();
    const detalle = document.getElementById('metodoUnicoDetalle');
    if (metodo === 'efectivo') {
        detalle.innerHTML = `<div class="efectivo-cambio"><label>El cliente entrega:</label><input type="number" id="dineroEntregado" value="${mesaData.total.toFixed(2)}" step="0.01" min="${mesaData.total}" onchange="calcularCambioUnico()"><div id="cambioDiv">Cambio: <strong id="cambioCantidad">0.00€</strong></div></div>`;
        calcularCambioUnico();
    } else if (metodo === 'tarjeta') {
        detalle.innerHTML = `<p class="info-pago">Pago único con tarjeta: ${mesaData.total.toFixed(2)}€</p>`;
    } else {
        detalle.innerHTML = `<div class="pago-mixto"><label>Parte en efectivo:</label><input type="number" id="parteEfectivo" value="0" step="0.01" max="${mesaData.total}" onchange="actualizarMixtoUnico()"><label>Parte con tarjeta:</label><input type="number" id="parteTarjeta" value="${mesaData.total.toFixed(2)}" step="0.01" max="${mesaData.total}" onchange="actualizarMixtoUnico()"></div>`;
    }
}

function calcularCambioUnico() {
    const mesaData = getMesaData();
    const entregado = parseFloat(document.getElementById('dineroEntregado')?.value) || 0;
    const cambio = entregado - mesaData.total;
    const el = document.getElementById('cambioCantidad');
    if (el) { el.textContent = cambio >= 0 ? cambio.toFixed(2) + '€' : 'Insuficiente'; el.style.color = cambio >= 0 ? 'var(--verde)' : 'var(--rojo)'; }
}

function actualizarMixtoUnico() {
    const mesaData = getMesaData();
    const efectivo = parseFloat(document.getElementById('parteEfectivo')?.value) || 0;
    const tarjetaEl = document.getElementById('parteTarjeta');
    if (tarjetaEl) tarjetaEl.value = Math.max(0, mesaData.total - efectivo).toFixed(2);
}

function restaurarPagoGuardado(pagoData) {
    pagoGuardadoActual = pagoData;
    if (pagoData.tipo === 'separado' && pagoData.numPersonas) {
        document.querySelector('input[name="tipoPago"][value="separado"]').checked = true;
        toggleTipoPago();
        setTimeout(() => {
            const numInput = document.getElementById('numPersonasPago');
            if (numInput) numInput.value = pagoData.numPersonas;
            actualizarDivisionPago();
            setTimeout(() => {
                if (pagoData.personas) {
                    pagoData.personas.forEach((pers, i) => {
                        const tick = document.getElementById('tickPersona_' + i);
                        const efInput = document.getElementById('efectivoPersona_' + i);
                        const tjInput = document.getElementById('tarjetaPersona_' + i);
                        if (tick) tick.checked = pers.pagada;
                        if (efInput) efInput.value = pers.efectivo || 0;
                        if (tjInput) tjInput.value = pers.tarjeta || 0;
                        togglePersonaPagada(i);
                    });
                    actualizarResumenPagoSeparado();
                }
            }, 100);
        }, 100);
    } else if (pagoData.tipo === 'junto' && pagoData.metodo) {
        document.querySelector('input[name="tipoPago"][value="junto"]').checked = true;
        toggleTipoPago();
        setTimeout(() => {
            const radio = document.querySelector(`input[name="metodoPago"][value="${pagoData.metodo}"]`);
            if (radio) radio.checked = true;
            toggleMetodoUnico();
        }, 100);
    }
}

function actualizarDivisionPago() {
    const mesaData = getMesaData();
    const num = parseInt(document.getElementById('numPersonasPago')?.value) || 1;
    const porPersona = mesaData.total / num;
    let html = `<p style="color:var(--gris);margin-bottom:8px">Cada persona: <strong style="color:var(--blanco)">${porPersona.toFixed(2)}€</strong></p>`;
    for (let i = 1; i <= num; i++) {
        html += `<div class="persona-pago" id="personaPago_${i}"><div class="persona-pago-header"><span>👤 Persona ${i}</span><label class="tick-pagado"><input type="checkbox" id="tickPersona_${i-1}" onchange="togglePersonaPagada(${i-1})"> Pagado ✅</label></div><div class="persona-pago-monto">Le corresponde: ${porPersona.toFixed(2)}€</div><div class="persona-pago-metodos"><div><label>Efectivo:</label><input type="number" id="efectivoPersona_${i-1}" value="0" step="0.01" onchange="actualizarResumenPagoSeparado()"></div><div><label>Tarjeta:</label><input type="number" id="tarjetaPersona_${i-1}" value="0" step="0.01" onchange="actualizarResumenPagoSeparado()"></div></div></div>`;
    }
    html += `<div id="resumenPagoSeparado" style="margin-top:10px;padding:10px;background:var(--negro-card);border-radius:8px"><div id="cambioIndividual"></div></div>`;
    document.getElementById('divisionDetalle').innerHTML = html;
}

function togglePersonaPagada(index) {
    const tick = document.getElementById('tickPersona_' + index);
    const div = document.getElementById('personaPago_' + (index + 1));
    if (tick && div) { if (tick.checked) div.classList.add('pagada'); else div.classList.remove('pagada'); }
}

function actualizarResumenPagoSeparado() {
    const mesaData = getMesaData();
    const num = parseInt(document.getElementById('numPersonasPago')?.value) || 1;
    const porPersona = mesaData.total / num;
    let html = '<h4>🪙 Cambios</h4>';
    let totalEf = 0, totalTj = 0;
    for (let i = 0; i < num; i++) {
        const ef = parseFloat(document.getElementById('efectivoPersona_' + i)?.value) || 0;
        const tj = parseFloat(document.getElementById('tarjetaPersona_' + i)?.value) || 0;
        const pagado = ef + tj;
        const cambio = pagado - porPersona;
        totalEf += ef; totalTj += tj;
        html += `<div class="cambio-item"><span>Persona ${i+1}:</span><span style="color:${cambio>0?'var(--verde)':cambio<0?'var(--rojo)':'var(--blanco)'}">${cambio>0?'Devuelve '+cambio.toFixed(2)+'€':cambio<0?'Falta '+Math.abs(cambio).toFixed(2)+'€':'Exacto'}</span></div>`;
    }
    html += `<div style="border-top:1px solid var(--vino);margin-top:6px;padding-top:6px"><div class="cambio-item"><span>Total efectivo:</span><span>${totalEf.toFixed(2)}€</span></div><div class="cambio-item"><span>Total tarjeta:</span><span>${totalTj.toFixed(2)}€</span></div></div>`;
    const el = document.getElementById('cambioIndividual');
    if (el) el.innerHTML = html;
}

function guardarPagoParcial() {
    const mesaKey = getMesaKey();
    const tipo = document.querySelector('input[name="tipoPago"]:checked')?.value;
    const pagoData = { tipo };
    if (tipo === 'separado') {
        pagoData.numPersonas = parseInt(document.getElementById('numPersonasPago')?.value) || 1;
        pagoData.personas = [];
        for (let i = 0; i < pagoData.numPersonas; i++) {
            pagoData.personas.push({
                pagada: document.getElementById('tickPersona_' + i)?.checked || false,
                efectivo: parseFloat(document.getElementById('efectivoPersona_' + i)?.value) || 0,
                tarjeta: parseFloat(document.getElementById('tarjetaPersona_' + i)?.value) || 0
            });
        }
    } else {
        pagoData.metodo = document.querySelector('input[name="metodoPago"]:checked')?.value;
    }
    storage.guardarPagoParcial(mesaKey, pagoData);
    alert('✅ Estado del pago guardado');
}

async function confirmarPago() {
    const mesaData = getMesaData();
    const mesaKey = getMesaKey();
    const tipo = document.querySelector('input[name="tipoPago"]:checked')?.value;
    let detallePago = { tipo, total: mesaData.total, fecha: new Date().toLocaleString('es-ES') };
    
    if (tipo === 'junto') {
        detallePago.metodo = document.querySelector('input[name="metodoPago"]:checked')?.value;
        if (detallePago.metodo === 'efectivo') {
            detallePago.entregado = parseFloat(document.getElementById('dineroEntregado')?.value) || 0;
            detallePago.cambio = detallePago.entregado - mesaData.total;
        }
    } else {
        const num = parseInt(document.getElementById('numPersonasPago')?.value) || 1;
        detallePago.numPersonas = num;
        detallePago.personas = [];
        for (let i = 0; i < num; i++) {
            detallePago.personas.push({
                pagada: document.getElementById('tickPersona_' + i)?.checked || false,
                efectivo: parseFloat(document.getElementById('efectivoPersona_' + i)?.value) || 0,
                tarjeta: parseFloat(document.getElementById('tarjetaPersona_' + i)?.value) || 0
            });
        }
    }
    
    // Calcular turno según registros de HOY para esta mesa
    // Si es Para Llevar, siempre turno 1 (no se guarda turno)
    const config = APP.configSalones[APP.salonActual];
    let turnoCalculado = (config && config.tipo === 'personas') ? 1 : 1;
    const nombreMesa = APP.mesaActual + (APP.mesasJuntadas.length > 0 ? '+' + APP.mesasJuntadas.join('+') : '');
    
    // Solo calcular turno si NO es Para Llevar
    if (!config || config.tipo !== 'personas') {
        try {
            if (storage.supabase) {
                const { data, error } = await storage.supabase
                    .from('historial_mesas')
                    .select('id, fecha_cierre')
                    .eq('mesa_nombre', nombreMesa);
                
                if (!error && data) {
                    const hoy = new Date();
                    const diaHoy = hoy.getDate();
                    const mesHoy = hoy.getMonth();
                    const anioHoy = hoy.getFullYear();
                    
                    const registrosHoy = data.filter(entry => {
                        if (!entry.fecha_cierre) return false;
                        const fechaRegistro = new Date(entry.fecha_cierre);
                        return fechaRegistro.getDate() === diaHoy &&
                            fechaRegistro.getMonth() === mesHoy &&
                            fechaRegistro.getFullYear() === anioHoy;
                    });
                    
                    turnoCalculado = registrosHoy.length + 1;
                }
            }
        } catch (e) {
            console.warn('Error consultando Supabase:', e.message);
        }
    }
    
    const ahora = new Date();
    const historialEntry = {
        salon: APP.salonActual,
        mesa: nombreMesa,
        turno: turnoCalculado,
        productos: JSON.parse(JSON.stringify(mesaData.productos)),
        total: Number(mesaData.total.toFixed(2)),
        metodoPago: detallePago,
        fecha: ahora.toLocaleString('es-ES'),
        fechaISO: ahora.toISOString()
    };
    
    await storage.guardarHistorial(historialEntry);
    
    mesaData.turno = turnoCalculado + 1;
    mesaData.productos = [];
    mesaData.total = 0;
    guardarMesaData(mesaData);
    
    storage.eliminarPagoParcial(mesaKey);
    alert('✅ Pago registrado. Turno: ' + turnoCalculado);

    // Si es Para Llevar, eliminar a la persona después de pagar
    if (config && config.tipo === 'personas') {
        delete APP.mesasActivas[mesaKey];
        storage.guardarMesasActivas(APP.mesasActivas);
        mostrarPersonas(APP.salonActual);
    } else {
        mostrarMesas(APP.salonActual);
    }
}

// ============================================
// HISTORIAL
// ============================================

async function mostrarHistorial() {
    let historial = await storage.cargarHistorial();
    const app = document.getElementById('app');
    let html = '';
    
    if (!historial || historial.length === 0) {
        html = '<p class="vacio">No hay historial aún</p>';
    } else {
        
        historial.forEach((entry, idx) => {
            let fecha = 'Fecha no disponible';
            if (entry.fecha) {
                try {
                    // Si la fecha viene en formato ISO (UTC), convertirla a local
                    if (entry.fecha.includes('T') || entry.fecha.includes('Z')) {
                        fecha = new Date(entry.fecha).toLocaleString('es-ES', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                        });
                    } else {
                        // Si ya está en formato local, mostrarla tal cual
                        fecha = entry.fecha;
                    }
                } catch(e) {
                    fecha = entry.fecha;
                }
            }
            
            // Recuperar total correctamente
            let total = 0;
            if (typeof entry.total === 'number') total = entry.total;
            else if (typeof entry.total === 'string') total = parseFloat(entry.total) || 0;
            else if (entry.total && typeof entry.total === 'object') total = parseFloat(entry.total) || 0;
            
            // Recuperar datos correctamente
            const salon = entry.salon || 'Desconocido';
            const mesa = entry.mesa || entry.mesa_nombre || '?';
            const turno = entry.turno || 1;
            
            let productosDetalle = '';
            if (entry.productos && Array.isArray(entry.productos)) {
                productosDetalle = entry.productos.map(p => `<div class="historial-producto-item"><span>${p.cantidad || 1}x ${p.nombre || '?'} ${p.descripcion || ''}</span><span>${((p.precio || 0) * (p.cantidad || 1)).toFixed(2)}€</span></div>`).join('');
            }
            
            html += `<div class="historial-item" onclick="toggleHistorialItem(${idx})"><div class="historial-header"><span>${salon.replace(/[🌿🏠🍸🛍️]\s*/, '')} - ${salon.includes('Para Llevar') ? '' : 'Mesa '}${mesa}</span><span>Turno ${turno}</span></div><div class="historial-fecha">${fecha}</div><div class="historial-total">${total.toFixed(2)}€</div><div class="historial-productos" id="histProd_${idx}">${productosDetalle || '<p style="color:var(--gris);font-size:0.8em">Sin detalle</p>'}</div></div>`;
        });
    }
    
    app.innerHTML = `<div class="pantalla historial"><div class="header"><button class="btn-volver" onclick="mostrarInicio()">←</button><h2>Historial</h2><button class="btn-peligro" onclick="borrarHistorial()" style="font-size:0.7em;padding:6px 10px;">🗑️</button></div><div class="historial-lista">${html}</div></div>`;
}

function toggleHistorialItem(idx) {
    const prod = document.getElementById('histProd_' + idx);
    if (prod) prod.classList.toggle('visible');
}

async function borrarHistorial() {
    if (confirm('¿Estás segura de que quieres borrar TODO el historial? Esta acción no se puede deshacer.')) {
        // Borrar de localStorage
        localStorage.removeItem('historial_mesas');
        
        // Borrar de Supabase
        if (storage.supabase) {
            try {
                const { error } = await storage.supabase
                    .from('historial_mesas')
                    .delete()
                    .neq('id', 0); // Borrar todos los registros
                if (error) console.warn('Error borrando de Supabase:', error);
                else console.log('✅ Historial borrado de Supabase');
            } catch (e) {
                console.warn('No se pudo borrar de Supabase');
            }
        }
        
        alert('✅ Historial borrado correctamente');
        mostrarHistorial();
    }
}


let modoEditarActivo = false;
let modoBorrarActivo = false;

function modoEditarMesa() {
    if (modoEditarActivo) {
        modoEditarActivo = false;
        mostrarMesas(APP.salonActual);
        return;
    }
    modoEditarActivo = true;
    modoBorrarActivo = false;
    
    const grid = document.getElementById('mesasGrid');
    if (!grid) return;
    
    Array.from(grid.children).forEach(card => {
        const mesaNombre = card.querySelector('.mesa-numero').textContent;
        card.style.border = '2px solid var(--dorado)';
        card.onclick = (e) => {
            e.stopPropagation();
            renombrarMesa(mesaNombre);
            modoEditarActivo = false;
            mostrarMesas(APP.salonActual);
        };
    });
}

function modoBorrarMesa() {
    if (modoBorrarActivo) {
        modoBorrarActivo = false;
        mostrarMesas(APP.salonActual);
        return;
    }
    modoBorrarActivo = true;
    modoEditarActivo = false;
    
    const grid = document.getElementById('mesasGrid');
    if (!grid) return;
    
    Array.from(grid.children).forEach(card => {
        const mesaNombre = card.querySelector('.mesa-numero').textContent;
        card.style.border = '2px solid var(--rojo)';
        card.onclick = (e) => {
            e.stopPropagation();
            eliminarMesa(mesaNombre);
            modoBorrarActivo = false;
            mostrarMesas(APP.salonActual);
        };
    });
}


let modoBorrarPersonaActivo = false;

function modoBorrarPersona() {
    if (modoBorrarPersonaActivo) {
        modoBorrarPersonaActivo = false;
        mostrarPersonas(APP.salonActual);
        return;
    }
    modoBorrarPersonaActivo = true;
    
    const grid = document.querySelector('.personas-grid');
    if (!grid) return;
    
    Array.from(grid.children).forEach(card => {
        const nombrePersona = card.querySelector('.mesa-numero').textContent;
        card.style.border = '2px solid var(--rojo)';
        card.onclick = (e) => {
            e.stopPropagation();
            eliminarPersona(nombrePersona);
            modoBorrarPersonaActivo = false;
            mostrarPersonas(APP.salonActual);
        };
    });
}

// ============================================
// SERVICE WORKER
// ============================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); });
}