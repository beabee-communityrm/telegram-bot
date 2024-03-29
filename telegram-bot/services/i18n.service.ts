import { BaseService } from "../core/index.ts";
import { dirname, fromFileUrl, Singleton } from "../deps/index.ts";
import {
  escapeMd,
  readJson,
  readJsonSync,
  toCamelCase,
} from "../utils/index.ts";
import { EventService } from "./event.service.ts";
import { I18nEvent } from "../enums/i18n-event.ts";

const __dirname = dirname(fromFileUrl(new URL(import.meta.url)));

interface Translations {
  [key: string]: string | Translations;
}

/**
 * I18nService is a Singleton service that handles internationalization.
 * - Load translations
 * - Translate strings
 */
@Singleton()
export class I18nService extends BaseService {
  protected translations: { [lang: string]: Translations } = {};
  protected _activeLang = "en";
  protected _ready = false;

  /**
   * Alias for translate
   */
  public t = this.translate.bind(this);

  get activeLang() {
    return this._activeLang;
  }

  constructor(protected readonly event: EventService) {
    super();
    this.setActiveLangSync(this._activeLang);
    this._ready = true;
    console.debug(`${this.constructor.name} created`);
  }
  /**
   * Set the active language
   * @param lang The language to set as active, e.g. "en"
   */
  public async setActiveLang(lang: string) {
    if (this._ready && this._activeLang === lang) {
      console.debug(`Language already set to "${lang}"`);
      return false;
    }
    this._activeLang = lang;
    await this.loadLanguage(this._activeLang);
    this.event.emit(I18nEvent.LANGUAGE_CHANGED, this._activeLang);
  }

  /**
   * Set the active language synchronously
   * @param lang The language to set as active, e.g. "en"
   * @returns Whether the language was changed
   */
  public setActiveLangSync(lang: string): boolean {
    if (this._ready && this._activeLang === lang) {
      console.debug(`Language already set to "${lang}"`);
      return false;
    }
    this._activeLang = lang;
    this.loadLanguageSync(this._activeLang);
    this.event.emit(I18nEvent.LANGUAGE_CHANGED, this._activeLang);
    return true;
  }

  /**
   * Load a language file
   * @param lang The language to load, e.g. "en"
   * @param filePath The path to the language file, e.g. "./locales/{lang}.json"
   */
  public async loadLanguage(
    lang: string,
    filePath = __dirname + "/../locales/{lang}.json",
  ): Promise<void> {
    filePath = filePath.replace("{lang}", lang);
    this.translations[lang] = await readJson(filePath) as Translations;
  }

  /**
   * Load a language file synchronously
   * @param lang The language to load, e.g. "en"
   * @param filePath The path to the language file, e.g. "./locales/{lang}.json"
   */
  public loadLanguageSync(
    lang: string,
    filePath = __dirname + "/../locales/{lang}.json",
  ): void {
    filePath = filePath.replace("{lang}", lang);
    this.translations[lang] = readJsonSync(filePath) as Translations;
  }

  /**
   * Load multiple languages
   * @param langs The languages to load, e.g. ["en", "de"]
   * @param filePath The path to the language file, e.g. "./locales/{lang}.json"
   */
  public async loadLanguages(
    langs: string[],
    filePath = __dirname + "/../locales/{lang}.json",
  ): Promise<void> {
    await Promise.all(langs.map((lang) => this.loadLanguage(lang, filePath)));
  }

  /**
   * Load multiple languages synchronously
   * @param langs The languages to load, e.g. ["en", "de"]
   * @param filePath The path to the language file, e.g. "./locales/{lang}.json"
   */
  protected translate(
    path: string,
    placeholders: { [key: string]: string } = {},
    options: {
      lang?: string;
      escapeMd?: boolean;
    } = {},
  ): string {
    const lang = options.lang || this._activeLang;
    const doEscapeMd = options.escapeMd ?? false;
    const translation = this.getTranslation(
      path,
      lang,
      this.translations[lang],
    );

    if (!translation) {
      if (lang === "en") {
        const errorMessage =
          `Error: Translation not found for '${path}' in language '${lang}'`;
        console.error(
          errorMessage,
        );
        return escapeMd(errorMessage);
      }
      // Fallback to English
      console.warn(
        `Translation not found for '${path}' in language '${lang}', falling back to English`,
      );
      return this.translate(path, placeholders, { ...options, lang: "en" });
    }

    return this.replacePlaceholders(
      doEscapeMd ? escapeMd(translation) : translation,
      placeholders,
      options,
    );
  }

  /**
   * Get a translation
   * @param path The path to the translation, e.g. "greetings.hello"
   * @param placeholders The placeholders to replace in the translation, e.g. { name: "John" }
   * @param lang The language to use, e.g. "en"
   */
  protected getTranslation(
    path: string,
    lang: string,
    translations: Translations | string,
  ): string | null {
    if (typeof translations === "string") {
      return translations;
    }

    const segments = path.split(".");
    const _key = segments.shift() ?? "";
    const key = toCamelCase(_key);
    const nextTranslations = translations[key] || translations[_key];

    if (!nextTranslations) {
      return null;
    }

    return this.getTranslation(segments.join("."), lang, nextTranslations);
  }

  /**
   * Replace placeholders in a translation
   * @param translation The translation to replace the placeholders in
   * @param placeholders The placeholders to replace in the translation, e.g. { name: "John" }
   */
  protected replacePlaceholders(
    translation: string,
    placeholders: { [key: string]: string },
    options: {
      escapeMd?: boolean;
    } = {},
  ): string {
    return Object.keys(placeholders).reduce((acc, key) => {
      // Allow whitespace in placeholders between curly braces
      const regexStr = options.escapeMd
        ? `\\\\{\\s*${key}\\s*\\\\}` // Search for excaped plaxeholders
        : `\\{\\s*${key}\\s*\\}`; // Search for unescaped placeholders
      const regex = new RegExp(regexStr, "g");
      return acc.replaceAll(regex, placeholders[key].toString());
    }, translation);
  }
}
