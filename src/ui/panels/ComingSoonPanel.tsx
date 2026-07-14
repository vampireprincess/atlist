interface Props {
  title: string;
  phase: string;
  description: string;
  billableNote?: string;
}

export function ComingSoonPanel({ title, phase, description, billableNote }: Props) {
  return (
    <div className="p-4 space-y-3">
      <div className="text-lg font-semibold text-text">{title}</div>
      <div className="inline-block chip">{phase}</div>
      <p className="text-sm text-text-muted leading-relaxed">{description}</p>
      {billableNote && (
        <div className="text-2xs text-amber-300/80 border-l-2 border-amber-500/40 pl-2">
          ⚠ {billableNote}
        </div>
      )}
      <div className="text-2xs text-text-dim pt-2 border-t border-panel-border">
        The panel's data model is already in the project schema, so custom items created via <em>Import</em>
        or via JSON edit will be preserved and exported correctly.
      </div>
    </div>
  );
}
