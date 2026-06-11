import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { BusinessSettings } from '@/types/database';
import PageTransition from '@/components/PageTransition';

export default function PublicLayout() {
  const [settings, setSettings] = useState<BusinessSettings | null>(null);

  useEffect(() => {
    supabase
      .from('business_settings')
      .select('*')
      .maybeSingle()
      .then(({ data }) => setSettings(data));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A] text-[#FDFCFB] font-sans selection:bg-[#D4AF37] selection:text-black">
      <header className="sticky top-0 z-50 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/10 shrink-0">
        <div className="px-6 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-[#D4AF37] flex items-center justify-center">
              <span className="text-[#D4AF37] font-serif text-lg tracking-tighter italic">
                {settings?.business_name ? settings.business_name.charAt(0) : 'E'}
              </span>
            </div>
            <Link to="/" className="tracking-[0.3em] font-light text-xs uppercase text-white hover:text-[#D4AF37] transition-colors">
              {settings?.business_name || 'Event Studio'}
            </Link>
          </div>
          <nav className="hidden md:flex gap-8 text-[10px] uppercase tracking-widest font-medium opacity-60">
            <a href="/#services" className="hover:text-[#D4AF37] transition-colors text-white">Services</a>
            <a href="/#about" className="hover:text-[#D4AF37] transition-colors text-white">Studio</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden md:block text-[10px] uppercase tracking-widest hover:text-[#D4AF37] transition-colors text-white font-medium opacity-80 hover:opacity-100">
              Client Portal
            </Link>
            <Link
              to="/book"
              className="px-5 py-2 border border-white/20 rounded-full text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all text-white"
            >
              Booking
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        <PageTransition />
      </main>

      <footer className="h-24 md:h-12 px-6 md:px-8 flex flex-col md:flex-row items-center justify-center md:justify-between border-t border-white/10 text-[9px] uppercase tracking-[0.2em] opacity-40 shrink-0 gap-2 md:gap-0 mt-8">
        <span>&copy; {new Date().getFullYear()} {settings?.business_name || 'Event Studio'}</span>
        <span className="hidden md:inline">
          <Link to="/login" className="hover:text-white transition-colors">Client Log In</Link>
          {' • '}
          <Link to="/admin/login" className="hover:text-white transition-colors">Admin Log In</Link>
        </span>
        <span>{settings?.business_address || 'KUALA LUMPUR, MY'}</span>
      </footer>
    </div>
  );
}
