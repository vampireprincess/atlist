import { useEffect } from 'react';
import { useProjectStore } from './store/projectStore';
import { EditorLayout } from './ui/layout/EditorLayout';
import { ApiSetupDialog } from './ui/dialogs/ApiSetupDialog';
import { ProjectPicker } from './ui/dialogs/ProjectPicker';
import { ErrorToast } from './ui/common/ErrorToast';

export default function App() {
  const bootstrap = useProjectStore((s) => s.bootstrap);
  const apiConfig = useProjectStore((s) => s.apiConfig);
  const project = useProjectStore((s) => s.project);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  // Global keyboard shortcuts for undo/redo/save/escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inField = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (e.key === 'Escape' && !inField) {
        useProjectStore.getState().setAddLocationMode(false);
        useProjectStore.getState().clearSelection();
        return;
      }
      const meta = e.metaKey || e.ctrlKey;
      if (!meta) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useProjectStore.getState().undo();
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        useProjectStore.getState().redo();
      } else if (key === 's') {
        e.preventDefault();
        useProjectStore.getState().saveNow();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Warn on unsaved changes
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (useProjectStore.getState().dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // Show Project Picker first — user can explore the app without an API key
  if (!project) {
    return (
      <>
        <ProjectPicker />
        <ErrorToast />
      </>
    );
  }

  // Only show API Setup when user has opened a project and tries to use map features
  return (
    <>
      <EditorLayout />
      {!apiConfig && <ApiSetupDialog />}
      <ErrorToast />
    </>
  );
}
