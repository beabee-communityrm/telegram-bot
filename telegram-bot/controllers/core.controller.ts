import { Controller, Get } from "../deps/index.ts";

@Controller()
export class CoreController {
  constructor() {
    console.debug(`${this.constructor.name} created`);
  }

  /**
   * Alive endpoint
   * @returns Alive message
   */
  @Get("/")
  alive() {
    return "Application is running";
  }

  /**
   * Health check endpoint
   * @returns Health check message
   */
  @Get("/health")
  healthCheck() {
    return "Application is healthy";
  }
}
