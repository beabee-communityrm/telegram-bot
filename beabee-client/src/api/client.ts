export abstract class BaseClient {
  constructor(private readonly token: string, private readonly options: BaseClientOptions) {
    console.log('Hello world!');
  }
  // ...
}