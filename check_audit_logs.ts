import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function check() {
  const { data: adminUsers, error: errorAdmin } = await supabase.from('admin_users').select('*');
  console.log('admin_users:', { adminUsers, errorAdmin });
}

check();
