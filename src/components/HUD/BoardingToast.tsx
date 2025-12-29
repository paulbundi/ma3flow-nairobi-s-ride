import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BoardingEvent } from '@/services/SimulationService';
import { Users, Banknote, MapPin } from 'lucide-react';

interface BoardingToastProps {
  event: BoardingEvent | null;
  isVisible: boolean;
}

const BoardingToast: React.FC<BoardingToastProps> = ({ event, isVisible }) => {
  if (!event) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-32 left-1/2 z-50 -translate-x-1/2"
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          <div className="bg-matatu-green text-primary-foreground px-5 py-3 rounded-xl shadow-lg border-2 border-matatu-yellow/30">
            <div className="flex items-center gap-4">
              {/* Passengers icon with animation */}
              <motion.div 
                className="relative"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
              >
                <div className="w-12 h-12 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <motion.div
                  className="absolute -top-1 -right-1 w-6 h-6 bg-matatu-yellow text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  +{event.passengersBoarded}
                </motion.div>
              </motion.div>

              {/* Info */}
              <div>
                <motion.p 
                  className="font-display text-2xl"
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  +{event.passengersBoarded} Passengers
                </motion.p>
                <motion.div 
                  className="flex items-center gap-3 text-sm opacity-90"
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="flex items-center gap-1">
                    <Banknote className="w-4 h-4" />
                    +{event.revenue} KES
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {event.stopName}
                  </span>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BoardingToast;
