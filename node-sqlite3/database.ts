// deno-lint-ignore-file

import { Database as _Database, Statement } from 'sqlite3'
import type { DatabaseOpenOptions, RestBindParameters } from 'sqlite3'

type ErrorCallback = (err: Error | null) => void;

interface RunResult extends Statement {
    lastID: number;
    changes: number;
}


export class Database extends _Database {

    // Constructor interface of the sqlite3 npm package
    constructor(filename: string, callback?: ErrorCallback);
    constructor(filename: string, mode?: number, callback?: ErrorCallback);

    // deno-lint-ignore constructor-super
    constructor(path: string | URL, mode?: number | ErrorCallback, callback?: ErrorCallback) {
        const options: DatabaseOpenOptions = {}

        if(typeof mode === 'number') {
            options.flags = mode;
        }

        if(typeof mode === 'function') {
            callback = mode;
        }

        try {
            super(path, options)
        } catch (error) {
            if(callback) {
                callback(error)
                return
            }
            throw error
        }

        // We need to wait for the database to be ready before we call the callback
        setTimeout(() => {
            callback?.(null)
        })
    }

    getCallback(arr: any[]) {
        let callback = (error: Error | null, result?: any) => {};

        if (arr.length > 0 && typeof arr[arr.length - 1] === 'function') {
            callback = arr.pop();
        }

        if(arr.length === 1 && arr[0] === undefined) {
            arr = [];
        }
    
        return { arr, callback };
    }

    run(sql: string, ...params: RestBindParameters): number // deno sqlite3
    run(sql: string, ...params: RestBindParameters): Database // node sqlite3

    run(sql: string, ...params: RestBindParameters): Database | number {
        let { callback } = this.getCallback(params);
        try {
            // TODO check result for errors
            const statement = new Statement(this, sql);
            const number = statement.run(...params);
            (statement as RunResult).changes = this.changes;
            (statement as RunResult).lastID = this.lastInsertRowId;
            callback = callback.bind(statement)
            callback(null)
        } catch (error) {
            console.error(error);
            callback(error)
        }
        return this;
    }

    // https://github.com/TryGhost/node-sqlite3/wiki/API#allsql--param---callback
    all<T>(sql: string, callback?: (this: Statement, err: Error | null, rows: T[]) => void): this;
    all<T>(sql: string, params: any, callback?: (this: Statement, err: Error | null, rows: T[]) => void): this;
    all(sql: string, ...params: any[]): this {
        let { callback } = this.getCallback(params);
        try {
            // TODO check result for errors
            // const result = super.run(sql, ...params)
            const statement = new Statement(this, sql);
            const rows = statement.all(...params);
            (statement as RunResult).changes = this.changes;
            (statement as RunResult).lastID = this.lastInsertRowId;
            callback = callback.bind(statement)
            callback(null, Object.values(rows))
        } catch (error) {
            console.error(error);
            callback(error)
        }
        return this;
    }

}
