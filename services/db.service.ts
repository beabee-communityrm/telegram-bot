import { Singleton } from 'alosaur';
import { Database, SQLite3Connector } from 'denodb';
import * as Models from '../models/index.ts';

@Singleton() // See https://github.com/alosaur/alosaur/tree/master/src/injection
export class DatabaseService {

  db: Database;

  constructor() {
    const connector = new SQLite3Connector({
        filepath: './database.sqlite',
    });
    
    this.db = new Database(connector);

    this.db.link(Object.values(Models))
  }
}