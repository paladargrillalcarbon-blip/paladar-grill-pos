/**
 * Formatea un número como moneda colombiana COP
 */
export const formatCOP = (amount) => {
  if (amount === null || amount === undefined) return '$0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Formatea un número como porcentaje
 */
export const formatPercent = (value) => {
  return `${(value * 100).toFixed(1)}%`;
};

/**
 * Parsea un string de moneda a número
 */
export const parseCOP = (str) => {
  return parseInt(str.replace(/[^0-9]/g, ''), 10) || 0;
};
