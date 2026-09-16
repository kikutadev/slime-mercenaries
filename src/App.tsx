import { AppShell } from './app/AppShell';
import { GameProvider } from './app/GameProvider';

export default function App() {
  return (
    <GameProvider>
      <AppShell />
    </GameProvider>
  );
}
