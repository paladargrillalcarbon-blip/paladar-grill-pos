import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSuppliersStore = create(
  persist(
    (set, get) => ({
      suppliers: [],
      purchaseOrders: [], // { id, date, supplierId, totalAmount, status }

      addSupplier: (supplier) => set((s) => ({
        suppliers: [...s.suppliers, { ...supplier, id: `sup-${Date.now()}` }]
      })),

      updateSupplier: (id, data) => set((s) => ({
        suppliers: s.suppliers.map(sup => sup.id === id ? { ...sup, ...data } : sup)
      })),

      deleteSupplier: (id) => set((s) => ({
        suppliers: s.suppliers.filter(sup => sup.id !== id)
      })),

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
