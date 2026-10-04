// Anything that stores user files (listing photos, permits, signed documents)
// goes through this interface. The database stores the storage *key*, never a
// URL, so the backing store can change without touching callers.
export interface StorageAdapter {
  put(key: string, body: Buffer, opts: { contentType: string }): Promise<void>;
  get(key: string): Promise<{ body: Buffer; contentType: string } | null>;
  delete(key: string): Promise<void>;
}
