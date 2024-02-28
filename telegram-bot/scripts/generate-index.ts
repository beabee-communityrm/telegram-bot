// Simple script to generate index.ts files for each folder
const paths = [
  "./areas",
  "./commands",
  "./controllers",
  "./constants",
  "./core",
  "./deps",
  "./enums",
  "./event-managers",
  "./models",
  "./renderer",
  // "./services", // The dependency injection system can sometimes cause problems with it
  "./types",
  "./utils",
];

const encoder = new TextEncoder();

const generateIndex = (paths: string[]) => {
  for (const path of paths) {
    const files = [...Deno.readDirSync(path)];
    // Sort files by file name
    files.sort((a, b) => a.name.localeCompare(b.name));

    let indexContent = "";

    for (const file of files) {
      if (
        (file.name.endsWith(".ts") || file.name.endsWith(".tsx")) &&
        file.name !== "index.ts"
      ) {
        indexContent += `export * from "./${file.name}";\n`;
      }
    }

    Deno.writeFileSync(`${path}/index.ts`, encoder.encode(indexContent));
  }
};

generateIndex(paths);
