/**
 * Datos semilla — Paladar Grill
 * Menú de hamburguesería + ingredientes + empleados
 */

// ─── CATEGORÍAS DEL MENÚ ──────────────────────────────────────────
export const seedCategories = [
  { id: 'cat-1', name: 'Hamburguesas Clásicas', icon: '🍔', order: 1 },
  { id: 'cat-2', name: 'Hamburguesas Especiales', icon: '🔥', order: 2 },
  { id: 'cat-3', name: 'Combos', icon: '🎁', order: 3 },
  { id: 'cat-4', name: 'Acompañamientos', icon: '🍟', order: 4 },
  { id: 'cat-5', name: 'Bebidas', icon: '🥤', order: 5 },
  { id: 'cat-6', name: 'Postres', icon: '🍦', order: 6 },
];

// ─── INGREDIENTES (para inventario) ───────────────────────────────
export const seedIngredients = [
  { id: 'ing-1',  name: 'Carne de res 150g',     unit: 'porción', stock: 80,  minStock: 20, cost: 4500 },
  { id: 'ing-2',  name: 'Carne de res 200g',     unit: 'porción', stock: 60,  minStock: 15, cost: 6000 },
  { id: 'ing-3',  name: 'Pan brioche',            unit: 'unidad',  stock: 100, minStock: 30, cost: 1200 },
  { id: 'ing-4',  name: 'Queso cheddar',          unit: 'loncha',  stock: 150, minStock: 40, cost: 800  },
  { id: 'ing-5',  name: 'Queso mozzarella',       unit: 'loncha',  stock: 80,  minStock: 20, cost: 900  },
  { id: 'ing-6',  name: 'Lechuga',                unit: 'hoja',    stock: 200, minStock: 50, cost: 150  },
  { id: 'ing-7',  name: 'Tomate',                 unit: 'rodaja',  stock: 300, minStock: 60, cost: 200  },
  { id: 'ing-8',  name: 'Cebolla caramelizada',   unit: 'porción', stock: 50,  minStock: 15, cost: 600  },
  { id: 'ing-9',  name: 'Tocino/Bacon',           unit: 'loncha',  stock: 120, minStock: 30, cost: 1200 },
  { id: 'ing-10', name: 'Aguacate/Guacamole',     unit: 'porción', stock: 40,  minStock: 10, cost: 1500 },
  { id: 'ing-11', name: 'Huevo',                  unit: 'unidad',  stock: 60,  minStock: 20, cost: 500  },
  { id: 'ing-12', name: 'Salsa especial de la casa', unit: 'porción', stock: 100, minStock: 20, cost: 400 },
  { id: 'ing-13', name: 'Salsa BBQ',              unit: 'porción', stock: 80,  minStock: 20, cost: 350  },
  { id: 'ing-14', name: 'Papas frescas',          unit: 'porción', stock: 90,  minStock: 25, cost: 1800 },
  { id: 'ing-15', name: 'Papas premium batata',   unit: 'porción', stock: 40,  minStock: 10, cost: 2500 },
  { id: 'ing-16', name: 'Aceite vegetal',         unit: 'ml',      stock: 5000,minStock: 500, cost: 20  },
  { id: 'ing-17', name: 'Aros de cebolla',        unit: 'porción', stock: 50,  minStock: 15, cost: 1200 },
  { id: 'ing-18', name: 'Coca-Cola 400ml',        unit: 'unidad',  stock: 60,  minStock: 24, cost: 2200 },
  { id: 'ing-19', name: 'Agua 500ml',             unit: 'unidad',  stock: 48,  minStock: 24, cost: 800  },
  { id: 'ing-20', name: 'Limonada base',          unit: 'porción', stock: 40,  minStock: 10, cost: 1500 },
  { id: 'ing-21', name: 'Michelada base',         unit: 'porción', stock: 30,  minStock: 10, cost: 2000 },
  { id: 'ing-22', name: 'Helado vainilla',        unit: 'porción', stock: 20,  minStock: 8,  cost: 2500 },
  { id: 'ing-23', name: 'Jalapeños',              unit: 'porción', stock: 60,  minStock: 15, cost: 500  },
  { id: 'ing-24', name: 'Champiñones',            unit: 'porción', stock: 35,  minStock: 10, cost: 1800 },
];

// ─── PRODUCTOS DEL MENÚ ───────────────────────────────────────────
export const seedProducts = [
  // HAMBURGUESAS CLÁSICAS
  {
    id: 'prod-1', categoryId: 'cat-1', name: 'Classic Burger',
    description: 'Carne de res 150g, lechuga, tomate, cebolla, salsa especial',
    price: 19900, isActive: true,
    ingredients: [
      { ingredientId: 'ing-1', quantity: 1 },
      { ingredientId: 'ing-3', quantity: 1 },
      { ingredientId: 'ing-6', quantity: 2 },
      { ingredientId: 'ing-7', quantity: 2 },
      { ingredientId: 'ing-12', quantity: 1 },
    ],
  },
  {
    id: 'prod-2', categoryId: 'cat-1', name: 'Cheese Burger',
    description: 'Carne de res 150g, queso cheddar, lechuga, tomate, salsa especial',
    price: 22900, isActive: true,
    ingredients: [
      { ingredientId: 'ing-1', quantity: 1 },
      { ingredientId: 'ing-3', quantity: 1 },
      { ingredientId: 'ing-4', quantity: 1 },
      { ingredientId: 'ing-6', quantity: 2 },
      { ingredientId: 'ing-7', quantity: 2 },
      { ingredientId: 'ing-12', quantity: 1 },
    ],
  },
  {
    id: 'prod-3', categoryId: 'cat-1', name: 'BBQ Burger',
    description: 'Carne 150g, tocino, cebolla caramelizada, queso cheddar, salsa BBQ',
    price: 26900, isActive: true,
    ingredients: [
      { ingredientId: 'ing-1', quantity: 1 },
      { ingredientId: 'ing-3', quantity: 1 },
      { ingredientId: 'ing-4', quantity: 2 },
      { ingredientId: 'ing-8', quantity: 1 },
      { ingredientId: 'ing-9', quantity: 2 },
      { ingredientId: 'ing-13', quantity: 1 },
    ],
  },
  // HAMBURGUESAS ESPECIALES
  {
    id: 'prod-4', categoryId: 'cat-2', name: 'Paladar Signature',
    description: 'Carne 200g doble, dos quesos, tocino, huevo, aguacate, salsa especial',
    price: 39900, isActive: true,
    ingredients: [
      { ingredientId: 'ing-2', quantity: 1 },
      { ingredientId: 'ing-3', quantity: 1 },
      { ingredientId: 'ing-4', quantity: 1 },
      { ingredientId: 'ing-5', quantity: 1 },
      { ingredientId: 'ing-9', quantity: 2 },
      { ingredientId: 'ing-10', quantity: 1 },
      { ingredientId: 'ing-11', quantity: 1 },
      { ingredientId: 'ing-12', quantity: 1 },
    ],
  },
  {
    id: 'prod-5', categoryId: 'cat-2', name: 'Smash Burger Doble',
    description: 'Dos carnes aplastadas 150g, doble cheddar, pepinillos, cebolla, mostaza',
    price: 34900, isActive: true,
    ingredients: [
      { ingredientId: 'ing-1', quantity: 2 },
      { ingredientId: 'ing-3', quantity: 1 },
      { ingredientId: 'ing-4', quantity: 2 },
      { ingredientId: 'ing-12', quantity: 1 },
    ],
  },
  {
    id: 'prod-6', categoryId: 'cat-2', name: 'Mushroom Swiss',
    description: 'Carne 200g, champiñones salteados, queso mozzarella, salsa especial',
    price: 32900, isActive: true,
    ingredients: [
      { ingredientId: 'ing-2', quantity: 1 },
      { ingredientId: 'ing-3', quantity: 1 },
      { ingredientId: 'ing-5', quantity: 2 },
      { ingredientId: 'ing-24', quantity: 1 },
      { ingredientId: 'ing-12', quantity: 1 },
    ],
  },
  {
    id: 'prod-7', categoryId: 'cat-2', name: 'Hot Jalapeño Burger',
    description: 'Carne 150g, jalapeños, queso cheddar, tocino crujiente, salsa picante',
    price: 29900, isActive: true,
    ingredients: [
      { ingredientId: 'ing-1', quantity: 1 },
      { ingredientId: 'ing-3', quantity: 1 },
      { ingredientId: 'ing-4', quantity: 2 },
      { ingredientId: 'ing-9', quantity: 1 },
      { ingredientId: 'ing-23', quantity: 1 },
      { ingredientId: 'ing-12', quantity: 1 },
    ],
  },
  // ACOMPAÑAMIENTOS
  {
    id: 'prod-8', categoryId: 'cat-4', name: 'Papas Fritas Medianas',
    description: 'Papas frescas cortadas en casa, sal y especias',
    price: 8900, isActive: true,
    ingredients: [
      { ingredientId: 'ing-14', quantity: 1 },
      { ingredientId: 'ing-16', quantity: 50 },
    ],
  },
  {
    id: 'prod-9', categoryId: 'cat-4', name: 'Papas Fritas Grandes',
    description: 'Papas frescas tamaño grande, sal y especias',
    price: 11900, isActive: true,
    ingredients: [
      { ingredientId: 'ing-14', quantity: 1.5 },
      { ingredientId: 'ing-16', quantity: 70 },
    ],
  },
  {
    id: 'prod-10', categoryId: 'cat-4', name: 'Papas Batata',
    description: 'Papas de batata premium con sal de mar',
    price: 12900, isActive: true,
    ingredients: [
      { ingredientId: 'ing-15', quantity: 1 },
      { ingredientId: 'ing-16', quantity: 50 },
    ],
  },
  {
    id: 'prod-11', categoryId: 'cat-4', name: 'Aros de Cebolla',
    description: 'Aros de cebolla apanados, crujientes',
    price: 10900, isActive: true,
    ingredients: [
      { ingredientId: 'ing-17', quantity: 1 },
      { ingredientId: 'ing-16', quantity: 50 },
    ],
  },
  // BEBIDAS
  {
    id: 'prod-12', categoryId: 'cat-5', name: 'Coca-Cola 400ml',
    description: 'Gaseosa helada',
    price: 5900, isActive: true,
    ingredients: [{ ingredientId: 'ing-18', quantity: 1 }],
  },
  {
    id: 'prod-13', categoryId: 'cat-5', name: 'Agua Mineral 500ml',
    description: 'Agua mineral sin gas',
    price: 3900, isActive: true,
    ingredients: [{ ingredientId: 'ing-19', quantity: 1 }],
  },
  {
    id: 'prod-14', categoryId: 'cat-5', name: 'Limonada Natural',
    description: 'Limonada de limón exprimido, con o sin leche',
    price: 8900, isActive: true,
    ingredients: [{ ingredientId: 'ing-20', quantity: 1 }],
  },
  {
    id: 'prod-15', categoryId: 'cat-5', name: 'Michelada',
    description: 'Cerveza con limón, sal y especias',
    price: 12900, isActive: true,
    ingredients: [{ ingredientId: 'ing-21', quantity: 1 }],
  },
  // COMBOS
  {
    id: 'prod-16', categoryId: 'cat-3', name: 'Combo Classic',
    description: 'Classic Burger + Papas Medianas + Gaseosa',
    price: 31900, isActive: true,
    ingredients: [
      { ingredientId: 'ing-1', quantity: 1 },
      { ingredientId: 'ing-3', quantity: 1 },
      { ingredientId: 'ing-6', quantity: 2 },
      { ingredientId: 'ing-7', quantity: 2 },
      { ingredientId: 'ing-12', quantity: 1 },
      { ingredientId: 'ing-14', quantity: 1 },
      { ingredientId: 'ing-16', quantity: 50 },
      { ingredientId: 'ing-18', quantity: 1 },
    ],
  },
  {
    id: 'prod-17', categoryId: 'cat-3', name: 'Combo Paladar Premium',
    description: 'Paladar Signature + Papas Grandes + Bebida',
    price: 55900, isActive: true,
    ingredients: [
      { ingredientId: 'ing-2', quantity: 1 },
      { ingredientId: 'ing-3', quantity: 1 },
      { ingredientId: 'ing-4', quantity: 1 },
      { ingredientId: 'ing-5', quantity: 1 },
      { ingredientId: 'ing-9', quantity: 2 },
      { ingredientId: 'ing-10', quantity: 1 },
      { ingredientId: 'ing-11', quantity: 1 },
      { ingredientId: 'ing-12', quantity: 1 },
      { ingredientId: 'ing-14', quantity: 1.5 },
      { ingredientId: 'ing-16', quantity: 70 },
      { ingredientId: 'ing-18', quantity: 1 },
    ],
  },
  // POSTRES
  {
    id: 'prod-18', categoryId: 'cat-6', name: 'Helado Vainilla',
    description: 'Helado artesanal de vainilla, 2 bolas',
    price: 9900, isActive: true,
    ingredients: [{ ingredientId: 'ing-22', quantity: 1 }],
  },
];

// ─── MODIFICADORES ────────────────────────────────────────────────
export const seedModifiers = [
  { id: 'mod-1',  name: 'Sin cebolla',            priceDelta: 0 },
  { id: 'mod-2',  name: 'Sin lechuga',             priceDelta: 0 },
  { id: 'mod-3',  name: 'Sin tomate',              priceDelta: 0 },
  { id: 'mod-4',  name: 'Extra queso cheddar',     priceDelta: 2000 },
  { id: 'mod-5',  name: 'Extra tocino',            priceDelta: 3000 },
  { id: 'mod-6',  name: 'Extra aguacate',          priceDelta: 2500 },
  { id: 'mod-7',  name: 'Término 3/4',             priceDelta: 0 },
  { id: 'mod-8',  name: 'Término bien cocido',     priceDelta: 0 },
  { id: 'mod-9',  name: 'Pan sin gluten',          priceDelta: 2000 },
  { id: 'mod-10', name: 'Extra salsa picante',     priceDelta: 0 },
];

// ─── EMPLEADOS ────────────────────────────────────────────────────
export const seedStaff = [
  { id: 'emp-1', name: 'Rodrigo Sotelo',  role: 'Administrador', shift: 'Día',   hourlyRate: 0,     phone: '', isActive: true },
  { id: 'emp-2', name: 'Carlos Gómez',    role: 'Cajero',        shift: 'Día',   hourlyRate: 7500,  phone: '', isActive: true },
  { id: 'emp-3', name: 'María López',     role: 'Cocinero',      shift: 'Día',   hourlyRate: 7500,  phone: '', isActive: true },
  { id: 'emp-4', name: 'Andrés Ruiz',     role: 'Domiciliario',  shift: 'Tarde', hourlyRate: 6500,  phone: '', isActive: true },
  { id: 'emp-5', name: 'Laura Martínez',  role: 'Auxiliar',      shift: 'Tarde', hourlyRate: 6500,  phone: '', isActive: true },
];

// ─── PROVEEDORES ──────────────────────────────────────────────────
export const seedSuppliers = [
  { id: 'sup-1', name: 'Carnes Premium SAS',     contact: '310 000 0001', products: 'Carnes de res', email: 'ventas@carnespremium.co' },
  { id: 'sup-2', name: 'Pan Artesanal Bogotá',   contact: '310 000 0002', products: 'Pan brioche, panes', email: '' },
  { id: 'sup-3', name: 'Lácteos del Valle',      contact: '310 000 0003', products: 'Quesos, mantequilla', email: '' },
  { id: 'sup-4', name: 'Distribuidora Frisby',   contact: '310 000 0004', products: 'Bebidas, gaseosas', email: '' },
  { id: 'sup-5', name: 'Verduras Frescas Cod.',  contact: '310 000 0005', products: 'Vegetales, aguacate', email: '' },
];

// ─── PROMOCIONES INICIALES ────────────────────────────────────────
export const seedPromotions = [
  {
    id: 'promo-1',
    name: 'Happy Hour Bebidas',
    description: '30% en todas las bebidas de 3pm a 6pm',
    type: 'percentage',
    value: 30,
    categoryIds: ['cat-5'],
    productIds: [],
    channels: ['all'],
    isActive: true,
    requiresCoupon: false,
    startDate: null,
    endDate: null,
    activeDays: [1, 2, 3, 4, 5], // Lunes a Viernes
    startTime: '15:00',
    endTime: '18:00',
    maxUses: null,
    usedCount: 0,
  },
  {
    id: 'promo-2',
    name: 'Lunes de Classic',
    description: '20% de descuento en Classic Burger los lunes',
    type: 'percentage',
    value: 20,
    categoryIds: [],
    productIds: ['prod-1'],
    channels: ['all'],
    isActive: true,
    requiresCoupon: false,
    startDate: null,
    endDate: null,
    activeDays: [1], // Solo lunes
    startTime: null,
    endTime: null,
    maxUses: null,
    usedCount: 0,
  },
];

// ─── CONFIGURACIÓN DEL NEGOCIO ────────────────────────────────────
export const seedBusinessConfig = {
  name: 'Paladar Grill',
  nit: '',
  address: '',
  phone: '',
  city: 'Bogotá',
  country: 'Colombia',
  currency: 'COP',
  taxRate: 0.08, // Impoconsumo 8%
  taxName: 'Impoconsumo',
  deliveryPlatforms: [
    { id: 'rappi',      name: 'Rappi',       commission: 0.30, isActive: true },
    { id: 'ifood',      name: 'iFood',       commission: 0.27, isActive: true },
    { id: 'pedidosya',  name: 'PedidosYa',   commission: 0.25, isActive: true },
    { id: 'own',        name: 'Domicilio Propio', commission: 0, isActive: true },
  ],
};
