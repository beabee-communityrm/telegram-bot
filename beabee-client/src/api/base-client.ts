import type { BaseClientOptions } from '../types/index.ts';

export abstract class BaseClient {
  constructor(private readonly token: string, private readonly options: BaseClientOptions = {}) {
    console.log('Hello world!');
  }
  // ...
}