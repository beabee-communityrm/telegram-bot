const paths = ["./src/types", "./src/api", "./src/utils"];

const encoder = new TextEncoder();

for (const path of paths) {
  const files = [...Deno.readDirSync(path)];
  files.sort((a, b) => a.name.localeCompare(b.name)); // Sort by file name

  let indexContent = "";



  for (const file of files) {
    if (file.name.endsWith('.ts') && file.name !== 'index.ts') {
      indexContent += `export * from './${file.name}';\n`;
    }
  }

  Deno.writeFileSync(`${path}/index.ts`, encoder.encode(indexContent));
}