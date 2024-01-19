import { Controller, Get, NotFoundError, Param } from "alosaur/mod.ts";
import { I18nService } from "../services/i18n.service.ts";

@Controller("/i18n")
export class I18nController {
  constructor(
    private readonly i18n: I18nService,
  ) {
    console.debug(`${this.constructor.name} created`);
  }

  /**
   * Just to test retrieving all subscribers.
   * Can be removed.
   */
  @Get("/set-lang/:lang")
  subscribers(@Param("lang") lang: string) {
    console.debug(`Set language to ${lang}`);
    try {
      this.i18n.setActiveLangSync(lang);
    } catch (error) {
      console.error(error.message);
      if (error instanceof Error && error.name === "NotFound") {
        return new NotFoundError(error.message);
      } else {
        throw error;
      }
    }
    return `Language changed to "${lang}"`;
  }
}