import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export const useSuppliersStore = create(
  persist(
    (set, get) => ({
      suppliers: [],
      purchaseOrders: [], // { id, date, supplierId, totalAmount, status }

      fetchSuppliers: async () => {
        try {
          const { data, error } = await supabase
            .from('suppliers')
            .select('*')
            .order('name');

          if (error) console.error('fetchSuppliers error:', error);
          if (data && data.length > 0) {
            set({ suppliers: data });
          }
        } catch (err) {
          console.error('fetchSuppliers catch:', err);
        }
      },

      addSupplier: async (supplier) => {
        const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sup-${Date.now()}`;
        const newSup = { ...supplier, id: newId };
        set((s) => ({ suppliers: [...s.suppliers, newSup] }));

        try {
          await supabase.from('suppliers').insert([{
            id: newId,
            name: supplier.name,
            contact_name: supplier.contactName || supplier.contact_name || '',
            phone: supplier.phone || '',
            email: supplier.email || '',
          }]);
        } catch (err) {
          console.error('addSupplier Supabase error:', err);
        }
      },

      updateSupplier: async (id, data) => {
        set((s) => ({
          suppliers: s.suppliers.map(sup => sup.id === id ? { ...sup, ...data } : sup)
        }));

        try {
          await supabase.from('suppliers').update(data).eq('id', id);
        } catch (err) {
          console.error('updateSupplier Supabase error:', err);
        }
      },

      deleteSupplier: async (id) => {
        set((s) => ({
          suppliers: s.suppliers.filter(sup => sup.id !== id)
        }));

        try {
          await supabase.from('suppliers').delete().eq('id', id);
        } catch (err) {
          console.error('deleteSupplier Supabase error:', err);
        }
      },

      addPurchaseOrder: (order) => set((s) => ({
        purchaseOrders: [
          { ...order, id: `po-${Date.now()}`, date: new Date().toISOString() },
          ...s.purchaseOrders
        ]
      }))
    }),
    { name: 'paladar-suppliers-storage-v2' }
  )
);
