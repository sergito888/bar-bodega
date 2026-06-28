class StorageManager {
    constructor() {
        this.supabase = null;
        this.initSupabase();
    }
    
    initSupabase() {
        if (typeof supabase !== 'undefined' && supabase.createClient) {
            this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        }
    }
    
    guardarLocal(clave, datos) {
        try { localStorage.setItem(clave, JSON.stringify(datos)); return true; } catch (e) { return false; }
    }
    
    cargarLocal(clave) {
        try { const datos = localStorage.getItem(clave); return datos ? JSON.parse(datos) : null; } catch (e) { return null; }
    }
    
    // ============================================
    // HISTORIAL
    // ============================================
    
    async guardarHistorial(mesaData) {
        if (this.supabase) {
            try {
                const { error } = await this.supabase
                    .from('historial_mesas')
                    .insert([{
                        salon: mesaData.salon,
                        mesa_nombre: mesaData.mesa,
                        turno: mesaData.turno,
                        productos: mesaData.productos,
                        total: mesaData.total,
                        metodo_pago: mesaData.metodoPago,
                        fecha_cierre: (() => {
                            const d = new Date(mesaData.fechaISO || new Date());
                            d.setHours(d.getHours() + 2);
                            return d.toISOString();
                        })()
                    }]);
                if (error) console.warn('Error guardando historial:', error.message);
            } catch (e) {
                console.warn('Sin conexión a Supabase');
            }
        }
        return true;
    }
    
    async cargarHistorial() {
        if (this.supabase && navigator.onLine) {
            try {
                const { data, error } = await this.supabase
                    .from('historial_mesas')
                    .select('*')
                    .order('fecha_cierre', { ascending: false });
                
                if (!error && data && data.length > 0) {
                    return data.map(entry => ({
                        salon: entry.salon,
                        mesa: entry.mesa_nombre,
                        turno: entry.turno,
                        productos: entry.productos,
                        total: parseFloat(entry.total),
                        metodoPago: entry.metodo_pago,
                        fecha: entry.fecha_cierre
                    }));
                }
            } catch (e) {
                console.warn('Error cargando historial de Supabase');
            }
        }
        return this.cargarLocal('historial_mesas') || [];
    }
    
    // ============================================
    // CATEGORÍA LIBRE (SUPABASE)
    // ============================================
    
    async guardarCategoriaLibre(items) {
        // Guardar en Supabase: borrar todos y volver a insertar
        if (this.supabase) {
            try {
                // Borrar todos los existentes
                await this.supabase.from('categoria_libre').delete().neq('id', 0);
                
                // Insertar los nuevos
                if (items.length > 0) {
                    const insertData = items.map(item => ({
                        nombre: item.nombre,
                        precio: item.precio
                    }));
                    const { error } = await this.supabase.from('categoria_libre').insert(insertData);
                    if (error) console.warn('Error guardando categoría libre:', error.message);
                }
            } catch (e) {
                console.warn('Sin conexión, guardando en local');
                this.guardarLocal('categoria_libre', items);
            }
        } else {
            this.guardarLocal('categoria_libre', items);
        }
    }
    
    async cargarCategoriaLibre() {
        if (this.supabase && navigator.onLine) {
            try {
                const { data, error } = await this.supabase
                    .from('categoria_libre')
                    .select('*')
                    .order('id', { ascending: true });
                
                if (!error && data) {
                    const items = data.map(item => ({
                        nombre: item.nombre,
                        precio: parseFloat(item.precio)
                    }));
                    // SIEMPRE actualizar local con lo que viene de Supabase
                    this.guardarLocal('categoria_libre', items);
                    return items;
                }
            } catch (e) {
                console.warn('Error cargando categoría libre de Supabase');
            }
        }
        return this.cargarLocal('categoria_libre') || [];
    }
    
    // ============================================
    // INGREDIENTES LIBRES (SUPABASE)
    // ============================================
    
    async guardarIngredientesLibres(items) {
        if (this.supabase) {
            try {
                // Borrar todos los existentes
                await this.supabase.from('ingredientes_libres').delete().neq('id', 0);
                
                // Insertar los nuevos
                if (items.length > 0) {
                    const insertData = items.map(item => ({
                        nombre: item.nombre,
                        precio: item.precio
                    }));
                    const { error } = await this.supabase.from('ingredientes_libres').insert(insertData);
                    if (error) console.warn('Error guardando ingredientes libres:', error.message);
                }
            } catch (e) {
                console.warn('Sin conexión, guardando ingredientes en local');
                this.guardarLocal('ingredientes_libres', items);
            }
        } else {
            this.guardarLocal('ingredientes_libres', items);
        }
    }
    
    async cargarIngredientesLibres() {
        if (this.supabase && navigator.onLine) {
            try {
                const { data, error } = await this.supabase
                    .from('ingredientes_libres')
                    .select('*')
                    .order('id', { ascending: true });
                
                if (!error && data) {
                    const items = data.map(item => ({
                        nombre: item.nombre,
                        precio: parseFloat(item.precio)
                    }));
                    // SIEMPRE guardar en local lo que viene de Supabase
                    this.guardarLocal('ingredientes_libres', items);
                    return items;
                }
            } catch (e) {
                console.warn('Error cargando ingredientes libres de Supabase');
            }
        }
        return this.cargarLocal('ingredientes_libres');
    }
    
    // ============================================
    // MESAS ACTIVAS Y CONFIGURACIÓN (LOCAL)
    // ============================================
    
    guardarMesasActivas(mesas) { return this.guardarLocal('mesas_activas', mesas); }
    cargarMesasActivas() { return this.cargarLocal('mesas_activas') || {}; }
    
    guardarConfigSalones(config) { return this.guardarLocal('config_salones', config); }
    cargarConfigSalones() { return this.cargarLocal('config_salones') || JSON.parse(JSON.stringify(CONFIG_SALONES_DEFAULT)); }
    
    guardarPagoParcial(mesaKey, pagoData) { return this.guardarLocal('pago_parcial_' + mesaKey, pagoData); }
    cargarPagoParcial(mesaKey) { return this.cargarLocal('pago_parcial_' + mesaKey); }
    eliminarPagoParcial(mesaKey) { localStorage.removeItem('pago_parcial_' + mesaKey); }
}

const storage = new StorageManager();