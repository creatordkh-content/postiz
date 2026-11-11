const fs = require('fs');
const path = require('path');

const roots = process.env.POSTIZ_PATCH_ROOT
  ? [process.env.POSTIZ_PATCH_ROOT]
  : ['/app/apps/backend/dist', '/app/dist', '/app/libraries'];
const replacements = {
  'facebook.provider.js': {
    before: ['pages_show_list', 'business_management', 'pages_manage_posts', 'pages_manage_engagement', 'pages_read_engagement', 'read_insights'],
    after: ['pages_show_list', 'pages_manage_posts', 'pages_manage_engagement', 'pages_read_engagement', 'pages_manage_metadata', 'pages_messaging'],
  },
  'instagram.provider.js': {
    before: ['instagram_basic', 'pages_show_list', 'pages_read_engagement', 'business_management', 'instagram_content_publish', 'instagram_manage_comments', 'instagram_manage_insights'],
    after: ['instagram_basic', 'pages_show_list', 'pages_read_engagement', 'business_management', 'instagram_content_publish', 'instagram_manage_comments', 'instagram_manage_insights', 'instagram_manage_messages'],
  },
  'instagram.standalone.provider.js': {
    before: ['instagram_business_basic', 'instagram_business_content_publish', 'instagram_business_manage_comments', 'instagram_business_manage_insights'],
    after: ['instagram_business_basic', 'instagram_business_content_publish', 'instagram_business_manage_comments', 'instagram_business_manage_insights', 'instagram_business_manage_messages'],
  },
  'threads.provider.js': {
    before: ['threads_basic', 'threads_content_publish', 'threads_manage_replies', 'threads_manage_insights'],
    after: ['threads_basic', 'threads_content_publish', 'threads_manage_replies', 'threads_manage_insights', 'threads_read_replies'],
  },
};

function visit(dir, files) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const location = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') visit(location, files);
    else if (entry.isFile() && replacements[entry.name]) files.push(location);
  }
}

const files = [];
for (const root of roots) visit(root, files);
for (const [filename, { before, after }] of Object.entries(replacements)) {
  const candidates = [...new Set(files.filter((file) => path.basename(file) === filename))];
  if (candidates.length !== 1) throw new Error(`Expected one ${filename}; found ${candidates.length}`);
  const file = candidates[0];
  const source = fs.readFileSync(file, 'utf8');
  const beforePattern = new RegExp(`scopes\\s*=\\s*\\[\\s*${before.map((scope) => `["']${scope}["']`).join('\\s*,\\s*')}\\s*,?\\s*(?://[^\\r\\n]*\\r?\\n\\s*)*\\]`, 'g');
  const matches = [...source.matchAll(beforePattern)];
  if (matches.length !== 1) throw new Error(`Unexpected OAuth scopes in ${filename}: ${matches.length}`);
  fs.writeFileSync(file, source.replace(beforePattern, `scopes = [${after.map((scope) => `'${scope}'`).join(', ')}]`));
  console.log(`Patched OAuth scopes: ${filename}`);
}
