const fs = require('fs');
const files = [
  'src/app/api/admin/save-config/route.ts',
  'src/app/api/interventor/mis-mesas/route.ts',
  'src/app/api/interventor/mesa/[id]/route.ts',
  'src/app/api/admin/interventores/route.ts',
  'src/app/api/admin/crear-autonomico/route.ts',
  'src/app/api/admin/administradores/route.ts'
];
for (const file of files) {
  if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      content = content.replace(/process\.env\.NEXT_PUBLIC_SUPABASE_URL!/g, "(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co')");
      content = content.replace(/process\.env\.SUPABASE_SERVICE_ROLE_KEY!/g, "(process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder')");
      fs.writeFileSync(file, content);
  } else {
      console.log('File not found', file);
  }
}
console.log('Fixed files');
