import * as _sqlite3 from 'sqlite3'
import { Database } from './database.ts'
import { Statement } from './statement.ts'

/**
 * This is a custom driver to support sqlite3 in deno.
 * See https://github.com/denodrivers/sqlite3/issues/113
 */
export const sqlite3 = {
    ..._sqlite3,
    Database,
    Statement,
    // This method is called from TypeORM but not part of deno's sqlite3
    // See https://github.com/TryGhost/node-sqlite3/blob/44e570aff823d6626d30558c8057a12a27476cf6/lib/sqlite3.js#L176
    verbose: () => {
        return sqlite3
    }
}

export default sqlite3;