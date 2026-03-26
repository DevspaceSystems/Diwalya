import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function test() {
  const { data: d1, error: e1 } = await supabase
    .from('ChatMessage')
    .select('id, sender:User!senderId(id, name), recipient:User!recipientId(id, name)')
    .limit(1);
  console.log('Query 1:', e1 ? e1.message : 'OK');

  const { data: d2, error: e2 } = await supabase
    .from('ChatMessage')
    .select('id, sender:User!ChatMessage_senderId_fkey(name), recipient:User!ChatMessage_recipientId_fkey(name)')
    .limit(1);
  console.log('Query 2:', e2 ? e2.message : 'OK');
}

test();
