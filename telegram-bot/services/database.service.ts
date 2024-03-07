import { BaseService } from "../core/index.ts";
import { container, DataSource, Singleton } from "../deps.ts";
import { SubscriberModel } from "../models/index.ts";
import { nodeSqlite3 } from "../utils/node-sqlite3/index.ts";

@Singleton()
export class DatabaseService extends DataSource implements BaseService {
  constructor() {
    const dbPath = Deno.env.get("TELEGRAM_BOT_DB_PATH") ||
      "./data/database.sqlite";
    const dropDb = Deno.env.get("TELEGRAM_BOT_DB_DROP") === "true" || false;

    super({
      type: "sqlite",

      database: dbPath,
      dropSchema: dropDb,
      synchronize: true,
      logging: false, // Enable for debugging
      entities: [SubscriberModel],
      migrations: [],
      subscribers: [],
      driver: nodeSqlite3, // Custom driver to support sqlite3
    });

    try {
      this.initialize();
    } catch (error) {
      console.error(error);
    }

    console.debug(`${this.constructor.name} created`);
  }

  /**
   * Get a singleton instance of the service.
   * This method makes use of the [dependency injection](https://alosaur.com/docs/basics/DI#custom-di-container) container to resolve the service.
   * @param this
   * @returns {T} An instance of the DatabaseService or its subclass.
   */
  static getSingleton<T extends DatabaseService>(
    this: new () => T,
  ): T {
    return container.resolve(this);
  }
}
