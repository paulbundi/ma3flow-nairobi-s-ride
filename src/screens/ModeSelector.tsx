import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Car, Users, MapPin } from 'lucide-react';

interface ModeSelectorProps {
  onSelectMode: (mode: 'driver' | 'passenger') => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelectMode }) => {
  return (
    <div className="min-h-screen gradient-road flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-64 h-64 rounded-full bg-matatu-green/10 blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-matatu-yellow/10 blur-3xl"
          animate={{
            x: [0, -40, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Logo and title */}
      <motion.div
        className="text-center mb-12 z-10"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-matatu mb-6 shadow-lg"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <img src="/ma3.png" alt="MA3" className="w-full h-full object-contain" />
        </motion.div>
        <h1 className="font-display text-6xl md:text-7xl text-glow tracking-tight">
          MA<span className="text-matatu-yellow">3</span>FLOW
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Nairobi Matatu Simulator
        </p>
        <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4 text-primary" />
          <span>Nairobi, Kenya</span>
        </div>
      </motion.div>

      {/* Mode selection cards */}
      <motion.div
        className="grid md:grid-cols-2 gap-6 w-full max-w-2xl z-10"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        {/* Driver Mode Card */}
        <motion.button
          className="group relative bg-card border border-border rounded-2xl p-8 text-left transition-all hover:border-matatu-green hover:shadow-lg hover:shadow-matatu-green/20"
          onClick={() => onSelectMode('driver')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="absolute top-4 right-4">
            <div className="w-12 h-12 rounded-xl bg-matatu-green/20 flex items-center justify-center group-hover:bg-matatu-green/30 transition-colors">
              <Car className="w-6 h-6 text-matatu-green" />
            </div>
          </div>
          <h2 className="font-display text-3xl mb-2">Driver Mode</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Take the wheel! Navigate routes, pick up passengers, and earn your daily fare. 
            Experience Nairobi traffic from behind the wheel.
          </p>
          <div className="mt-6 flex items-center gap-2 text-matatu-green font-medium">
            <span>Start Driving</span>
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </div>
        </motion.button>

        {/* Passenger Mode Card */}
        <motion.button
          className="group relative bg-card border border-border rounded-2xl p-8 text-left transition-all hover:border-matatu-yellow hover:shadow-lg hover:shadow-matatu-yellow/20"
          onClick={() => onSelectMode('passenger')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="absolute top-4 right-4">
            <div className="w-12 h-12 rounded-xl bg-matatu-yellow/20 flex items-center justify-center group-hover:bg-matatu-yellow/30 transition-colors">
              <Users className="w-6 h-6 text-matatu-yellow" />
            </div>
          </div>
          <h2 className="font-display text-3xl mb-2">Passenger Mode</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Hop on a matatu! Track your journey, see upcoming stops, and experience 
            the authentic Nairobi commute.
          </p>
          <div className="mt-6 flex items-center gap-2 text-matatu-yellow font-medium">
            <span>Board Matatu</span>
            <motion.span
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </div>
        </motion.button>
      </motion.div>

      {/* Footer */}
      {/* <motion.p
        className="mt-12 text-muted-foreground text-sm z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Simulating Thika Road & Westlands Routes
      </motion.p> */}
    </div>
  );
};

export default ModeSelector;
