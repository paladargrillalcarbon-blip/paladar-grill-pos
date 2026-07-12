import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calcOrderTotals } from '../utils/taxes';

const generateId = () => `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export const useOrdersStore = create(
  persist(
    (set, get) => ({
      orders: [],

      saveOrder: (orderData, totals, payments = []) => {
        let savedOrder;
        set((s) => {
          const isExisting = orderData.id && s.orders.some(o => o.id === orderData.id);
          const paymentStatus = payments.length > 0 ? 'paid' : 'unpaid';
          const now = new Date().toISOString();
          
          if (isExisting) {
            const updatedOrders = s.orders.map(o => {
              if (o.id === orderData.id) {
                const isNowPaid = payments.length > 0;
                // Si se está pagando y la orden estaba en "ready" (o si el usuario quiere que al pagar desaparezca), 
                // la auto-marcamos como "delivered" para limpiar la cocina.
                const newStatus = (isNowPaid && o.status === 'ready') ? 'delivered' : o.status;

                savedOrder = {
                  ...o,
                  ...orderData,
                  totals,
                  payments: isNowPaid ? payments : o.payments,
                  paymentStatus: isNowPaid ? 'paid' : o.paymentStatus,
                  status: newStatus,
                  updatedAt: now
                };
                return savedOrder;
              }
              return o;
            });
            return { orders: updatedOrders };
          } else {
            savedOrder = {
              ...orderData,
              id: orderData.id || generateId(),
              createdAt: now,
              status: 'pending',
              paymentStatus,
              totals,
              payments,
              updatedAt: now,
            };
            return { orders: [savedOrder, ...s.orders] };
          }
        });
        return savedOrder;
      },

      updateStatus: (orderId, status) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o
          ),
        })),

      cancelOrder: (orderId) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? { ...o, status: 'cancelled', updatedAt: new Date().toISOString() }
              : o
          ),
        })),

      getActiveOrders: () => {
        return get().orders.filter(
          (o) => !['delivered', 'cancelled'].includes(o.status)
        );
      },

      getTodaysOrders: () => {
        const today = new Date().toISOString().split('T')[0];
        return get().orders.filter((o) => o.createdAt.startsWith(today));
      },

      getOrdersByDateRange: (startDate, endDate) => {
        return get().orders.filter((o) => {
          const d = o.createdAt.split('T')[0];
          return d >= startDate && d <= endDate;
        });
      },
    }),
    { name: 'paladar-orders' }
  )
);
