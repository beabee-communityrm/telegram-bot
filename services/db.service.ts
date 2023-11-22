import { Singleton } from 'alosaur/mod.ts';
import { Database, SQLite3Connector } from 'denodb/mod.ts';
import * as Models from '../models/index.ts';

@Singleton() // See https://github.com/alosaur/alosaur/tree/master/src/injection
export class DatabaseService {

  db: Database;

  constructor() {

    const token = Deno.env.get("TELEGRAM_TOKEN");
    if(!token) throw new Error("TELEGRAM_TOKEN is not set");

    const dbPath = Deno.env.get("DB_PATH") || "./database.sqlite";
    const dropDb = Deno.env.get("DB_DROP") === 'true' || false;

    const connector = new SQLite3Connector({
        filepath: dbPath,
    });
    
    this.db = new Database(connector);

    // https://eveningkid.com/denodb-docs/docs/guides/synchronize-database#link-models
    this.db.link(Object.values(Models))

    // https://eveningkid.com/denodb-docs/docs/guides/synchronize-database#synchronize-models
    this.db.sync({drop: dropDb});

    console.debug("Database initialized")
  }
}