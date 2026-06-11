import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Service, BusinessHours, BlockedDate, BusinessSettings, Appointment } from '@/types/database';
import { format, addDays, startOfDay, endOfDay, parseISO, isSameDay, getDay, addMinutes, isBefore, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isToday, isSameMonth } from 'date-fns';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2, Building2, Clock, CalendarIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

import { motion, AnimatePresence } from 'framer-motion';

type TimeSlot = {
  start: Date;
  end: Date;
  label: string;
};

export default function Booking() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  const [services, setServices] = useState<Service[]>([]);
  const [hours, setHours] = useState<BusinessHours[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Booking State
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    notes: ''
  });
  
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('timeout')), 3000);
        });

        const fetches = Promise.all([
          supabase.from('services').select('*').eq('is_active', true).order('price', { ascending: false }),
          supabase.from('business_hours').select('*'),
          supabase.from('blocked_dates').select('*'),
          supabase.from('business_settings').select('*').maybeSingle()
        ]);

        const [
          { data: srvs },
          { data: hrs },
          { data: bd },
          { data: stg }
        ] = await Promise.race([fetches, timeoutPromise]) as any;

        if (srvs) setServices(srvs);
        if (hrs) setHours(hrs);
        if (bd) setBlockedDates(bd);
        if (stg) setSettings(stg);
      } catch (err) {
        console.warn("Failed to load booking config:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchConfig();
  }, []);

  // Fetch appointments when date changes
  useEffect(() => {
    setSelectedSlot(null);
  }, [selectedDate, selectedService]);

  useEffect(() => {
    if (!selectedDate) return;
    
    async function fetchAppointmentsForDate() {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .eq('appointment_date', dateStr)
        .in('status', ['confirmed', 'pending']);
      
      if (data) setAppointments(data);
    }
    fetchAppointmentsForDate();
  }, [selectedDate]);

  // Calculate slots
  useEffect(() => {
    if (!selectedDate || !selectedService || !hours.length) {
      setAvailableSlots([]);
      return;
    }

    const dayOfWeek = getDay(selectedDate);
    const dayConfig = hours.find(h => h.weekday === dayOfWeek);
    
    if (!dayConfig || !dayConfig.is_open || !dayConfig.start_time || !dayConfig.end_time) {
      setAvailableSlots([]);
      return;
    }

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    if (blockedDates.some(b => b.blocked_date === dateStr)) {
      setAvailableSlots([]);
      return;
    }

    // Parse start and end times for the day
    const [startH, startM] = dayConfig.start_time.split(':').map(Number);
    const [endH, endM] = dayConfig.end_time.split(':').map(Number);
    
    const dayStart = new Date(selectedDate);
    dayStart.setHours(startH, startM, 0, 0);
    
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(endH, endM, 0, 0);

    const interval = settings?.slot_interval_minutes || 30;
    const duration = selectedService.duration_minutes || 60;
    const noticeMs = (settings?.booking_notice_hours ?? 24) * 60 * 60 * 1000;
    const now = new Date();
    
    const slots: TimeSlot[] = [];
    let current = dayStart;

    while (true) {
      const slotEnd = addMinutes(current, duration);
      if (isBefore(dayEnd, slotEnd)) break;
      
      if (current.getTime() - now.getTime() >= noticeMs) {
        // Check overlaps
        const hasOverlap = appointments.some(apt => {
          if (apt.status === 'cancelled') return false;
          
          const aptDateParts = apt.appointment_date.split('-');
          const [aStartH, aStartM] = apt.start_time.split(':').map(Number);
          const [aEndH, aEndM] = apt.end_time.split(':').map(Number);
          
          // Use the exact date components from the appointment date to avoid timezone shifts
          const aStart = new Date(Number(aptDateParts[0]), Number(aptDateParts[1]) - 1, Number(aptDateParts[2]), aStartH, aStartM, 0, 0);
          const aEnd = new Date(Number(aptDateParts[0]), Number(aptDateParts[1]) - 1, Number(aptDateParts[2]), aEndH, aEndM, 0, 0);

          return current < aEnd && slotEnd > aStart;
        });

        if (!hasOverlap) {
          slots.push({
            start: current,
            end: slotEnd,
            label: format(current, 'h:mm a')
          });
        }
      }
      current = addMinutes(current, interval);
    }

    setAvailableSlots(slots);
  }, [selectedDate, selectedService, settings, hours, blockedDates, appointments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedSlot) return;

    setIsSubmitting(true);
    try {
      const newAppointment = {
        full_name: formData.full_name,
        email: formData.email.toLowerCase().trim(),
        phone: formData.phone,
        service_id: selectedService.id,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: format(selectedSlot.start, 'HH:mm:ss'),
        end_time: format(selectedSlot.end, 'HH:mm:ss'),
        notes: formData.notes,
        status: 'pending' as const
      };

      const { error } = await supabase.from('appointments').insert(newAppointment);
      
      if (error) throw error;
      
      setAppointments(prev => [...prev, { id: Date.now().toString(), ...newAppointment } as unknown as Appointment]);
      
      setStep(4);
    } catch (error: any) {
      console.error('Booking failed:', error);
      alert('Failed to book appointment. Please try again or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  if (isLoading) {
    return <div className="min-h-[80vh] flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;
  }

  return (
    <div className="bg-primary-50 min-h-screen py-16">
      <div className="container max-w-4xl mx-auto px-6">
        
        {/* Progress header (hidden on success step) */}
        {step < 4 && (
          <div className="mb-12">
            <h1 className="text-3xl font-serif font-medium text-secondary-900 mb-6 text-center">Reservation</h1>
            <div className="flex items-center justify-center space-x-2 text-sm font-medium">
              <span className={cn(step >= 1 ? 'text-primary-800' : 'text-secondary-400')}>1. Service</span>
              <span className="text-secondary-300">—</span>
              <span className={cn(step >= 2 ? 'text-primary-800' : 'text-secondary-400')}>2. Time</span>
              <span className="text-secondary-300">—</span>
              <span className={cn(step >= 3 ? 'text-primary-800' : 'text-secondary-400')}>3. Details</span>
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="grid gap-4">
                {services.map((service) => (
                  <div 
                    key={service.id} 
                    onClick={() => {
                      setSelectedService(service);
                      setStep(2);
                    }}
                    className="p-6 bg-white border border-secondary-100 rounded-xl cursor-pointer hover:border-primary-400 hover:shadow-md transition-all group flex justify-between items-center"
                  >
                    <div>
                      <h3 className="font-serif text-xl font-medium text-secondary-900 mb-1">{service.name}</h3>
                      <p className="text-secondary-500 text-sm mb-3 max-w-xl">{service.description}</p>
                      <div className="flex space-x-4 text-xs font-medium uppercase tracking-wider text-secondary-400">
                        <span className="flex items-center"><Clock className="w-3.5 h-3.5 mr-1" /> {service.duration_minutes} min</span>
                        <span>•</span>
                        <span>RM{service.price}</span>
                      </div>
                    </div>
                    <div className="text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-6 h-6" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <Card className="border-secondary-100 mb-6">
                <div className="px-6 py-4 bg-secondary-50/50 border-b border-secondary-100 flex items-center justify-between">
                  <div className="font-medium text-secondary-900">{selectedService?.name}</div>
                  <button onClick={() => setStep(1)} className="text-xs text-primary-600 hover:underline">Change Service</button>
                </div>
                <CardContent className="p-6">
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-medium text-secondary-900 uppercase tracking-widest">Select Date</h4>
                        <div className="flex items-center space-x-2">
                          <button onClick={prevMonth} className="p-1 rounded-full text-secondary-400 hover:bg-secondary-100 hover:text-primary-600 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                          </button>
                          <div className="font-serif text-base font-medium text-secondary-900 w-32 text-center">
                            {format(currentMonth, 'MMMM yyyy')}
                          </div>
                          <button onClick={nextMonth} className="p-1 rounded-full text-secondary-400 hover:bg-secondary-100 hover:text-primary-600 transition-colors">
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="mb-2">
                        <div className="grid grid-cols-7 text-center mb-2">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                            <div key={day} className="text-xs font-medium text-secondary-400 uppercase tracking-wider py-1">
                              {day}
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1 sm:gap-2">
                          {calendarDays.map((date, i) => {
                            const isSelected = selectedDate && isSameDay(selectedDate, date);
                            const isPast = isBefore(startOfDay(date), startOfDay(new Date()));
                            const isCurrentMonth = isSameMonth(date, currentMonth);
                            const dateStr = format(date, 'yyyy-MM-dd');
                            const isBlocked = blockedDates.some(b => b.blocked_date === dateStr);
                            const dayOfWeek = getDay(date);
                            const dayConfig = hours.find(h => h.weekday === dayOfWeek);
                            const isClosed = !dayConfig || !dayConfig.is_open;
                            const isDisabled = isPast || !isCurrentMonth || isBlocked || isClosed;
                            
                            return (
                              <button
                                key={i}
                                disabled={isDisabled}
                                onClick={() => {
                                  setSelectedSlot(null);
                                  setSelectedDate(date);
                                }}
                                className={cn(
                                  "aspect-[4/3] sm:aspect-square flex flex-col items-center justify-center rounded-md text-sm transition-all relative border border-transparent",
                                  isSelected 
                                    ? "bg-primary-900 text-white font-bold shadow-md transform scale-105 z-10"
                                    : isDisabled 
                                      ? "text-secondary-300 cursor-not-allowed opacity-40 bg-secondary-50/30" 
                                      : "text-secondary-800 hover:border-primary-300 bg-white shadow-sm hover:shadow",
                                  !isCurrentMonth && "opacity-0 pointer-events-none"
                                )}
                              >
                                <span>{format(date, 'd')}</span>
                                {isToday(date) && !isSelected && (
                                  <span className="w-1 h-1 rounded-full bg-primary-500 absolute bottom-1.5" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div>
                      {selectedDate ? (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                          <h4 className="text-sm font-medium text-secondary-900 mb-4 uppercase tracking-widest text-center md:text-left">
                            Available Times
                          </h4>
                          {availableSlots.length > 0 ? (
                            <div className="grid grid-cols-3 gap-3">
                              {availableSlots.map((slot, i) => (
                                <button
                                  key={i}
                                  onClick={() => {
                                    setSelectedSlot(slot);
                                    setStep(3);
                                  }}
                                  className="py-3 rounded-md border border-secondary-200 bg-white text-secondary-900 text-sm font-medium hover:border-primary-500 hover:text-primary-700 hover:bg-primary-50 transition-colors shadow-sm"
                                >
                                  {slot.label}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="p-8 text-center border border-dashed border-secondary-200 rounded-lg flex flex-col items-center justify-center h-[280px]">
                              <p className="text-secondary-500 text-sm">No availability on {format(selectedDate, 'MMM d')}.<br/>Please select another date.</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="hidden md:flex h-[360px] flex-col items-center justify-center text-center p-6 border border-dashed border-secondary-200 rounded-lg text-secondary-400">
                          <p className="text-sm">Select a date to see available times.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                  <Card>
                    <CardContent className="p-8">
                      <h3 className="font-serif text-2xl font-medium mb-6">Your Details</h3>
                      <form id="booking-form" onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-secondary-700">Full Name</label>
                          <Input required value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} placeholder="Jane Doe" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary-700">Email</label>
                            <Input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="jane@example.com" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary-700">Phone</label>
                            <Input type="tel" required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="(555) 000-0000" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-secondary-700">Event Details (Optional)</label>
                          <textarea
                            className="flex w-full rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-secondary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 min-h-[100px]"
                            placeholder="Tell us a bit about your event..."
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                          />
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <Card className="sticky top-28 bg-white border-primary-200">
                    <CardContent className="p-6">
                      <h4 className="font-serif text-lg font-medium mb-4">Summary</h4>
                      
                      <div className="space-y-4 text-sm mb-6">
                        <div>
                          <span className="block text-xs uppercase text-secondary-400 font-medium mb-1">Service</span>
                          <span className="font-medium text-secondary-900">{selectedService?.name}</span>
                        </div>
                        <div>
                          <span className="block text-xs uppercase text-secondary-400 font-medium mb-1">Date & Time</span>
                          <span className="font-medium text-secondary-900">
                            {selectedDate && format(selectedDate, 'EEEE, MMMM do, yyyy')}<br/>
                            {selectedSlot?.label} ({selectedService?.duration_minutes} min)
                          </span>
                        </div>
                        <div className="pt-4 border-t border-secondary-100 flex justify-between font-medium">
                          <span>Total</span>
                          <span>RM{selectedService?.price}</span>
                        </div>
                      </div>

                      <Button form="booking-form" type="submit" className="w-full h-12 text-sm uppercase tracking-widest" isLoading={isSubmitting}>
                        Confirm Request
                      </Button>
                      <button onClick={() => setStep(2)} className="w-full text-center text-xs text-secondary-500 mt-4 hover:text-secondary-900">
                        Go Back
                      </button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <div className="max-w-xl mx-auto text-center py-16 bg-white p-8 rounded-2xl shadow-sm border border-secondary-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-primary-600" />
                <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="font-serif text-3xl font-medium text-secondary-900 mb-4">Request Received</h2>
                <p className="text-secondary-600 mb-8 max-w-md mx-auto">
                  Thank you, {formData.full_name.split(' ')[0]}. We have received your consultation request and will reach out shortly to confirm the details.
                </p>
                <div className="inline-block bg-primary-50 rounded-lg p-6 text-left border border-primary-100">
                  <p className="text-sm font-medium text-secondary-900 mb-1">{selectedService?.name}</p>
                  <p className="text-sm text-secondary-600">
                    {selectedDate && format(selectedDate, 'EEEE, MMMM do, yyyy')} at {selectedSlot?.label}
                  </p>
                </div>
                <div className="mt-8">
                  <Button onClick={() => window.location.href = '/'} variant="outline">
                    Return to Homepage
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
