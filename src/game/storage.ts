/*
 * Key-value storage for saves, profile and hall of fame.
 *
 * All of the owner's GitHub Pages games share one origin, and with it one
 * ~5 MB localStorage quota, which other games can fill up. So the game keeps
 * its data in IndexedDB (a much larger quota), with an in-memory copy so the
 * rest of the code can stay synchronous. On first start, `xi2_*` keys found
 * in localStorage are moved into IndexedDB and removed from localStorage.
 * Where IndexedDB isn't available (old browsers, node tests) it falls back
 * to localStorage.
 */

const DB_NAME = 'xi2';
const STORE = 'kv';
const PREFIX = 'xi2_';

let db: IDBDatabase | null = null;
const mem = new Map<string, string>();
let onError: (msg: string) => void = () => {};

export function onStorageError(fn: (msg: string) => void) { onError = fn; }
export function storageKind(): 'indexeddb' | 'localstorage' { return db ? 'indexeddb' : 'localstorage'; }

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => { r.result.createObjectStore(STORE); };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
    r.onblocked = () => rej(new Error('IndexedDB blocked'));
  });
}

function lsKeys(): string[] {
  try { return Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)); } catch { return []; }
}

/** call once before the app renders */
export async function initStorage(): Promise<void> {
  try {
    if (typeof indexedDB === 'undefined') return;
    const d = await openDb();
    const tx = d.transaction(STORE, 'readonly').objectStore(STORE);
    const [keys, vals] = await Promise.all([req(tx.getAllKeys()), req(tx.getAll())]);
    keys.forEach((k, i) => mem.set(String(k), String(vals[i])));
    // move anything still in localStorage over (IndexedDB wins if both exist)
    const moved: string[] = [];
    const wtx = d.transaction(STORE, 'readwrite');
    for (const k of lsKeys()) {
      const v = localStorage.getItem(k);
      if (v === null) continue;
      if (!mem.has(k)) { mem.set(k, v); wtx.objectStore(STORE).put(v, k); }
      moved.push(k);
    }
    await new Promise<void>((res, rej) => { wtx.oncomplete = () => res(); wtx.onerror = () => rej(wtx.error); wtx.onabort = () => rej(wtx.error); });
    for (const k of moved) { try { localStorage.removeItem(k); } catch { /* ignore */ } }
    db = d;
    // ask the browser not to evict the saves under storage pressure
    try { void navigator.storage?.persist?.(); } catch { /* optional */ }
  } catch (e) {
    console.warn('IndexedDB unavailable, using localStorage', e);
    db = null;
  }
}

export function kvGet(key: string): string | null {
  if (db) return mem.get(key) ?? null;
  try { return localStorage.getItem(key); } catch { return null; }
}

export function kvKeys(): string[] {
  return db ? [...mem.keys()] : lsKeys();
}

function write(key: string, value: string | null) {
  if (!db) return;
  try {
    const tx = db.transaction(STORE, 'readwrite');
    const st = tx.objectStore(STORE);
    if (value === null) st.delete(key); else st.put(value, key);
    tx.onabort = () => onError(describe(tx.error));
    tx.onerror = () => onError(describe(tx.error));
  } catch (e) { onError(describe(e)); }
}

export function describe(e: unknown): string {
  const name = (e as { name?: string } | null)?.name ?? '';
  if (name === 'QuotaExceededError') return 'Browser storage is full';
  if (name === 'SecurityError') return 'Browser storage is blocked for this site';
  return 'Save failed';
}

/** returns false if the browser refused to store it */
export function kvSet(key: string, value: string): boolean {
  if (db) { mem.set(key, value); write(key, value); return true; }
  try { localStorage.setItem(key, value); return true; }
  catch (e) { console.error(describe(e), e); return false; }
}

export function kvRemove(key: string) {
  if (db) { mem.delete(key); write(key, null); return; }
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}
