import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Stores the founder's RevenueCat read-only API key + selected project.
 * Native: expo-secure-store (Keychain / Keystore). Web (dev preview only):
 * localStorage, since SecureStore is unsupported there.
 */

const KEY_API = 'rc_api_key';
const KEY_PROJECT = 'rc_project_id';
const KEY_PROJECT_NAME = 'rc_project_name';

async function setItem(k: string, v: string) {
  if (Platform.OS === 'web') localStorage.setItem(k, v);
  else await SecureStore.setItemAsync(k, v);
}
async function getItem(k: string): Promise<string | null> {
  if (Platform.OS === 'web') return localStorage.getItem(k);
  return SecureStore.getItemAsync(k);
}
async function delItem(k: string) {
  if (Platform.OS === 'web') localStorage.removeItem(k);
  else await SecureStore.deleteItemAsync(k);
}

export interface RcCredentials {
  apiKey: string;
  projectId: string;
  projectName: string;
}

export async function saveRcCredentials(c: RcCredentials) {
  await setItem(KEY_API, c.apiKey);
  await setItem(KEY_PROJECT, c.projectId);
  await setItem(KEY_PROJECT_NAME, c.projectName);
}

export async function getRcCredentials(): Promise<RcCredentials | null> {
  const [apiKey, projectId, projectName] = await Promise.all([
    getItem(KEY_API),
    getItem(KEY_PROJECT),
    getItem(KEY_PROJECT_NAME),
  ]);
  if (!apiKey || !projectId) return null;
  return { apiKey, projectId, projectName: projectName ?? 'Your app' };
}

export async function clearRcCredentials() {
  await Promise.all([delItem(KEY_API), delItem(KEY_PROJECT), delItem(KEY_PROJECT_NAME)]);
}
