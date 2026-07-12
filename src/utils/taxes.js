/**
 * Impuesto al Consumo Colombia — 8%
 * Se aplica sobre el precio neto (con descuentos aplicados)
 * NO se aplica sobre propinas
 */
export const IMPOCONSUMO_RATE = 0.08;

/**
 * Calcula el Impoconsumo sobre el subtotal (ya con descuentos)
 */
export const calcImpoconsumo = (subtotalWithDiscounts) => {
  return Math.round(subtotalWithDiscounts * IMPOCONSUMO_RATE);
};

/**
 * Calcula el desglose completo de un pedido
 */
export const calcOrderTotals = (items, tip = 0) => {
  const grossTotal = items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  const totalDiscounts = items.reduce((sum, item) => {
    return sum + (item.discountAmount || 0) * item.quantity;
  }, 0);

  const netTotal = grossTotal - totalDiscounts;
  const impoconsumo = calcImpoconsumo(netTotal);
  const grandTotal = netTotal + impoconsumo + tip;

  return {
    grossTotal,       // Venta bruta
    totalDiscounts,   // Total descuentos
    netTotal,         // Venta neta (base para impoconsumo)
    impoconsumo,      // 8% sobre venta neta
    tip,              // Propina (sin impoconsumo)
    grandTotal,       // Total a cobrar
  };
};
