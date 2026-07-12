import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Default initial users for a fresh system
const initialUsers = [
  { id: 'usr-1', name: 'Administrador Principal', username: 'admin', password: '123', role: 'superadmin' },
  { id: 'usr-2', name: 'Caja Principal', username: 'caja', password: '123', role: 'cajero' },
  { id: 'usr-3', name: 'Mesero 1', username: 'mesero1', password: '123', role: 'mesero' }
];

export const useAuthStore = create(
  persist(
    (set, get) => ({
      users: initialUsers,
      activeUser: null, // User object if logged in, null otherwise

      login: (username, password) => {
        const user = get().users.find(u => u.username === username && u.password === password);
        if (user) {
          set({ activeUser: user });
          return { success: true, user };
        }
        return { success: false, error: 'Usuario o contraseña incorrectos.' };
      },

      logout: () => {
        set({ activeUser: null });
      },

      // User Management (superadmin only, UI handles permission check)
      addUser: (user) => set((s) => ({
        users: [...s.users, { ...user, id: `usr-${Date.now()}` }]
      })),

      updateUser: (id, userData) => set((s) => ({
        users: s.users.map(u => u.id === id ? { ...u, ...userData } : u)
      })),

      deleteUser: (id) => set((s) => ({
        users: s.users.filter(u => u.id !== id)
      })),
    }),
    { name: 'paladar-auth-v2' }
  )
);
