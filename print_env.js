const fs = require('fs');
const content = fs.readFileSync('.env', 'utf-8');
console.log('--- .env content ---');
console.log(content);
console.log('--- end .env content ---');

const processEnv = {
  URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'EXISTS' : 'MISSING'
};
console.log('Process.env check:', processEnv);
