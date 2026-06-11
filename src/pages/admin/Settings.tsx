import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BusinessSettings } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase.from('business_settings').select('*').maybeSingle();
      if (data) {
        setSettings(data);
      } else {
        setSettings({
          id: '',
          business_name: 'Everly Events Studio',
          business_email: 'hello@example.com',
          business_phone: '+1 234 567 8900',
          business_address: 'Worldwide',
          slot_interval_minutes: 30,
          booking_notice_hours: 24,
          created_at: new Date().toISOString()
        });
      }
      setIsLoading(false);
    }
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    
    try {
      if (settings.id) {
        const { error } = await supabase
          .from('business_settings')
          .update(settings)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        const { id, created_at, ...insertData } = settings;
        const { data, error } = await supabase
          .from('business_settings')
          .insert(insertData)
          .select()
          .single();
        if (error) throw error;
        if (data) setSettings(data);
      }
      
      toast.success('Studio settings updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-secondary-400" /></div>;
  if (!settings) return <div className="p-8">Configuration error: Cannot load settings.</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-serif font-medium text-secondary-900">Studio Settings</h1>
        <p className="text-secondary-500 text-sm mt-1">Configure your studio profile and booking rules.</p>
      </div>

      <form onSubmit={handleSave}>
        <div className="space-y-6">
          <Card>
            <CardHeader className="border-b border-secondary-100 pb-4">
              <CardTitle className="text-lg">Studio Profile</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary-700">Studio Name</label>
                <Input
                  required
                  value={settings.business_name}
                  onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary-700">Studio Email</label>
                  <Input
                     type="email"
                     required
                     value={settings.business_email}
                     onChange={(e) => setSettings({ ...settings, business_email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary-700">Studio Phone</label>
                  <Input
                    type="tel"
                    value={settings.business_phone}
                    onChange={(e) => setSettings({ ...settings, business_phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary-700">Studio Address</label>
                <Input
                  value={settings.business_address}
                  onChange={(e) => setSettings({ ...settings, business_address: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-secondary-100 pb-4">
              <CardTitle className="text-lg">Booking Rules</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary-700">Slot Interval (Minutes)</label>
                  <p className="text-xs text-secondary-500 mb-2">How frequently slots appear (e.g. every 30 mins)</p>
                  <Input
                    type="number"
                    required
                    min={15}
                    step={15}
                    value={settings.slot_interval_minutes}
                    onChange={(e) => setSettings({ ...settings, slot_interval_minutes: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary-700">Minimum Booking Notice (Hours)</label>
                  <p className="text-xs text-secondary-500 mb-2">How far in advance clients must book</p>
                  <Input
                    type="number"
                    required
                    min={0}
                    value={settings.booking_notice_hours}
                    onChange={(e) => setSettings({ ...settings, booking_notice_hours: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit" size="lg" isLoading={isSaving}>Save Settings</Button>
        </div>
      </form>
    </div>
  );
}
