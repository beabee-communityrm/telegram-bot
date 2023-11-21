import { Database, SQLite3Connector } from 'denodb';

export class DatabaseService {

  db: Database;

  constructor() {
    const connector = new SQLite3Connector({
        filepath: './database.sqlite',
      });
    
    this.db = new Database(connector);
  }
}