// This script is based on https://github.com/beabee-communityrm/beabee-frontend/blob/main/scripts/i18n.js

import {
  dirname,
  fromFileUrl,
  google,
  join,
  MarkdownIt,
  MarkdownRenderer,
  sheets_v4,
} from "../deps.ts";

const __dirname = dirname(fromFileUrl(new URL(import.meta.url)));
const simpleMd = new MarkdownIt("zero").enable(["emphasis", "link"]);
const sheetTab = Deno.args[0] || "telegram-bot";
const sheetId = Deno.args[1] || "1l35DW5OMi-xM8HXek5Q1jOxsXScINqqpEvPWDlpBPX8";

simpleMd.renderer.rules.link_open = (
  tokens: MarkdownIt.Token[],
  idx: number,
  options: MarkdownIt.Options,
  _env: unknown,
  self: MarkdownRenderer,
) => {
  const token = tokens[idx];
  const hrefIndex = token.attrIndex("href");
  if (hrefIndex >= 0) {
    const href = token.attrs?.[hrefIndex][1];
    if (href?.startsWith("http")) {
      token.attrPush(["target", "_blank"]);
      token.attrPush(["rel", "noopener noreferrer"]);
    }
  }
  return self.renderToken(tokens, idx, options);
};

const optHandlers: { [key: string]: (data: string) => string } = {
  md: (data) => simpleMd.render(data),
};

const auth = new google.auth.GoogleAuth({
  keyFile: join(__dirname, ".credentials.json"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
});

const sheets: sheets_v4.Sheets = google.sheets({ version: "v4", auth });

interface LocaleData {
  [key: string]: LocaleEntry;
}

interface LocaleEntry {
  [key: string]: string | LocaleEntry;
}
const localeData: LocaleData = {};

function processKeyData(keyOpts: string[], keyData: string | undefined) {
  if (!keyData) {
    return "";
  }
  return (
    keyOpts
      // Apply handlers
      .reduce((data, opt) => optHandlers[opt](data), keyData || "")
      // Sanitize special i18n character
      .replace(/@/g, "{'@'}")
  );
}

async function loadSheet(name: string) {
  console.log("Loading sheet " + name);

  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: name,
  });

  const headers = resp.data?.values?.[0];
  if (!headers) {
    throw new Error("No headers found");
  }
  const rows: Record<string, string>[] = resp.data?.values?.slice(1)
    .map((row) =>
      Object.fromEntries(headers.map((header, i) => [header, row[i]]))
    )
    .filter((row) => row.key) || [];

  // Add locales to data
  const locales = headers.filter((h) => h !== "key" && !h.startsWith("!"));
  for (const locale of locales) {
    if (!localeData[locale]) {
      localeData[locale] = {};
    }
  }

  // Construct nested objects from a.b.c key paths
  for (const row of rows) {
    const keyParts = row.key.split(".");
    const [lastKeyPart, ...keyOpts] = keyParts.pop()?.split(":") ?? [];

    for (const locale of locales) {
      let localeDataPart = localeData[locale] as LocaleEntry;
      for (const part of keyParts) {
        if (!localeDataPart[part]) {
          localeDataPart[part] = {};
        }
        localeDataPart = localeDataPart[part] as LocaleEntry;
      }
      if (localeDataPart[lastKeyPart] !== undefined) {
        console.log("Duplicate key " + row.key);
      }
      localeDataPart[lastKeyPart] = processKeyData(keyOpts, row[locale]);
    }
  }
}

// Recursively sort for predictable output
function sortObject(obj: LocaleEntry): LocaleEntry {
  const ret: LocaleEntry = {};
  for (const key of Object.keys(obj).sort()) {
    ret[key] = typeof obj[key] === "object" ? sortObject(obj[key] as LocaleEntry) : obj[key];
  }
  return ret;
}

try {
  await loadSheet(sheetTab);

  for (const locale in localeData) {
    console.log("Updating " + locale);
    const dir = join(__dirname, "../locales");
    const path = join(dir, locale + ".json");
    Deno.mkdir(dir, { recursive: true });
    await Deno.writeTextFile(
      path,
      JSON.stringify(sortObject(localeData[locale]), null, 2) + "\n",
    );
  }
} catch (error) {
  console.error(error);
  Deno.exit(1);
}
