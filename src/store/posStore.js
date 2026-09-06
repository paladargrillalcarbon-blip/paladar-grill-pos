import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import {
  seedCategories, seedProducts, seedModifiers,
  seedBusinessConfig, seedPromotions,
} from '../data/seed';
import { calcOrderTotals } from '../utils/taxes';
import { calcItemDiscount } from '../utils/promotions';

const generateId = () => `order-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const usePosStore = create(
  persist(
    (set, get) => ({
      // Config
      config: seedBusinessConfig,
      categories: seedCategories,
      products: seedProducts,
      modifiers: seedModifiers,
      loadingMenu: false,

      // --- CARGA DESDE SUPABASE ---
      fetchMenu: async () => {
        set({ loadingMenu: true });
        try {
          // Categorías
          const { data: catData, error: catError } = await supabase
            .from('categories')
            .select('*')
            .order('created_at', { ascending: true });

          if (catError) {
            console.error('Error fetching categories from Supabase:', catError);
          }

          // Productos
          const { data: prodData, error: prodError } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: true });

          if (prodError) {
            console.error('Error fetching products from Supabase:', prodError);
          }

          if (catData && catData.length > 0) {
            const mappedCats = catData.map(c => ({
              ...c,
              icon: c.image_url || c.icon || '🍽️',
              isActive: c.is_active !== undefined ? c.is_active : true
            }));
            set({ categories: mappedCats });
          }

          if (prodData && prodData.length > 0) {
            const mappedProds = prodData.map(p => ({
              ...p,
              price: Number(p.price) || 0,
              categoryId: p.category_id || p.categoryId,
              isActive: p.is_available !== undefined ? p.is_available : true
            }));
            set({ products: mappedProds });
          }

          set({ loadingMenu: false });
        } catch (err) {
          console.error('Error in fetchMenu:', err);
          set({ loadingMenu: false });
        }
      },

      // --- MENÚ CRUD (SUPABASE + LOCAL) ---
      addCategory: async (category) => {
        const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cat-${Date.now()}`;
        const newCat = {
          id: newId,
          name: category.name,
          description: category.description || '',
          image_url: category.icon || category.image_url || '',
          is_active: category.isActive !== undefined ? category.isActive : true
        };

        // Estado local inmediato
        set((s) => ({
          categories: [...s.categories, { ...newCat, icon: newCat.image_url, isActive: newCat.is_active }]
        }));

        try {
          const { data, error } = await supabase
            .from('categories')
            .insert([newCat])
            .select()
            .single();

          if (error) {
            console.error('Error al insertar categoría en Supabase:', error);
            alert('Error al guardar categoría en Supabase: ' + error.message);
          } else if (data) {
            set((s) => ({
              categories: s.categories.map(c => c.id === newId ? {
                ...data,
                icon: data.image_url || '🍽️',
                isActive: data.is_active !== undefined ? data.is_active : true
              } : c)
            }));
          }
        } catch (err) {
          console.error('addCategory error:', err);
        }
      },

      updateCategory: async (id, categoryData) => {
        set((s) => ({
          categories: s.categories.map(c => c.id === id ? { ...c, ...categoryData } : c)
        }));

        try {
          const updatePayload = {};
          if (categoryData.name !== undefined) updatePayload.name = categoryData.name;
          if (categoryData.description !== undefined) updatePayload.description = categoryData.description;
          if (categoryData.icon !== undefined) updatePayload.image_url = categoryData.icon;
          if (categoryData.isActive !== undefined) updatePayload.is_active = categoryData.isActive;

          const { error } = await supabase
            .from('categories')
            .update(updatePayload)
            .eq('id', id);

          if (error) console.error('Error al actualizar categoría en Supabase:', error);
        } catch (err) {
          console.error('updateCategory error:', err);
        }
      },

      deleteCategory: async (id) => {
        set((s) => ({
          categories: s.categories.filter(c => c.id !== id),
          products: s.products.filter(p => p.categoryId !== id && p.category_id !== id)
        }));

        try {
          const { error } = await supabase
            .from('categories')
            .delete()
            .eq('id', id);

          if (error) console.error('Error al eliminar categoría en Supabase:', error);
        } catch (err) {
          console.error('deleteCategory error:', err);
        }
      },

      addProduct: async (product) => {
        const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `prod-${Date.now()}`;
        const newProd = {
          id: newId,
          category_id: product.categoryId || product.category_id,
          name: product.name,
          description: product.description || '',
          price: Number(product.price) || 0,
          image_url: product.image_url || '',
          is_available: product.isActive !== undefined ? product.isActive : true
        };

        const localProd = {
          ...newProd,
          categoryId: newProd.category_id,
          isActive: newProd.is_available
        };

        // Estado local inmediato
        set((s) => ({
          products: [...s.products, localProd]
        }));

        try {
          const { data, error } = await supabase
            .from('products')
            .insert([newProd])
            .select()
            .single();

          if (error) {
            console.error('Error al insertar producto en Supabase:', error);
            alert('Error al guardar producto en Supabase: ' + error.message);
          } else if (data) {
            set((s) => ({
              products: s.products.map(p => p.id === newId ? {
                ...data,
                price: Number(data.price),
                categoryId: data.category_id,
                isActive: data.is_available !== undefined ? data.is_available : true
              } : p)
            }));
          }
        } catch (err) {
          console.error('addProduct error:', err);
        }
      },

      updateProduct: async (id, productData) => {
        set((s) => ({
          products: s.products.map(p => p.id === id ? { ...p, ...productData } : p)
        }));

        try {
          const updatePayload = {};
          if (productData.name !== undefined) updatePayload.name = productData.name;
          if (productData.description !== undefined) updatePayload.description = productData.description;
          if (productData.price !== undefined) updatePayload.price = Number(productData.price);
          if (productData.categoryId !== undefined) updatePayload.category_id = productData.categoryId;
          if (productData.image_url !== undefined) updatePayload.image_url = productData.image_url;
          if (productData.isActive !== undefined) updatePayload.is_available = productData.isActive;

          const { error } = await supabase
            .from('products')
            .update(updatePayload)
            .eq('id', id);

          if (error) console.error('Error al actualizar producto en Supabase:', error);
        } catch (err) {
          console.error('updateProduct error:', err);
        }
      },

      deleteProduct: async (id) => {
        set((s) => ({
          products: s.products.filter(p => p.id !== id)
        }));

        try {
          const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

          if (error) console.error('Error al eliminar producto en Supabase:', error);
        } catch (err) {
          console.error('deleteProduct error:', err);
        }
      },

      // --- MODIFICADORES CRUD ---
      addModifier: (modifier) => set((s) => ({
        modifiers: [...s.modifiers, { ...modifier, id: `mod-${Date.now()}` }]
      })),
      updateModifier: (id, modData) => set((s) => ({
        modifiers: s.modifiers.map(m => m.id === id ? { ...m, ...modData } : m)
      })),
      deleteModifier: (id) => set((s) => ({
        modifiers: s.modifiers.filter(m => m.id !== id)
      })),

      // --- CONFIG CRUD ---
      updateConfig: (newConfig) => set((s) => ({
        config: { ...s.config, ...newConfig }
      })),

      // --- PROMOCIONES CRUD ---
      promotions: seedPromotions,
      addPromotion: (promo) => set((s) => ({
        promotions: [...s.promotions, { ...promo, id: `promo-${Date.now()}` }]
      })),
      updatePromotion: (id, promoData) => set((s) => ({
        promotions: s.promotions.map(p => p.id === id ? { ...p, ...promoData } : p)
      })),
      deletePromotion: (id) => set((s) => ({
        promotions: s.promotions.filter(p => p.id !== id)
      })),
      // -----------------

      // Estado de la sesión de caja
      cashSession: null, // { id, openedAt, openedBy, initialAmount }

      // Pedido activo en pantalla
      currentOrder: {
        id: null,
        type: 'local', // local | takeaway | own_delivery | rappi | ifood | pedidosya
        tableNumber: '',
        customerName: '',
        customerId: null, // Asociar con cliente fidelizado
        deliveryAddress: '',
        platform: null,
        platformOrderId: '',
        items: [],       // { productId, name, price, quantity, modifiers[], promotionId, discountAmount, note }
        tip: 0,
        tipMode: null,   // 'percent' | 'custom'
        splitCount: 1,
        notes: '',
      },

      // Acciones sobre el pedido actual
      setOrderType: (type) =>
        set((s) => ({ currentOrder: { ...s.currentOrder, type, platform: type } })),

      setOrderMeta: (meta) =>
        set((s) => ({ currentOrder: { ...s.currentOrder, ...meta } })),

      addItem: (product, customization = { selectedModifiers: [], comboDetails: null }, promotion = null, note = '', quantity = 1) => {
        let discountAmount = 0;
        let appliedPromo = null;

        let finalPrice = product.price;
        if (customization.comboDetails) {
          finalPrice += customization.comboDetails.priceDelta || 0;
        }
        
        const allModifiers = get().modifiers || [];
        customization.selectedModifiers?.forEach(modId => {
          const mod = allModifiers.find(m => m.id === modId);
          if (mod && mod.priceDelta) {
            finalPrice += mod.priceDelta;
          }
        });

        if (promotion) {
          discountAmount = calcItemDiscount(promotion, { price: finalPrice, quantity: 1 });
          appliedPromo = promotion.id;
        }

        const newItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          productId: product.id,
          name: product.name,
          price: finalPrice,
          quantity: Math.max(1, Number(quantity) || 1),
          modifiers: customization.selectedModifiers || [],
          comboDetails: customization.comboDetails || null,
          promotionId: appliedPromo,
          discountAmount,
          note,
        };

        set((s) => ({
          currentOrder: {
            ...s.currentOrder,
            items: [...s.currentOrder.items, newItem],
          },
        }));
      },

      updateItemQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }
        set((s) => ({
          currentOrder: {
            ...s.currentOrder,
            items: s.currentOrder.items.map((it) =>
              it.id === itemId ? { ...it, quantity } : it
            ),
          },
        }));
      },

      removeItem: (id) =>
        set((s) => ({
          currentOrder: {
            ...s.currentOrder,
            items: s.currentOrder.items.filter((i) => i.id !== id),
          },
        })),

      applyPromoToItem: (itemId, promotion) =>
        set((s) => {
          const newItems = s.currentOrder.items.map(item => {
            if (item.id !== itemId) return item;
            if (!promotion) return { ...item, promotionId: null, discountAmount: 0 };
            
            const discountAmount = calcItemDiscount(promotion, { price: item.price, quantity: 1 });
            return { ...item, promotionId: promotion.id, discountAmount };
          });
          return { currentOrder: { ...s.currentOrder, items: newItems } };
        }),

      applyPromoToOrder: (promotion) =>
        set((s) => {
          const newItems = s.currentOrder.items.map(item => {
            const product = s.products.find(p => p.id === item.productId);
            if (!product) return item;
            
            const discountAmount = calcItemDiscount(promotion, { price: item.price, quantity: 1 });
            return { ...item, promotionId: promotion.id, discountAmount };
          });
          return { currentOrder: { ...s.currentOrder, items: newItems } };
        }),

      setTip: (tip, tipMode) =>
        set((s) => ({ currentOrder: { ...s.currentOrder, tip, tipMode: tipMode } })),

      setSplitCount: (count) =>
        set((s) => ({ currentOrder: { ...s.currentOrder, splitCount: count } })),

      clearOrder: () =>
        set((s) => ({
          currentOrder: {
            id: null, type: 'local', tableNumber: '', customerName: '', customerId: null,
            deliveryAddress: '', platform: null, platformOrderId: '',
            items: [], tip: 0, tipMode: null, splitCount: 1, notes: '',
          },
        })),

      loadOrder: (order) =>
        set({
          currentOrder: {
            id: order.id,
            type: order.type || 'local',
            tableNumber: order.tableNumber || '',
            customerName: order.customerName || '',
            customerId: order.customerId || null,
            deliveryAddress: order.deliveryAddress || '',
            platformOrderId: order.platformOrderId || '',
            items: order.items || [],
            tip: order.tip || 0,
            tipMode: null,
            splitCount: 1,
            notes: order.notes || '',
          }
        }),

      getOrderTotals: () => {
        const { currentOrder } = get();
        return calcOrderTotals(currentOrder.items, currentOrder.tip);
      },

      // Caja
      openCashSession: (openedBy, initialAmount) => {
        set({
          cashSession: {
            id: `session-${Date.now()}`,
            openedAt: new Date().toISOString(),
            openedBy,
            initialAmount,
          },
        });
      },

      closeCashSession: () => {
        set({ cashSession: null });
      },
    }),
    { name: 'paladar-pos-v2' }
  )
);
