import type { Location, PopupBlock, PopupTemplate, Project } from '@/types';

interface Props {
  template: PopupTemplate;
  location: Location;
  project: Project;
  onClose?: () => void;
}

/**
 * Renders a popup template as HTML.
 * This same shape is what the export pipeline generates in vanilla JS.
 */
export function PopupRenderer({ template, location, project, onClose }: Props) {
  const style: React.CSSProperties = {
    width: template.width,
    maxWidth: template.maxWidth,
    padding: template.padding,
    background: template.background,
    border: template.borderWidth > 0 ? `${template.borderWidth}px solid ${template.borderColor}` : 'none',
    borderRadius: template.borderRadius,
    boxShadow: template.shadow,
    color: project.globalStyles.textColor,
    fontFamily: project.globalStyles.fontFamily,
    backdropFilter: template.backdropBlur > 0 ? `blur(${template.backdropBlur}px)` : undefined,
    position: 'relative',
  };

  return (
    <div style={style} role="dialog" aria-label={location.name}>
      {template.showClose && (
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'rgba(0,0,0,0.06)',
            borderRadius: 999,
            cursor: 'pointer',
            fontSize: 14,
            color: '#4b5563',
          }}
        >
          ×
        </button>
      )}
      {template.blocks.map((block) => (
        <BlockView key={block.id} block={block} location={location} />
      ))}
      {template.showArrow && (
        <div
          style={{
            position: 'absolute',
            bottom: -8,
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: 16,
            height: 16,
            background: template.background,
            borderRight: template.borderWidth > 0 ? `${template.borderWidth}px solid ${template.borderColor}` : undefined,
            borderBottom: template.borderWidth > 0 ? `${template.borderWidth}px solid ${template.borderColor}` : undefined,
          }}
        />
      )}
    </div>
  );
}

function resolveSource(source: string | undefined, location: Location): string {
  if (!source) return '';
  const parts = source.split('.');
  let val: any = { location };
  for (const p of parts) val = val?.[p];
  return typeof val === 'string' ? val : val ? String(val) : '';
}

function BlockView({ block, location }: { block: PopupBlock; location: Location }) {
  switch (block.type) {
    case 'title':
      return <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>{resolveSource(block.props.source, location) || block.props.text}</h3>;
    case 'subtitle':
      return <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{resolveSource(block.props.source, location) || block.props.text}</div>;
    case 'text': {
      const t = resolveSource(block.props.source, location) || block.props.text;
      return t ? <p style={{ margin: '6px 0', fontSize: 14, lineHeight: 1.5 }}>{t}</p> : null;
    }
    case 'address': {
      const t = location.address;
      return t ? <div style={{ fontSize: 13, color: '#374151', margin: '6px 0' }}>📍 {t}</div> : null;
    }
    case 'hours':
      return location.hours ? <div style={{ fontSize: 13, margin: '6px 0' }}>🕒 {location.hours}</div> : null;
    case 'phone':
      return location.phone ? <div style={{ fontSize: 13, margin: '6px 0' }}>📞 <a href={`tel:${location.phone}`}>{location.phone}</a></div> : null;
    case 'email':
      return location.email ? <div style={{ fontSize: 13, margin: '6px 0' }}>✉ <a href={`mailto:${location.email}`}>{location.email}</a></div> : null;
    case 'divider':
      return <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '10px 0' }} />;
    case 'image': {
      const first = location.images[0];
      const dataUrl = first ? (window as any).__atlist_assets?.[first.assetId] : null;
      return dataUrl ? <img src={dataUrl} alt={first?.alt || ''} style={{ width: '100%', height: 'auto', borderRadius: 8, margin: '6px 0' }} /> : null;
    }
    case 'gallery': {
      return (
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', margin: '6px 0' }}>
          {location.images.map((img, i) => {
            const dataUrl = (window as any).__atlist_assets?.[img.assetId];
            return dataUrl ? (
              <img
                key={i}
                src={dataUrl}
                alt={img.alt || ''}
                style={{ width: 96, height: 72, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }}
              />
            ) : null;
          })}
        </div>
      );
    }
    case 'button': {
      const label = block.props.label || 'Open';
      const action = block.props.action;
      let href = block.props.href || '#';
      if (action === 'directions') {
        href = `https://www.google.com/maps/dir/?api=1&destination=${location.position.lat},${location.position.lng}`;
      } else if (action === 'callPhone' && location.phone) {
        href = `tel:${location.phone}`;
      } else if (action === 'sendEmail' && location.email) {
        href = `mailto:${location.email}`;
      }
      const style: React.CSSProperties = {
        display: 'inline-block',
        marginTop: 8,
        padding: '8px 12px',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 500,
        textDecoration: 'none',
        background: block.props.style === 'ghost' ? 'transparent' : block.props.style === 'secondary' ? '#f3f4f6' : '#5b8def',
        color: block.props.style === 'ghost' || block.props.style === 'secondary' ? '#111827' : '#fff',
        border: block.props.style === 'ghost' ? '1px solid #e5e7eb' : 'none',
      };
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" style={style}>
          {label}
        </a>
      );
    }
    case 'buttons': {
      return (
        <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          {(location.buttons || []).map((b) => (
            <a
              key={b.id}
              href={b.href || '#'}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                fontSize: 13,
                textDecoration: 'none',
                background: b.style === 'ghost' ? 'transparent' : b.style === 'secondary' ? '#f3f4f6' : '#5b8def',
                color: b.style === 'ghost' || b.style === 'secondary' ? '#111827' : '#fff',
                border: b.style === 'ghost' ? '1px solid #e5e7eb' : 'none',
              }}
            >
              {b.label}
            </a>
          ))}
        </div>
      );
    }
    case 'badge':
      return (
        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: block.props.color || '#eef2ff', color: '#4338ca', fontSize: 11, marginBottom: 4 }}>
          {block.props.text || 'Badge'}
        </span>
      );
    case 'html':
      return <div dangerouslySetInnerHTML={{ __html: block.props.html || '' }} />;
    default:
      return null;
  }
}
