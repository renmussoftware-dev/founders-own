import { useEffect } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getCharacter } from '@/db/character';
import { useStore } from '@/store/useStore';

/**
 * Returns the character, loading it from SQLite into the store if it isn't
 * already hydrated. Standalone routes (founder-card, milestone) can be reached
 * by deep link or web refresh without the tab layout ever having mounted, so
 * they can't assume the store is populated.
 *
 * `loaded` distinguishes "still loading" (show nothing) from "loaded, but no
 * character exists" (deep-linked before onboarding → caller should redirect).
 */
export function useEnsureCharacter() {
  const db = useSQLiteContext();
  const character = useStore(s => s.character);
  const characterLoaded = useStore(s => s.characterLoaded);
  const setCharacter = useStore(s => s.setCharacter);

  useEffect(() => {
    if (!characterLoaded) {
      getCharacter(db).then(setCharacter);
    }
  }, [characterLoaded, db, setCharacter]);

  return { character, loaded: characterLoaded };
}
