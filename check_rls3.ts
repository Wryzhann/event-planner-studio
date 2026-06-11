import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function check() {
  const testEmail = `izhanshahmie+test${Date.now()}@gmail.com`;
  
  const { data: authData, error: authErr } = await supabase.auth.signUp({
    email: testEmail,
    password: 'password123'
  });
  console.log('User signed up:', !!authData.user, authData.user?.id, authErr);

  const newAppointment = {
    full_name: 'Test Name',
    email: testEmail,
    phone: '1234567890',
    service_id: '6c6158c3-12bd-4b76-a0e9-d2f7e7075e4a', // replace later
    appointment_date: '2026-06-03',
    start_time: '14:00:00',
    end_time: '15:00:00',
    notes: 'none',
    status: 'pending',
    user_id: authData.user?.id
  };

  const { data: services } = await supabase.from('services').select('id').limit(1);
  if (services && services.length > 0) {
    newAppointment.service_id = services[0].id;
  }

  const { error: insErr } = await supabase.from('appointments').insert(newAppointment);
  console.log('Inserted appointment error:', insErr);

  const { data: apts, error: fetchErr } = await supabase
    .from('appointments')
    .select('*')
    .ilike('email', testEmail);
    
  console.log('Fetched appointments:', apts?.length, fetchErr);
}

check();
