import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import settingsService from '../services/settingsService';

export const useModuleSettingsStore = create(
  persist(
    (set, get) => ({
      disabledPaths: [],
      loading: false,
      loaded: false,

      loadModuleSettings: async () => {
        if (get().loading) return get().disabledPaths;
        set({ loading: true });
        try {
          const settings = await settingsService.get();
          const disabledPaths = settings.module_settings?.disabledPaths || [];
          set({ disabledPaths, loaded: true });
          return disabledPaths;
        } finally {
          set({ loading: false });
        }
      },

      setDisabledPaths: (disabledPaths) => {
        set({ disabledPaths, loaded: true });
      },
    }),
    {
      name: 'module-settings-storage',
      partialize: (state) => ({ disabledPaths: state.disabledPaths, loaded: state.loaded }),
    }
  )
);
