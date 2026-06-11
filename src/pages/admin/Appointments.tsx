import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Appointment, Service } from '@/types/database';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, Phone, Mail, Clock, CalendarDays, Edit2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

export default function Appointments() {
  const [appointments, setAppointments] = useState<(Appointment & { services: Pick<Service, 'name'> | null })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<Appointment['status'] | 'all'>('all');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const fetchAppointments = async () => {
    setIsLoading(true);
    let query = supabase.from('appointments').select('*, services(name)').order('appointment_date', { ascending: false }).order('start_time', { ascending: false });
    
    if (filter !== 'all') {
      query = query.eq('status', filter);
    }
    
    const { data, error } = await query;
    if (data) setAppointments(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const updateStatus = async (id: string, newStatus: Appointment['status']) => {
    setIsUpdating(id);
    try {
      const { error } = await supabase.from('appointments').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      toast.success(`Appointment marked as ${newStatus}`);
      fetchAppointments();
    } catch (error: any) {
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-primary-100 text-primary-800 border-primary-200';
      case 'pending': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'completed': return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-secondary-100 text-secondary-700 border-secondary-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-medium text-secondary-900">Appointments</h1>
          <p className="text-secondary-500 text-sm mt-1">Manage your studio consultations and appointments.</p>
        </div>
        
        <div className="flex bg-white rounded-md p-1 border border-secondary-200 shadow-sm">
          {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-sm capitalize transition-colors",
                filter === f ? "bg-primary-50 text-primary-900 shadow-sm" : "text-secondary-500 hover:text-secondary-900"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-secondary-400" /></div>
      ) : appointments.length === 0 ? (
        <div className="text-center p-12 border border-dashed rounded-xl border-secondary-200 bg-white">
          <p className="text-secondary-500 font-medium">No appointments found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((apt) => {
            const [y, m, d] = apt.appointment_date.split('-');
            const dateObj = new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0);
            return (
            <Card key={apt.id} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                {/* Left side: Date & Time */}
                <div className="bg-primary-50 px-6 py-6 border-b md:border-b-0 md:border-r border-secondary-100 min-w-[200px] flex flex-col justify-center items-center text-center">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary-600 mb-1">
                    {format(dateObj, 'MMM yyyy')}
                  </span>
                  <span className="text-4xl font-serif text-primary-900">
                    {format(dateObj, 'dd')}
                  </span>
                  <span className="text-sm font-medium text-secondary-600 mt-1">
                    {format(dateObj, 'EEEE')}
                  </span>
                  <div className="mt-4 flex items-center text-sm font-medium text-secondary-700 bg-white px-3 py-1 rounded-full shadow-sm">
                    <Clock className="w-3.5 h-3.5 mr-1.5 text-primary-600" />
                    {apt.start_time.substring(0, 5)}
                  </div>
                </div>

                {/* Middle: Details */}
                <div className="p-6 flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-serif text-xl font-medium text-secondary-900">{apt.full_name}</h3>
                    <span className={cn("px-2.5 py-1 text-xs font-medium rounded-full border", getStatusColor(apt.status))}>
                      {apt.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-primary-700 mb-4">{apt.services?.name || 'Unknown Service'}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-4 mb-4 text-sm text-secondary-600">
                    <div className="flex items-center"><Mail className="w-4 h-4 mr-2" /> <a href={`mailto:${apt.email}`} className="hover:underline">{apt.email}</a></div>
                    <div className="flex items-center"><Phone className="w-4 h-4 mr-2" /> {apt.phone}</div>
                  </div>

                  {apt.notes && (
                    <div className="mt-4 p-3 bg-secondary-50 text-sm italic text-secondary-700 rounded-md border border-secondary-100">
                      "{apt.notes}"
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="p-6 border-t md:border-t-0 md:border-l border-secondary-100 flex flex-row md:flex-col justify-center gap-2 bg-secondary-50/50 min-w-[160px]">
                  {apt.status === 'pending' && (
                    <>
                      <Button size="sm" onClick={() => updateStatus(apt.id, 'confirmed')} disabled={isUpdating === apt.id}>Confirm</Button>
                      <Button variant="outline" size="sm" onClick={() => updateStatus(apt.id, 'cancelled')} disabled={isUpdating === apt.id}>Cancel</Button>
                    </>
                  )}
                  {apt.status === 'confirmed' && (
                    <>
                      <Button variant="secondary" size="sm" onClick={() => updateStatus(apt.id, 'completed')} disabled={isUpdating === apt.id}>Mark Complete</Button>
                      <Button variant="outline" size="sm" onClick={() => updateStatus(apt.id, 'cancelled')} disabled={isUpdating === apt.id}>Cancel Event</Button>
                    </>
                  )}
                  {(apt.status === 'cancelled' || apt.status === 'completed') && (
                    <p className="text-xs text-center text-secondary-500 font-medium">No actions available</p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        </div>
      )}
    </div>
  );
}
