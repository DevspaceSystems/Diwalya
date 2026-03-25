const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?$/m);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?$/m);

if (!urlMatch || !keyMatch) {
    console.error('Failed to parse .env. URL:', !!urlMatch, 'Key:', !!keyMatch);
    process.exit(1);
}

const url = urlMatch[1].trim();
const key = keyMatch[1].trim();

console.log('Using URL:', url);
// Key hidden for safety

const supabase = createClient(url, key);

async function check() {
    console.log('Checking User table structure...');
    const { data, error } = await supabase.from('User').select('*').limit(1);
    if (error) {
        console.error('Error selecting from User:', error);
        return;
    }
    if (data && data.length > 0) {
        console.log('User sample columns:', Object.keys(data[0]));
        console.log('Sample User:', JSON.stringify(data[0], null, 2));
    } else {
        console.log('User table is empty.');
    }
}

check();
