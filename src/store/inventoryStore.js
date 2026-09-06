import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { seedIngredients } from '../data/seed';
import { getInventoryImpact } from '../utils/promotions';

export const useInventoryStore = create(
  persist(
    (set, get) => ({
      ingredients: seedIngredients,
      movements: [], // { id, date, type, ingredientId, quantity, reason, orderId }
      loading: false,

      fetchIngredients: async () => {
        set({ loading: true });
        try {
          const { data, error } = await supabase
            .from('inventory_items')
            .select('*')
            .order('name');

          if (error) console.error('Error fetching inventory_items:', error);

          if (data && data.length > 0) {
            const mapped = data.map(item => ({
              id: item.id,
              name: item.name,
              unit: item.unit,
              stock: Number(item.current_stock) || 0,
              minStock: Number(item.min_stock_alert) || 0,
              costPerUnit: Number(item.cost_per_unit) || 0,
              lastRestockDate: item.last_restock_date,
            }));
            set({ ingredients: mapped, loading: false });
          } else {
            set({ loading: false });
          }
        } catch (err) {
          console.error('fetchIngredients error:', err);
          set({ loading: false });
        }
      },

      // --- INGREDIENTES CRUD ---
      addIngredient: async (ing) => {
        const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ing-${Date.now()}`;
        const newIng = {
          id: newId,
          name: ing.name,
          unit: ing.unit,
          stock: Number(ing.stock) || 0,
          minStock: Number(ing.minStock) || 0,
          costPerUnit: Number(ing.costPerUnit) || 0,
        };

        set((s) => ({
          ingredients: [...s.ingredients, newIng]
        }));

        try {
          const { data, error } = await supabase
            .from('inventory_items')
            .insert([{
              id: newId,
              name: newIng.name,
              unit: newIng.unit,
              current_stock: newIng.stock,
              min_stock_alert: newIng.minStock,
              cost_per_unit: newIng.costPerUnit,
            }])
            .select()
            .single();

          if (error) console.error('Supabase addIngredient error:', error);
        } catch (err) {
          console.error('addIngredient catch:', err);
        }
      },

      updateIngredient: async (id, ingData) => {
        set((s) => ({
          ingredients: s.ingredients.map(i => i.id === id ? { ...i, ...ingData } : i)
        }));

        try {
          const payload = {};
          if (ingData.name !== undefined) payload.name = ingData.name;
          if (ingData.unit !== undefined) payload.unit = ingData.unit;
          if (ingData.stock !== undefined) payload.current_stock = Number(ingData.stock);
          if (ingData.minStock !== undefined) payload.min_stock_alert = Number(ingData.minStock);
          if (ingData.costPerUnit !== undefined) payload.cost_per_unit = Number(ingData.costPerUnit);

          const { error } = await supabase
            .from('inventory_items')
            .update(payload)
            .eq('id', id);

          if (error) console.error('Supabase updateIngredient error:', error);
        } catch (err) {
          console.error('updateIngredient catch:', err);
        }
      },

      deleteIngredient: async (id) => {
        set((s) => ({
          ingredients: s.ingredients.filter(i => i.id !== id)
        }));

        try {
          const { error } = await supabase
            .from('inventory_items')
            .delete()
            .eq('id', id);

          if (error) console.error('Supabase deleteIngredient error:', error);
        } catch (err) {
          console.error('deleteIngredient catch:', err);
        }
      },
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

          // Consumir sub-productos del combo
          if (item.comboDetails) {
            [item.comboDetails.sideId, item.comboDetails.drinkId].forEach(subProdId => {
              const subProduct = products.find(p => p.id === subProdId);
              if (subProduct && subProduct.ingredients) {
                subProduct.ingredients.forEach(ing => {
                  moves.push({ ingredientId: ing.ingredientId, qty: ing.quantity * actualQuantity });
                });
              }
            });
          }
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
    { name: 'paladar-inventory-v2' }
  )
);
