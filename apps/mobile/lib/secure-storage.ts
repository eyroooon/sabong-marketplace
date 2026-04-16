/**
 * Cross-platform secure storage abstraction.
 * - Native: expo-secure-store (Keychain/Keystore)
 * - Web: localStorage (NOT secure — Expo Go for dev only; production web is N/A
 *        because this app is iOS + Android)
 */
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const webGet = (key: string): string | null => {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const webSet = (key: string, value: string): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore quota / private-mode errors */
  }
};

const webDelete = (key: string): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
};

export async function getSecureItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") return webGet(key);
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setSecureItem(
  key: string,
  value: string,
): Promise<void> {
  if (Platform.OS === "web") return webSet(key, value);
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    /* ignore — tokens will simply not persist across reloads */
  }
}

export async function deleteSecureItem(key: string): Promise<void> {
  if (Platform.OS === "web") return webDelete(key);
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    /* ignore */
  }
}
