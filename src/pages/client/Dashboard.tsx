import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Appointment, Service } from '@/types/database';
import { Loader2, Calendar, CalendarPlus } from 'lucide-react';
import { format } from 'date-fns';

function getGoogleCalendarUrl(apt: Appointment & { services: Pick<Service, 'name'> | null }) {
  const [y, m, d] = apt.appointment_date.split('-');
  const [sh, sm] = apt.start_time.split(':');
  const [eh, em] = apt.end_time.split(':');
  
  const startStr = `${y}${m}${d}T${sh}${sm}00`;
  const endStr = `${y}${m}${d}T${eh}${em}00`;
  
  const title = encodeURIComponent(apt.services?.name || 'Studio Consultation');
  const details = encodeURIComponent(`Your event consultation booking is confirmed.\n\nNotes: ${apt.notes || 'None'}`);
  
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}`;
}

export default function ClientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<(Appointment & { services: Pick<Service, 'name'> | null })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;

    async function fetchAppointments() {
      const { data } = await supabase
        .from('appointments')
        .select('*, services(name)')
        .ilike('email', user!.email)
        .order('appointment_date', { ascending: false })
        .order('start_time', { ascending: false });
      
      if (data) setAppointments(data);
      setIsLoading(false);
    }

    fetchAppointments();
  }, [user]);

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" /></div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif italic mb-3">My Events</h1>
          <p className="text-white/50 text-sm font-light">Track and manage your upcoming consultations and events.</p>
        </div>
        <a href="/book" className="px-6 py-3 bg-[#D4AF37] text-black rounded-full text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#C5A059] transition-colors self-start md:self-auto shrink-0">
          Book New Session
        </a>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center p-16 border border-white/10 border-dashed rounded-3xl bg-neutral-900 mt-8">
          <Calendar className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/60 mb-6 font-light">You have no upcoming events.</p>
          <a href="/book" className="inline-block border-b border-[#D4AF37] text-[#D4AF37] font-bold text-[10px] uppercase tracking-widest hover:text-[#C5A059] hover:border-[#C5A059] transition-colors pb-1">
            Browse our Services
          </a>
        </div>
      ) : (
        <div className="grid gap-4 mt-8">
          {appointments.map((apt) => {
            const [y, m, d] = apt.appointment_date.split('-');
            const dateObj = new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0);
            return (
            <div key={apt.id} className="bg-neutral-900 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/20 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="w-20 h-20 rounded-2xl bg-[#0A0A0A] border border-white/5 flex flex-col items-center justify-center shrink-0 shadow-inner">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] mb-1">{format(dateObj, 'MMM')}</span>
                  <span className="text-2xl font-serif leading-none">{format(dateObj, 'dd')}</span>
                </div>
                <div>
                  <h3 className="font-serif text-xl italic mb-2">{apt.services?.name || 'Consultation'}</h3>
                  <div className="flex flex-col space-y-1">
                    <p className="text-xs text-white/60 font-light tracking-wide uppercase">
                      {format(dateObj, 'EEEE, MMMM do, yyyy')}
                    </p>
                    <p className="text-xs text-white/40">
                      Time: {apt.start_time.substring(0, 5)}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-between md:flex-col md:items-end gap-3 border-t border-white/10 md:border-t-0 pt-4 md:pt-0 shrink-0">
                <span className={`px-4 py-1.5 text-[9px] uppercase tracking-[0.2em] font-bold rounded-full border ${
                  apt.status === 'confirmed' ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20' :
                  apt.status === 'pending' ? 'bg-white/5 text-white/70 border-white/10' :
                  apt.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                  'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  {apt.status === 'pending' ? 'Request Sent' : apt.status}
                </span>
                
                {apt.status === 'confirmed' && (
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[10px] text-white/40 italic">Confirmed via Email</span>
                    <a
                      href={getGoogleCalendarUrl(apt)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[#D4AF37] hover:text-white transition-colors"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" />
                      Add to Calendar
                    </a>
                  </div>
                )}
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}
