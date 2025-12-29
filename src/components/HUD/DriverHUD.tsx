import React from 'react';
import { motion } from 'framer-motion';
import { SimulationState } from '@/services/SimulationService';
import { 
  Gauge, 
  Users, 
  Banknote, 
  CloudRain, 
  Clock, 
  Activity,
  TrendingUp
} from 'lucide-react';

interface DriverHUDProps {
  state: SimulationState;
}

const DriverHUD: React.FC<DriverHUDProps> = ({ state }) => {
  const getTrafficColor = (health: number) => {
    if (health >= 70) return 'text-matatu-green';
    if (health >= 40) return 'text-matatu-yellow';
    return 'text-destructive';
  };

  const getSpeedColor = (speed: number) => {
    if (speed >= 40) return 'text-matatu-green';
    if (speed >= 20) return 'text-matatu-yellow';
    return 'text-destructive';
  };

  return (
    <motion.div 
      className="absolute top-0 left-0 right-0 z-20 p-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Main HUD Bar */}
      <div className="bg-card/95 backdrop-blur-md rounded-xl border border-border shadow-lg overflow-hidden">
        {/* Status indicators row */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border/50 bg-muted/30">
          {state.isRaining && (
            <motion.div 
              className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <CloudRain className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-blue-400">Rain</span>
            </motion.div>
          )}
          {state.isRushHour && (
            <motion.div 
              className="flex items-center gap-1 px-2 py-1 bg-orange-500/20 rounded-full"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              <Clock className="w-3 h-3 text-orange-400" />
              <span className="text-xs text-orange-400">Rush Hour</span>
            </motion.div>
          )}
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              Fare: <span className="text-matatu-yellow font-semibold">{state.currentFare} KES</span>
            </span>
          </div>
        </div>

        {/* Main stats row */}
        <div className="grid grid-cols-4 divide-x divide-border/50">
          {/* Speed */}
          <div className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Gauge className={`w-4 h-4 ${getSpeedColor(state.speed)}`} />
            </div>
            <motion.p 
              className={`font-display text-2xl ${getSpeedColor(state.speed)}`}
              key={state.speed}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
            >
              {state.speed}
            </motion.p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">km/h</p>
          </div>

          {/* Passengers */}
          <div className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="w-4 h-4 text-matatu-yellow" />
            </div>
            <motion.p 
              className="font-display text-2xl"
              key={state.passengers}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
            >
              {state.passengers}
              <span className="text-muted-foreground text-lg">/{state.maxPassengers}</span>
            </motion.p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Passengers</p>
          </div>

          {/* Revenue */}
          <div className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Banknote className="w-4 h-4 text-matatu-green" />
            </div>
            <motion.p 
              className="font-display text-2xl text-matatu-green"
              key={state.totalRevenue}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
            >
              {state.totalRevenue.toLocaleString()}
            </motion.p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">KES</p>
          </div>

          {/* Traffic */}
          <div className="p-3 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Activity className={`w-4 h-4 ${getTrafficColor(state.trafficHealth)}`} />
            </div>
            <motion.p 
              className={`font-display text-2xl ${getTrafficColor(state.trafficHealth)}`}
              key={Math.round(state.trafficHealth)}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
            >
              {Math.round(state.trafficHealth)}%
            </motion.p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Traffic</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DriverHUD;
