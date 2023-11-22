import { DataSource } from 'typeorm';
import { Singleton } from 'alosaur/mod.ts';
import * as Models from '../models/index.ts';

@Singleton()
export class DatabaseService extends DataSource {

    constructor() {

        const dbPath = Deno.env.get("DB_PATH") || "./database.sqlite";
        const dropDb = Deno.env.get("DB_DROP") === 'true' || false;

        super({
            type: "sqlite",
            database: dbPath,
            synchronize: dropDb,
            logging: false,
            entities: Object.values(Models),
            migrations: [],
            subscribers: [],
        })

        this.init().catch(error => console.log(error));
    }

    async init() {
        await this.initialize();

        // console.log("Inserting a new user into the database...")
        // const user = new User()
        // user.firstName = "Timber"
        // user.lastName = "Saw"
        // user.age = 25
        // await AppDataSource.manager.save(user)
        // console.log("Saved a new user with id: " + user.id)

        // console.log("Loading users from the database...")
        // const users = await AppDataSource.manager.find(User)
        // console.log("Loaded users: ", users)

        // console.log("Here you can setup and run express / fastify / any other framework.")
    }
}