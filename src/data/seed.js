/**
 * Datos semilla — Paladar Grill
 * Menú de hamburguesería + ingredientes + empleados
 */

// ─── CATEGORÍAS DEL MENÚ ──────────────────────────────────────────
export const seedCategories = [];

// ─── INGREDIENTES (para inventario) ───────────────────────────────
export const seedIngredients = [];

// ─── PRODUCTOS DEL MENÚ ───────────────────────────────────────────
export const seedProducts = [];

// ─── MODIFICADORES ────────────────────────────────────────────────
export const seedModifiers = [];

// ─── EMPLEADOS ────────────────────────────────────────────────────
export const seedStaff = [];

// ─── PROVEEDORES ──────────────────────────────────────────────────
export const seedSuppliers = [];

// ─── PROMOCIONES INICIALES ────────────────────────────────────────
export const seedPromotions = [];

// ─── CONFIGURACIÓN DEL NEGOCIO ────────────────────────────────────
export const seedBusinessConfig = {
  // Datos básicos
  name: 'Paladar Grill',
  slogan: 'La mejor parrilla de la ciudad',
  nit: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  city: 'Bogotá',
  department: 'Cundinamarca',
  country: 'Colombia',
  currency: 'COP',

  // Datos legales Colombia
  taxRate: 0.08,        // Impoconsumo 8%
  taxName: 'Impoconsumo',
  taxRegime: 'Régimen Simplificado', // 'Régimen Simplificado' | 'Responsable de IVA'
  invoiceResolution: '',  // Resolución DIAN Nº
  invoiceResolutionDate: '', // Fecha de resolución
  invoicePrefix: 'FAC',  // Prefijo de factura
  invoiceFrom: '',       // Desde numeración
  invoiceTo: '',         // Hasta numeración
  
  // Textos legales que aparecen en la factura
  legalFooter: 'Esta factura se asimila en todos sus efectos a una letra de cambio. Art. 774 Código de Comercio.',
  returnPolicy: 'No se aceptan devoluciones ni cambios después de 24 horas.',
  thankYouMessage: '¡Gracias por preferirnos! Vuelva pronto.',

  // Logo (base64 string o URL)
  logoUrl: '',

  // Precio combo
  comboPrice: 12000,

  // Plataformas de entrega
  deliveryPlatforms: [
    { id: 'rappi',      name: 'Rappi',       commission: 0.30, isActive: true },
    { id: 'ifood',      name: 'iFood',       commission: 0.27, isActive: true },
    { id: 'pedidosya',  name: 'PedidosYa',   commission: 0.25, isActive: true },
    { id: 'own',        name: 'Domicilio Propio', commission: 0, isActive: true },
  ],
};

