import { Statement as _Statement } from 'sqlite3'

// In node-sqlite3, `changes` and `lastID` are not part of `Statement` but this values are injected to the `Statement` object after the query is executed.
// So maybe this here is not the best solution but easiest and seems to work
export class Statement extends _Statement {

    get changes() {
        return this.db.changes;
    }


    get lastID() {
        return this.db.lastInsertRowId;
    }
}