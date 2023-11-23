import { Statement as _Statement } from 'sqlite3'

export class Statement extends _Statement {

    get changes() {
        return this.db.changes;
    }


    get lastID() {
        return this.db.lastInsertRowId;
    }
}