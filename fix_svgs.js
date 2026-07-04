const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'assets', 'icons');
const files = fs.readdirSync(dir);

files.forEach(f => {
  if (f.endsWith('.svg')) {
    let content = fs.readFileSync(path.join(dir, f), 'utf8');
    content = content.replace(/width="[^"]*"/g, '').replace(/height="[^"]*"/g, '');
    fs.writeFileSync(path.join(dir, f), content);
  }
});
console.log("SVGs fixed!");
