import { ComingSoonPanel } from './ComingSoonPanel';

export function RoutesPanel() {
  return (
    <ComingSoonPanel
      title="Routes & Lines"
      phase="Phase 3"
      description="Draw straight lines, custom polylines, walking / driving / bicycling / transit routes; dashed, dotted, glowing and animated styles."
      billableNote="Driving, walking, bicycling and transit routes call the Directions API and can incur additional Google costs."
    />
  );
}
