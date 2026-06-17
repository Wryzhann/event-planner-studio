import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import PageTransition from '@/components/PageTransition';
import {
  LayoutDashboard,
  Calendar,
  Layers,
  Clock,
  CalendarOff,
  Settings as SettingsIcon,
  LogOut,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

const sidebarLinks = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/appointments', label: 'Appointments', icon: Calendar },
  { href: '/admin/services', label: 'Services', icon: Layers },
  { href: '/admin/business-hours', label: 'Business Hours', icon: Clock },
  { href: '/admin/blocked-dates', label: 'Blocked Dates', icon: CalendarOff },
  { href: '/admin/settings', label: 'Settings', icon: SettingsIcon },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: ShieldAlert },
];

export default function AdminLayout() {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-primary-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600 mb-4" />
        <p className="text-secondary-600 font-medium">Verifying access...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-primary-50 p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm text-center">
          <h2 className="text-xl font-serif font-medium text-secondary-900 mb-2">Unauthorized access</h2>
          <p className="text-secondary-500 mb-6 font-medium">
            You are signed in, but you are not authorized as an admin.
          </p>
          <Button onClick={() => supabase.auth.signOut()} className="w-full">
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-secondary-50 text-secondary-900 font-sans">
      <aside className="w-64 bg-white border-r border-secondary-200 flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-secondary-100">
          <h2 className="font-serif text-lg font-medium text-primary-900">Studio Admin</h2>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.href || (link.href !== '/admin' && location.pathname.startsWith(link.href));
            
            return (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-50 text-primary-900'
                    : 'text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900'
                )}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-secondary-100">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              toast.success('Signed out successfully');
            }}
            className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>
      
      <main className="flex-1 overflow-auto p-8 relative flex flex-col">
        <div className="max-w-5xl mx-auto w-full flex-1 flex flex-col">
          <PageTransition />
        </div>
      </main>
    </div>
  );
}
