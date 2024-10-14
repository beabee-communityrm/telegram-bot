import { StorageAdapter } from "../deps/index.ts";

/**
 * Key-value storage adapter for Deno.
 * Based on https://github.com/grammyjs/storages/blob/main/packages/denokv/src/adapter.ts
 * @see https://docs.deno.com/examples/kv/
 * @see https://github.com/grammyjs/storages/tree/main/packages/denokv
 */
export class KeyValueStorageAdapter<T> implements StorageAdapter<T> {
  constructor(
    private kv: Deno.Kv,
    private prefix: Deno.KvKeyPart[] = ["sessions"],
  ) {}

  async read(key: string): Promise<T | undefined> {
    const result = await this.kv.get([...this.prefix, key]);
    return result.value !== null ? result.value as T : undefined;
  }

  async write(key: string, value: T) {
    await this.kv.set([...this.prefix, key], value);
  }

  async delete(key: string) {
    await this.kv.delete([...this.prefix, key]);
  }
}
