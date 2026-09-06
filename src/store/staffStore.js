import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useStaffStore = create((set, get) => ({
  staff: [],
  loading: false,
  payrollRecords: [], // Esto podríamos dejarlo local por ahora o migrarlo después

  fetchStaff: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      const mapped = (data || []).map(emp => ({
        ...emp,
        nombre: emp.name || emp.nombre,
        rol: emp.role || emp.rol
      }));
      set({ staff: mapped, loading: false });
    } catch (err) {
      console.error('Error fetching staff:', err);
      set({ loading: false });
    }
  },

  addStaff: async (employee) => {
    set({ loading: true });
    try {
      const newId = employee.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `emp-${Date.now()}`);
      const { data, error } = await supabase
        .from('staff')
        .insert([{
          id: newId,
          name: employee.nombre || employee.name,
          role: employee.rol || employee.role,
          pin_code: employee.pin_code,
          is_active: employee.is_active !== undefined ? employee.is_active : true
        }])
        .select()
        .single();

      if (error) throw error;

      const mapped = {
        ...data,
        nombre: data.name || data.nombre,
        rol: data.role || data.rol
      };

      set((s) => ({
        staff: [mapped, ...s.staff],
        loading: false
      }));
      return { success: true };
    } catch (err) {
      console.error('Error adding staff:', err);
      set({ loading: false });
      return { success: false, error: err.message };
    }
  },

  updateStaff: async (id, employeeData) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('staff')
        .update({
          name: employeeData.nombre || employeeData.name,
          role: employeeData.rol || employeeData.role,
          pin_code: employeeData.pin_code,
          is_active: employeeData.is_active
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const mapped = {
        ...data,
        nombre: data.name || data.nombre,
        rol: data.role || data.rol
      };

      set((s) => ({
        staff: s.staff.map(e => e.id === id ? mapped : e),
        loading: false
      }));
      return { success: true };
    } catch (err) {
      console.error('Error updating staff:', err);
      set({ loading: false });
      return { success: false, error: err.message };
    }
  },

  deleteStaff: async (id) => {
    set({ loading: true });
    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((s) => ({
        staff: s.staff.filter(e => e.id !== id),
        loading: false
      }));
      return { success: true };
    } catch (err) {
      console.error('Error deleting staff:', err);
      set({ loading: false });
      return { success: false, error: err.message };
    }
  },

  // Payroll (local for now)
  recordPayment: (staffId, amount, type = 'Salario Mensual', note = '') => set((s) => ({
    payrollRecords: [
      { id: `pay-${Date.now()}`, date: new Date().toISOString(), staffId, amount, type, note },
      ...s.payrollRecords
    ]
  }))
}));
