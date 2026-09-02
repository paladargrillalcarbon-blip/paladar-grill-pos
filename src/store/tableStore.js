import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const defaultTables = [
  { id: 1, name: 'Mesa 1', zone: 'principal', capacity: 4, shape: 'square' },
  { id: 2, name: 'Mesa 2', zone: 'principal', capacity: 4, shape: 'square' },
  { id: 3, name: 'Mesa 3', zone: 'principal', capacity: 2, shape: 'round' },
  { id: 4, name: 'Mesa 4', zone: 'principal', capacity: 6, shape: 'square' },
  { id: 5, name: 'Mesa 5', zone: 'terraza', capacity: 4, shape: 'round' },
  { id: 6, name: 'Mesa 6', zone: 'terraza', capacity: 4, shape: 'square' },
  { id: 7, name: 'Mesa 7', zone: 'vip', capacity: 8, shape: 'square' },
  { id: 8, name: 'Mesa 8', zone: 'vip', capacity: 6, shape: 'square' },
];

export const useTableStore = create(
  persist(
    (set, get) => ({
      tables: defaultTables,

      addTable: (tableData) => {
        const currentTables = get().tables;
        const maxId = currentTables.reduce((max, t) => (typeof t.id === 'number' && t.id > max ? t.id : max), 0);
        const newId = maxId + 1;
        const newTable = {
          id: newId,
          name: tableData.name || `Mesa ${newId}`,
          zone: tableData.zone || 'principal',
          capacity: Number(tableData.capacity) || 4,
          shape: tableData.shape || 'square',
        };
        set({ tables: [...currentTables, newTable] });
        return newTable;
      },

      updateTable: (id, tableData) => {
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
      },

      deleteTable: (id) => {
        set((state) => ({
          tables: state.tables.filter((t) => t.id !== id),
        }));
      },

      resetTables: () => {
        set({ tables: defaultTables });
      },
    }),
    { name: 'paladar-tables-storage-v2', version: 1 }
  )
);
