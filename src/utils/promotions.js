/**
 * Motor de validación y aplicación de promociones
 * Principio: el precio base NUNCA se modifica.
 * El descuento es una línea separada en el pedido.
 */

/**
 * Valida si una promoción está activa en este momento
 */
export const isPromotionActive = (promo) => {
  if (!promo.isActive) return false;

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const currentHour = now.getHours() * 60 + now.getMinutes(); // minutos desde medianoche
  const dayOfWeek = now.getDay(); // 0=Domingo, 1=Lunes...

  // Verificar rango de fechas
  if (promo.startDate && today < promo.startDate) return false;
  if (promo.endDate && today > promo.endDate) return false;

  // Verificar días de la semana
  if (promo.activeDays && promo.activeDays.length > 0) {
    if (!promo.activeDays.includes(dayOfWeek)) return false;
  }

  // Verificar horario (Happy Hour, etc.)
  if (promo.startTime && promo.endTime) {
    const [sh, sm] = promo.startTime.split(':').map(Number);
    const [eh, em] = promo.endTime.split(':').map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    if (currentHour < start || currentHour > end) return false;
  }

  // Verificar límite de usos
  if (promo.maxUses && promo.usedCount >= promo.maxUses) return false;

  return true;
};

/**
 * Verifica si una promoción aplica para un producto y canal dados
 */
export const isPromotionApplicable = (promo, product, channel = 'local') => {
  if (!isPromotionActive(promo)) return false;

  // Verificar canal
  if (promo.channels && !promo.channels.includes(channel) && !promo.channels.includes('all')) {
    return false;
  }

  // Verificar producto o categoría
  if (promo.productIds && promo.productIds.length > 0) {
    if (!promo.productIds.includes(product.id)) return false;
  }
  if (promo.categoryIds && promo.categoryIds.length > 0) {
    if (!promo.categoryIds.includes(product.categoryId)) return false;
  }

  return true;
};

/**
 * Calcula el monto de descuento para un ítem con una promoción aplicada
 */
export const calcItemDiscount = (promo, item) => {
  const basePrice = item.price;
  const quantity = item.quantity || 1;

  switch (promo.type) {
    case 'percentage':
      // Ej: 20% de descuento
      return Math.round(basePrice * (promo.value / 100));

    case 'fixed_price':
      // Ej: Precio fijo $18.000 (el descuento es la diferencia)
      return Math.max(0, basePrice - promo.value);

    case 'fixed_amount':
      // Ej: $5.000 de descuento
      return Math.min(promo.value, basePrice);

    case 'two_for_one':
      // 2x1: en un par de ítems, uno es gratis
      // El descuento es el precio del 2do ítem en grupos de 2
      const pairsCount = Math.floor(quantity / 2);
      return pairsCount > 0 ? Math.round((basePrice * pairsCount) / quantity) : 0;

    default:
      return 0;
  }
};

/**
 * Obtiene las promociones automáticas aplicables a un producto
 * (sin necesidad de cupón)
 */
export const getAutoPromotionsForProduct = (promotions, product, channel) => {
  return promotions.filter(
    (p) => !p.requiresCoupon && isPromotionApplicable(p, product, channel)
  );
};

/**
 * Calcula cuántas unidades extra se descuentan del inventario
 * para promociones como 2x1 (se consumen 2 pero se cobra 1)
 */
export const getInventoryImpact = (promo, quantity) => {
  if (promo.type === 'two_for_one') {
    return quantity + Math.floor(quantity / 2); // consume el doble en pares
  }
  return quantity; // el resto no afecta el inventario diferente
};
