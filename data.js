const CONFIG_SALONES_DEFAULT = {
    "🌿 Terraza": { mesas: ["T1","T2","T3","T4","T5","T6","T7","T8","T9","T10","T11","T12","T13","Puri"], color: "#722f37", tipo: "mesas" },
    "🏠 Salón": { mesas: ["S1","S2","S3","S4","S5","S6","S7","S8","Barril"], color: "#8b3a42", tipo: "mesas" },
    "🍸 Barra": { mesas: ["B1"], color: "#5c1e24", tipo: "mesas" },
    "🛍️ Para Llevar": { mesas: [], color: "#9b4d55", tipo: "personas" }
};

let INGREDIENTES_LIBRES = [
    { nombre: "Huevo frito", precio: 0.5 },
    { nombre: "Bacon", precio: 0.5 },
    { nombre: "Pimientos fritos", precio: 0.5 },
    { nombre: "Jamón serrano", precio: 1 },
    { nombre: "Tocino", precio: 1 },
    { nombre: "Longaniza", precio: 1 },
    { nombre: "Chorizo", precio: 1 },
    { nombre: "Lomo", precio: 1 },
    { nombre: "Morcilla", precio: 1 }
];

const PRECIOS_PAN_BOCADILLO = {
    "Montadito": { normal: 1, sinGluten: 1.5 },
    "Medio Bocadillo": { normal: 1.5, sinGluten: 2 },
    "Bocadillo": { normal: 2, sinGluten: 3 },
    "Tostada": { normal: 2, sinGluten: 3 }
};

const PRODUCTOS_MONTADITOS = [
    { nombre: "Sobrasada", precios: { Montadito: 2, "Medio Bocadillo": 2.5, Bocadillo: 3.5, Tostada: 3.5 } },
    { nombre: "Jamón York", precios: { Montadito: 2, "Medio Bocadillo": 3, Bocadillo: 4, Tostada: 4 } },
    { nombre: "Bacon", precios: { Montadito: 2, "Medio Bocadillo": 3, Bocadillo: 4, Tostada: 4 } },
    { nombre: "Queso con anchoa", precios: { Montadito: 2, "Medio Bocadillo": 3, Bocadillo: 4, Tostada: 4 } },
    { nombre: "Lomo", precios: { Montadito: 2, "Medio Bocadillo": 3.5, Bocadillo: 5, Tostada: 5 } },
    { nombre: "Atún", precios: { Montadito: 2.5, "Medio Bocadillo": 3, Bocadillo: 4.5, Tostada: 4.5 } },
    { nombre: "Catalana", precios: { Montadito: 2.5, "Medio Bocadillo": 3.5, Bocadillo: 5, Tostada: 5 } },
    { nombre: "Chorizo", precios: { Montadito: 2.5, "Medio Bocadillo": 4, Bocadillo: 6, Tostada: 6 } },
    { nombre: "Tocino", precios: { Montadito: 2.5, "Medio Bocadillo": 4, Bocadillo: 6, Tostada: 6 } },
    { nombre: "Longaniza", precios: { Montadito: 2.5, "Medio Bocadillo": 4, Bocadillo: 6, Tostada: 6 } },
    { nombre: "Pastor", precios: { Montadito: 2.5, "Medio Bocadillo": 4, Bocadillo: 6, Tostada: 6 } },
    { nombre: "Tradicional", precios: { Montadito: 3, "Medio Bocadillo": 4, Bocadillo: 5, Tostada: 5 } },
    { nombre: "Especial", precios: { Montadito: 3, "Medio Bocadillo": 4, Bocadillo: 5, Tostada: 5 } },
    { nombre: "Morcilla", precios: { Montadito: 3, "Medio Bocadillo": 4, Bocadillo: 6, Tostada: 6 } },
    { nombre: "Serranito", precios: { Montadito: 3, "Medio Bocadillo": 4, Bocadillo: 6.5, Tostada: 6.5 } },
    { nombre: "Especial Ana", precios: { Montadito: 3.5, "Medio Bocadillo": 4, Bocadillo: 6, Tostada: 6 } },
    { nombre: "Salmón", precios: { Montadito: 4, "Medio Bocadillo": 5, Bocadillo: 6, Tostada: 6 } },
    { nombre: "Eloy", precios: { Montadito: 3.5, "Medio Bocadillo": 5, Bocadillo: 7, Tostada: 7 } },
    { nombre: "Blanco y Negro", precios: { Montadito: 3.5, "Medio Bocadillo": 5, Bocadillo: 7, Tostada: 7 } }
];

const PRODUCTOS_INDIVIDUALES = [
    { nombre: "Pajarito", precio: 2.5, formatoFijo: "Media Tostada" },
    { nombre: "Gorrión", precio: 3, formatoFijo: "Media Tostada" },
    { nombre: "Pincho moruno", precio: 2.5, formatoFijo: null },
    { nombre: "Pincho de pollo", precio: 2.5, formatoFijo: null },
    { nombre: "Volcán", precio: 3.5, formatoFijo: "Bocadillo" }
];

const CARTA = {
    "🍽️ Entrantes": { icono: "🍽️", subcategorias: { "Entrantes": [
        { nombre: "Patatas con ajo", variantes: ["Pequeño", "Grande"], preciosVariante: [2.5, 3.5] },
        { nombre: "Ensaladilla rusa", variantes: ["Pequeño", "Grande"], preciosVariante: [2.5, 4] },
        { nombre: "Salpicón de pulpo", variantes: ["Pequeño", "Grande"], preciosVariante: [2.5, 4.5] },
        { nombre: "Champiñón", variantes: ["Pequeño", "Grande"], preciosVariante: [2.5, 4] },
        { nombre: "Boquerones con oliva", variantes: ["Pequeño", "Grande"], preciosVariante: [3.5, 4.5] },
        { nombre: "Cortezas", variantes: ["Grande"], preciosVariante: [2] },
        { nombre: "Almendras - Frutos secos", variantes: ["Grande"], preciosVariante: [2] },
        { nombre: "Olivas agrezo", variantes: ["Grande"], preciosVariante: [2] },
        { nombre: "Olivas caustico", variantes: ["Grande"], preciosVariante: [2.5] },
        { nombre: "Olivas rellenas", variantes: ["Grande"], preciosVariante: [3] },
        { nombre: "Papas", variantes: ["Grande"], preciosVariante: [1.5] },
        { nombre: "Papas con boquerones", variantes: ["Grande"], preciosVariante: [4] },
        { nombre: "Papas con boquerones y olivas", variantes: ["Grande"], preciosVariante: [5] },
        { nombre: "Capellán con tomate", variantes: ["Pequeño", "Grande"], preciosVariante: [3, 4.5] },
        { nombre: "Queso a la plancha", variantes: ["Pequeño", "Grande"], preciosVariante: [3, 5] },
        { nombre: "Michirones", variantes: ["Pequeño", "Grande"], preciosVariante: [3, 5] },
        { nombre: "Caracoles", variantes: ["Pequeño", "Grande"], preciosVariante: [3, 5] },
        { nombre: "Magro con tomate", variantes: ["Pequeño", "Grande"], preciosVariante: [3, 6] }
    ]}},
    "🥔 Patatas al Montón": { icono: "🥔", subcategorias: { "Patatas al Montón": [
        { nombre: "Patatas al Montón", precioBase: 2.5, esPersonalizable: true,
            extras: [
                { nombre: "Huevo frito", precio: 0.5, tipo: "unidad" },
                { nombre: "Bacon", precio: 0.5, tipo: "persona" },
                { nombre: "Pimientos fritos", precio: 0.5, tipo: "persona" },
                { nombre: "Jamón serrano", precio: 1, tipo: "persona" },
                { nombre: "Tocino", precio: 1, tipo: "unidad" },
                { nombre: "Longaniza", precio: 1, tipo: "unidad" },
                { nombre: "Chorizo", precio: 1, tipo: "unidad" },
                { nombre: "Lomo", precio: 1, tipo: "unidad" },
                { nombre: "Morcilla", precio: 1, tipo: "unidad" }
            ]
        }
    ]}},
    "🥚 Tortilla": { icono: "🥚", subcategorias: { "Tortilla": [
        { nombre: "Tortilla - Cuarto", precio: 2 },
        { nombre: "Tortilla - Media", precio: 3.5 },
        { nombre: "Tortilla - Entera", precio: 6 }
    ]}},
    "🥖 Montaditos y Tostadas": { icono: "🥖", subcategorias: { "Productos": [] }},
    "🍔 Hamburguesas": { icono: "🍔", subcategorias: { "Hamburguesas": [
        { nombre: "Hamburguesa Normal", precio: 5.5, extras: [{ nombre: "Queso", precio: 1 }, { nombre: "Bacon", precio: 1 }] },
        { nombre: "Hamburguesa Especial", precio: 7, extras: [] }
    ]}},
    "🥪 Sandwiches": { icono: "🥪", subcategorias: { "Sandwiches": [
        { nombre: "Sandwich Mixto", precio: 2.5 },
        { nombre: "Sandwich de sobrasada con queso en loncha", precio: 2.5 },
        { nombre: "Sandwich de sobrasada con queso fresco", precio: 3.5 },
        { nombre: "Sandwich de sobrasada con queso manchego", precio: 3.5 },
        { nombre: "Sandwich Vegetal", precio: 3.5 },
        { nombre: "Sandwich Especial", precio: 4.5 }
    ]}},
    "🍰 Postres": { icono: "🍰", subcategorias: { "Postres": [
        { nombre: "Brownie", precio: 5 },
        { nombre: "Bola de helado (vainilla)", precio: 2.5 },
        { nombre: "Tarta de queso", precio: 4 },
        { nombre: "Otros postres", precio: 4 }
    ]}},
    "🥤 Bebidas": { icono: "🥤", subcategorias: {
        "Sin Alcohol": [
            { nombre: "Agua pequeña", precio: 1 }, { nombre: "Agua grande", precio: 1.5 },
            { nombre: "Zumo melocotón", precio: 1.5 }, { nombre: "Zumo piña", precio: 1.5 },
            { nombre: "Refresco", precio: 2.2 }, { nombre: "Vichy", precio: 2.2 }, { nombre: "Bitter Kas", precio: 2.2 }
        ],
        "Cerveza": [
            { nombre: "Caña", precio: 2.2 }, { nombre: "Copa de cerveza", precio: 3.5 },
            { nombre: "Tanque", precio: 3.5 }, { nombre: "Jarra de cerveza (1L)", precio: 5 },
            { nombre: "Tercio Alhambra", precio: 2.2 }, { nombre: "Tercio Alhambra sin alcohol", precio: 2.2 },
            { nombre: "Tercio Alhambra verde", precio: 3 }, { nombre: "Tercio San Miguel 00 tostada", precio: 2.2 },
            { nombre: "Tercio San Miguel sin gluten", precio: 2.2 }, { nombre: "Tercio Radler", precio: 2.2 },
            { nombre: "Tercio Estrella Levante", precio: 2.5 }, { nombre: "Tanque Rosendo", precio: 3.5 },
            { nombre: "Jarra Rosendo (1L)", precio: 6 }
        ],
        "Vermut y Tinto de Verano": [
            { nombre: "Tinto de verano", precio: 2.5 }, { nombre: "Vermut", precio: 3 },
            { nombre: "Media Sangría", precio: 3.5 }, { nombre: "Sangría (1L)", precio: 6 }
        ],
        "Copas y Chupitos": [
            { nombre: "Chupito", precio: 1.5 }, { nombre: "Chupito Tequila/Jack/Baileys", precio: 2 },
            { nombre: "Piedra", precio: 3 }, { nombre: "Piedra Tequila/Jack/Baileys", precio: 3.5 },
            { nombre: "Cubata", precio: 6 }, { nombre: "Cubata Red Bull/Tequila/Jack", precio: 7 }
        ],
        "🍷 Vinos Blancos": [
            { nombre: "Barahonda Blanco Organic", variantes: ["Copa", "Botella"], preciosVariante: [2.5, 10] },
            { nombre: "Macabeo Chardonnay", variantes: ["Copa", "Botella"], preciosVariante: [2.5, 10] },
            { nombre: "Filarmonia Blanco", variantes: ["Copa", "Botella"], preciosVariante: [2.8, 12] },
            { nombre: "Nocturne", variantes: ["Copa", "Botella"], preciosVariante: [2.8, 13] }
        ],
        "🍷 Vinos Rosados": [
            { nombre: "Filarmonía Rosa", variantes: ["Copa", "Botella"], preciosVariante: [2.8, 12] },
            { nombre: "Rosado Semidulce Castaño", variantes: ["Copa", "Botella"], preciosVariante: [2.8, 13] }
        ],
        "🍷 Tintos sin Madera": [
            { nombre: "Consentido Syrah", variantes: ["Copa", "Botella"], preciosVariante: [2.5, 9] },
            { nombre: "Castaño GSM", variantes: ["Copa", "Botella"], preciosVariante: [2.5, 9] }
        ],
        "🍷 Tintos con Madera": [
            { nombre: "Barahonda Organic", variantes: ["Copa", "Botella"], preciosVariante: [2.5, 9] },
            { nombre: "Consentido Monastrell Barrica", variantes: ["Copa", "Botella"], preciosVariante: [2.5, 9] },
            { nombre: "Maria Sarmiento", variantes: ["Copa", "Botella"], preciosVariante: [2.5, 10] },
            { nombre: "Solanera", variantes: ["Copa", "Botella"], preciosVariante: [2.5, 11] },
            { nombre: "Hécula", variantes: ["Copa", "Botella"], preciosVariante: [2.5, 11] },
            { nombre: "Filarmonía MSM", variantes: ["Copa", "Botella"], preciosVariante: [2.8, 12] },
            { nombre: "Barahonda Crianza", variantes: ["Copa", "Botella"], preciosVariante: [2.8, 13] },
            { nombre: "Barahonda Barrica", variantes: ["Copa", "Botella"], preciosVariante: [2.8, 14] },
            { nombre: "Juan Gil Oro", variantes: ["Botella"], preciosVariante: [12] },
            { nombre: "Uvas Contadas", variantes: ["Botella"], preciosVariante: [14] },
            { nombre: "Juan Gil Plata", variantes: ["Botella"], preciosVariante: [16] },
            { nombre: "Barahonda Summum", variantes: ["Botella"], preciosVariante: [20] }
        ]
    }},
    "🍞 Pan": { icono: "🍞", subcategorias: { "Pan": [
        { nombre: "Pan normal", precio: 1 }, { nombre: "Pan sin gluten", precio: 2 }
    ]}},
    "📋 Menús": { icono: "📋", subcategorias: { "Menús": [
        { nombre: "Menú Barato", precio: 15, esMenu: true, tipoMenu: "barato", descripcion: "Barra libre limitada", incluye: ["Refresco", "Caña", "Tinto de verano", "Agua pequeña"] },
        { nombre: "Menú Caro", precio: 25, esMenu: true, tipoMenu: "caro", descripcion: "Barra libre completa", incluye: ["Refresco", "Caña", "Copa de cerveza", "Tinto de verano", "Vermut", "Cubata", "Chupito"] }
    ]}},
    "📝 Categoría Libre": { icono: "📝", subcategorias: { "Productos libres": [
        { nombre: "Huevo frito", precio: 0.5 }, { nombre: "Bacon", precio: 0.5 },
        { nombre: "Pimientos fritos", precio: 0.5 }, { nombre: "Jamón serrano", precio: 1 },
        { nombre: "Tocino", precio: 1 }, { nombre: "Longaniza", precio: 1 },
        { nombre: "Chorizo", precio: 1 }, { nombre: "Lomo", precio: 1 }, { nombre: "Morcilla", precio: 1 }
    ]}}
};

function construirListaMontaditos() {
    const lista = [];
    PRODUCTOS_MONTADITOS.forEach(prod => {
        lista.push({ nombre: prod.nombre, tipo: "variable", formatos: Object.keys(prod.precios), precios: prod.precios, permiteSinGluten: true });
    });
    PRODUCTOS_INDIVIDUALES.forEach(prod => {
        lista.push({ nombre: prod.nombre, tipo: "fijo", precio: prod.precio, formatoFijo: prod.formatoFijo, permiteSinGluten: prod.formatoFijo ? true : false });
    });
    CARTA["🥖 Montaditos y Tostadas"].subcategorias["Productos"] = lista;
}
construirListaMontaditos();

const SUPABASE_URL = 'https://lcwakjcntjpikdiedzkj.supabase.co';
const SUPABASE_KEY = 'sb_publishable_fe2cR9dK2xzsB2xz3_yDoA_cjnCKOxn';