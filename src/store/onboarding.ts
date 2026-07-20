import { create } from 'zustand';
import { type BusinessType } from '@/db/character';

interface OnboardingState {
  businessType: BusinessType | null;
  businessName: string;
  checked: Record<string, boolean>;
  setBusinessType: (t: BusinessType) => void;
  setBusinessName: (name: string) => void;
  toggleItem: (id: string) => void;
}

export const useOnboarding = create<OnboardingState>(set => ({
  businessType: null,
  businessName: '',
  checked: {},
  setBusinessType: businessType => set({ businessType }),
  setBusinessName: businessName => set({ businessName }),
  toggleItem: id => set(s => ({ checked: { ...s.checked, [id]: !s.checked[id] } })),
}));
