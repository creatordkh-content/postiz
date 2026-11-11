const fs = require('fs');
const path = require('path');

const roots = ['/app/apps/backend/dist', '/app/dist', '/app/libraries'];
const matches = [];
const oldScopes = /scopes\s*=\s*\[\s*['"]pages_show_list['"],\s*['"]business_management['"],\s*['"]pages_manage_posts['"],\s*['"]pages_manage_engagement['"],\s*['"]pages_read_engagement['"],\s*['"]read_insights['"],?\s*\]/g;

function visit(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const location = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') visit(location);
    } else if (entry.isFile() && entry.name === 'facebook.provider.js') {
      matches.push(location);
    }
  }
}

for (const root of roots) visit(root);
let patched = 0;
for (const file of [...new Set(matches)]) {
  const source = fs.readFileSync(file, 'utf8');
  const count = [...source.matchAll(oldScopes)].length;
  if (count === 0) continue;
  if (count !== 1) throw new Error(`Unexpected Facebook scopes in ${file}: ${count}`);
  fs.writeFileSync(file, source.replace(oldScopes, "scopes = ['pages_show_list', 'pages_manage_posts']"));
  console.log(`Patched Facebook OAuth scopes: ${file}`);
  patched++;
}
if (patched !== 1) throw new Error(`Expected one Facebook provider, found ${patched}; candidates: ${matches.join(', ')}`);
