import { useState, useMemo } from 'react';

const MAX_MATRIX_NODES = 15;

export default function InfoPanel({ nodes, edges, directed }) {
  const [activeTab, setActiveTab] = useState('list');
  const [collapsed, setCollapsed] = useState(false);

  // Sort node IDs for consistent ordering
  const sortedIds = useMemo(() => nodes.map(n => n.id).sort((a, b) => a - b), [nodes]);

  // Build adjacency list
  const adjList = useMemo(() => {
    const map = {};
    sortedIds.forEach(id => { map[id] = []; });
    edges.forEach(e => {
      if (map[e.from]) map[e.from].push({ to: e.to, weight: e.weight ?? 1 });
      if (!directed && map[e.to]) map[e.to].push({ to: e.from, weight: e.weight ?? 1 });
    });
    // Sort each neighbor list
    Object.values(map).forEach(arr => arr.sort((a, b) => a.to - b.to));
    return map;
  }, [edges, directed, sortedIds]);

  // Build adjacency matrix
  const matrix = useMemo(() => {
    if (sortedIds.length === 0 || sortedIds.length > MAX_MATRIX_NODES) return null;
    const idxMap = {};
    sortedIds.forEach((id, i) => { idxMap[id] = i; });
    const n = sortedIds.length;
    // Initialize with null (no edge)
    const mat = Array.from({ length: n }, () => Array(n).fill(null));
    edges.forEach(e => {
      const fi = idxMap[e.from];
      const ti = idxMap[e.to];
      if (fi !== undefined && ti !== undefined) {
        mat[fi][ti] = e.weight ?? 1;
        if (!directed) mat[ti][fi] = e.weight ?? 1;
      }
    });
    return mat;
  }, [edges, directed, sortedIds]);

  const panelWidth = collapsed ? 44 : 320;

  return (
    <div
      className="fixed right-0 top-0 bottom-0 z-40 flex transition-all duration-300"
      style={{ width: panelWidth }}
    >
      {/* Collapse toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="self-center -ml-5 w-6 h-14 rounded-l-lg flex items-center justify-center z-50 shrink-0"
        style={{
          background: 'var(--color-bg-surface)',
          border: '2px solid var(--color-border)',
          borderRight: 'none',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          boxShadow: '-2px 2px 0px var(--color-border)',
        }}
        title={collapsed ? 'Show Info Panel' : 'Hide Info Panel'}
      >
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      {/* Panel content */}
      {!collapsed && (
        <div
          className="flex-1 flex flex-col overflow-hidden"
          style={{
            background: 'var(--color-bg-surface)',
            borderLeft: '2px solid var(--color-border)',
            boxShadow: '-4px 0 20px rgba(61,44,30,0.08)',
          }}
        >
          {/* Header */}
          <div className="px-4 pt-4 pb-2">
            <h2
              className="text-lg font-bold"
              style={{ fontFamily: "'Caveat', cursive", fontSize: '1.5rem', color: 'var(--color-text-primary)' }}
            >
              📋 Graph Info
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex mx-4 mb-3 rounded-lg overflow-hidden" style={{ border: '2px solid var(--color-border)' }}>
            <button
              onClick={() => setActiveTab('list')}
              className="flex-1 py-2 text-sm font-medium transition-all duration-150"
              style={{
                background: activeTab === 'list' ? 'var(--color-accent-primary)' : 'transparent',
                color: activeTab === 'list' ? '#fff' : 'var(--color-text-secondary)',
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '1rem',
                borderRight: '1px solid var(--color-border)',
              }}
            >
              Adj. List
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className="flex-1 py-2 text-sm font-medium transition-all duration-150"
              style={{
                background: activeTab === 'matrix' ? 'var(--color-accent-primary)' : 'transparent',
                color: activeTab === 'matrix' ? '#fff' : 'var(--color-text-secondary)',
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '1rem',
              }}
            >
              Adj. Matrix
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto px-4 pb-4">
            {nodes.length === 0 ? (
              <div
                className="text-center py-8"
                style={{ color: 'var(--color-text-muted)', fontFamily: "'Patrick Hand', cursive", fontSize: '1.1rem' }}
              >
                ✏️ Add some nodes to see the graph info here
              </div>
            ) : activeTab === 'list' ? (
              <AdjacencyListView adjList={adjList} sortedIds={sortedIds} />
            ) : (
              <AdjacencyMatrixView matrix={matrix} sortedIds={sortedIds} />
            )}
          </div>

          {/* Footer stats */}
          <div
            className="px-4 py-3 flex justify-between"
            style={{
              borderTop: '2px dashed var(--color-border)',
              fontFamily: "'Patrick Hand', cursive",
              fontSize: '0.95rem',
              color: 'var(--color-text-muted)',
            }}
          >
            <span>{directed ? '→ Directed' : '— Undirected'}</span>
            <span>{nodes.length}N · {edges.length}E</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Adjacency List View ───────────────────────────────────────────────

function AdjacencyListView({ adjList, sortedIds }) {
  return (
    <div className="flex flex-col gap-2">
      {sortedIds.map(id => (
        <div
          key={id}
          className="px-3 py-2 rounded-lg"
          style={{
            background: 'var(--color-bg-primary)',
            border: '1.5px solid var(--color-border)',
          }}
        >
          <div className="flex items-start gap-2">
            {/* Node badge */}
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-full shrink-0 text-white font-bold"
              style={{
                background: '#e8573a',
                fontFamily: "'Caveat', cursive",
                fontSize: '1rem',
                boxShadow: '1px 1px 0px #c44125',
              }}
            >
              {id}
            </span>
            {/* Neighbors */}
            <div
              className="flex flex-wrap gap-1 pt-0.5"
              style={{ fontFamily: "'Caveat', cursive", fontSize: '1.1rem', color: 'var(--color-text-primary)' }}
            >
              <span style={{ color: 'var(--color-text-muted)' }}>→</span>
              {adjList[id].length === 0 ? (
                <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>∅</span>
              ) : (
                adjList[id].map((neighbor, i) => (
                  <span key={`${id}-${neighbor.to}-${i}`}>
                    <span style={{ color: 'var(--color-accent-tertiary)', fontWeight: 600 }}>{neighbor.to}</span>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        color: neighbor.weight < 0 ? 'var(--color-accent-danger)' : 'var(--color-text-muted)',
                        marginLeft: '1px',
                      }}
                    >
                      ({neighbor.weight})
                    </span>
                    {i < adjList[id].length - 1 && (
                      <span style={{ color: 'var(--color-text-muted)', margin: '0 2px' }}>,</span>
                    )}
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Adjacency Matrix View ─────────────────────────────────────────────

function AdjacencyMatrixView({ matrix, sortedIds }) {
  if (!matrix) {
    return (
      <div
        className="text-center py-8"
        style={{ color: 'var(--color-text-muted)', fontFamily: "'Patrick Hand', cursive", fontSize: '1rem' }}
      >
        ⚠️ Matrix view is hidden for graphs with more than {MAX_MATRIX_NODES} nodes.
        <br />
        <span style={{ fontSize: '0.85rem' }}>Use the Adjacency List tab instead.</span>
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <table
        className="border-collapse"
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: '1rem',
        }}
      >
        <thead>
          <tr>
            {/* Empty corner cell */}
            <th
              className="sticky left-0 z-10 p-1.5 min-w-[32px]"
              style={{ background: 'var(--color-bg-surface)' }}
            />
            {sortedIds.map(id => (
              <th
                key={id}
                className="p-1.5 text-center min-w-[32px]"
                style={{
                  color: '#e8573a',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                }}
              >
                {id}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedIds.map((rowId, ri) => (
            <tr key={rowId}>
              {/* Row header */}
              <td
                className="sticky left-0 z-10 p-1.5 text-center font-bold"
                style={{
                  background: 'var(--color-bg-surface)',
                  color: '#e8573a',
                  fontSize: '1.05rem',
                }}
              >
                {rowId}
              </td>
              {sortedIds.map((colId, ci) => {
                const val = matrix[ri][ci];
                const isDiag = ri === ci;
                const hasEdge = val !== null;
                return (
                  <td
                    key={colId}
                    className="p-1.5 text-center min-w-[32px]"
                    style={{
                      background: isDiag
                        ? 'var(--color-bg-surface-hover)'
                        : hasEdge
                          ? 'rgba(232, 87, 58, 0.08)'
                          : 'var(--color-bg-primary)',
                      border: '1px solid var(--color-border)',
                      color: val !== null && val < 0
                        ? 'var(--color-accent-danger)'
                        : hasEdge
                          ? 'var(--color-text-primary)'
                          : 'var(--color-text-muted)',
                      fontWeight: hasEdge ? 600 : 400,
                      fontSize: hasEdge ? '1.1rem' : '0.85rem',
                    }}
                  >
                    {isDiag ? '·' : val !== null ? val : '0'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
