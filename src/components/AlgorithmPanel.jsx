import { useMemo } from 'react';

const SPEED_LABELS = { slow: '🐢', medium: '🐇', fast: '🚀' };
const SPEED_ORDER = ['slow', 'medium', 'fast'];

function findRoot(nodeId, parentMap) {
  if (!parentMap) return nodeId;
  let curr = nodeId;
  while (parentMap[curr] !== undefined && parentMap[curr] !== curr) {
    curr = parentMap[curr];
  }
  return curr;
}



function NodeBadge({ id, state, isCurrent, small }) {
  const colors = {
    unvisited: { bg: '#a89478', shadow: '#8a7660' },   // muted gray-brown
    queued:    { bg: '#f28c28', shadow: '#d47620' },   // bright orange
    visiting:  { bg: '#f28c28', shadow: '#d47620' },   // orange (processing)
    visited:   { bg: '#5bba6f', shadow: '#459a56' },   // green
    negative_cycle: { bg: '#ef4444', shadow: '#b91c1c' }, // red
  };
  const c = colors[state] || colors.unvisited;
  const size = small ? 'w-7 h-7 text-sm' : 'w-9 h-9 text-base';

  return (
    <div
      className={`${size} rounded-full inline-flex items-center justify-center font-bold text-white shrink-0`}
      style={{
        background: c.bg,
        boxShadow: isCurrent
          ? `0 0 0 3px ${c.bg}40, 2px 2px 0px ${c.shadow}`
          : `2px 2px 0px ${c.shadow}`,
        fontFamily: "'Caveat', cursive",
        transition: 'background 0.4s, box-shadow 0.3s',
        animation: isCurrent ? 'algoNodePulse 1s ease-in-out infinite' : 'none',
      }}
    >
      {id}
    </div>
  );
}

export default function AlgorithmPanel({
  algorithmType, currentData, currentStep, totalSteps,
  isPlaying, isComplete, speed,
  onTogglePlay, onNextStep, onPrevStep, onReset, onSetSpeed,
  sourceNode, hasNegativeWeights, onSpTabChange,
  nodes = [], directed = false,
}) {
  if (!algorithmType || !currentData) return null;

  const isBFS = algorithmType === 'bfs';
  const isDFS = algorithmType === 'dfs';
  const isDijkstra = algorithmType === 'dijkstra';
  const isBFSSp = algorithmType === 'bfsSp';
  const isBellmanFord = algorithmType === 'bellmanFord';
  const isFloydWarshall = algorithmType === 'floydWarshall';
  const isKruskal = algorithmType === 'kruskal';
  const isPrim = algorithmType === 'prim';
  const isTopoSort = algorithmType === 'topoSort';
  const isKosaraju = algorithmType === 'kosaraju';
  const isBipartite = algorithmType === 'bipartite';
  const isBridgesAndAPs = algorithmType === 'bridgesAndAPs';
  const isCycleDetection = algorithmType === 'cycleDetection';

  const isSpTab = isDijkstra || isBellmanFord || isFloydWarshall;
  const isMstTab = isKruskal || isPrim;

  const algoDetails = {
    bfs: { name: 'BFS', color: 'var(--color-accent-tertiary)', shadow: '#2a6ba4', icon: '📋', fName: 'Queue' },
    dfs: { name: 'DFS', color: '#a855f7', shadow: '#8b3fcf', icon: '📚', fName: 'Stack' },
    dijkstra: { name: 'Dijkstra', color: '#6366f1', shadow: '#4f46e5', icon: '⚖️', fName: 'Priority Queue' },
    bfsSp: { name: 'BFS Shortest Path', color: '#0d9488', shadow: '#0f766e', icon: '📋', fName: 'Queue' },
    bellmanFord: { name: 'Bellman-Ford', color: '#ec4899', shadow: '#be185d', icon: '🔄', fName: 'Relaxation' },
    floydWarshall: { name: 'Floyd-Warshall', color: '#f59e0b', shadow: '#d97706', icon: '🧮', fName: 'All Pairs' },
    kruskal: { name: "Kruskal's MST", color: '#10b981', shadow: '#059669', icon: '🌳', fName: 'DSU Forest' },
    prim: { name: "Prim's MST", color: '#10b981', shadow: '#059669', icon: '⚖️', fName: 'Priority Queue' },
    topoSort: { name: 'Topological Sort', color: '#0ea5e9', shadow: '#0369a1', icon: '🔢', fName: 'Zero In-degree Queue' },
    kosaraju: { name: "Kosaraju's SCC", color: '#a855f7', shadow: '#8b3fcf', icon: '🎨', fName: 'Finishing Stack' },
    bipartite: { name: 'Bipartite Check', color: '#ec4899', shadow: '#be185d', icon: '🔴🔵', fName: 'Coloring Queue' },
    bridgesAndAPs: { name: 'Bridges & APs', color: '#f59e0b', shadow: '#d97706', icon: '🌉', fName: 'DFS Tree tin/low' },
    cycleDetection: { name: 'Cycle Detection', color: '#ef4444', shadow: '#b91c1c', icon: '🔄', fName: 'DFS Stack' },
  };

  const currentAlgo = algoDetails[algorithmType] || algoDetails.bfs;
  const progress = totalSteps > 1 ? ((currentStep) / (totalSteps - 1)) * 100 : 0;

  const renderFrontierList = () => {
    if (isBellmanFord) {
      const edgeId = currentData.edgeChecked;
      const round = currentData.round;
      return (
        <div
          className="flex flex-col justify-center items-center h-full gap-2 text-center"
          style={{ fontFamily: "'Patrick Hand', cursive", color: 'var(--color-text-secondary)' }}
        >
          <div className="text-xl font-bold">
            {round === 0 ? 'Initialization' : (round === totalSteps - 1 ? 'Cycle Check' : `Round ${round} / ${totalSteps - 2}`)}
          </div>
          {edgeId && (
            <div
              className="text-xs px-2.5 py-1 rounded-lg font-bold"
              style={{
                background: 'rgba(245, 197, 66, 0.15)',
                border: '1.5px dashed var(--color-accent-warning)',
                color: 'var(--color-text-primary)'
              }}
            >
              Checking edge ID: {edgeId}
            </div>
          )}
        </div>
      );
    }

    if (isFloydWarshall) {
      const kId = currentData.kNodeId;
      return (
        <div
          className="flex flex-col justify-center items-center h-full gap-2 text-center"
          style={{ fontFamily: "'Patrick Hand', cursive", color: 'var(--color-text-secondary)' }}
        >
          <div className="text-sm font-bold text-gray-500">Intermediate Node (k):</div>
          {kId !== null ? (
            <NodeBadge id={kId} state="visiting" isCurrent={true} />
          ) : (
            <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '1.1rem' }}>
              {currentStep === 0 ? 'None (Init)' : 'None (Done)'}
            </span>
          )}
        </div>
      );
    }

    if (isKruskal) {
      const dsuParent = currentData.dsuParent || {};
      // Group nodes by root
      const roots = {};
      nodes.forEach(n => {
        const r = findRoot(n.id, dsuParent);
        if (!roots[r]) roots[r] = [];
        if (Number(r) !== Number(n.id)) {
          roots[r].push(n.id);
        }
      });

      return (
        <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[140px] pr-1">
          {Object.keys(roots).sort((a, b) => Number(a) - Number(b)).map(rootId => {
            const children = roots[rootId];
            return (
              <div
                key={rootId}
                className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-dashed border-gray-300 bg-gray-50/50 shrink-0"
                style={{ fontFamily: "'Patrick Hand', cursive" }}
              >
                <div className="flex items-center gap-1">
                  <NodeBadge id={Number(rootId)} state="visited" small />
                  {children.length > 0 ? (
                    <>
                      <span className="text-gray-400 text-sm">←</span>
                      <span className="text-sm text-gray-500 font-bold">
                        [{children.sort((a,b)=>a-b).join(', ')}]
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 italic font-normal ml-1">(isolated)</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    if (isPrim) {
      const pq = currentData.frontier || [];
      if (pq.length === 0) {
        return (
          <div
            className="text-center py-4"
            style={{ color: 'var(--color-text-muted)', fontFamily: "'Patrick Hand', cursive", fontSize: '0.95rem' }}
          >
            {isComplete ? '✨ MST Complete!' : 'Empty'}
          </div>
        );
      }

      return (
        <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[140px]">
          {pq.map((item, i) => {
            const isTop = i === 0;
            return (
              <div
                key={`${item.id}-${i}`}
                className="flex items-center gap-2 px-2 py-1 rounded-lg"
                style={{
                  background: isTop ? 'rgba(242, 140, 40, 0.12)' : 'transparent',
                  border: isTop ? '1.5px solid rgba(242, 140, 40, 0.3)' : '1.5px solid transparent',
                  transition: 'background 0.3s, border 0.3s',
                }}
              >
                <NodeBadge id={item.id} state="queued" isCurrent={isTop} small />
                
                <span
                  className="px-2 py-0.5 rounded-md text-xs font-bold"
                  style={{
                    background: 'var(--color-bg-secondary)',
                    color: 'var(--color-accent-tertiary)',
                    fontFamily: "'Patrick Hand', cursive",
                    fontSize: '0.85rem',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  key = {item.key === Infinity ? '∞' : item.key}
                </span>

                {item.parent !== null && item.parent !== undefined && (
                  <span
                    style={{
                      fontFamily: "'Caveat', cursive",
                      color: 'var(--color-text-muted)',
                      fontSize: '0.85rem',
                    }}
                  >
                    via {item.parent}
                  </span>
                )}

                <span
                  style={{
                    fontFamily: "'Caveat', cursive",
                    color: 'var(--color-text-muted)',
                    fontSize: '0.8rem',
                  }}
                >
                  {isTop ? '← min' : ''}
                </span>
              </div>
            );
          })}
        </div>
      );
    }

    if (isTopoSort || isBipartite) {
      const q = currentData.frontier || [];
      if (q.length === 0) {
        return (
          <div className="text-center py-4" style={{ color: 'var(--color-text-muted)', fontFamily: "'Patrick Hand', cursive", fontSize: '0.95rem' }}>
            Empty Queue
          </div>
        );
      }
      return (
        <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-[140px]">
          {q.map((id, index) => (
            <NodeBadge key={`${id}-${index}`} id={id} state="queued" isCurrent={index === 0} small />
          ))}
        </div>
      );
    }

    if (isKosaraju) {
      const stack = currentData.finishingStack || [];
      if (stack.length === 0) {
        return (
          <div className="text-center py-4" style={{ color: 'var(--color-text-muted)', fontFamily: "'Patrick Hand', cursive", fontSize: '0.95rem' }}>
            Empty Stack
          </div>
        );
      }
      return (
        <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-[140px] flex-row-reverse justify-end">
          {stack.map((id, index) => (
            <NodeBadge key={`${id}-${index}`} id={id} state="queued" isCurrent={index === stack.length - 1} small />
          ))}
        </div>
      );
    }

    if (isCycleDetection || isBridgesAndAPs) {
      const activePath = Object.entries(currentData.nodeStates || {})
        .filter(([id, val]) => (typeof val === 'object' ? val.state : val) === 'visiting')
        .map(([id]) => Number(id));
      if (activePath.length === 0) {
        return (
          <div className="text-center py-4" style={{ color: 'var(--color-text-muted)', fontFamily: "'Patrick Hand', cursive", fontSize: '0.95rem' }}>
            None (DFS Stack empty)
          </div>
        );
      }
      return (
        <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-[140px]">
          {activePath.map((id, index) => (
            <NodeBadge key={`${id}-${index}`} id={id} state="visiting" isCurrent={index === activePath.length - 1} small />
          ))}
        </div>
      );
    }

    const frontierList = currentData.frontier || [];
    if (frontierList.length === 0) {
      return (
        <div
          className="text-center py-4"
          style={{ color: 'var(--color-text-muted)', fontFamily: "'Patrick Hand', cursive", fontSize: '0.95rem' }}
        >
          {isComplete ? '✨ Empty!' : 'Empty'}
        </div>
      );
    }

    const items = isDFS ? [...frontierList].reverse() : frontierList;

    return (
      <div className="flex flex-col gap-1.5">
        {items.map((item, i) => {
          const nodeId = isDijkstra ? item.id : item;
          const dist = isDijkstra ? item.dist : null;
          const isTop = i === 0;
          return (
            <div
              key={`${nodeId}-${i}`}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
              style={{
                background: isTop ? 'rgba(242, 140, 40, 0.12)' : 'transparent',
                border: isTop ? '1.5px solid rgba(242, 140, 40, 0.3)' : '1.5px solid transparent',
                transition: 'background 0.3s, border 0.3s',
              }}
            >
              <NodeBadge id={nodeId} state="queued" isCurrent={isTop} small />
              
              {isDijkstra && (
                <span
                  className="px-2 py-0.5 rounded-md text-xs font-bold"
                  style={{
                    background: 'var(--color-bg-secondary)',
                    color: 'var(--color-accent-tertiary)',
                    fontFamily: "'Patrick Hand', cursive",
                    fontSize: '0.85rem',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  d = {dist === Infinity ? '∞' : dist}
                </span>
              )}

              <span
                style={{
                  fontFamily: "'Caveat', cursive",
                  color: 'var(--color-text-muted)',
                  fontSize: '0.8rem',
                }}
              >
                {isTop ? (isDijkstra ? '← min' : (isDFS ? '← top' : '← front')) : ''}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="fixed bottom-0 left-24 right-0 z-[60]"
      style={{
        background: 'var(--color-bg-surface)',
        borderTop: '2px solid var(--color-border)',
        boxShadow: '0 -4px 20px rgba(61,44,30,0.1)',
        animation: 'slideUpPanel 0.3s ease-out',
      }}
    >
      {/* Shortest Path Tab Switcher */}
      {isSpTab && (
        <div
          className="flex items-center gap-1.5 px-6 pt-3"
          style={{
            borderBottom: '2px solid var(--color-border)',
            background: 'var(--color-bg-secondary)'
          }}
        >
          {[
            { id: 'dijkstra', name: "Dijkstra's" },
            { id: 'bellmanFord', name: 'Bellman-Ford' },
            { id: 'floydWarshall', name: 'Floyd-Warshall' },
          ].map(tab => {
            const active = algorithmType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSpTabChange?.(tab.id)}
                className="px-4 py-1.5 rounded-t-xl transition-all duration-150 border-t border-x"
                style={{
                  background: active ? 'var(--color-bg-surface)' : 'transparent',
                  borderColor: active ? 'var(--color-border)' : 'transparent',
                  color: active ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginBottom: '-2px',
                  zIndex: active ? 10 : 1,
                  position: 'relative',
                  borderTopWidth: '2px',
                  borderLeftWidth: '2px',
                  borderRightWidth: '2px',
                }}
              >
                {tab.name}
              </button>
            );
          })}
        </div>
      )}

      {/* MST Tab Switcher */}
      {isMstTab && (
        <div
          className="flex items-center gap-1.5 px-6 pt-3"
          style={{
            borderBottom: '2px solid var(--color-border)',
            background: 'var(--color-bg-secondary)'
          }}
        >
          {[
            { id: 'kruskal', name: "Kruskal's" },
            { id: 'prim', name: "Prim's" },
          ].map(tab => {
            const active = algorithmType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSpTabChange?.(tab.id)}
                className="px-4 py-1.5 rounded-t-xl transition-all duration-150 border-t border-x"
                style={{
                  background: active ? 'var(--color-bg-surface)' : 'transparent',
                  borderColor: active ? 'var(--color-border)' : 'transparent',
                  color: active ? 'var(--color-accent-primary)' : 'var(--color-text-muted)',
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginBottom: '-2px',
                  zIndex: active ? 10 : 1,
                  position: 'relative',
                  borderTopWidth: '2px',
                  borderLeftWidth: '2px',
                  borderRightWidth: '2px',
                }}
              >
                {tab.name}
              </button>
            );
          })}
        </div>
      )}

      {/* Progress bar */}
      <div className="h-1 w-full" style={{ background: 'var(--color-bg-secondary)' }}>
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${progress}%`,
            background: currentAlgo.color,
          }}
        />
      </div>

      {/* Warning Banner for Dijkstra with Negative Weights */}
      {isDijkstra && hasNegativeWeights && (
        <div
          className="flex items-center gap-2 px-6 py-2"
          style={{
            background: 'rgba(232, 87, 58, 0.08)',
            borderBottom: '2px dashed var(--color-accent-danger)',
            color: 'var(--color-accent-danger)',
            fontFamily: "'Patrick Hand', cursive",
            fontSize: '1.05rem',
            fontWeight: 700,
          }}
        >
          <span>⚠️</span>
          <span>Dijkstra's algorithm may not yield correct results on graphs with negative edge weights!</span>
        </div>
      )}

      {/* Warning Banner for Bellman-Ford Negative Cycle */}
      {isBellmanFord && currentData.negativeCycle && (
        <div
          className="flex items-center gap-2 px-6 py-2"
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            borderBottom: '2px dashed #ef4444',
            color: '#ef4444',
            fontFamily: "'Patrick Hand', cursive",
            fontSize: '1.05rem',
            fontWeight: 700,
          }}
        >
          <span>⚠️</span>
          <span>Negative Cycle Detected! Shortest paths are undefined since we can relax infinitely.</span>
        </div>
      )}

      {/* Warning Banner for MST with Directed Graph */}
      {isMstTab && directed && (
        <div
          className="flex items-center gap-2 px-6 py-2"
          style={{
            background: 'rgba(242, 140, 40, 0.08)',
            borderBottom: '2px dashed #f28c28',
            color: '#f28c28',
            fontFamily: "'Patrick Hand', cursive",
            fontSize: '1.05rem',
            fontWeight: 700,
          }}
        >
          <span>⚠️</span>
          <span>Spanning trees are only defined on undirected graphs. Kruskal and Prim will treat all edges as undirected.</span>
        </div>
      )}

      {/* Warning Banner for Directed TopoSort / Kosaraju on Undirected graph */}
      {(isTopoSort || isKosaraju) && !directed && (
        <div
          className="flex items-center gap-2 px-6 py-2"
          style={{
            background: 'rgba(242, 140, 40, 0.08)',
            borderBottom: '2px dashed #f28c28',
            color: '#f28c28',
            fontFamily: "'Patrick Hand', cursive",
            fontSize: '1.05rem',
            fontWeight: 700,
          }}
        >
          <span>⚠️</span>
          <span>{isTopoSort ? "Topological Sort" : "Kosaraju's SCC"} is only defined on directed graphs! Edges are treated as directed.</span>
        </div>
      )}

      {/* Warning Banner for Undirected AP/Bridges on Directed graph */}
      {isBridgesAndAPs && directed && (
        <div
          className="flex items-center gap-2 px-6 py-2"
          style={{
            background: 'rgba(242, 140, 40, 0.08)',
            borderBottom: '2px dashed #f28c28',
            color: '#f28c28',
            fontFamily: "'Patrick Hand', cursive",
            fontSize: '1.05rem',
            fontWeight: 700,
          }}
        >
          <span>⚠️</span>
          <span>Tarjan's Bridges & Articulation Points is only defined on undirected graphs! Edges are treated as undirected.</span>
        </div>
      )}

      <div className="flex items-stretch" style={{ minHeight: '180px' }}>
        {/* Left: Controls */}
        <div
          className="flex flex-col items-center justify-center gap-3 px-5 py-4 shrink-0"
          style={{ borderRight: '2px dashed var(--color-border)', minWidth: '200px' }}
        >
          {/* Algorithm badge */}
          <div className="flex items-center gap-2">
            <span
              className="px-3 py-1 rounded-lg text-white font-bold text-sm"
              style={{
                background: currentAlgo.color,
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '1rem',
                boxShadow: `2px 2px 0px ${currentAlgo.shadow}`,
              }}
            >
              {currentAlgo.name}
            </span>
            {!isFloydWarshall && sourceNode !== null && (
              <span
                style={{
                  fontFamily: "'Patrick Hand', cursive",
                  color: 'var(--color-text-muted)',
                  fontSize: '0.9rem',
                }}
              >
                from node {sourceNode}
              </span>
            )}
          </div>

          {/* Step counter */}
          <div
            style={{
              fontFamily: "'Caveat', cursive",
              color: 'var(--color-text-secondary)',
              fontSize: '1.1rem',
            }}
          >
            Step {currentStep + 1} / {totalSteps}
          </div>

          {currentData.mstWeight !== undefined && (
            <div
              className="text-sm font-bold px-2.5 py-1 rounded-lg mt-1"
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1.5px dashed #10b981',
                color: '#10b981',
                fontFamily: "'Patrick Hand', cursive",
                fontSize: '1rem',
              }}
            >
              🌳 MST Weight: {currentData.mstWeight}
            </div>
          )}

          {/* Playback buttons */}
          <div className="flex items-center gap-2">
            {/* Prev */}
            <button
              onClick={onPrevStep}
              disabled={currentStep <= 0}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: 'transparent',
                color: currentStep <= 0 ? 'var(--color-border)' : 'var(--color-text-secondary)',
                border: '1.5px solid var(--color-border)',
                cursor: currentStep <= 0 ? 'not-allowed' : 'pointer',
                opacity: currentStep <= 0 ? 0.4 : 1,
              }}
              title="Previous Step"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="11 17 6 12 11 7" />
                <polyline points="18 17 13 12 18 7" />
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={onTogglePlay}
              disabled={isComplete}
              className="w-11 h-11 rounded-xl flex items-center justify-center transition-all"
              style={{
                background: isComplete ? 'var(--color-border)' : currentAlgo.color,
                color: '#fff',
                border: 'none',
                cursor: isComplete ? 'not-allowed' : 'pointer',
                boxShadow: isComplete ? 'none' : `2px 2px 0px ${currentAlgo.shadow}`,
              }}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6 3 20 12 6 21" />
                </svg>
              )}
            </button>

            {/* Next */}
            <button
              onClick={onNextStep}
              disabled={isComplete}
              className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
              style={{
                background: 'transparent',
                color: isComplete ? 'var(--color-border)' : 'var(--color-text-secondary)',
                border: '1.5px solid var(--color-border)',
                cursor: isComplete ? 'not-allowed' : 'pointer',
                opacity: isComplete ? 0.4 : 1,
              }}
              title="Next Step"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="13 17 18 12 13 7" />
                <polyline points="6 17 11 12 6 7" />
              </svg>
            </button>
          </div>

          {/* Speed selector */}
          <div className="flex items-center gap-1.5">
            {SPEED_ORDER.map(s => (
              <button
                key={s}
                onClick={() => onSetSpeed(s)}
                className="px-2.5 py-1 rounded-lg text-sm transition-all"
                style={{
                  background: speed === s ? 'var(--color-accent-secondary)' : 'transparent',
                  color: speed === s ? '#fff' : 'var(--color-text-muted)',
                  border: `1.5px solid ${speed === s ? 'var(--color-accent-secondary)' : 'var(--color-border)'}`,
                  fontFamily: "'Patrick Hand', cursive",
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                }}
              >
                {SPEED_LABELS[s]}
              </button>
            ))}
          </div>

          {/* Reset */}
          <button
            onClick={onReset}
            className="px-4 py-1.5 rounded-lg text-sm transition-all"
            style={{
              background: 'transparent',
              color: 'var(--color-accent-danger)',
              border: '1.5px solid var(--color-accent-danger)',
              fontFamily: "'Patrick Hand', cursive",
              fontSize: '0.9rem',
              cursor: 'pointer',
            }}
          >
            ✖ Reset
          </button>
        </div>

        {/* Middle: Queue/Stack */}
        <div
          className="flex flex-col py-3 px-4 overflow-hidden justify-center"
          style={{ borderRight: '2px dashed var(--color-border)', minWidth: '200px', maxWidth: '280px' }}
        >
          <div
            className="text-sm font-bold mb-2 flex items-center gap-1.5"
            style={{
              fontFamily: "'Patrick Hand', cursive",
              color: 'var(--color-text-secondary)',
              fontSize: '1rem',
            }}
          >
            {currentAlgo.icon} {currentAlgo.fName}
            {!isBellmanFord && !isFloydWarshall && (
              <span
                className="ml-auto px-2 py-0.5 rounded-md text-xs"
                style={{
                  background: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-muted)',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '0.65rem',
                }}
              >
                {currentData.frontier?.length || 0}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-auto">
            {renderFrontierList()}
          </div>
        </div>

        {/* Right: Traversal Order + Description */}
        <div className="flex-1 flex flex-col py-3 px-5 overflow-hidden">
          {/* Description */}
          <div
            className="px-3 py-2 rounded-lg mb-3"
            style={{
              background: 'var(--color-bg-primary)',
              border: '1.5px dashed var(--color-border)',
              fontFamily: "'Patrick Hand', cursive",
              color: 'var(--color-text-primary)',
              fontSize: '1.05rem',
              minHeight: '40px',
            }}
          >
            {currentData.description}
          </div>

          {/* Traversal Order */}
          {(isBFS || isDFS || isDijkstra || isBFSSp) && (
            <>
              <div
                className="text-sm font-bold mb-2"
                style={{
                  fontFamily: "'Patrick Hand', cursive",
                  color: 'var(--color-text-secondary)',
                  fontSize: '1rem',
                }}
              >
                📍 Traversal Order
              </div>
              <div className="flex-1 overflow-auto">
                {currentData.traversalOrder.length === 0 ? (
                  <div
                    style={{ color: 'var(--color-text-muted)', fontFamily: "'Patrick Hand', cursive", fontSize: '0.95rem' }}
                  >
                    No nodes visited yet…
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {currentData.traversalOrder.map((nodeId, i) => (
                      <div key={`${nodeId}-${i}`} className="flex items-center gap-1">
                        <NodeBadge id={nodeId} state="visited" isCurrent={nodeId === currentData.currentNode} small />
                        {i < currentData.traversalOrder.length - 1 && (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>→</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* If Bellman Ford, show active relaxation statistics */}
          {isBellmanFord && (
            <div
              className="flex-1 overflow-auto p-2 rounded-lg border border-dashed border-gray-300 bg-gray-50"
              style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '1rem' }}
            >
              <div className="font-bold mb-1">Bellman-Ford Info:</div>
              <ul className="list-disc pl-4 text-sm flex flex-col gap-1 text-gray-700">
                <li>Iterates over all edges round by round.</li>
                <li>Performs total of V-1 relaxation rounds.</li>
                <li>Nth round is executed to detect negative weight cycles.</li>
              </ul>
            </div>
          )}

          {/* If Floyd Warshall, explain intermediate node usage */}
          {isFloydWarshall && (
            <div
              className="flex-1 overflow-auto p-2 rounded-lg border border-dashed border-gray-300 bg-gray-50"
              style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '1rem' }}
            >
              <div className="font-bold mb-1">Floyd-Warshall Info:</div>
              <ul className="list-disc pl-4 text-sm flex flex-col gap-1 text-gray-700">
                <li>All-pairs shortest path dynamic programming algorithm.</li>
                <li>Updates distance table based on intermediate node k.</li>
                <li>Runs for total of N steps (one per node k).</li>
              </ul>
            </div>
          )}

          {/* If Kruskal, explain DSU components */}
          {isKruskal && (
            <div
              className="flex-1 overflow-auto p-2 rounded-lg border border-dashed border-gray-300 bg-gray-50"
              style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '1rem' }}
            >
              <div className="font-bold mb-1">Kruskal's Info:</div>
              <ul className="list-disc pl-4 text-sm flex flex-col gap-1 text-gray-700">
                <li>Sorts all edges by weight and processes them.</li>
                <li>Uses Union-Find (DSU) to detect cycles.</li>
                <li>If endpoints are in different sets, union them and add to MST.</li>
              </ul>
            </div>
          )}

          {/* If Prim, explain cut and priority queue */}
          {isPrim && (
            <div
              className="flex-1 overflow-auto p-2 rounded-lg border border-dashed border-gray-300 bg-gray-50"
              style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '1rem' }}
            >
              <div className="font-bold mb-1">Prim's Info:</div>
              <ul className="list-disc pl-4 text-sm flex flex-col gap-1 text-gray-700">
                <li>Grows the MST from a selected source node.</li>
                <li>Always selects the minimum weight edge crossing the cut.</li>
                <li>Updates priority queue with keys (min edge weights to cut).</li>
              </ul>
            </div>
          )}

          {/* Topological sort result */}
          {isTopoSort && (
            <div
              className="flex-1 overflow-auto p-2 rounded-lg border border-dashed border-gray-300 bg-gray-50/50"
              style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '1rem' }}
            >
              <div className="font-bold mb-1 text-sm text-gray-500">Topological Sort Order:</div>
              {currentData.hasCycle ? (
                <div style={{ color: 'var(--color-accent-danger)', fontWeight: 'bold' }}>
                  ⚠️ Cycle detected! Topological sort impossible.
                </div>
              ) : currentData.traversalOrder && currentData.traversalOrder.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {currentData.traversalOrder.map((id, index) => (
                    <div key={`${id}-${index}`} className="flex items-center gap-1">
                      <span className="font-bold text-xs" style={{ color: 'var(--color-text-muted)' }}>#{index + 1}</span>
                      <NodeBadge id={id} state="visited" small />
                      {index < currentData.traversalOrder.length - 1 && <span className="text-gray-400">→</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-gray-400 italic text-sm">Waiting for nodes to finish...</span>
              )}
            </div>
          )}

          {/* Kosaraju explanation */}
          {isKosaraju && (
            <div
              className="flex-1 overflow-auto p-2 rounded-lg border border-dashed border-gray-300 bg-gray-50/50"
              style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '1rem' }}
            >
              <div className="font-bold mb-1">Kosaraju's SCC Info:</div>
              <ul className="list-disc pl-4 text-xs flex flex-col gap-0.5 text-gray-700">
                <li>Pass 1: Run DFS to compute node finishing times.</li>
                <li>Pass 2: Transpose edge arrows & run DFS in reverse finishing order.</li>
                <li>Each DFS traversal tree in Pass 2 reveals one SCC.</li>
              </ul>
            </div>
          )}

          {/* Bipartite explanation */}
          {isBipartite && (
            <div
              className="flex-1 overflow-auto p-2 rounded-lg border border-dashed border-gray-300 bg-gray-50/50"
              style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '1rem' }}
            >
              <div className="font-bold mb-1">Bipartite Check Info:</div>
              <ul className="list-disc pl-4 text-xs flex flex-col gap-0.5 text-gray-700">
                <li>Bipartite if nodes can be partitioned into Red vs Blue.</li>
                <li>Runs BFS coloring neighbors the opposite color of parent.</li>
                <li>Bipartite check fails if an edge connects same-color nodes.</li>
              </ul>
            </div>
          )}

          {/* Bridges and APs explanation */}
          {isBridgesAndAPs && (
            <div
              className="flex-1 overflow-auto p-2 rounded-lg border border-dashed border-gray-300 bg-gray-50/50"
              style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '1rem' }}
            >
              <div className="font-bold mb-1">Tarjan's AP & Bridge Info:</div>
              <ul className="list-disc pl-4 text-xs flex flex-col gap-0.5 text-gray-700">
                <li>tin: discovery time of a node in DFS tree.</li>
                <li>low: lowest tin reachable via a back-edge from this subtree.</li>
                <li>Bridge edge (u, v): if low[v] &gt; tin[u].</li>
                <li>Articulation Point u: if low[v] &gt;= tin[u].</li>
              </ul>
            </div>
          )}

          {/* Cycle Detection explanation */}
          {isCycleDetection && (
            <div
              className="flex-1 overflow-auto p-2 rounded-lg border border-dashed border-gray-300 bg-gray-50/50"
              style={{ fontFamily: "'Patrick Hand', cursive", fontSize: '1rem' }}
            >
              <div className="font-bold mb-1">Cycle Detection Info:</div>
              <ul className="list-disc pl-4 text-xs flex flex-col gap-0.5 text-gray-700">
                <li>Directed: cycle exists if DFS hits a node in active recursion stack.</li>
                <li>Undirected: cycle exists if DFS hits a visited node (not parent).</li>
                <li>Cycle path highlighted in red on completion/detection.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
