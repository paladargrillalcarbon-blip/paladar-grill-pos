import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useFinanceStore = create(
  persist(
    (set, get) => ({
      cashClosings: [],   // historial de cierres de caja
      expenses: [],       // gastos operativos manuales
      dailyPurchases: [], // compras del dia { id, date, concept, amount, paymentMethod, category, notes }

      addDailyPurchase: (purchase) =>
        set((s) => ({
          dailyPurchases: [
            {
              ...purchase,
              id: `dp-${Date.now()}`,
              date: new Date().toISOString(),
            },
            ...s.dailyPurchases,
          ],
        })),

      deleteDailyPurchase: (id) =>
        set((s) => ({
          dailyPurchases: s.dailyPurchases.filter((p) => p.id !== id),
        })),

      addCashClosing: (closing) =>
        set((s) => ({
          cashClosings: [
            { ...closing, id: `closing-${Date.now()}`, createdAt: new Date().toISOString() },
            ...s.cashClosings,
          ],
        })),

      addExpense: (expense) =>
        set((s) => ({
          expenses: [
            { ...expense, id: `exp-${Date.now()}`, date: new Date().toISOString() },
            ...s.expenses,
          ],
        })),

      getExpensesByDateRange: (startDate, endDate) => {
        return get().expenses.filter((e) => {
          const d = e.date.split('T')[0];
          return d >= startDate && d <= endDate;
        });
      },

      getClosingsByDateRange: (startDate, endDate) => {
        return get().cashClosings.filter((c) => {
          const d = c.createdAt.split('T')[0];
          return d >= startDate && d <= endDate;
        });
      },
    }),
    { name: 'paladar-finance' }
  )
);
