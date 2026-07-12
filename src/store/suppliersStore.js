import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSuppliersStore = create(
  persist(
    (set, get) => ({
      suppliers: [
        { id: 'sup-1', name: 'Distribuidora Carnes Premium', contact: 'Carlos López', phone: '3001112233', categories: 'Carnes, Aves', deliveryDays: 'Lunes, Jueves' },
        { id: 'sup-2', name: 'Fruver El Campesino', contact: 'Doña Rosa', phone: '3102223344', categories: 'Verduras, Frutas', deliveryDays: 'Diario' },
        { id: 'sup-3', name: 'Panificadora La Espiga', contact: 'Julián', phone: '3203334455', categories: 'Panadería', deliveryDays: 'Lunes, Miércoles, Viernes' }
      ],
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
    { name: 'paladar-suppliers-storage' }
  )
);
