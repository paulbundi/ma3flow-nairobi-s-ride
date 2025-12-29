import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  RotateCcw,
  CloudRain,
  AlertTriangle,
  Settings,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { SimulationState } from '@/services/SimulationService';

interface SimulationControlsProps {
  state: SimulationState;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onSetRaining: (value: boolean) => void;
  onSetTrafficHealth: (value: number) => void;
  onBack: () => void;
}

const SimulationControls: React.FC<SimulationControlsProps> = ({
  state,
  isRunning,
  onStart,
  onStop,
  onReset,
  onSetRaining,
  onSetTrafficHealth,
  onBack,
}) => {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <motion.div 
      className="absolute bottom-0 left-0 right-0 z-20"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
    >
      {/* Expandable settings panel */}
      <motion.div 
        className="bg-card/95 backdrop-blur-md border-t border-border"
        animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
        initial={{ height: 0, opacity: 0 }}
      >
        {expanded && (
          <div className="p-4 space-y-4 border-b border-border/50">
            <h3 className="font-display text-lg flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              Simulation Controls
            </h3>
            
            {/* Rain toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CloudRain className={`w-5 h-5 ${state.isRaining ? 'text-blue-400' : 'text-muted-foreground'}`} />
                <div>
                  <p className="font-medium">Simulate Rain</p>
                  <p className="text-xs text-muted-foreground">1.5x fare multiplier</p>
                </div>
              </div>
              <Switch
                checked={state.isRaining}
                onCheckedChange={onSetRaining}
              />
            </div>

            {/* Traffic slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className={`w-5 h-5 ${state.trafficHealth < 50 ? 'text-destructive' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="font-medium">Traffic Congestion</p>
                    <p className="text-xs text-muted-foreground">Slide left for traffic jam</p>
                  </div>
                </div>
                <span className="text-sm font-mono">{Math.round(state.trafficHealth)}%</span>
              </div>
              <Slider
                value={[state.trafficHealth]}
                onValueChange={([value]) => onSetTrafficHealth(value)}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Gridlock</span>
                <span>Free Flow</span>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Main control bar */}
      <div className="bg-card/95 backdrop-blur-md px-4 py-4">
        <div className="flex items-center gap-3">
          {/* Back button */}
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            className="shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          {/* Settings toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpanded(!expanded)}
            className="shrink-0"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </Button>

          {/* Main action button */}
          <Button
            variant="driver"
            size="lg"
            className="flex-1"
            onClick={isRunning ? onStop : onStart}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                Stop Simulation
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Driving
              </>
            )}
          </Button>

          {/* Reset button */}
          <Button
            variant="outline"
            size="icon"
            onClick={onReset}
            className="shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default SimulationControls;
