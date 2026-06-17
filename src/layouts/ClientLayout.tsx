import { Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import PageTransition from '@/components/PageTransition';

export default function ClientLayout() {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0A0A0A]">
        <Loader2 className="h-8 w-8 animate-spin text-[#D4AF37] mb-4" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A] text-[#FDFCFB] font-sans selection:bg-[#D4AF37] selection:text-black">
      {/* Header */}
      <header className="h-16 px-6 md:px-8 flex items-center justify-between border-b border-white/10 shrink-0">
        <div className="flex items-center gap-8">
          <Link to="/" className="tracking-[0.3em] font-light text-xs uppercase text-white hover:text-[#D4AF37] transition-colors">
            Ali Baba Event Studio
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/client" className={`text-[10px] uppercase tracking-widest transition-colors ${location.pathname === '/client' ? 'text-[#D4AF37]' : 'text-white/60 hover:text-white'}`}>
              Events
            </Link>
            <Link to="/client/profile" className={`text-[10px] uppercase tracking-widest transition-colors ${location.pathname === '/client/profile' ? 'text-[#D4AF37]' : 'text-white/60 hover:text-white'}`}>
              Profile
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[10px] uppercase tracking-widest opacity-60 hidden md:block">
            {user.email}
          </span>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              toast.success('Signed out');
            }}
            className="text-[10px] uppercase tracking-widest hover:text-[#D4AF37] transition-colors flex items-center gap-2"
          >
            <LogOut className="w-3 h-3" />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 container mx-auto relative overflow-hidden flex flex-col">
        <PageTransition />
      </main>
    </div>
  );
}
