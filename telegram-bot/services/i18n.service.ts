import { dirname, fromFileUrl, Singleton } from "../deps.ts";
import { readJson } from "../utils/file.ts";

const __dirname = dirname(fromFileUrl(new URL(import.meta.url)));

interface Translations {
  [key: string]: string | Translations;
}

@Singleton()
export class I18nService {
  private translations: { [lang: string]: Translations } = {};
  private activeLang = "en";

  /**
   * Alias for translate
   */
  t = this.translate.bind(this);

  constructor() {
    this.setActiveLang(this.activeLang);
  }

  setActiveLang(lang: string): void {
    this.activeLang = lang;
    this.loadLanguage(this.activeLang);
  }

  async loadLanguage(
    lang: string,
    filePath = __dirname + "/../locales/{lang}.json",
  ): Promise<void> {
    filePath = filePath.replace("{lang}", lang);
    this.translations[lang] = await readJson(filePath) as Translations;
  }

  async loadLanguages(
    langs: string[],
    filePath = __dirname + "/../locales/{lang}.json",
  ): Promise<void> {
    await Promise.all(langs.map((lang) => this.loadLanguage(lang, filePath)));
  }

  translate(
    path: string,
    placeholders: { [key: string]: string } = {},
    lang: string = this.activeLang,
  ): string {
    const translation = this.getTranslation(
      path,
      lang,
      this.translations[lang],
    );

    return this.replacePlaceholders(translation, placeholders);
  }

  private getTranslation(
    path: string,
    lang: string,
    translations: Translations | string,
  ): string {
    if (typeof translations === "string") {
      return translations;
    }

    const segments = path.split(".");
    const key = segments.shift() ?? "";
    const nextTranslations = translations[key];

    if (!nextTranslations) {
      return `Error: Translation not found for '${path}' in language '${lang}'`;
    }

    return this.getTranslation(segments.join("."), lang, nextTranslations);
  }

  private replacePlaceholders(
    translation: string,
    placeholders: { [key: string]: string },
  ): string {
    return Object.keys(placeholders).reduce((acc, key) => {
      // Allow whitespace in placeholders between curly braces
      const regex = new RegExp(`\\{\\s*${key}\\s*\\}`, "g");
      return acc.replaceAll(regex, placeholders[key]);
    }, translation);
  }
}
