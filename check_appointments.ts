import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function check() {
  const newAppointment = {
    full_name: 'Test Name',
    email: 'test@example.com',
    phone: '1234567890',
    service_id: '6c6158c3-12bd-4b76-a0e9-d2f7e7075e4a',
    appointment_date: '2026-06-03',
    start_time: '14:00:00',
    end_time: '15:00:00',
    notes: 'none',
    status: 'pending'
  };

  const { data, error } = await supabase.from('appointments').insert(newAppointment).select().single();
  console.log('appointments:', data, error);
}

check();
