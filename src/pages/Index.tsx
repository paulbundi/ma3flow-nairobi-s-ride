import React, { useState } from 'react';
import ModeSelector from '@/screens/ModeSelector';
import DriverScreen from '@/screens/DriverScreen';
import PassengerScreen from '@/screens/PassengerScreen';

type AppMode = 'select' | 'driver' | 'passenger';

const Index: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('select');

  const handleSelectMode = (selectedMode: 'driver' | 'passenger') => {
    setMode(selectedMode);
  };

  const handleBack = () => {
    setMode('select');
  };

  return (
    <>
      {mode === 'select' && <ModeSelector onSelectMode={handleSelectMode} />}
      {mode === 'driver' && <DriverScreen onBack={handleBack} />}
      {mode === 'passenger' && <PassengerScreen onBack={handleBack} />}
    </>
  );
};

export default Index;
