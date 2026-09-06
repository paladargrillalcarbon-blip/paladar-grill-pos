import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

export const defaultTables = [
  { id: '1', name: 'Mesa 1', zone: 'principal', capacity: 4, shape: 'square' },
  { id: '2', name: 'Mesa 2', zone: 'principal', capacity: 4, shape: 'square' },
  { id: '3', name: 'Mesa 3', zone: 'principal', capacity: 2, shape: 'round' },
  { id: '4', name: 'Mesa 4', zone: 'principal', capacity: 6, shape: 'square' },
  { id: '5', name: 'Mesa 5', zone: 'terraza', capacity: 4, shape: 'round' },
  { id: '6', name: 'Mesa 6', zone: 'terraza', capacity: 4, shape: 'square' },
  { id: '7', name: 'Mesa 7', zone: 'vip', capacity: 8, shape: 'square' },
  { id: '8', name: 'Mesa 8', zone: 'vip', capacity: 6, shape: 'square' },
];

export const useTableStore = create(
  persist(
    (set, get) => ({
      tables: defaultTables,

      fetchTables: async () => {
        try {
          const { data, error } = await supabase
            .from('tables')
            .select('*')
            .order('table_number');

          if (error) console.error('fetchTables error:', error);

          if (data && data.length > 0) {
            const mapped = data.map(t => ({
              id: t.id,
              name: t.table_number || `Mesa ${t.id}`,
              table_number: t.table_number,
              capacity: Number(t.capacity) || 4,
              status: t.status || 'available',
              zone: 'principal',
              shape: 'square'
            }));
            set({ tables: mapped });
          }
        } catch (err) {
          console.error('fetchTables catch:', err);
        }
      },

      addTable: async (tableData) => {
        const currentTables = get().tables;
        const newId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tbl-${Date.now()}`;
        const tableName = tableData.name || `Mesa ${currentTables.length + 1}`;
        const newTable = {
          id: newId,
          name: tableName,
          zone: tableData.zone || 'principal',
          capacity: Number(tableData.capacity) || 4,
          shape: tableData.shape || 'square',
        };
        set({ tables: [...currentTables, newTable] });

        try {
          await supabase
            .from('tables')
            .insert([{
              id: newId,
              table_number: tableName,
              capacity: newTable.capacity,
              status: 'available'
            }]);
        } catch (err) {
          console.error('addTable Supabase error:', err);
        }
        return newTable;
      },

      updateTable: async (id, tableData) => {
        set((state) => ({
          tables: state.tables.map((t) =>
            t.id === id
              ? {
                  ...t,
                  ...tableData,
                  capacity: tableData.capacity !== undefined ? Number(tableData.capacity) : t.capacity,
                }
              : t
          ),
        }));

        try {
          const payload = {};
          if (tableData.name !== undefined) payload.table_number = tableData.name;
          if (tableData.capacity !== undefined) payload.capacity = Number(tableData.capacity);
          if (tableData.status !== undefined) payload.status = tableData.status;

          await supabase
            .from('tables')
            .update(payload)
            .eq('id', id);
        } catch (err) {
          console.error('updateTable Supabase error:', err);
        }
      },

      deleteTable: async (id) => {
        set((state) => ({
          tables: state.tables.filter((t) => t.id !== id),
        }));

        try {
          await supabase
            .from('tables')
            .delete()
            .eq('id', id);
        } catch (err) {
          console.error('deleteTable Supabase error:', err);
        }
      },

      resetTables: () => {
        set({ tables: defaultTables });
      },
    }),
    { name: 'paladar-tables-storage-v2', version: 1 }
  )
);
