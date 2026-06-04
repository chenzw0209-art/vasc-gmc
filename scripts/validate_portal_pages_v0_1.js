const fs = require("fs");

const files = [
  "portal/pages/market/index.html",
  "portal/pages/players/index.html",
  "portal/pages/products/index.html",
  "portal/pages/leads/index.html",
];

for (const file of files) {
  const html = fs.readFileSync(file, "utf8");
  const scripts = [];
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  let match;
  while ((match = re.exec(html))) {
    const code = match[1].trim();
    if (code) scripts.push(code);
  }
  const srcRe = /<script[^>]*\bsrc=["']([^"']+)["'][^>]*><\/script>/g;
  while ((match = srcRe.exec(html))) {
    const src = match[1];
    if (!src.startsWith("../../assets/")) continue;
    const asset = "portal/assets/" + src.replace("../../assets/", "");
    if (fs.existsSync(asset)) scripts.push(fs.readFileSync(asset, "utf8"));
  }
  if (!scripts.length) {
    console.log(`${file}: no_inline_script`);
    continue;
  }
  for (const code of scripts) {
    new Function(code);
  }
  console.log(`${file}: inline_js_ok`);
}
