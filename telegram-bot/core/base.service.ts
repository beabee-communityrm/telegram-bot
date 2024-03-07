import { container } from "../deps.ts";

export abstract class BaseService {
  /**
   * Get a singleton instance of the service.
   * This method makes use of the [dependency injection](https://alosaur.com/docs/basics/DI#custom-di-container) container to resolve the service.
   * @param this
   * @returns
   */
  static getSingleton<T extends BaseService = typeof this>(
    // deno-lint-ignore no-explicit-any
    this: new (...args: any[]) => T,
  ): T {
    return container.resolve(this);
  }
}
