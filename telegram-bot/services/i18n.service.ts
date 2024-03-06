import { dirname, fromFileUrl, Singleton } from "../deps.ts";
import { readJson, readJsonSync, toCamelCase } from "../utils/index.ts";
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
export class I18nService {
  protected translations: { [lang: string]: Translations } = {};
  protected _activeLang = "en";
  protected _ready = false;

  /**
   * Alias for translate
   */
  t = this.translate.bind(this);

  get activeLang() {
    return this._activeLang;
  }

  constructor(protected readonly event: EventService) {
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
  public translate(
    path: string,
    placeholders: { [key: string]: string } = {},
    lang: string = this._activeLang,
  ): string {
    let translation = this.getTranslation(
      path,
      lang,
      this.translations[lang],
    );

    if (translation) {
      translation = this.replacePlaceholders(translation, placeholders);
    } else {
      // Fallback to english
      if (lang !== "en") {
        return this.translate(path, placeholders, "en");
      }
    }
    return translation ?? `Error: Translation not found for '${path}'`;
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
  ): string {
    if (typeof translations === "string") {
      return translations;
    }

    const segments = path.split(".");
    const _key = segments.shift() ?? "";
    const key = toCamelCase(_key);
    const nextTranslations = translations[key] || translations[_key];

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
  ): string {
    return Object.keys(placeholders).reduce((acc, key) => {
      // Allow whitespace in placeholders between curly braces
      const regex = new RegExp(`\\{\\s*${key}\\s*\\}`, "g");
      return acc.replaceAll(regex, placeholders[key]);
    }, translation);
  }
}
