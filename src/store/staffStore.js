import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStaffStore = create(
  persist(
    (set, get) => ({
      staff: [
        { id: 'staff-1', name: 'Juan Pérez', role: 'Administrador', salary: 1500000, phone: '3001234567', isActive: true },
        { id: 'staff-2', name: 'María Gómez', role: 'Cajero', salary: 1300000, phone: '3109876543', isActive: true },
        { id: 'staff-3', name: 'Carlos Díaz', role: 'Mesero', salary: 1160000, phone: '3205554433', isActive: true }
      ],
      payrollRecords: [], // Historial de pagos de nómina { id, date, staffId, amount, type }

      addStaff: (employee) => set((s) => ({
        staff: [...s.staff, { ...employee, id: `staff-${Date.now()}` }]
      })),

      updateStaff: (id, employeeData) => set((s) => ({
        staff: s.staff.map(e => e.id === id ? { ...e, ...employeeData } : e)
      })),

      deleteStaff: (id) => set((s) => ({
        staff: s.staff.filter(e => e.id !== id)
      })),

      recordPayment: (staffId, amount, type = 'Salario Mensual', note = '') => set((s) => ({
        payrollRecords: [
          { id: `pay-${Date.now()}`, date: new Date().toISOString(), staffId, amount, type, note },
          ...s.payrollRecords
        ]
      }))
    }),
    { name: 'paladar-staff-storage' }
  )
);
