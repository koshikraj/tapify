import { create } from 'zustand';

interface VouchertStoreState {
  voucherSecret: string;
  setVoucherSecret: (secret: string) => void;
}

const useAccountStore = create<VouchertStoreState>((set) => ({
  voucherSecret: '',
  setVoucherSecret: (secret: string) => {
    set((state) => ({
      ...state,
      voucherSecret: secret,
    }));
  },
}));

export default useAccountStore;
