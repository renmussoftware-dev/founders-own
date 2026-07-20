import { create } from 'zustand';
import { type CharacterRow } from '@/db/character';

interface AppState {
  /** Lifetime "Founder's Edition" (or monthly) entitlement, synced by useRevenueCat. */
  isPro: boolean;
  setIsPro: (isPro: boolean) => void;

  /** In-memory snapshot of the character row; SQLite is the source of truth. */
  character: CharacterRow | null;
  characterLoaded: boolean;
  setCharacter: (character: CharacterRow | null) => void;
}

export const useStore = create<AppState>(set => ({
  isPro: false,
  setIsPro: isPro => set({ isPro }),

  character: null,
  characterLoaded: false,
  setCharacter: character => set({ character, characterLoaded: true }),
}));

/** Select: onboarding is needed until a character row exists. */
export const selectNeedsOnboarding = (s: AppState) => s.characterLoaded && s.character === null;
