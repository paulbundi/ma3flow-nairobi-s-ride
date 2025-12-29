import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, AlertTriangle, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { aiAdvisorService, TrafficAdvice } from '@/services/AiAdvisorService';

export function AiAssistantBubble() {
  const [advice, setAdvice] = useState<TrafficAdvice | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = aiAdvisorService.subscribe((newAdvice) => {
      setAdvice(newAdvice);
      setIsVisible(true);
    });

    return () => unsubscribe();
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const getTypeStyles = (type: TrafficAdvice['type']) => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-amber-500/90',
          border: 'border-amber-400',
          icon: AlertTriangle,
        };
      case 'alert':
        return {
          bg: 'bg-red-500/90',
          border: 'border-red-400',
          icon: AlertCircle,
        };
      case 'success':
        return {
          bg: 'bg-emerald-500/90',
          border: 'border-emerald-400',
          icon: CheckCircle,
        };
      default:
        return {
          bg: 'bg-blue-500/90',
          border: 'border-blue-400',
          icon: Info,
        };
    }
  };

  const styles = advice ? getTypeStyles(advice.type) : getTypeStyles('info');
  const IconComponent = styles.icon;

  return (
    <AnimatePresence>
      {isVisible && advice && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className={`absolute bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-80 ${styles.bg} ${styles.border} border rounded-2xl shadow-2xl backdrop-blur-sm z-20`}
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 p-2 bg-white/20 rounded-full">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">
                    AI Traffic Advisor
                  </span>
                  <IconComponent className="w-4 h-4 text-white" />
                </div>
                <p className="text-sm text-white font-medium leading-relaxed">
                  {advice.message}
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white/80" />
              </button>
            </div>
          </div>
          
          {/* Animated pulse indicator */}
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
