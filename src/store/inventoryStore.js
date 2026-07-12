import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { seedIngredients } from '../data/seed';
import { getInventoryImpact } from '../utils/promotions';

export const useInventoryStore = create(
  persist(
    (set, get) => ({
      ingredients: seedIngredients,
      movements: [], // { id, date, type, ingredientId, quantity, reason, orderId }

      // --- INGREDIENTES CRUD ---
      addIngredient: (ing) => set((s) => ({
        ingredients: [...s.ingredients, { ...ing, id: `ing-${Date.now()}` }]
      })),
      updateIngredient: (id, ingData) => set((s) => ({
        ingredients: s.ingredients.map(i => i.id === id ? { ...i, ...ingData } : i)
      })),
      deleteIngredient: (id) => set((s) => ({
        ingredients: s.ingredients.filter(i => i.id !== id)
      })),
      // -------------------------

      // Entrada de mercancía
      addStock: (ingredientId, quantity, reason = 'Compra', supplierId = null, cost = null) => {
        const movId = `mov-${Date.now()}`;
        set((s) => ({
          ingredients: s.ingredients.map((ing) =>
            ing.id === ingredientId
              ? { ...ing, stock: ing.stock + quantity }
              : ing
          ),
          movements: [
            {
              id: movId,
              date: new Date().toISOString(),
              type: 'in',
              ingredientId,
              quantity,
              reason,
              supplierId,
              cost,
            },
            ...s.movements,
          ],
        }));
      },

      // Salida manual de mercancía (Mermas, Daños, Ajustes)
      removeStock: (ingredientId, quantity, reason = 'Ajuste/Merma') => {
        const movId = `mov-${Date.now()}`;
        set((s) => ({
          ingredients: s.ingredients.map((ing) =>
            ing.id === ingredientId
              ? { ...ing, stock: ing.stock - quantity }
              : ing
          ),
          movements: [
            {
              id: movId,
              date: new Date().toISOString(),
              type: 'out',
              ingredientId,
              quantity,
              reason,
            },
            ...s.movements,
          ],
        }));
      },

      // Descuento de inventario al procesar pedido
      consumeForOrder: (orderId, items, products, promotions = []) => {
        const moves = [];

        items.forEach((item) => {
          const product = products.find((p) => p.id === item.productId);
          if (!product) return;

          const promo = item.promotionId
            ? promotions.find((p) => p.id === item.promotionId)
            : null;

          const actualQuantity = promo
            ? getInventoryImpact(promo, item.quantity)
            : item.quantity;

          product.ingredients.forEach((ing) => {
            const totalQty = ing.quantity * actualQuantity;
            moves.push({ ingredientId: ing.ingredientId, qty: totalQty });
          });
        });

        set((s) => {
          const updatedIngredients = s.ingredients.map((ing) => {
            const consumed = moves
              .filter((m) => m.ingredientId === ing.id)
              .reduce((sum, m) => sum + m.qty, 0);
            return consumed > 0
              ? { ...ing, stock: Math.max(0, ing.stock - consumed) }
              : ing;
          });

          const newMovements = moves.map((m) => ({
            id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            date: new Date().toISOString(),
            type: 'out',
            ingredientId: m.ingredientId,
            quantity: m.qty,
            reason: 'Pedido',
            orderId,
          }));

          return {
            ingredients: updatedIngredients,
            movements: [...newMovements, ...s.movements],
          };
        });
      },

      // Ajuste manual
      adjustStock: (ingredientId, newStock, reason = 'Ajuste manual') => {
        const current = get().ingredients.find((i) => i.id === ingredientId);
        const diff = newStock - (current?.stock || 0);
        set((s) => ({
          ingredients: s.ingredients.map((ing) =>
            ing.id === ingredientId ? { ...ing, stock: newStock } : ing
          ),
          movements: [
            {
              id: `mov-${Date.now()}`,
              date: new Date().toISOString(),
              type: diff >= 0 ? 'in' : 'out',
              ingredientId,
              quantity: Math.abs(diff),
              reason,
            },
            ...s.movements,
          ],
        }));
      },

      updateIngredient: (id, data) =>
        set((s) => ({
          ingredients: s.ingredients.map((i) => (i.id === id ? { ...i, ...data } : i)),
        })),

      addIngredient: (ingredient) =>
        set((s) => ({
          ingredients: [...s.ingredients, { ...ingredient, id: `ing-${Date.now()}` }],
        })),

      getLowStockIngredients: () => {
        return get().ingredients.filter((i) => i.stock <= i.minStock);
      },
    }),
    { name: 'paladar-inventory' }
  )
);
