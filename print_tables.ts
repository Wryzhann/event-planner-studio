import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function check() {
  const { data: appointmentCols, error: appointmentErr } = await supabase.from('appointments').select('*').limit(1);
  console.log('appointments check:', { appointmentCols, appointmentErr });

  const { data: settingsCols, error: settingsErr } = await supabase.from('business_settings').select('*').limit(1);
  console.log('business_settings check:', { settingsCols, settingsErr });

  const { data: hoursCols, error: hoursErr } = await supabase.from('business_hours').select('*').limit(1);
  console.log('business_hours check:', { hoursCols, hoursErr });

  const { data: blockedCols, error: blockedErr } = await supabase.from('blocked_dates').select('*').limit(1);
  console.log('blocked_dates check:', { blockedCols, blockedErr });
}

check();
