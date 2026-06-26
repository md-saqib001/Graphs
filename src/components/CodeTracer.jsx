import { useState, useRef, useEffect } from 'react';

const PSEUDOCODE = {
  bfs: [
    'Initialize Queue Q, visited set V',
    'while Q is not empty:',
    '  u = Q.dequeue()',
    '  for each neighbor v of u:',
    '    if v is unvisited:',
    '      Q.enqueue(v), parent[v] = u',
    '      mark u as visited',
  ],
  dfs: [
    'Initialize Stack S, visited set V',
    'while S is not empty:',
    '  u = S.pop()',
    '  if u is visited: continue',
    '  for each neighbor v of u:',
    '    if v is unvisited: S.push(v)',
    '  mark u as visited',
  ],
  dijkstra: [
    'dist[all] = ∞, dist[source] = 0',
    'Insert source into Priority Queue PQ',
    'while PQ is not empty:',
    '  u = PQ.extractMin()',
    '  for each neighbor v of u:',
    '    if dist[u] + w(u,v) < dist[v]:',
    '      dist[v] = dist[u] + w(u,v)',
    '      PQ.update(v, dist[v])',
  ],
  bfsSp: [
    'Queue Q, dist[all] = ∞, dist[source] = 0',
    'while Q is not empty:',
    '  u = Q.dequeue()',
    '  for each neighbor v of u:',
    '    if v is unvisited:',
    '      dist[v] = dist[u] + 1, parent[v] = u, Q.enqueue(v)',
  ],
  bellmanFord: [
    'dist[all] = ∞, dist[source] = 0',
    'repeat V-1 times:',
    '  for each edge (u, v) with weight w:',
    '    if dist[u] + w < dist[v]:',
    '      dist[v] = dist[u] + w, parent[v] = u',
    'for each edge (u, v) with weight w:',
    '  if dist[u] + w < dist[v]: report negative cycle',
  ],
  floydWarshall: [
    'dist[i][j] = edge_weight(i,j) or ∞',
    'for k from 0 to N-1 (intermediate):',
    '  for i from 0 to N-1 (source):',
    '    for j from 0 to N-1 (destination):',
    '      if dist[i][k] + dist[k][j] < dist[i][j]:',
    '        dist[i][j] = dist[i][k] + dist[k][j]',
  ],
  kruskal: [
    'Sort edges by weight ascending',
    'Initialize Union-Find / DSU forest',
    'for each edge (u, v) in sorted list:',
    '  if find(u) != find(v):',
    '    union(u, v)',
    '    add edge (u, v) to MST',
    '  else: skip edge (creates cycle)',
  ],
  prim: [
    'key[all] = ∞, key[source] = 0',
    'Insert all nodes into PQ',
    'while PQ is not empty:',
    '  u = PQ.extractMin(), add u to MST',
    '  for each neighbor v of u:',
    '    if v ∉ MST and w(u,v) < key[v]:',
    '      key[v] = w(u,v), parent[v] = u, update PQ',
  ],
  topoSort: [
    'Compute in-degree for all nodes',
    'Queue Q, enqueue nodes with in-degree = 0',
    'while Q is not empty:',
    '  u = Q.dequeue(), add u to sorted order',
    '  for each neighbor v of u:',
    '    in-degree[v]--',
    '    if in-degree[v] == 0: Q.enqueue(v)',
  ],
  kosaraju: [
    'Pass 1 DFS: Compute finishing times',
    'Transpose all edges in graph',
    'while finishing stack is not empty:',
    '  u = stack.pop()',
    '  if u is unvisited in transposed graph:',
    '    Pass 2 DFS: start tree from u',
    '    Group visited nodes as one SCC',
  ],
  bipartite: [
    'Initialize color[all] = uncolored',
    'for each unvisited node component:',
    '  while Q is not empty: u = Q.dequeue()',
    '  for each neighbor v of u:',
    '    if v is uncolored: color[v] = 1 - color[u], Q.enqueue(v)',
    '    else if color[v] == color[u]: report conflict',
  ],
  bridgesAndAPs: [
    'DFS(u): tin[u] = low[u] = timer++',
    'for neighbor v of u (v ≠ parent):',
    '  if v is visited: low[u] = min(low[u], tin[v])',
    '  if v is unvisited: DFS(v)',
    '    low[u] = min(low[u], low[v])',
    '    if low[v] > tin[u]: bridge detected',
    '    if low[v] >= tin[u]: AP u detected',
  ],
  cycleDetection: [
    'DFS(u): mark u visited & active',
    'for neighbor v of u:',
    '  if directed and v is active: cycle found',
    '  if undirected and v is visited (v ≠ parent): cycle found',
    '  else if v is unvisited: DFS(v)',
  ],
};

const ALGO_DETAILS = {
  bfs: { name: 'BFS', color: 'var(--color-accent-tertiary)' },
  dfs: { name: 'DFS', color: '#a855f7' },
  dijkstra: { name: 'Dijkstra', color: '#6366f1' },
  bfsSp: { name: 'BFS Shortest Path', color: '#0d9488' },
  bellmanFord: { name: 'Bellman-Ford', color: '#ec4899' },
  floydWarshall: { name: 'Floyd-Warshall', color: '#f59e0b' },
  kruskal: { name: "Kruskal's MST", color: '#10b981' },
  prim: { name: "Prim's MST", color: '#10b981' },
  topoSort: { name: 'Topological Sort', color: '#0ea5e9' },
  kosaraju: { name: "Kosaraju's SCC", color: '#a855f7' },
  bipartite: { name: 'Bipartite Check', color: '#ec4899' },
  bridgesAndAPs: { name: 'Bridges & APs', color: '#f59e0b' },
  cycleDetection: { name: 'Cycle Detection', color: '#ef4444' },
};

export default function CodeTracer({ algorithmType, currentData }) {
  const [collapsed, setCollapsed] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 72 });
  const [dimensions, setDimensions] = useState({ width: 420, height: 350 });
  const [fontOffset, setFontOffset] = useState(0);
  const containerRef = useRef(null);

  // Position properly on mount relative to window size
  useEffect(() => {
    const margin = 24;
    const infoPanelWidth = 320;
    const tracerWidth = 420;
    const initialX = window.innerWidth - infoPanelWidth - tracerWidth - margin;
    setPosition({ x: initialX, y: 72 });
  }, []);

  // Track size changes via ResizeObserver to scale font dynamically
  useEffect(() => {
    if (!containerRef.current || collapsed) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions((prev) => {
          if (Math.abs(prev.width - width) < 1 && Math.abs(prev.height - height) < 1) {
            return prev;
          }
          return { width, height };
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [collapsed]);

  if (!algorithmType || !currentData) return null;

  const currentAlgo = ALGO_DETAILS[algorithmType] || { name: 'Algorithm', color: '#e28743' };
  const lines = PSEUDOCODE[algorithmType] || [];

  const handleMouseDown = (e) => {
    if (e.target.closest('button')) return; // ignore buttons inside header
    e.preventDefault();
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (moveEvent) => {
      let nextX = moveEvent.clientX - startX;
      let nextY = moveEvent.clientY - startY;

      // Restrict within screen boundaries
      const tracerWidth = containerRef.current?.offsetWidth || dimensions.width;
      const tracerHeight = containerRef.current?.offsetHeight || dimensions.height;
      nextX = Math.max(10, Math.min(window.innerWidth - tracerWidth - 10, nextX));
      nextY = Math.max(10, Math.min(window.innerHeight - tracerHeight - 10, nextY));

      setPosition({ x: nextX, y: nextY });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const accentColor = currentAlgo.color.startsWith('#') ? currentAlgo.color : '#e28743';

  // Font size calculation: scale from base 14.5px depending on width
  const baseWidth = 420;
  const baseFontSize = 14.5;
  const computedFontSize = Math.max(
    11,
    Math.min(26, baseFontSize + (dimensions.width - baseWidth) * 0.02)
  );
  const fontSize = computedFontSize + fontOffset;

  return (
    <div
      ref={containerRef}
      className="fixed z-[70] rounded-2xl border flex flex-col shadow-2xl transition-shadow select-none overflow-hidden"
      style={{
        left: position.x,
        top: position.y,
        width: `${dimensions.width}px`,
        height: collapsed ? 'auto' : `${dimensions.height}px`,
        borderColor: 'var(--color-border)',
        background: 'rgba(30, 41, 59, 0.85)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
        resize: collapsed ? 'none' : 'both',
        minWidth: '320px',
        minHeight: '180px',
        maxWidth: '800px',
        maxHeight: '600px',
      }}
    >
      {/* Draggable Header */}
      <div
        onMouseDown={handleMouseDown}
        className="flex items-center justify-between px-4 py-2.5 cursor-grab active:cursor-grabbing border-b select-none shrink-0"
        style={{
          borderColor: 'rgba(255, 255, 255, 0.1)',
          background: 'rgba(255, 255, 255, 0.03)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">💻</span>
          <span
            className="font-bold tracking-wide"
            style={{
              fontFamily: "'Patrick Hand', cursive",
              fontSize: '1.05rem',
              color: 'rgba(255, 255, 255, 0.95)',
            }}
          >
            Live Code Tracing: <span style={{ color: accentColor }}>{currentAlgo.name}</span>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          {/* Font Sizing Buttons */}
          {!collapsed && (
            <div className="flex items-center mr-1 border-r border-white/10 pr-2 gap-0.5">
              <button
                onClick={() => setFontOffset((prev) => Math.max(-6, prev - 1))}
                className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer font-bold text-[10px]"
                title="Decrease Font Size"
              >
                A-
              </button>
              <button
                onClick={() => setFontOffset((prev) => Math.min(12, prev + 1))}
                className="w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer font-bold text-[10px]"
                title="Increase Font Size"
              >
                A+
              </button>
            </div>
          )}

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title={collapsed ? 'Expand Code' : 'Collapse Code'}
          >
            {collapsed ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 14 10 14 10 20" />
                <polyline points="20 10 14 10 14 4" />
                <line x1="14" y1="10" x2="21" y2="3" />
                <line x1="10" y1="14" x2="3" y2="21" />
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="8 3 14 3 14 9" />
                <polyline points="16 21 10 21 10 15" />
                <line x1="10" y1="15" x2="3" y2="22" />
                <line x1="14" y1="3" x2="21" y2="10" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Code Container */}
      {!collapsed && (
        <div
          className="p-3 flex flex-col gap-0.5 overflow-y-auto flex-grow"
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
            fontSize: `${fontSize}px`,
            lineHeight: '1.35',
          }}
        >
          {lines.map((line, idx) => {
            const lineNum = idx + 1;
            const isHighlighted = lineNum === currentData.activeLine;

            return (
              <div
                key={idx}
                className="flex items-start py-0.5 px-2 rounded transition-all duration-150"
                style={{
                  background: isHighlighted ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                  borderLeft: isHighlighted ? `3px solid ${accentColor}` : '3px solid transparent',
                  boxShadow: isHighlighted ? `0 0 10px ${accentColor}25` : 'none',
                  fontWeight: isHighlighted ? '700' : '400',
                  color: isHighlighted ? '#ffffff' : '#9ca3af',
                }}
              >
                <span className="w-5 select-none text-gray-600 shrink-0 text-right pr-2">
                  {lineNum}
                </span>
                <span className="whitespace-pre overflow-x-auto select-text scrollbar-thin">
                  {line}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
