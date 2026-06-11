import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function check() {
  const { data: settings } = await supabase.from('business_settings').select('*');
  console.log('settings:', settings);
  
  const { data: services } = await supabase.from('services').select('*');
  console.log('services name and description:', services?.map(s => ({name: s.name, desc: s.description})));
}

check();
