import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { calcOrderTotals } from '../utils/taxes';

const generateId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ord-${Date.now()}`;

export const useOrdersStore = create(
  persist(
    (set, get) => ({
      orders: [],
      loading: false,

      fetchOrders: async () => {
        try {
          const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .order('created_at', { ascending: false })
            .limit(100);

          if (error) {
            console.error('fetchOrders Supabase error:', error);
            return;
          }

          if (data && data.length > 0) {
            const mapped = data.map(o => ({
              id: o.id,
              tableNumber: o.table_number,
              customerName: o.customer_name,
              status: o.status,
              paymentStatus: o.payment_method ? 'paid' : 'unpaid',
              paymentMethod: o.payment_method,
              createdAt: o.created_at,
              totals: {
                subtotal: Number(o.subtotal) || 0,
                tax: Number(o.tax) || 0,
                discount: Number(o.discount) || 0,
                total: Number(o.total) || 0,
              },
              items: (o.order_items || []).map(item => ({
                id: item.id,
                productId: item.product_id,
                quantity: item.quantity,
                price: Number(item.unit_price) || 0,
                note: item.notes || ''
              }))
            }));
            set({ orders: mapped });
          }
        } catch (err) {
          console.error('fetchOrders catch:', err);
        }
      },

      saveOrder: async (orderData, totals, payments = []) => {
        let savedOrder;
        const isExisting = orderData.id && get().orders.some(o => o.id === orderData.id);
        const paymentStatus = payments.length > 0 ? 'paid' : 'unpaid';
        const now = new Date().toISOString();
        const orderId = orderData.id || generateId();
        
        if (isExisting) {
          const updatedOrders = get().orders.map(o => {
            if (o.id === orderData.id) {
              const isNowPaid = payments.length > 0;
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
          set({ orders: updatedOrders });
        } else {
          savedOrder = {
            ...orderData,
            id: orderId,
            createdAt: now,
            status: 'pending',
            paymentStatus,
            totals,
            payments,
            updatedAt: now,
          };
          set((s) => ({ orders: [savedOrder, ...s.orders] }));
        }

        // Sincronizar en segundo plano con Supabase
        try {
          const orderPayload = {
            id: orderId,
            table_number: orderData.tableNumber ? String(orderData.tableNumber) : null,
            customer_name: orderData.customerName || null,
            status: savedOrder.status || 'pending',
            payment_method: payments[0]?.method || null,
            subtotal: totals?.subtotal || 0,
            tax: totals?.tax || 0,
            discount: totals?.discount || 0,
            total: totals?.total || totals?.grandTotal || 0,
            amount_tendered: payments[0]?.amount || null,
          };

          const { error: ordErr } = await supabase
            .from('orders')
            .upsert([orderPayload]);

          if (ordErr) console.error('Supabase saveOrder error:', ordErr);

          // Guardar items si existen y es nueva orden
          if (!isExisting && orderData.items && orderData.items.length > 0) {
            const itemsPayload = orderData.items.map(item => ({
              id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : undefined,
              order_id: orderId,
              product_id: item.productId && item.productId.length > 20 ? item.productId : null,
              quantity: Math.max(1, Number(item.quantity) || 1),
              unit_price: Number(item.price) || 0,
              subtotal: (Number(item.price) || 0) * (Number(item.quantity) || 1),
              notes: item.note || null,
            }));

            await supabase.from('order_items').insert(itemsPayload);
          }
        } catch (err) {
          console.error('saveOrder Supabase sync error:', err);
        }

        return savedOrder;
      },

      updateStatus: async (orderId, status) => {
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString() } : o
          ),
        }));

        try {
          await supabase.from('orders').update({ status }).eq('id', orderId);
        } catch (err) {
          console.error('updateStatus Supabase error:', err);
        }
      },

      cancelOrder: async (orderId) => {
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === orderId
              ? { ...o, status: 'cancelled', updatedAt: new Date().toISOString() }
              : o
          ),
        }));

        try {
          await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
        } catch (err) {
          console.error('cancelOrder Supabase error:', err);
        }
      },

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
    { name: 'paladar-orders-v2' }
  )
);
