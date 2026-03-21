const fs = require('fs');
const path = 'd:/A1 working/Diwalya/src/app/dashboard/admin/users/page.tsx';
let content = fs.readFileSync(path, 'utf8');
content = content.replace("['CLIENT', 'WORKER', 'ADMIN']", "['', 'CLIENT', 'WORKER', 'ADMIN']");
content = content.replace("{role === 'CLIENT' ? 'Clients' : role === 'WORKER' ? 'Workers' : 'Admins'}", "{role === '' ? 'All Roles' : role === 'CLIENT' ? 'Clients' : role === 'WORKER' ? 'Workers' : 'Admins'}");
fs.writeFileSync(path, content);
console.log('Admin UI fix applied successfully.');
