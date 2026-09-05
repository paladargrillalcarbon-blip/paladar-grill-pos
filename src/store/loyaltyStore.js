import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useLoyaltyStore = create(
  persist(
    (set, get) => ({
      customers: [],

      rewards: [
        { id: 'rew-1', name: 'Gaseosa Personal', pointsCost: 50, stock: 100, isActive: true },
        { id: 'rew-2', name: 'Porción de Papas Fritas', pointsCost: 100, stock: 50, isActive: true },
        { id: 'rew-3', name: 'Hamburguesa Sencilla', pointsCost: 250, stock: 20, isActive: true }
      ],

      settings: {
        accumulationRate: 1000, // 1 punto por cada $1000 gastados
        redemptionRate: 10,     // Cada punto equivale a $10 de descuento
        isActive: true          // El sistema de fidelización está activo
      },

      addCustomer: (customer) => set((s) => {
        const phoneExists = s.customers.some(c => c.phone === customer.phone);
        if (phoneExists) {
          throw new Error('Ya existe un cliente registrado con este número de teléfono.');
        }
        return {
          customers: [
            ...s.customers,
            {
              ...customer,
              id: `cust-${Date.now()}`,
              points: customer.points || 0,
              createdAt: new Date().toISOString(),
              history: customer.points > 0 ? [
                {
                  id: `hist-${Date.now()}`,
                  type: 'accumulation',
                  points: customer.points,
                  date: new Date().toISOString(),
                  description: 'Puntos iniciales'
                }
              ] : []
            }
          ]
        };
      }),

      updateCustomer: (id, customerData) => set((s) => ({
        customers: s.customers.map(c => c.id === id ? { ...c, ...customerData } : c)
      })),

      deleteCustomer: (id) => set((s) => ({
        customers: s.customers.filter(c => c.id !== id)
      })),

      addPoints: (phoneOrId, amount, description = 'Acumulación por compra') => set((s) => {
        const amountInt = Math.floor(amount);
        if (amountInt <= 0) return {};
        
        return {
          customers: s.customers.map(c => {
            if (c.id === phoneOrId || c.phone === phoneOrId) {
              const newPoints = c.points + amountInt;
              const newHistoryItem = {
                id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                type: 'accumulation',
                points: amountInt,
                date: new Date().toISOString(),
                description
              };
              return {
                ...c,
                points: newPoints,
                history: [newHistoryItem, ...c.history]
              };
            }
            return c;
          })
        };
      }),

      redeemPoints: (phoneOrId, amount, description = 'Redención de puntos') => set((s) => {
        const amountInt = Math.floor(amount);
        if (amountInt <= 0) return {};

        let success = true;
        const updatedCustomers = s.customers.map(c => {
          if (c.id === phoneOrId || c.phone === phoneOrId) {
            if (c.points < amountInt) {
              success = false;
              return c;
            }
            const newPoints = c.points - amountInt;
            const newHistoryItem = {
              id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              type: 'redemption',
              points: amountInt,
              date: new Date().toISOString(),
              description
            };
            return {
              ...c,
              points: newPoints,
              history: [newHistoryItem, ...c.history]
            };
          }
          return c;
        });

        if (!success) {
          throw new Error('El cliente no tiene suficientes puntos para realizar esta redención.');
        }

        return { customers: updatedCustomers };
      }),

      addReward: (reward) => set((s) => ({
        rewards: [...s.rewards, { ...reward, id: `rew-${Date.now()}`, isActive: true }]
      })),

      updateReward: (id, rewardData) => set((s) => ({
        rewards: s.rewards.map(r => r.id === id ? { ...r, ...rewardData } : r)
      })),

      deleteReward: (id) => set((s) => ({
        rewards: s.rewards.filter(r => r.id !== id)
      })),

      updateSettings: (settingsData) => set((s) => ({
        settings: { ...s.settings, ...settingsData }
      }))
    }),
    { name: 'paladar-loyalty-storage-v2' }
  )
);
