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
        .single();

      if (error || !data) {
        set({ loading: false });
        return { success: false, error: 'PIN incorrecto o usuario inactivo.' };
      }

      set({ activeUser: data, loading: false });
      return { success: true, user: data };
    } catch (err) {
      console.error('Login error:', err);
      set({ loading: false });
      return { success: false, error: 'Error al conectar con la base de datos.' };
    }
  },

  logout: () => {
    set({ activeUser: null });
  },

  // Create first admin (setup mode)
  createFirstAdmin: async (name, pin_code) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('staff')
        .insert([{
          nombre: name,
          rol: 'Administrador', // Rol fijo para el primero
          pin_code: pin_code,
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;

      set({ activeUser: data, isSetupMode: false, loading: false });
      return { success: true, user: data };
    } catch (err) {
      console.error('Setup error:', err);
      set({ loading: false });
      return { success: false, error: 'Error al crear el administrador.' };
    }
  }
}));
