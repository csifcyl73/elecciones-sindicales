const fs = require('fs');
const files = [
  'src/app/admin/nacional/page.tsx',
  'src/app/admin/nacional/dashboard/page.tsx',
  'src/app/admin/autonomico/page.tsx',
  'src/app/admin/autonomico/dashboard/page.tsx',
  'src/app/interventor/page.tsx',
  'src/app/interventor/dashboard/page.tsx'
];
for (const file of files) {
  if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      content = content.replace(/process\.env\.NEXT_PUBLIC_SUPABASE_URL!/g, "(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co')");
      content = content.replace(/process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY!/g, "(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder')");
      fs.writeFileSync(file, content);
      console.log('Fixed', file)
  }
}
console.log('Fixed files');
