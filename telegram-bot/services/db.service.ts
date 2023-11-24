import { DataSource } from 'typeorm';
import { Singleton } from 'alosaur/mod.ts';
import { SubscriberModel } from '../models/index.ts';
import { nodeSqlite3 } from '../utils/index.ts';

@Singleton()
export class DatabaseService extends DataSource {

    constructor() {

        const dbPath = Deno.env.get("DB_PATH") || "./database.sqlite";
        const dropDb = Deno.env.get("DB_DROP") === 'true' || false;

        super({
            type: "sqlite",
            database: dbPath,
            dropSchema: dropDb,
            synchronize: true,
            logging: true,
            entities: [SubscriberModel],
            migrations: [],
            subscribers: [],
            driver: nodeSqlite3 // Custom driver to support sqlite3
        })

        try {
            this.initialize();
        } catch (error) {
            console.error(error);
        }
    }
}