import { motion } from 'motion/react';
import { Waves } from 'lucide-react';

interface WaterTankProps {
  currentLiters: number;
  capacity: number;
}

export default function WaterTank({ currentLiters, capacity }: WaterTankProps) {
  const percentage = Math.min(100, (currentLiters / capacity) * 100);

  return (
    <div className="relative w-48 h-64 mx-auto bg-slate-50 border-[6px] border-slate-100 rounded-[3rem] overflow-hidden shadow-2xl shadow-olive/5 group">
      {/* Dynamic Water Layer */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-olive to-olive-light opacity-90"
        initial={{ height: 0 }}
        animate={{ height: `${percentage}%` }}
        transition={{ type: 'spring', damping: 25, stiffness: 40 }}
      >
        {/* Glow effect at the surface */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-white/20 blur-xl -translate-y-4" />
        
        {/* Bubbles */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white/20 rounded-full"
            style={{ 
              width: Math.random() * 8 + 4, 
              height: Math.random() * 8 + 4,
              left: `${Math.random() * 100}%`,
              bottom: 0
            }}
            animate={{ 
              bottom: '100%',
              opacity: [0, 0.4, 0],
              x: [0, (Math.random() - 0.5) * 20]
            }}
            transition={{ 
              duration: Math.random() * 3 + 2, 
              repeat: Infinity, 
              delay: Math.random() * 2,
              ease: "easeOut"
            }}
          />
        ))}

        {/* Wave Overlay */}
        <motion.div
          className="absolute -top-6 w-[250%] h-12 bg-white/10 rounded-[45%] left-[-75%] blur-[1px]"
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        />
        <motion.div
          className="absolute -top-8 w-[250%] h-12 bg-white/5 rounded-[40%] left-[-50%] blur-[2px]"
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>

      {/* Glass Reflection */}
      <div className="absolute top-0 left-4 w-4 h-full bg-gradient-to-r from-white/20 to-transparent opacity-40 rounded-full blur-sm" />
      <div className="absolute top-8 right-6 w-1 h-32 bg-white/10 rounded-full opacity-30" />

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <motion.div 
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border border-white"
        >
          <div className="text-3xl font-black text-olive tabular-nums">
            {percentage.toFixed(0)}%
          </div>
        </motion.div>
        
        <div className="mt-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
           Storage
        </div>
      </div>
      
      {/* Decorative Icon */}
      <div className="absolute top-4 right-4 text-slate-200 group-hover:text-olive/20 transition-colors">
        <Waves className="w-5 h-5" />
      </div>
    </div>
  );
}
