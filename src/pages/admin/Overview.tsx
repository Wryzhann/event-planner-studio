import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { CalendarClock, CheckCircle, Clock, Layers } from 'lucide-react';
import { Appointment, Service } from '@/types/database';
import { startOfDay, endOfDay } from 'date-fns';

export default function Overview() {
  const [stats, setStats] = useState({
    upcoming: 0,
    pending: 0,
    completed: 0,
    activeServices: 0,
  });

  useEffect(() => {
    async function fetchStats() {
      // Use maybeSingle or count depending on what we need. Let's just do select.
      const today = new Date().toISOString().split('T')[0];

      const [
        { count: upcoming },
        { count: pending },
        { count: completed },
        { count: activeServices }
      ] = await Promise.all([
        supabase.from('appointments').select('*', { count: 'exact', head: true }).in('status', ['confirmed']).gte('appointment_date', today),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('services').select('*', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      setStats({
        upcoming: upcoming || 0,
        pending: pending || 0,
        completed: completed || 0,
        activeServices: activeServices || 0,
      });
    }

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-medium text-secondary-900">Dashboard Overview</h1>
        <p className="text-secondary-500 text-sm mt-1">Here is what's happening at your studio today.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-primary-50 text-primary-600 rounded-full">
                <CalendarClock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-500">Upcoming Confirmed</p>
                <h3 className="text-2xl font-serif font-medium">{stats.upcoming}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-yellow-50 text-yellow-600 rounded-full">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-500">Pending Requests</p>
                <h3 className="text-2xl font-serif font-medium">{stats.pending}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-50 text-green-600 rounded-full">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-500">Completed Sessions</p>
                <h3 className="text-2xl font-serif font-medium">{stats.completed}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-full">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-secondary-500">Active Services</p>
                <h3 className="text-2xl font-serif font-medium">{stats.activeServices}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
