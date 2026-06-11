import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Appointment, Service } from '@/types/database';
import { Loader2, Calendar, User, Phone, Mail } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

export default function ClientProfile() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<(Appointment & { services: Pick<Service, 'name'> | null })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
  });

  useEffect(() => {
    if (user?.user_metadata) {
      setFormData({
        full_name: user.user_metadata.full_name || '',
        phone: user.user_metadata.phone || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (!user?.email) return;

    async function fetchAppointments() {
      const { data } = await supabase
        .from('appointments')
        .select('*, services(name)')
        .eq('email', user!.email)
        .order('appointment_date', { ascending: false })
        .order('start_time', { ascending: false });
      
      if (data) {
        setAppointments(data);
        
        // If they don't have metadata yet, try to prepopulate from latest appointment
        if (data.length > 0 && !user?.user_metadata?.full_name && !formData.full_name) {
          setFormData(prev => ({
            ...prev,
            full_name: prev.full_name || data[0].full_name,
            phone: prev.phone || (data[0].phone || ''),
          }));
        }
      }
      setIsLoading(false);
    }

    fetchAppointments();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: formData.full_name,
          phone: formData.phone,
        }
      });
      
      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile');
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto py-8 w-full">
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-serif italic mb-3">Profile</h1>
        <p className="text-white/50 text-sm font-light">Manage your contact information and view your booking history.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Info Form */}
        <div className="lg:col-span-1">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 md:p-8">
            <h2 className="text-xl font-serif italic mb-6">Contact Information</h2>
            
            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div>
                <label className="text-xs uppercase tracking-widest text-white/40 mb-2 block font-bold">Email Address</label>
                <div className="flex items-center gap-3 px-4 py-3 bg-[#0A0A0A] border border-white/5 rounded-xl text-white/60">
                  <Mail className="w-4 h-4" />
                  <span className="text-sm">{user?.email}</span>
                </div>
                <p className="text-[10px] text-white/30 mt-2">Email address cannot be changed.</p>
              </div>
              
              <div>
                <label className="text-xs uppercase tracking-widest text-white/60 mb-2 block font-bold">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-11 py-3 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                    placeholder="Your name"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs uppercase tracking-widest text-white/60 mb-2 block font-bold">Phone Number</label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-[#0A0A0A] border border-white/10 rounded-xl px-11 py-3 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
                    placeholder="Your phone number"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdating}
                className="w-full mt-4 bg-[#D4AF37] text-black rounded-full px-6 py-3 text-[10px] items-center justify-center flex uppercase tracking-[0.2em] font-bold hover:bg-[#C5A059] transition-colors disabled:opacity-50"
              >
                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Profile'}
              </button>
            </form>
          </div>
        </div>

        {/* Booking History Table */}
        <div className="lg:col-span-2">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 md:p-8 overflow-hidden flex flex-col h-full">
            <h2 className="text-xl font-serif italic mb-6">Booking History</h2>
            
            {appointments.length === 0 ? (
              <div className="text-center p-12 border border-white/5 border-dashed rounded-2xl bg-[#0A0A0A]/50 my-auto">
                <Calendar className="w-8 h-8 text-white/20 mx-auto mb-3" />
                <p className="text-white/60 mb-4 font-light text-sm">No bookings found in your history.</p>
                <a href="/book" className="inline-block border-b border-[#D4AF37] text-[#D4AF37] font-bold text-[10px] uppercase tracking-widest hover:text-[#C5A059] hover:border-[#C5A059] transition-colors pb-1">
                  Book a Session
                </a>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="pb-4 text-[10px] uppercase tracking-widest text-white/40 font-bold whitespace-nowrap pl-4">Date</th>
                      <th className="pb-4 text-[10px] uppercase tracking-widest text-white/40 font-bold whitespace-nowrap">Service</th>
                      <th className="pb-4 text-[10px] uppercase tracking-widest text-white/40 font-bold whitespace-nowrap">Time</th>
                      <th className="pb-4 text-[10px] uppercase tracking-widest text-white/40 font-bold whitespace-nowrap pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {appointments.map((apt) => {
                      const [y, m, d] = apt.appointment_date.split('-');
                      const dateObj = new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0);
                      return (
                      <tr key={apt.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                        <td className="py-4 pl-4 whitespace-nowrap">
                          <span className="font-medium">{format(dateObj, 'MMM dd, yyyy')}</span>
                        </td>
                        <td className="py-4 whitespace-nowrap">
                          <span className="text-white/80">{apt.services?.name || 'Consultation'}</span>
                        </td>
                        <td className="py-4 whitespace-nowrap">
                          <span className="text-white/60">{apt.start_time.substring(0, 5)}</span>
                        </td>
                        <td className="py-4 pr-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 text-[9px] uppercase tracking-[0.2em] font-bold rounded-full border ${
                            apt.status === 'confirmed' ? 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20' :
                            apt.status === 'pending' ? 'bg-white/5 text-white/70 border-white/10' :
                            apt.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {apt.status}
                          </span>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
