import { create } from 'zustand';
import { type CharacterRow } from '@/db/character';
import { type RcOverview } from '@/integrations/revenuecat';
import { saveReminderEnabled, saveReminderHour, saveSoundEnabled } from '@/integrations/settings';
import { setSoundOn } from '@/utils/feedback';

interface AppState {
  /** Pro subscription (annual/monthly) entitlement, synced by useRevenueCat. */
  isPro: boolean;
  setIsPro: (isPro: boolean) => void;

  /** UI sound effects (achievements, level-ups, taps). Persisted; default on. */
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;

  /** Daily reminder notification. Persisted; default off (needs permission). */
  reminderEnabled: boolean;
  setReminderEnabled: (enabled: boolean) => void;

  /** Hour of day (0–23) for the daily reminder. Persisted; default 19. */
  reminderHour: number;
  setReminderHour: (hour: number) => void;

  /** In-memory snapshot of the character row; SQLite is the source of truth. */
  character: CharacterRow | null;
  characterLoaded: boolean;
  setCharacter: (character: CharacterRow | null) => void;

  /** RevenueCat connection (the founder's own sales, read-only). */
  rcConnected: boolean;
  rcProjectName: string | null;
  rcOverview: RcOverview | null;
  setRcConnection: (c: { connected: boolean; projectName: string | null }) => void;
  setRcOverview: (overview: RcOverview | null) => void;
}

export const useStore = create<AppState>(set => ({
  isPro: false,
  setIsPro: isPro => set({ isPro }),

  soundEnabled: true,
  setSoundEnabled: enabled => {
    setSoundOn(enabled); // keep the audio layer in sync immediately
    void saveSoundEnabled(enabled); // persist for next launch
    set({ soundEnabled: enabled });
  },

  reminderEnabled: false,
  setReminderEnabled: enabled => {
    void saveReminderEnabled(enabled); // persist; scheduling handled by caller
    set({ reminderEnabled: enabled });
  },

  reminderHour: 19,
  setReminderHour: hour => {
    void saveReminderHour(hour); // persist; rescheduling handled by caller
    set({ reminderHour: hour });
  },

  character: null,
  characterLoaded: false,
  setCharacter: character => set({ character, characterLoaded: true }),

  rcConnected: false,
  rcProjectName: null,
  rcOverview: null,
  setRcConnection: c => set({ rcConnected: c.connected, rcProjectName: c.projectName }),
  setRcOverview: overview => set({ rcOverview: overview }),
}));

/** Select: onboarding is needed until a character row exists. */
export const selectNeedsOnboarding = (s: AppState) => s.characterLoaded && s.character === null;
