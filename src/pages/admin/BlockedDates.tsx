import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BlockedDate } from '@/types/database';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { Trash2, Plus, CalendarOff, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function BlockedDates() {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [newDate, setNewDate] = useState('');
  const [newReason, setNewReason] = useState('');

  const fetchDates = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('blocked_dates').select('*').order('blocked_date', { ascending: true });
    if (data) setBlockedDates(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchDates();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;
    
    try {
      const { error } = await supabase.from('blocked_dates').insert({
        blocked_date: newDate,
        reason: newReason || null
      });
      if (error) throw error;
      toast.success('Date blocked successfully');
      setNewDate('');
      setNewReason('');
      fetchDates();
    } catch (error: any) {
      toast.error(error.message || 'Failed to block date');
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const { error } = await supabase.from('blocked_dates').delete().eq('id', id);
      if (error) throw error;
      toast.success('Blocked date removed');
      fetchDates();
    } catch (error: any) {
      toast.error('Failed to remove block');
    }
  };

  // Filter out past dates for the upcoming view
  const today = new Date().toISOString().split('T')[0];
  const upcoming = blockedDates.filter(d => d.blocked_date >= today);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-medium text-secondary-900">Blocked Dates</h1>
        <p className="text-secondary-500 text-sm mt-1">Manage days off, holidays, and entire days where the studio is fully booked.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-serif font-medium text-lg mb-4">Add Blocked Date</h3>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary-700">Date</label>
                  <Input
                    type="date"
                    required
                    min={today}
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary-700">Reason (Optional)</label>
                  <Input
                    type="text"
                    placeholder="e.g. Corporate Retreat, Holiday"
                    value={newReason}
                    onChange={(e) => setNewReason(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Block Date
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-4">
          <h3 className="font-serif font-medium text-lg border-b border-secondary-200 pb-2">Upcoming Blocked Dates</h3>
          
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-secondary-400" /></div>
          ) : upcoming.length === 0 ? (
            <div className="text-center p-12 border border-dashed rounded-xl border-secondary-300">
              <CalendarOff className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
              <p className="text-secondary-500 font-medium">No upcoming blocked dates.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {upcoming.map((block) => {
                const [y, m, d] = block.blocked_date.split('-');
                const dateObj = new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0);
                return (
                <div key={block.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-secondary-200 rounded-lg shadow-sm">
                  <div className="flex items-center space-x-4 mb-2 sm:mb-0">
                    <div className="w-12 h-12 rounded-lg bg-red-50 text-red-600 flex flex-col items-center justify-center font-serif leading-none">
                      <span className="text-sm font-bold uppercase">{format(dateObj, 'MMM')}</span>
                      <span className="text-lg">{format(dateObj, 'dd')}</span>
                    </div>
                    <div>
                      <p className="font-medium text-secondary-900">{format(dateObj, 'EEEE, MMMM do, yyyy')}</p>
                      <p className="text-sm text-secondary-500">{block.reason || 'No reason provided'}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(block.id)} className="text-secondary-400 hover:text-red-600 self-end sm:self-auto">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )})}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
