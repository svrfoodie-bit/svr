import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import settingsService from '../services/settingsService';

export const DEFAULT_COMPANY_NAME = 'SVR Food Production';
export const APP_SUBTITLE = 'Cashew Management';
export const SYSTEM_SUBTITLE = 'Management System';

const normaliseCompanyInfo = (companyInfo = {}) => ({
  companyName: companyInfo.companyName || DEFAULT_COMPANY_NAME,
  ownerName: companyInfo.ownerName || '',
  businessType: companyInfo.businessType || '',
  gstNumber: companyInfo.gstNumber || '',
  panNumber: companyInfo.panNumber || '',
  address: companyInfo.address || '',
  city: companyInfo.city || '',
  state: companyInfo.state || '',
  pincode: companyInfo.pincode || '',
  phone: companyInfo.phone || '',
  email: companyInfo.email || '',
  website: companyInfo.website || '',
});

export const useCompanyStore = create(
  persist(
    (set, get) => ({
      companyInfo: normaliseCompanyInfo(),
      loading: false,
      loaded: false,

      loadCompanyInfo: async () => {
        if (get().loading) return get().companyInfo;
        set({ loading: true });
        try {
          const settings = await settingsService.get();
          const companyInfo = normaliseCompanyInfo(settings.company_info);
          set({ companyInfo, loaded: true });
          return companyInfo;
        } finally {
          set({ loading: false });
        }
      },

      setCompanyInfo: (companyInfo) => {
        set({ companyInfo: normaliseCompanyInfo(companyInfo), loaded: true });
      },
    }),
    {
      name: 'company-settings-storage',
      partialize: (state) => ({ companyInfo: state.companyInfo, loaded: state.loaded }),
    }
  )
);

export const getCompanyName = () =>
  useCompanyStore.getState().companyInfo?.companyName || DEFAULT_COMPANY_NAME;
