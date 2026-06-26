import { useState, useRef } from 'react';
import { PRESETS } from '../hooks/useGraph.js';

const ICONS = {
  addNode: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  addEdge: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="15 8 19 12 15 16" />
    </svg>
  ),
  delete: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" />
      <line x1="18" y1="9" x2="12" y2="15" />
      <line x1="12" y1="9" x2="18" y2="15" />
    </svg>
  ),
  clear: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  directed: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="15 8 19 12 15 16" />
    </svg>
  ),
  undirected: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  weighted: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 10V7a3 3 0 0 1 6 0v3" />
      <rect x="5" y="10" width="14" height="10" rx="3" />
      <circle cx="12" cy="15" r="1.5" fill="currentColor" />
    </svg>
  ),
  unitWeight: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 10V7a3 3 0 0 1 6 0v3" strokeDasharray="3 3" />
      <rect x="5" y="10" width="14" height="10" rx="3" strokeDasharray="3 3" />
      <text x="12" y="17" textAnchor="middle" fontSize="9" fontWeight="bold" fill="currentColor" fontFamily="monospace">1</text>
    </svg>
  ),
  undo: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  ),
  redo: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
    </svg>
  ),
  save: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  load: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <polyline points="9 14 12 11 15 14" />
    </svg>
  ),
  presets: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  degrees: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
    </svg>
  ),
};

const TOOL_COLORS = {
  addNode: '#5bba6f',
  addEdge: '#3b82c4',
  delete: '#e8573a',
};

function ToolButton({ id, icon, isActive, color, onClick, title, disabled }) {
  return (
    <div className="relative group">
      <button
        id={id}
        onClick={onClick}
        disabled={disabled}
        className="w-full flex items-center justify-center p-3.5 rounded-xl transition-all duration-200"
        style={{
          background: isActive ? (color || 'var(--color-accent-primary)') : 'transparent',
          color: disabled ? 'var(--color-border)' : isActive ? '#fff' : 'var(--color-text-secondary)',
          boxShadow: isActive ? `2px 2px 0px ${color}88` : 'none',
          border: isActive ? 'none' : '1.5px dashed transparent',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.4 : 1,
        }}
        onMouseEnter={(e) => { if (!isActive && !disabled) e.currentTarget.style.borderColor = 'var(--color-border-hover)'; }}
        onMouseLeave={(e) => { if (!isActive && !disabled) e.currentTarget.style.borderColor = 'transparent'; }}
        title={title}
      >
        {icon}
      </button>
      {/* Tooltip */}
      <div
        className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-2 rounded-xl text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150"
        style={{
          background: 'var(--color-bg-surface)',
          border: '2px solid var(--color-border)',
          color: 'var(--color-text-primary)',
          boxShadow: '3px 3px 0px var(--color-border)',
          fontFamily: 'var(--font-hand)',
          fontSize: '1rem',
        }}
      >
        {title}
      </div>
    </div>
  );
}

export default function Toolbar({
  mode, onModeChange, directed, onToggleDirected, weighted, onToggleWeighted, onClearAll,
  nodeCount, edgeCount,
  canUndo, canRedo, onUndo, onRedo,
  onSave, onLoad, onLoadPreset,
  algoActive,
  showDegrees, onToggleDegrees,
}) {
  const [presetsOpen, setPresetsOpen] = useState(false);
  const fileInputRef = useRef(null);

  const tools = [
    { id: 'addNode', label: 'Add Node', icon: ICONS.addNode, shortcut: 'N', color: TOOL_COLORS.addNode },
    { id: 'addEdge', label: 'Add Edge', icon: ICONS.addEdge, shortcut: 'E', color: TOOL_COLORS.addEdge },
    { id: 'delete', label: 'Erase', icon: ICONS.delete, shortcut: 'D', color: TOOL_COLORS.delete },
  ];

  const handleFileLoad = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        onLoad(data);
      } catch {
        alert('Invalid JSON file');
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be loaded again
    e.target.value = '';
  };

  return (
    <div
      className="fixed left-5 z-50 flex flex-col gap-3 px-3 py-4 rounded-2xl"
      style={{
        top: '68px',
        background: 'var(--color-bg-surface)',
        border: '2px solid var(--color-border)',
        boxShadow: '4px 4px 0px var(--color-border), 0 8px 24px rgba(61,44,30,0.1)',
        minWidth: '68px',
        fontFamily: 'var(--font-hand)',
      }}
    >
      {/* Drawing tools */}
      <div className="flex flex-col gap-1.5">
        {tools.map(tool => (
          <ToolButton
            key={tool.id}
            id={`tool-${tool.id}`}
            icon={tool.icon}
            isActive={mode === tool.id}
            color={tool.color}
            onClick={() => onModeChange(tool.id)}
            title={`${tool.label} (${tool.shortcut})`}
            disabled={algoActive}
          />
        ))}
      </div>

      <div style={{ borderTop: '2px dashed var(--color-border)' }} />

      {/* Directed toggle */}
      <ToolButton
        id="toggle-directed"
        icon={directed ? ICONS.directed : ICONS.undirected}
        isActive={false}
        onClick={onToggleDirected}
        title={directed ? 'Directed (toggle)' : 'Undirected (toggle)'}
      />

      {/* Weighted toggle */}
      <ToolButton
        id="toggle-weighted"
        icon={weighted ? ICONS.weighted : ICONS.unitWeight}
        isActive={false}
        onClick={onToggleWeighted}
        title={weighted ? 'Weighted Graph (toggle)' : 'Unit-weight Graph (toggle)'}
      />

      {/* Degrees toggle */}
      <ToolButton
        id="toggle-degrees"
        icon={ICONS.degrees}
        isActive={showDegrees}
        onClick={onToggleDegrees}
        title={showDegrees ? 'Hide Node Degrees' : 'Show Node Degrees'}
      />

      {/* Clear */}
      <ToolButton
        id="btn-clear-all"
        icon={ICONS.clear}
        isActive={false}
        color="var(--color-accent-danger)"
        onClick={onClearAll}
        title="Clear All"
      />

      <div style={{ borderTop: '2px dashed var(--color-border)' }} />

      {/* Undo / Redo */}
      <div className="flex flex-col gap-1.5">
        <ToolButton id="btn-undo" icon={ICONS.undo} isActive={false} onClick={onUndo} title="Undo (Ctrl+Z)" disabled={!canUndo} />
        <ToolButton id="btn-redo" icon={ICONS.redo} isActive={false} onClick={onRedo} title="Redo (Ctrl+Y)" disabled={!canRedo} />
      </div>

      <div style={{ borderTop: '2px dashed var(--color-border)' }} />

      {/* Save / Load / Presets */}
      <div className="flex flex-col gap-1.5">
        <ToolButton id="btn-save" icon={ICONS.save} isActive={false} onClick={onSave} title="Save Graph" />
        <ToolButton
          id="btn-load"
          icon={ICONS.load}
          isActive={false}
          onClick={() => fileInputRef.current?.click()}
          title="Load Graph"
        />
        {/* Presets */}
        <div className="relative">
          <ToolButton
            id="btn-presets"
            icon={ICONS.presets}
            isActive={presetsOpen}
            color="#f28c28"
            onClick={() => setPresetsOpen(!presetsOpen)}
            title="Preset Graphs"
          />
          {/* Preset flyout */}
          {presetsOpen && (
            <div
              className="absolute left-full bottom-0 ml-3 py-2 rounded-xl"
              style={{
                background: 'var(--color-bg-surface)',
                border: '2px solid var(--color-border)',
                boxShadow: '4px 4px 0px var(--color-border)',
                minWidth: '220px',
                maxHeight: '380px',
                overflowY: 'auto',
                animation: 'tooltipFadeIn 0.15s ease-out',
                fontFamily: 'var(--font-hand)',
                zIndex: 100,
              }}
            >
              {Object.entries(PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  className="w-full text-left px-4 py-2.5 flex items-center gap-2 transition-colors duration-150"
                  style={{
                    color: 'var(--color-text-primary)',
                    fontSize: '1rem',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-surface-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={() => {
                    onLoadPreset(key);
                    setPresetsOpen(false);
                  }}
                >
                  <span style={{ fontSize: '0.85rem' }}>
                    {preset.icon || '➖'}
                  </span>
                  {preset.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ borderTop: '2px dashed var(--color-border)' }} />

      {/* Stats */}
      <div className="flex flex-col items-center gap-2 pt-1">
        <div className="text-center">
          <div className="text-lg font-bold" style={{ color: 'var(--color-accent-primary)', fontFamily: 'var(--font-label)', fontSize: '1.4rem' }}>{nodeCount}</div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.6rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nodes</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold" style={{ color: 'var(--color-accent-tertiary)', fontFamily: 'var(--font-label)', fontSize: '1.4rem' }}>{edgeCount}</div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.6rem', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Edges</div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileLoad}
        style={{ display: 'none' }}
      />
    </div>
  );
}
