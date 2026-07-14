import clsx from 'clsx';
import { useProjectStore } from '@/store/projectStore';
import { ProjectManagerPanel } from '../panels/ProjectManagerPanel';
import { MapSettingsPanel } from '../panels/MapSettingsPanel';
import { LocationsPanel } from '../panels/LocationsPanel';
import { MarkersPanel } from '../panels/MarkersPanel';
import { PopupsPanel } from '../panels/PopupsPanel';
import { CategoriesPanel } from '../panels/CategoriesPanel';
import { RoutesPanel } from '../panels/RoutesPanel';
import { ShapesPanel } from '../panels/ShapesPanel';
import { LayersPanel } from '../panels/LayersPanel';
import { AnimationsPanel } from '../panels/AnimationsPanel';
import { InteractionsPanel } from '../panels/InteractionsPanel';
import { SidebarPanel } from '../panels/SidebarPanel';
import { LegendPanel } from '../panels/LegendPanel';
import { SearchPanel } from '../panels/SearchPanel';
import { ResponsivePanel } from '../panels/ResponsivePanel';
import { GlobalStylesPanel } from '../panels/GlobalStylesPanel';
import { AssetsPanel } from '../panels/AssetsPanel';
import { ImportPanel } from '../panels/ImportPanel';
import { ExportPanel } from '../panels/ExportPanel';
import { OverviewPanel } from '../panels/OverviewPanel';

const PANELS = [
  { id: 'projects', label: 'Project', icon: '📁' },
  { id: 'mapSettings', label: 'Map', icon: '🗺' },
  { id: 'locations', label: 'Locations', icon: '📍' },
  { id: 'markers', label: 'Markers', icon: '🎯' },
  { id: 'popups', label: 'Popups', icon: '💬' },
  { id: 'categories', label: 'Categories', icon: '🏷' },
  { id: 'routes', label: 'Routes', icon: '➰' },
  { id: 'shapes', label: 'Shapes', icon: '⬢' },
  { id: 'layers', label: 'Layers', icon: '☰' },
  { id: 'animations', label: 'Animations', icon: '✨' },
  { id: 'interactions', label: 'Interactions', icon: '⚡' },
  { id: 'sidebar', label: 'Sidebar', icon: '▤' },
  { id: 'legend', label: 'Legend', icon: '⚖' },
  { id: 'search', label: 'Search', icon: '🔍' },
  { id: 'responsive', label: 'Responsive', icon: '📱' },
  { id: 'globalStyles', label: 'Styles', icon: '🎨' },
  { id: 'assets', label: 'Assets', icon: '🖼' },
  { id: 'importPanel', label: 'Import', icon: '⬇' },
  { id: 'exportPanel', label: 'Export', icon: '⬆' },
  { id: 'overview', label: 'Overview', icon: 'ⓘ' },
] as const;

export function LeftPanel() {
  const activePanel = useProjectStore((s) => s.activePanel);
  const setPanel = useProjectStore((s) => s.setPanel);

  return (
    <aside className="flex shrink-0 h-full border-r border-panel-border bg-panel">
      <nav className="w-14 flex flex-col items-stretch py-1 border-r border-panel-border bg-panel overflow-y-auto">
        {PANELS.map((p) => (
          <button
            key={p.id}
            className={clsx(
              'group flex flex-col items-center gap-0.5 py-2 px-1 transition-colors relative',
              activePanel === p.id
                ? 'bg-panel-light text-accent'
                : 'text-text-muted hover:text-text hover:bg-panel-light',
            )}
            onClick={() => setPanel(p.id)}
            title={p.label}
          >
            <span className="text-lg leading-none">{p.icon}</span>
            <span className="text-[9px] leading-tight uppercase tracking-wide">{p.label}</span>
            {activePanel === p.id && <span className="absolute left-0 top-1 bottom-1 w-0.5 bg-accent rounded-r" />}
          </button>
        ))}
      </nav>

      <div className="w-72 h-full overflow-y-auto flex flex-col">
        <div className="px-3 py-2 border-b border-panel-border flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider text-text-muted font-semibold">
            {PANELS.find((p) => p.id === activePanel)?.label}
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto">
          {activePanel === 'projects' && <ProjectManagerPanel />}
          {activePanel === 'mapSettings' && <MapSettingsPanel />}
          {activePanel === 'locations' && <LocationsPanel />}
          {activePanel === 'markers' && <MarkersPanel />}
          {activePanel === 'popups' && <PopupsPanel />}
          {activePanel === 'categories' && <CategoriesPanel />}
          {activePanel === 'routes' && <RoutesPanel />}
          {activePanel === 'shapes' && <ShapesPanel />}
          {activePanel === 'layers' && <LayersPanel />}
          {activePanel === 'animations' && <AnimationsPanel />}
          {activePanel === 'interactions' && <InteractionsPanel />}
          {activePanel === 'sidebar' && <SidebarPanel />}
          {activePanel === 'legend' && <LegendPanel />}
          {activePanel === 'search' && <SearchPanel />}
          {activePanel === 'responsive' && <ResponsivePanel />}
          {activePanel === 'globalStyles' && <GlobalStylesPanel />}
          {activePanel === 'assets' && <AssetsPanel />}
          {activePanel === 'importPanel' && <ImportPanel />}
          {activePanel === 'exportPanel' && <ExportPanel />}
          {activePanel === 'overview' && <OverviewPanel />}
        </div>
      </div>
    </aside>
  );
}
