import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

      // --- MENÚ CRUD ---
      addCategory: (category) => set((s) => ({
        categories: [...s.categories, { ...category, id: `cat-${Date.now()}` }]
      })),
      updateCategory: (id, categoryData) => set((s) => ({
        categories: s.categories.map(c => c.id === id ? { ...c, ...categoryData } : c)
      })),
      deleteCategory: (id) => set((s) => ({
        categories: s.categories.filter(c => c.id !== id)
      })),

      addProduct: (product) => set((s) => ({
        products: [...s.products, { ...product, id: `prod-${Date.now()}` }]
      })),
      updateProduct: (id, productData) => set((s) => ({
        products: s.products.map(p => p.id === id ? { ...p, ...productData } : p)
      })),
      deleteProduct: (id) => set((s) => ({
        products: s.products.filter(p => p.id !== id)
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

      addItem: (product, modifiers = [], promotion = null, note = '') => {
        let discountAmount = 0;
        let appliedPromo = null;

        if (promotion) {
          discountAmount = calcItemDiscount(promotion, { price: product.price, quantity: 1 });
          appliedPromo = promotion.id;
        }

        const newItem = {
          id: `item-${Date.now()}`,
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          modifiers,
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
            id: null, type: 'local', tableNumber: '', customerName: '',
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
    { name: 'paladar-pos' }
  )
);
