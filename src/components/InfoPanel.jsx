import { useState, useMemo, useEffect } from 'react';

const MAX_MATRIX_NODES = 15;

export default function InfoPanel({
  nodes,
  edges,
  directed,
  weighted,
  algoActive,
  algorithmType,
  currentData,
  onCellHover,
}) {
  const [activeTab, setActiveTab] = useState('list');
  const [collapsed, setCollapsed] = useState(false);

  const isSp = algoActive && (
    algorithmType === 'dijkstra' || 
    algorithmType === 'bfsSp' || 
    algorithmType === 'bellmanFord' || 
    algorithmType === 'floydWarshall'
  );

  const isMst = algoActive && (
    algorithmType === 'kruskal' ||
    algorithmType === 'prim'
  );

  const isAnalysis = algoActive && (
    algorithmType === 'topoSort' ||
    algorithmType === 'kosaraju' ||
    algorithmType === 'bipartite' ||
    algorithmType === 'bridgesAndAPs' ||
    algorithmType === 'cycleDetection'
  );

  // Automatically switch tab to Distances/Analysis when an algorithm starts
  useEffect(() => {
    if (isSp || isMst || isAnalysis) {
      setActiveTab('distances');
    } else {
      setActiveTab(prev => prev === 'distances' ? 'list' : prev);
    }
  }, [isSp, isMst, isAnalysis]);

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

  const panelWidth = collapsed ? 24 : 340;

  return (
    <div
      className="fixed right-5 z-40 flex transition-all duration-300"
      style={{
        width: panelWidth,
        top: '68px',
        bottom: algoActive ? '204px' : '20px',
      }}
    >
      {/* Collapse toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-1/2 -translate-y-1/2 w-6 h-14 flex items-center justify-center z-50 shrink-0 transition-all duration-150"
        style={{
          left: collapsed ? '0' : '-24px',
          background: 'var(--color-bg-surface)',
          border: '2px solid var(--color-border)',
          borderRight: collapsed ? '2px solid var(--color-border)' : 'none',
          borderRadius: collapsed ? '10px' : '10px 0 0 10px',
          color: 'var(--color-text-muted)',
          cursor: 'pointer',
          boxShadow: collapsed
            ? '2px 2px 0px var(--color-border)'
            : '-2px 2px 0px var(--color-border)',
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
          className="w-full h-full flex flex-col overflow-hidden rounded-2xl"
          style={{
            background: 'var(--color-bg-surface)',
            border: '2px solid var(--color-border)',
            boxShadow: '4px 4px 0px var(--color-border), 0 8px 24px rgba(61,44,30,0.1)',
          }}
        >
          {/* Header */}
          <div className="px-4 pt-5 pb-3">
            <h2
              className="text-lg font-bold"
              style={{ fontFamily: "'Caveat', cursive", fontSize: '1.6rem', color: 'var(--color-text-primary)' }}
            >
              📋 Graph Info
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex mx-5 mb-4 rounded-lg overflow-hidden" style={{ border: '2px solid var(--color-border)' }}>
            <button
              onClick={() => setActiveTab('list')}
              className="flex-1 py-2 text-sm font-medium transition-all duration-150"
              style={{
                background: activeTab === 'list' ? 'var(--color-accent-primary)' : 'transparent',
                color: activeTab === 'list' ? '#fff' : 'var(--color-text-secondary)',
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '1.05rem',
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
                fontSize: '1.05rem',
                borderRight: (isSp || isMst || isAnalysis) ? '1px solid var(--color-border)' : 'none',
              }}
            >
              Adj. Matrix
            </button>
            {(isSp || isMst || isAnalysis) && (
              <button
                onClick={() => setActiveTab('distances')}
                className="flex-1 py-2 text-sm font-medium transition-all duration-150"
                style={{
                  background: activeTab === 'distances' ? 'var(--color-accent-primary)' : 'transparent',
                  color: activeTab === 'distances' ? '#fff' : 'var(--color-text-secondary)',
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '1.05rem',
                }}
              >
                {algorithmType === 'floydWarshall' ? 'FW Matrix' : 
                 algorithmType === 'kruskal' ? 'MST Edges' :
                 algorithmType === 'prim' ? 'Prim Cuts' :
                 algorithmType === 'topoSort' ? 'In-degrees' :
                 algorithmType === 'kosaraju' ? 'SCCs Found' :
                 algorithmType === 'bipartite' ? 'Colors' :
                 algorithmType === 'bridgesAndAPs' ? 'tin / low' : 
                 algorithmType === 'cycleDetection' ? 'Cycle State' : 'Distances'}
              </button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto px-5 pb-4">
            {nodes.length === 0 ? (
              <div
                className="text-center py-8"
                style={{ color: 'var(--color-text-muted)', fontFamily: "'Patrick Hand', cursive", fontSize: '1.15rem' }}
              >
                ✏️ Add some nodes to see the graph info here
              </div>
            ) : activeTab === 'distances' && (isSp || isMst || isAnalysis) ? (
              algorithmType === 'floydWarshall' ? (
                <FloydWarshallMatrixView
                  nodes={nodes}
                  matrix={currentData?.matrix || []}
                  onCellHover={onCellHover}
                />
              ) : algorithmType === 'kruskal' ? (
                <KruskalEdgesView sortedEdges={currentData?.sortedEdges || []} />
              ) : algorithmType === 'topoSort' ? (
                <InDegreeTableView
                  nodes={nodes}
                  nodeStates={currentData?.nodeStates || {}}
                />
              ) : algorithmType === 'kosaraju' ? (
                <SccListView
                  sccsList={currentData?.sccsList || []}
                  finishingStack={currentData?.finishingStack || []}
                />
              ) : algorithmType === 'bipartite' ? (
                <BipartiteColorTableView
                  nodes={nodes}
                  nodeStates={currentData?.nodeStates || {}}
                />
              ) : algorithmType === 'bridgesAndAPs' ? (
                <TarjanTableView
                  nodes={nodes}
                  tin={currentData?.tin || {}}
                  low={currentData?.low || {}}
                  bridgesList={currentData?.bridgesList || []}
                  apsList={currentData?.apsList || []}
                  currentNode={currentData?.currentNode}
                />
              ) : algorithmType === 'cycleDetection' ? (
                <CycleTableView
                  nodes={nodes}
                  nodeStates={currentData?.nodeStates || {}}
                />
              ) : (
                <DistanceTableView
                  nodes={nodes}
                  distances={currentData?.distances || {}}
                  parentMap={currentData?.parentMap || {}}
                  currentNode={currentData?.currentNode}
                />
              )
            ) : activeTab === 'list' ? (
              <AdjacencyListView adjList={adjList} sortedIds={sortedIds} weighted={weighted} />
            ) : (
              <AdjacencyMatrixView matrix={matrix} sortedIds={sortedIds} weighted={weighted} />
            )}
          </div>

          {/* Footer stats */}
          <div
            className="px-5 py-4 flex justify-between items-center"
            style={{
              borderTop: '2px dashed var(--color-border)',
              fontFamily: "'Patrick Hand', cursive",
              fontSize: '1.05rem',
              color: 'var(--color-text-muted)',
            }}
          >
            <span>{directed ? '→ Directed Graph' : '— Undirected Graph'}</span>
            <span style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              {nodes.length} Nodes · {edges.length} Edges
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Adjacency List View ───────────────────────────────────────────────
function AdjacencyListView({ adjList, sortedIds, weighted }) {
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
                fontSize: '1.05rem',
                boxShadow: '1px 1px 0px #c44125',
              }}
            >
              {id}
            </span>
            {/* Neighbors */}
            <div
              className="flex flex-wrap gap-1 pt-0.5"
              style={{ fontFamily: "'Caveat', cursive", fontSize: '1.15rem', color: 'var(--color-text-primary)' }}
            >
              <span style={{ color: 'var(--color-text-muted)' }}>→</span>
              {adjList[id].length === 0 ? (
                <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>∅</span>
              ) : (
                adjList[id].map((neighbor, i) => (
                  <span key={`${id}-${neighbor.to}-${i}`}>
                    <span style={{ color: 'var(--color-accent-tertiary)', fontWeight: 600 }}>{neighbor.to}</span>
                    {weighted && (
                      <span
                        style={{
                          fontSize: '0.9rem',
                          color: neighbor.weight < 0 ? 'var(--color-accent-danger)' : 'var(--color-text-muted)',
                          marginLeft: '1px',
                        }}
                      >
                        ({neighbor.weight})
                      </span>
                    )}
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
function AdjacencyMatrixView({ matrix, sortedIds, weighted }) {
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
                    {isDiag ? '·' : val !== null ? (weighted ? val : '1') : '0'}
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

// ── Distance Table View ───────────────────────────────────────────────
function DistanceTableView({ nodes, distances, parentMap, currentNode }) {
  const sortedNodes = useMemo(() => [...nodes].sort((a, b) => a.id - b.id), [nodes]);

  return (
    <div className="overflow-auto">
      <table
        className="w-full border-collapse"
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: '1.1rem',
        }}
      >
        <thead>
          <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
            <th className="py-2 text-left" style={{ color: 'var(--color-text-secondary)' }}>Node</th>
            <th className="py-2 text-center" style={{ color: 'var(--color-text-secondary)' }}>Distance</th>
            <th className="py-2 text-right" style={{ color: 'var(--color-text-secondary)' }}>Via</th>
          </tr>
        </thead>
        <tbody>
          {sortedNodes.map(node => {
            const dist = distances[node.id];
            const parent = parentMap[node.id];
            const isCurrent = currentNode === node.id;

            return (
              <tr
                key={node.id}
                style={{
                  background: isCurrent ? 'rgba(242, 140, 40, 0.08)' : 'transparent',
                  borderBottom: '1px solid var(--color-border-hover)',
                  transition: 'background 0.3s',
                }}
              >
                {/* Node badge */}
                <td className="py-2 text-left">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white font-bold"
                      style={{
                        background: isCurrent ? '#f28c28' : '#e8573a',
                        fontFamily: "'Caveat', cursive",
                        fontSize: '1rem',
                        boxShadow: isCurrent ? '1px 1px 0px #d47620' : '1px 1px 0px #c44125',
                      }}
                    >
                      {node.id}
                    </span>
                    {isCurrent && (
                      <span className="text-xs" style={{ color: '#f28c28', fontFamily: "'Patrick Hand', cursive" }}>
                        (visiting)
                      </span>
                    )}
                  </div>
                </td>

                {/* Distance */}
                <td className="py-2 text-center font-bold" style={{ fontSize: '1.2rem' }}>
                  {dist === Infinity || dist === undefined ? (
                    <span style={{ color: 'var(--color-text-muted)' }}>∞</span>
                  ) : (
                    <span style={{ color: 'var(--color-accent-tertiary)' }}>{dist}</span>
                  )}
                </td>

                {/* Via parent */}
                <td className="py-2 text-right font-bold" style={{ fontSize: '1.15rem', color: 'var(--color-text-secondary)' }}>
                  {parent === null || parent === undefined ? (
                    <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>-</span>
                  ) : (
                    <span
                      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white font-bold"
                      style={{ background: '#3b82c4', fontSize: '0.9rem', boxShadow: '1px 1px 0px #2a6ba4' }}
                    >
                      {parent}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Floyd-Warshall Matrix View ─────────────────────────────────────────
function FloydWarshallMatrixView({ nodes, matrix, onCellHover }) {
  const sortedIds = useMemo(() => nodes.map(n => n.id).sort((a, b) => a - b), [nodes]);

  return (
    <div className="overflow-auto max-w-full">
      <table
        className="border-collapse mx-auto"
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: '1.1rem',
        }}
      >
        <thead>
          <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
            <th className="p-1 min-w-[28px]" style={{ background: 'var(--color-bg-surface)' }} />
            {sortedIds.map(id => (
              <th
                key={id}
                className="p-1 text-center min-w-[28px]"
                style={{ color: '#e8573a', fontWeight: 700, fontSize: '1.05rem' }}
              >
                {id}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedIds.map((rowId, ri) => (
            <tr key={rowId} style={{ borderBottom: '1px solid var(--color-border-hover)' }}>
              <td
                className="p-1 text-center font-bold"
                style={{
                  background: 'var(--color-bg-surface)',
                  color: '#e8573a',
                  fontSize: '1.05rem',
                  borderRight: '2px solid var(--color-border)'
                }}
              >
                {rowId}
              </td>
              {sortedIds.map((colId, ci) => {
                const val = matrix?.[ri]?.[ci];
                const isDiag = ri === ci;
                const isInf = val === Infinity || val === undefined;

                return (
                  <td
                    key={colId}
                    className="p-1 text-center min-w-[28px] transition-colors duration-150 cursor-pointer"
                    style={{
                      background: isDiag ? 'var(--color-bg-surface-hover)' : 'var(--color-bg-primary)',
                      borderRight: '1px solid var(--color-border-hover)',
                      color: isInf ? 'var(--color-text-muted)' : 'var(--color-accent-tertiary)',
                      fontWeight: isInf ? 400 : 700,
                    }}
                    onMouseEnter={() => !isInf && !isDiag && onCellHover?.({ from: rowId, to: colId })}
                    onMouseLeave={() => onCellHover?.(null)}
                  >
                    {isDiag ? '0' : (isInf ? '∞' : val)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div
        className="text-xs text-center mt-4 px-2"
        style={{ color: 'var(--color-text-muted)', fontFamily: "'Patrick Hand', cursive" }}
      >
        💡 Hover over any cell (except diagonal or ∞) to trace its shortest path on the canvas.
      </div>
    </div>
  );
}

// ── Kruskal Edges View ────────────────────────────────────────────────
function KruskalEdgesView({ sortedEdges }) {
  if (sortedEdges.length === 0) {
    return (
      <div
        className="text-center py-8"
        style={{ color: 'var(--color-text-muted)', fontFamily: "'Patrick Hand', cursive", fontSize: '1rem' }}
      >
        No edges to sort.
      </div>
    );
  }

  return (
    <div className="overflow-auto max-h-[300px] pr-1">
      <table
        className="w-full border-collapse text-left"
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: '1.1rem',
        }}
      >
        <thead>
          <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
            <th className="py-2 text-left" style={{ color: 'var(--color-text-secondary)' }}>Edge</th>
            <th className="py-2 text-center" style={{ color: 'var(--color-text-secondary)' }}>Weight</th>
            <th className="py-2 text-right" style={{ color: 'var(--color-text-secondary)' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {sortedEdges.map((e, idx) => {
            let statusColor = 'var(--color-text-muted)';
            let statusText = '⏳ Waiting';
            let rowBg = 'transparent';

            if (e.status === 'checking') {
              statusColor = '#f5c542'; // yellow
              statusText = '🔍 Checking';
              rowBg = 'rgba(245, 197, 66, 0.08)';
            } else if (e.status === 'mst') {
              statusColor = '#5bba6f'; // green
              statusText = '✅ In MST';
              rowBg = 'rgba(91, 186, 111, 0.08)';
            } else if (e.status === 'cycle') {
              statusColor = '#ef4444'; // red
              statusText = '❌ Cycle';
              rowBg = 'rgba(239, 68, 68, 0.08)';
            }

            return (
              <tr
                key={`${e.id}-${idx}`}
                style={{
                  background: rowBg,
                  borderBottom: '1px solid var(--color-border-hover)',
                  transition: 'background 0.3s',
                }}
              >
                <td className="py-2 text-left">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white font-bold"
                      style={{ background: '#3b82c4', fontSize: '0.85rem', boxShadow: '1px 1px 0px #2a6ba4' }}
                    >
                      {e.from}
                    </span>
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>—</span>
                    <span
                      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white font-bold"
                      style={{ background: '#3b82c4', fontSize: '0.85rem', boxShadow: '1px 1px 0px #2a6ba4' }}
                    >
                      {e.to}
                    </span>
                  </div>
                </td>
                <td className="py-2 text-center font-bold" style={{ fontSize: '1.15rem', color: 'var(--color-text-primary)' }}>
                  {e.weight}
                </td>
                <td className="py-2 text-right font-bold" style={{ color: statusColor, fontSize: '1rem', fontFamily: "'Patrick Hand', cursive" }}>
                  {statusText}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── In-degree Table View (Kahn's) ─────────────────────────────────────
function InDegreeTableView({ nodes, nodeStates }) {
  const sortedNodes = useMemo(() => [...nodes].sort((a, b) => a.id - b.id), [nodes]);

  return (
    <div className="overflow-auto">
      <table
        className="w-full border-collapse"
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: '1.1rem',
        }}
      >
        <thead>
          <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
            <th className="py-2 text-left" style={{ color: 'var(--color-text-secondary)' }}>Node</th>
            <th className="py-2 text-center" style={{ color: 'var(--color-text-secondary)' }}>In-degree</th>
            <th className="py-2 text-right" style={{ color: 'var(--color-text-secondary)' }}>State</th>
          </tr>
        </thead>
        <tbody>
          {sortedNodes.map(node => {
            const stateInfo = nodeStates[node.id];
            const inDeg = stateInfo?.inDegree ?? 0;
            const state = stateInfo?.state ?? 'unvisited';
            const isVisiting = state === 'visiting';

            return (
              <tr
                key={node.id}
                style={{
                  background: isVisiting ? 'rgba(242, 140, 40, 0.08)' : 'transparent',
                  borderBottom: '1px solid var(--color-border-hover)',
                  transition: 'background 0.3s',
                }}
              >
                <td className="py-2 text-left">
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white font-bold"
                    style={{
                      background: isVisiting ? '#f28c28' : '#e8573a',
                      fontFamily: "'Caveat', cursive",
                      fontSize: '1rem',
                      boxShadow: isVisiting ? '1px 1px 0px #d47620' : '1px 1px 0px #c44125',
                    }}
                  >
                    {node.id}
                  </span>
                </td>
                <td className="py-2 text-center font-bold" style={{ fontSize: '1.2rem', color: inDeg === 0 ? '#5bba6f' : 'var(--color-text-primary)' }}>
                  {inDeg}
                </td>
                <td className="py-2 text-right font-bold" style={{ fontSize: '1.05rem', fontFamily: "'Patrick Hand', cursive" }}>
                  {state === 'negative_cycle' ? (
                    <span style={{ color: 'var(--color-accent-danger)' }}>⚠️ In Cycle</span>
                  ) : state === 'visited' ? (
                    <span style={{ color: '#5bba6f' }}>Completed</span>
                  ) : state === 'queued' ? (
                    <span style={{ color: '#f28c28' }}>In Queue</span>
                  ) : state === 'visiting' ? (
                    <span style={{ color: '#f28c28' }}>Processing</span>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)' }}>Waiting</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── SCC List View (Kosaraju's) ────────────────────────────────────────
function SccListView({ sccsList, finishingStack }) {
  return (
    <div className="flex flex-col gap-3">
      {/* Finishing stack view */}
      <div
        className="p-3 rounded-xl"
        style={{
          background: 'var(--color-bg-primary)',
          border: '1.5px solid var(--color-border)',
        }}
      >
        <div className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)', fontFamily: "'Patrick Hand', cursive" }}>
          📚 Finishing Order Stack (Pass 1)
        </div>
        <div className="flex flex-wrap gap-1 items-center" style={{ fontFamily: "'Caveat', cursive", fontSize: '1.15rem' }}>
          {finishingStack.length === 0 ? (
            <span className="text-xs text-muted" style={{ fontStyle: 'italic' }}>Stack is empty</span>
          ) : (
            finishingStack.map((id, index) => (
              <span key={`${id}-${index}`} className="flex items-center gap-1">
                <span
                  className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white font-bold"
                  style={{ background: '#a89478', fontSize: '0.85rem' }}
                >
                  {id}
                </span>
                {index < finishingStack.length - 1 && <span className="text-xs text-muted">→</span>}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Strongly Connected Components list */}
      <div className="text-sm font-bold mb-1" style={{ fontFamily: "'Patrick Hand', cursive", color: 'var(--color-text-secondary)' }}>
        🏆 Strongly Connected Components ({sccsList.length})
      </div>
      {sccsList.length === 0 ? (
        <div className="text-center py-4 text-xs italic text-muted" style={{ fontFamily: "'Patrick Hand', cursive" }}>
          No components found yet.
        </div>
      ) : (
        sccsList.map((scc, idx) => {
          const SCC_COLORS = ['#5bba6f', '#3b82c4', '#f59e0b', '#ec4899', '#a855f7', '#0d9488', '#e8573a', '#94a3b8'];
          const color = SCC_COLORS[idx % SCC_COLORS.length];

          return (
            <div
              key={idx}
              className="p-3 rounded-xl flex items-center justify-between"
              style={{
                background: 'var(--color-bg-primary)',
                border: `2px solid ${color}`,
                boxShadow: `2px 2px 0px ${color}`,
              }}
            >
              <span className="font-bold" style={{ color: color, fontFamily: "'Patrick Hand', cursive", fontSize: '1rem' }}>
                SCC-{idx + 1}
              </span>
              <div className="flex gap-1.5 flex-wrap justify-end max-w-[75%]">
                {scc.map(nodeId => (
                  <span
                    key={nodeId}
                    className="inline-flex items-center justify-center rounded-full text-white font-bold animate-fadeIn"
                    style={{
                      background: color,
                      fontFamily: "'Caveat', cursive",
                      fontSize: '0.9rem',
                      width: '24px',
                      height: '24px',
                    }}
                  >
                    {nodeId}
                  </span>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

// ── Bipartite Color Table View (BFS 2-coloring) ───────────────────────
function BipartiteColorTableView({ nodes, nodeStates }) {
  const sortedNodes = useMemo(() => [...nodes].sort((a, b) => a.id - b.id), [nodes]);

  return (
    <div className="overflow-auto">
      <table
        className="w-full border-collapse"
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: '1.1rem',
        }}
      >
        <thead>
          <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
            <th className="py-2 text-left" style={{ color: 'var(--color-text-secondary)' }}>Node</th>
            <th className="py-2 text-center" style={{ color: 'var(--color-text-secondary)' }}>Color</th>
            <th className="py-2 text-right" style={{ color: 'var(--color-text-secondary)' }}>Status</th>
          </tr>
        </thead>
        <tbody>
          {sortedNodes.map(node => {
            const stateInfo = nodeStates[node.id];
            const label = stateInfo?.label || 'None';
            const state = stateInfo?.state || 'unvisited';
            const isConflict = state === 'negative_cycle';

            return (
              <tr
                key={node.id}
                style={{
                  background: isConflict ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
                  borderBottom: '1px solid var(--color-border-hover)',
                  transition: 'background 0.3s',
                }}
              >
                <td className="py-2 text-left">
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white font-bold"
                    style={{
                      background: stateInfo?.fill || '#e8573a',
                      fontFamily: "'Caveat', cursive",
                      fontSize: '1rem',
                      boxShadow: `1px 1px 0px ${stateInfo?.shadow || '#c44125'}`,
                    }}
                  >
                    {node.id}
                  </span>
                </td>
                <td className="py-2 text-center font-bold" style={{ fontSize: '1.15rem' }}>
                  {label === 'Red' ? (
                    <span style={{ color: '#ef4444' }}>🔴 Red</span>
                  ) : label === 'Blue' ? (
                    <span style={{ color: '#3b82c4' }}>🔵 Blue</span>
                  ) : label.startsWith('Conflict') ? (
                    <span style={{ color: '#ef4444', fontWeight: 'bold' }}>⚠️ Conflict</span>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)' }}>uncolored</span>
                  )}
                </td>
                <td className="py-2 text-right font-bold" style={{ fontSize: '1.05rem', fontFamily: "'Patrick Hand', cursive" }}>
                  {isConflict ? (
                    <span style={{ color: 'var(--color-accent-danger)' }}>Conflict!</span>
                  ) : state === 'visited' ? (
                    <span style={{ color: '#5bba6f' }}>Visited</span>
                  ) : state === 'queued' ? (
                    <span style={{ color: '#f28c28' }}>Queued</span>
                  ) : state === 'visiting' ? (
                    <span style={{ color: '#f28c28' }}>Visiting</span>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)' }}>Waiting</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Tarjan AP & Bridges Table View ────────────────────────────────────
function TarjanTableView({ nodes, tin, low, bridgesList, apsList, currentNode }) {
  const sortedNodes = useMemo(() => [...nodes].sort((a, b) => a.id - b.id), [nodes]);

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-auto max-h-[200px]">
        <table
          className="w-full border-collapse"
          style={{
            fontFamily: "'Caveat', cursive",
            fontSize: '1.1rem',
          }}
        >
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
              <th className="py-2 text-left" style={{ color: 'var(--color-text-secondary)' }}>Node</th>
              <th className="py-2 text-center" style={{ color: 'var(--color-text-secondary)' }}>tin</th>
              <th className="py-2 text-center" style={{ color: 'var(--color-text-secondary)' }}>low</th>
              <th className="py-2 text-right" style={{ color: 'var(--color-text-secondary)' }}>Role</th>
            </tr>
          </thead>
          <tbody>
            {sortedNodes.map(node => {
              const t = tin[node.id];
              const l = low[node.id];
              const isAP = apsList.includes(node.id.toString()) || apsList.includes(node.id);
              const isCurrent = currentNode === node.id;

              return (
                <tr
                  key={node.id}
                  style={{
                    background: isCurrent ? 'rgba(242, 140, 40, 0.08)' : 'transparent',
                    borderBottom: '1px solid var(--color-border-hover)',
                    transition: 'background 0.3s',
                  }}
                >
                  <td className="py-2 text-left">
                    <span
                      className="inline-flex items-center justify-center w-6.5 h-6.5 rounded-full text-white font-bold"
                      style={{
                        background: isCurrent ? '#f28c28' : '#e8573a',
                        fontFamily: "'Caveat', cursive",
                        fontSize: '0.95rem',
                        boxShadow: isCurrent ? '1px 1px 0px #d47620' : '1px 1px 0px #c44125',
                      }}
                    >
                      {node.id}
                    </span>
                  </td>
                  <td className="py-2 text-center font-bold">
                    {t === null || t === undefined ? (
                      <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                    ) : (
                      t
                    )}
                  </td>
                  <td className="py-2 text-center font-bold" style={{ color: l !== null && l !== t ? '#f59e0b' : 'var(--color-text-primary)' }}>
                    {l === null || l === undefined ? (
                      <span style={{ color: 'var(--color-text-muted)' }}>-</span>
                    ) : (
                      l
                    )}
                  </td>
                  <td className="py-2 text-right font-bold" style={{ fontSize: '0.95rem', fontFamily: "'Patrick Hand', cursive", color: '#f5c542' }}>
                    {isAP ? '⭐ AP Node' : <span style={{ color: 'var(--color-text-muted)' }}>Normal</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bridges list */}
      <div
        className="p-3 rounded-xl"
        style={{
          background: 'var(--color-bg-primary)',
          border: '1.5px solid var(--color-border)',
        }}
      >
        <div className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)', fontFamily: "'Patrick Hand', cursive" }}>
          🌉 Detected Bridge Edges ({bridgesList.length})
        </div>
        <div className="flex flex-wrap gap-2 items-center" style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '0.95rem' }}>
          {bridgesList.length === 0 ? (
            <span className="text-xs text-muted" style={{ fontStyle: 'italic' }}>No bridges detected yet</span>
          ) : (
            bridgesList.map(edgeId => (
              <span
                key={edgeId}
                className="px-2 py-0.5 rounded-md text-white font-bold"
                style={{ background: '#ef4444', fontSize: '0.85rem' }}
              >
                Edge {edgeId}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Cycle Table View (Cycle Detection) ────────────────────────────────
function CycleTableView({ nodes, nodeStates }) {
  const sortedNodes = useMemo(() => [...nodes].sort((a, b) => a.id - b.id), [nodes]);

  return (
    <div className="overflow-auto">
      <table
        className="w-full border-collapse"
        style={{
          fontFamily: "'Caveat', cursive",
          fontSize: '1.1rem',
        }}
      >
        <thead>
          <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
            <th className="py-2 text-left" style={{ color: 'var(--color-text-secondary)' }}>Node</th>
            <th className="py-2 text-right" style={{ color: 'var(--color-text-secondary)' }}>DFS State</th>
          </tr>
        </thead>
        <tbody>
          {sortedNodes.map(node => {
            const stateInfo = nodeStates[node.id];
            const state = stateInfo?.state || 'unvisited';

            return (
              <tr
                key={node.id}
                style={{
                  background: state === 'negative_cycle' ? 'rgba(239, 68, 68, 0.08)' : 'transparent',
                  borderBottom: '1px solid var(--color-border-hover)',
                  transition: 'background 0.3s',
                }}
              >
                <td className="py-2 text-left">
                  <span
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white font-bold"
                    style={{
                      background: state === 'negative_cycle' ? '#ef4444' : (state === 'visited' ? '#5bba6f' : (state === 'visiting' ? '#f28c28' : '#a89478')),
                      fontFamily: "'Caveat', cursive",
                      fontSize: '1rem',
                      boxShadow: '1px 1px 0px rgba(0,0,0,0.2)',
                    }}
                  >
                    {node.id}
                  </span>
                </td>
                <td className="py-2 text-right font-bold" style={{ fontSize: '1.05rem', fontFamily: "'Patrick Hand', cursive" }}>
                  {state === 'negative_cycle' ? (
                    <span style={{ color: 'var(--color-accent-danger)' }}>🔴 In Cycle</span>
                  ) : state === 'visiting' ? (
                    <span style={{ color: '#f28c28' }}>Visiting (Active Stack)</span>
                  ) : state === 'visited' ? (
                    <span style={{ color: '#5bba6f' }}>Visited (Completed)</span>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)' }}>Unvisited</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
