import { TopBar } from './TopBar';
import { LeftPanel } from './LeftPanel';
import { MapCanvas } from '../canvas/MapCanvas';
import { RightInspector } from './RightInspector';

export function EditorLayout() {
  return (
    <div className="h-screen w-screen flex flex-col bg-surface text-text">
      <TopBar />
      <div className="flex-1 flex min-h-0">
        <LeftPanel />
        <main className="flex-1 relative min-w-0">
          <MapCanvas />
        </main>
        <RightInspector />
      </div>
    </div>
  );
}
