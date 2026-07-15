import { create } from 'zustand';

export type DrawingMode = 
  | 'none'
  | 'add-location'
  | 'draw-polyline'
  | 'draw-polygon'
  | 'draw-circle'
  | 'draw-rectangle'
  | 'edit-route'
  | 'edit-shape';

interface DrawingState {
  mode: DrawingMode;
  activeRouteId: string | null;
  activeShapeId: string | null;
  previewPoints: Array<{ lat: number; lng: number }>;
  isDrawing: boolean;
  tempCircle: { center: { lat: number; lng: number }; radius: number } | null;
  tempRect: { ne: { lat: number; lng: number }; sw: { lat: number; lng: number } } | null;
}

interface DrawingActions {
  setMode: (mode: DrawingMode) => void;
  startDrawing: (mode: DrawingMode, id?: string) => void;
  addPreviewPoint: (point: { lat: number; lng: number }) => void;
  clearPreview: () => void;
  finishDrawing: () => void;
  cancelDrawing: () => void;
  setActiveRoute: (id: string | null) => void;
  setActiveShape: (id: string | null) => void;
  setTempCircle: (data: { center: { lat: number; lng: number }; radius: number } | null) => void;
  setTempRect: (data: { ne: { lat: number; lng: number }; sw: { lat: number; lng: number } } | null) => void;
}

export const useDrawingStore = create<DrawingState & DrawingActions>((set) => ({
  mode: 'none',
  activeRouteId: null,
  activeShapeId: null,
  previewPoints: [],
  isDrawing: false,
  tempCircle: null,
  tempRect: null,

  setMode: (mode) => set({ mode }),
  
  startDrawing: (mode, id) => set({
    mode,
    isDrawing: true,
    previewPoints: [],
    activeRouteId: mode.includes('route') ? id || null : null,
    activeShapeId: mode.includes('shape') ? id || null : null,
    tempCircle: null,
    tempRect: null,
  }),

  addPreviewPoint: (point) => set((state) => ({
    previewPoints: [...state.previewPoints, point]
  })),

  clearPreview: () => set({
    previewPoints: [],
    tempCircle: null,
    tempRect: null,
  }),

  finishDrawing: () => set({
    mode: 'none',
    isDrawing: false,
    previewPoints: [],
    activeRouteId: null,
    activeShapeId: null,
    tempCircle: null,
    tempRect: null,
  }),

  cancelDrawing: () => set({
    mode: 'none',
    isDrawing: false,
    previewPoints: [],
    activeRouteId: null,
    activeShapeId: null,
    tempCircle: null,
    tempRect: null,
  }),

  setActiveRoute: (id) => set({ activeRouteId: id }),
  setActiveShape: (id) => set({ activeShapeId: id }),

  setTempCircle: (data) => set({ tempCircle: data }),
  setTempRect: (data) => set({ tempRect: data }),
}));