import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function test() {
  const { error } = await supabase
    .from('ChatMessage')
    .insert({
      senderId: '123e4567-e89b-12d3-a456-426614174000',
      recipientId: 'admin',
      content: 'test',
      isFlagged: false
    });
  console.log('Insert Result:', error);
}

test();
