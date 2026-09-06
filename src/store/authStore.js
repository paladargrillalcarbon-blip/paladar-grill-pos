import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAuthStore = create((set, get) => ({
  activeUser: null, // User object if logged in, null otherwise
  loading: true,
  isSetupMode: false,

  // Check initial state (are there any users?)
  checkSetupMode: async () => {
    set({ loading: true });
    try {
      const { data, error, count } = await supabase
        .from('staff')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      
      set({ isSetupMode: count === 0, loading: false });
    } catch (err) {
      console.error('Error checking setup mode:', err);
      set({ loading: false });
    }
  },

  // Login using pin code
  login: async (pin_code) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('is_active', true)
        .eq('pin_code', pin_code)
        .maybeSingle();

      if (error || !data) {
        set({ loading: false });
        return { success: false, error: 'PIN incorrecto o usuario inactivo.' };
      }

      const roleStr = (data.role || data.rol || '').toLowerCase();
      const mappedUser = { 
        ...data, 
        name: data.name || data.nombre || 'Usuario', 
        role: (roleStr === 'administrador' || roleStr === 'admin') ? 'superadmin' : roleStr 
      };
      set({ activeUser: mappedUser, loading: false });
      return { success: true, user: mappedUser };
    } catch (err) {
      console.error('Login error:', err);
      set({ loading: false });
      return { success: false, error: err.message || 'Error al conectar con la base de datos.' };
    }
  },

  logout: () => {
    set({ activeUser: null });
  },

  // Create first admin (setup mode)
  createFirstAdmin: async (name, pin_code) => {
    set({ loading: true });
    try {
      const adminId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `adm-${Date.now()}`;
      const { data, error } = await supabase
        .from('staff')
        .insert([{
          id: adminId,
          name: name,
          role: 'admin',
          pin_code: pin_code,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      const roleStr = (data.role || data.rol || '').toLowerCase();
      const mappedUser = { 
        ...data, 
        name: data.name || data.nombre || 'Admin', 
        role: (roleStr === 'administrador' || roleStr === 'admin') ? 'superadmin' : roleStr 
      };
      set({ activeUser: mappedUser, isSetupMode: false, loading: false });
      return { success: true, user: mappedUser };
    } catch (err) {
      console.error('Setup error:', err);
      set({ loading: false });
      return { success: false, error: err.message || 'Error al crear el administrador.' };
    }
  }
}));
