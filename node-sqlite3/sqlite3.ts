import * as _sqlite3 from 'sqlite3'
import { Database } from './database.ts'

export const sqlite3 = {
    ..._sqlite3,
    Database,
    verbose: () => {
        return sqlite3
    }
}

export default sqlite3;