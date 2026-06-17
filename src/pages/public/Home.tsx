import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Service } from '@/types/database';
import { motion } from 'framer-motion';

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    supabase.from('services').select('*').eq('is_active', true).order('price', { ascending: false }).then(({ data }) => {
      if (data) setServices(data);
    });
  }, []);

  return (
    <div className="flex-1 p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 md:auto-rows-[minmax(200px,auto)] gap-4 container mx-auto">
      {/* Hero Section (Bento Grid Style) */}
      <div className="col-span-1 md:col-span-8 md:row-span-3 relative rounded-3xl overflow-hidden bg-neutral-900 border border-white/10 min-h-[500px] flex items-end">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=2000" 
            alt="Elegant event table setup" 
            className="w-full h-full object-cover object-center opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/90 via-black/40 to-transparent" />
        </div>

        <div className="relative z-10 p-8 md:p-12 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          >
            <span className="text-[#D4AF37] font-medium tracking-widest uppercase text-xs mb-4 block">
              Bespoke Event Design & Planning
            </span>
            <h1 className="text-4xl md:text-6xl font-serif font-medium text-white mb-6 leading-[1.1] italic">
              Curating Life’s Most <br className="hidden md:block" />Elegant Celebrations.
            </h1>
            <p className="text-sm md:text-base text-white/70 mb-8 font-light max-w-lg leading-relaxed">
              We bring visionary concepts to life with meticulous details, flawless execution, and a timeless aesthetic to create memories that linger.
            </p>
            <Link 
              to="/book" 
              className="inline-flex items-center justify-center bg-[#D4AF37] text-black px-8 py-4 text-[10px] uppercase tracking-widest font-bold hover:bg-[#C5A059] transition-all rounded-full"
            >
              Inquire Now
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Services Section (Mapped to Bento Grid) */}
      <div id="services" className="col-span-1 md:col-span-4 md:row-span-3 rounded-3xl bg-[#FDFCFB] text-[#1A1A1A] p-8 border border-white/10 flex flex-col justify-between">
        <div className="mb-8">
          <h2 className="text-3xl font-serif italic mb-4 text-[#1A1A1A]">Our Services</h2>
          <p className="text-xs text-black/50 leading-relaxed">
            From conception to flawless execution, we offer tailored planning services designed to accommodate the unique scale and vision of your event.
          </p>
        </div>

        <div className="space-y-3 overflow-y-auto pr-2 max-h-[350px]">
          {services.map((service, idx) => (
            <motion.div 
              key={service.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.6 }}
              className={`p-4 rounded-2xl flex flex-col justify-between group transition-colors cursor-pointer border ${
                idx === 0 
                ? 'border-[#D4AF37] bg-white shadow-sm' 
                : 'border-black/5 bg-black/5 opacity-80 hover:opacity-100 hover:bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold uppercase tracking-tight text-black">{service.name}</h4>
                {idx === 0 && (
                  <div className="w-4 h-4 rounded-full bg-[#D4AF37] flex items-center justify-center shrink-0">
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-black/60 mb-3">{service.description.substring(0, 80)}...</p>
              <div className="flex items-center justify-between border-t border-black/10 pt-3">
                <span className="text-black/50 font-medium text-[10px] tracking-wider uppercase">
                  From RM{service.price}
                </span>
                <Link to="/book" className="text-black font-medium text-[10px] uppercase hover:text-[#D4AF37] transition-colors">
                  Reserve →
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* About / Philosophy Section Image (Bento Image box) */}
      <div className="col-span-1 md:col-span-4 md:row-span-2 rounded-3xl overflow-hidden border border-white/10 relative min-h-[300px]">
        <img 
          src="https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=1000" 
          alt="Event Planner arranging details" 
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
      </div>

      {/* About / Philosophy Section Text (Bento Box) */}
      <div id="about" className="col-span-1 md:col-span-8 md:row-span-2 rounded-3xl bg-neutral-900 border border-white/10 p-8 md:p-12 flex flex-col justify-center">
        <span className="text-[#D4AF37] font-bold tracking-[0.2em] uppercase text-xs mb-4 block">
          The Philosophy
        </span>
        <h2 className="text-3xl md:text-5xl font-serif font-medium text-white mb-6 leading-[1.1] italic">
          An intentional approach <br/> to extraordinary events.
        </h2>
        <div className="grid md:grid-cols-2 gap-8 text-white/70 leading-relaxed text-sm font-light italic">
          <p>
            We believe that the best events are deeply personal and flawlessly executed. Our studio specializes in translating your vision into a cohesive, sensory experience where every detail feels inevitable.
          </p>
          <div>
            <p className="mb-6">
              From building relationships with premier vendors to crafting minute-by-minute timelines, we handle the intricacies of production so you can remain present in the moments that matter most.
            </p>
            <Link to="/book" className="inline-block border-b border-[#D4AF37] text-[#D4AF37] font-bold text-[10px] uppercase tracking-widest hover:text-[#C5A059] hover:border-[#C5A059] transition-colors pb-1">
              Begin your planning journey
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
