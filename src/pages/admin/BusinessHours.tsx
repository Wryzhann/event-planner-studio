import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BusinessHours } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const WEEKDAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export default function BusinessHoursPage() {
  const [hours, setHours] = useState<BusinessHours[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchHours() {
      const { data } = await supabase.from('business_hours').select('*').order('weekday');
      if (data) setHours(data);
      setIsLoading(false);
    }
    fetchHours();
  }, []);

  const handleChange = (id: string, field: keyof BusinessHours, value: any) => {
    setHours(prev => prev.map(h => h.id === id ? { ...h, [field]: value } : h));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('business_hours').upsert(hours);
      if (error) throw error;
      toast.success('Business hours updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save business hours');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-secondary-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-medium text-secondary-900">Business Hours</h1>
          <p className="text-secondary-500 text-sm mt-1">Set your standard weekly availability for consultations.</p>
        </div>
        <Button onClick={handleSave} isLoading={isSaving}>
          Save Changes
        </Button>
      </div>

      <Card>
        <CardContent className="p-0 divide-y divide-secondary-100">
          {hours.map((hour) => (
            <div key={hour.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-4 w-48">
                <input
                  type="checkbox"
                  id={`open-${hour.id}`}
                  checked={hour.is_open}
                  onChange={(e) => handleChange(hour.id, 'is_open', e.target.checked)}
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-600"
                />
                <label htmlFor={`open-${hour.id}`} className="font-medium text-secondary-900">
                  {WEEKDAYS[hour.weekday]}
                </label>
              </div>

              {hour.is_open ? (
                <div className="flex items-center space-x-4 flex-1 md:justify-end">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-secondary-500 w-12 text-right">Open</span>
                    <Input
                      type="time"
                      value={hour.start_time}
                      onChange={(e) => handleChange(hour.id, 'start_time', e.target.value)}
                      className="w-32"
                    />
                  </div>
                  <span className="text-secondary-300">to</span>
                  <div className="flex items-center space-x-2">
                    <Input
                      type="time"
                      value={hour.end_time}
                      onChange={(e) => handleChange(hour.id, 'end_time', e.target.value)}
                      className="w-32"
                    />
                    <span className="text-sm text-secondary-500 w-12">Close</span>
                  </div>
                </div>
              ) : (
                <div className="flex-1 text-secondary-400 text-sm md:text-right font-medium italic">
                  Closed
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
