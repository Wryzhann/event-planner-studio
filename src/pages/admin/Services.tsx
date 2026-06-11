import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Service } from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { Edit2, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<Service>>({
    name: '',
    description: '',
    duration_minutes: 60,
    price: 0,
    is_active: true
  });

  const fetchServices = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('services').select('*').order('created_at', { ascending: false });
    if (data) setServices(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleEdit = (service: Service) => {
    setIsEditing(service.id);
    setFormData(service);
  };

  const handleCreateNew = () => {
    setIsEditing('new');
    setFormData({
      name: '',
      description: '',
      duration_minutes: 60,
      price: 0,
      is_active: true
    });
  };

  const cancelEdit = () => {
    setIsEditing(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing === 'new') {
        const { error } = await supabase.from('services').insert({
          name: formData.name,
          description: formData.description,
          duration_minutes: formData.duration_minutes,
          price: formData.price,
          is_active: formData.is_active
        });
        if (error) throw error;
        toast.success('Service created');
      } else if (isEditing) {
        const { error } = await supabase.from('services').update({
          name: formData.name,
          description: formData.description,
          duration_minutes: formData.duration_minutes,
          price: formData.price,
          is_active: formData.is_active
        }).eq('id', isEditing);
        if (error) throw error;
        toast.success('Service updated');
      }
      setIsEditing(null);
      fetchServices();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save service');
    }
  };

  const toggleActive = async (service: Service) => {
    try {
      const { error } = await supabase.from('services').update({
        is_active: !service.is_active
      }).eq('id', service.id);
      if (error) throw error;
      toast.success(service.is_active ? 'Service deactivated' : 'Service activated');
      fetchServices();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (isLoading && services.length === 0) {
    return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-secondary-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-medium text-secondary-900">Services</h1>
          <p className="text-secondary-500 text-sm mt-1">Manage your studio services and pricing.</p>
        </div>
        {!isEditing && (
          <Button onClick={handleCreateNew} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        )}
      </div>

      {isEditing ? (
        <Card className="border-primary-200 shadow-md">
          <CardContent className="p-6">
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary-700">Service Name</label>
                <Input
                  required
                  value={formData.name || ''}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Full-Service Event Planning"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary-700">Description</label>
                <textarea
                  className="flex w-full rounded-md border border-secondary-200 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-secondary-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
                  required
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe this service..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary-700">Duration (Minutes)</label>
                  <Input
                    type="number"
                    required
                    min={15}
                    value={formData.duration_minutes || ''}
                    onChange={e => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary-700">Price (RM)</label>
                  <Input
                    type="number"
                    required
                    min={0}
                    value={formData.price || ''}
                    onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-secondary-300 text-primary-600 focus:ring-primary-600"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-secondary-700">
                  Service is active and visible on booking page
                </label>
              </div>

                <div className="flex justify-between w-full pt-4 border-t border-secondary-100">
                  {isEditing !== 'new' ? (
                    <Button type="button" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={async () => {
                      if (confirm('Are you sure you want to delete this service?')) {
                        try {
                          const { error } = await supabase.from('services').delete().eq('id', isEditing);
                          if (error) throw error;
                          toast.success('Service deleted');
                          setIsEditing(null);
                          fetchServices();
                        } catch (error: any) {
                          toast.error(error.message || 'Failed to delete service');
                        }
                      }
                    }}>Delete Service</Button>
                  ) : <div></div>}
                  <div className="flex space-x-3">
                    <Button type="button" variant="ghost" onClick={cancelEdit}>Cancel</Button>
                    <Button type="submit">Save Service</Button>
                  </div>
                </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {services.map((service) => (
            <Card key={service.id} className={!service.is_active ? 'opacity-60 bg-secondary-50' : ''}>
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-serif font-medium text-lg text-secondary-900">{service.name}</h3>
                    {!service.is_active && (
                      <span className="px-2 py-0.5 rounded-full bg-secondary-200 text-secondary-700 text-xs font-medium">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-secondary-500 max-w-2xl truncate mb-2">{service.description}</p>
                  <div className="flex items-center gap-4 text-xs font-medium text-secondary-500">
                    <span>{service.duration_minutes} mins</span>
                    <span>•</span>
                    <span>RM{service.price}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggleActive(service)}>
                    {service.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleEdit(service)}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {services.length === 0 && (
            <div className="text-center p-12 border border-dashed rounded-xl border-secondary-200">
              <p className="text-secondary-500 font-medium">No services found.</p>
              <Button variant="link" onClick={handleCreateNew} className="mt-2 text-primary-600">Create your first service</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
