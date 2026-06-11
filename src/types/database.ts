export type Service = {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  created_at: string;
};

export type Appointment = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  service_id: string;
  appointment_date: string; // date string
  start_time: string; // time string
  end_time: string; // time string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  notes: string | null;
  created_at: string;
};

export type BusinessHours = {
  id: string;
  weekday: number; // 0 = Sunday, 1 = Monday, etc.
  is_open: boolean;
  start_time: string;
  end_time: string;
};

export type BlockedDate = {
  id: string;
  blocked_date: string;
  reason: string | null;
  created_at: string;
};

export type BusinessSettings = {
  id: string;
  business_name: string;
  business_email: string;
  business_phone: string;
  business_address: string;
  slot_interval_minutes: number;
  booking_notice_hours: number;
  created_at: string;
};

export type AdminUser = {
  id: string;
  user_id: string;
  created_at: string;
};
