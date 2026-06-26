import { useRef, useState, useCallback, useEffect } from 'react';

const NODE_RADIUS = 24;
const ARROW_SIZE = 11;

// ── Algorithm color mapping ───────────────────────────────────────────
const ALGO_NODE_COLORS = {
  unvisited: { fill: '#a89478', shadow: '#8a7660' },   // muted gray-brown
  queued:    { fill: '#f28c28', shadow: '#d47620' },   // bright orange
  visiting:  { fill: '#f28c28', shadow: '#d47620' },   // orange (processing)
  visited:   { fill: '#5bba6f', shadow: '#459a56' },   // green
  negative_cycle: { fill: '#ef4444', shadow: '#b91c1c' }, // red for negative cycles
};

const ALGO_EDGE_COLORS = {
  default:   '#6b5744',
  traversed: '#5bba6f',   // green for relaxed
  active:    '#f5c542',   // yellow for checking
  negative_cycle: '#ef4444', // red for negative cycles
  mst:       '#10b981',   // bold green for MST
  conflict:  '#ef4444',   // red for bipartite conflict edge
  bridge:    '#ef4444',   // red for bridges
  cycle:     '#ef4444',   // red for cycle detection
};

function getEdgePath(fromNode, toNode, directed) {
  const dx = toNode.x - fromNode.x;
  const dy = toNode.y - fromNode.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return null;

  const ux = dx / dist;
  const uy = dy / dist;

  const x1 = fromNode.x + ux * NODE_RADIUS;
  const y1 = fromNode.y + uy * NODE_RADIUS;
  const offset = directed ? NODE_RADIUS + ARROW_SIZE : NODE_RADIUS;
  const x2 = toNode.x - ux * offset;
  const y2 = toNode.y - uy * offset;

  return { x1, y1, x2, y2, ux, uy };
}

const NODE_COLOR = { fill: '#e8573a', shadow: '#c44125' };

function EdgeLine({
  edge, fromNode, toNode, directed, weighted, isHovered,
  onMouseEnter, onMouseLeave, onClick, onContextMenu,
  algoState, isSpTreeEdge, isQueryPathEdge, isAlgoSp, isComplete
}) {
  if (!fromNode || !toNode) return null;
  const path = getEdgePath(fromNode, toNode, directed);
  if (!path) return null;

  const { x1, y1, x2, y2, ux, uy } = path;
  const midX = (fromNode.x + toNode.x) / 2;
  const midY = (fromNode.y + toNode.y) / 2;
  const weight = edge.weight ?? 1;
  const isNegative = weight < 0;

  const perpX = -uy * 16;
  const perpY = ux * 16;

  // Determine edge color based on algo state
  let edgeColor = algoState
    ? (ALGO_EDGE_COLORS[algoState] || ALGO_EDGE_COLORS.default)
    : (isHovered ? 'var(--color-accent-primary)' : '#6b5744');

  if (isAlgoSp && isComplete && isSpTreeEdge) {
    edgeColor = '#3b82c4'; // Blue for shortest path tree
  }

  const isMstEdge = algoState === 'mst';
  const isTreeEdgeActive = isAlgoSp && isComplete && isSpTreeEdge;
  const isSpecialRedEdge = algoState === 'conflict' || algoState === 'bridge' || algoState === 'cycle';
  const edgeOpacity = algoState === 'traversed' || isTreeEdgeActive || isMstEdge || isSpecialRedEdge ? 1 : (isHovered ? 1 : 0.7);
  const edgeWidth = isMstEdge ? 5.0 : (isSpecialRedEdge ? 4.5 : (algoState === 'traversed' || isTreeEdgeActive ? 3.5 : (isHovered ? 3.5 : 2.5)));

  return (
    <g
      className="edge-group"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onContextMenu={onContextMenu}
      style={{ cursor: 'pointer' }}
    >
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="transparent"
        strokeWidth="16"
      />
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={edgeColor}
        strokeWidth={edgeWidth}
        strokeLinecap="round"
        opacity={edgeOpacity}
        style={{ transition: 'stroke 0.4s, stroke-width 0.3s, opacity 0.3s' }}
      />
      
      {/* Glowing animated trail overlay for queried paths */}
      {isQueryPathEdge && (
        <line
          x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="#60a5fa"
          strokeWidth={edgeWidth + 2.5}
          strokeLinecap="round"
          strokeDasharray="8 6"
          className="glowing-path"
          style={{ transition: 'stroke-width 0.3s' }}
          pointerEvents="none"
        />
      )}

      {directed && (
        <polygon
          points={`
            ${toNode.x - ux * NODE_RADIUS},${toNode.y - uy * NODE_RADIUS}
            ${toNode.x - ux * (NODE_RADIUS + ARROW_SIZE) - uy * (ARROW_SIZE / 2)},${toNode.y - uy * (NODE_RADIUS + ARROW_SIZE) + ux * (ARROW_SIZE / 2)}
            ${toNode.x - ux * (NODE_RADIUS + ARROW_SIZE) + uy * (ARROW_SIZE / 2)},${toNode.y - uy * (NODE_RADIUS + ARROW_SIZE) - ux * (ARROW_SIZE / 2)}
          `}
          fill={edgeColor}
          opacity={edgeOpacity}
          style={{ transition: 'fill 0.4s, opacity 0.3s' }}
        />
      )}
      {/* Weight label */}
      {weighted && (
        <g>
          <rect
            x={midX + perpX - 16}
            y={midY + perpY - 12}
            width="32"
            height="22"
            rx="6"
            fill="var(--color-bg-surface)"
            stroke={algoState === 'traversed' || isTreeEdgeActive ? (isTreeEdgeActive ? '#3b82c4' : '#f28c28') : (isHovered ? 'var(--color-accent-primary)' : 'var(--color-border)')}
            strokeWidth="1.5"
            opacity="0.95"
            style={{ transition: 'stroke 0.4s' }}
          />
          <text
            x={midX + perpX}
            y={midY + perpY + 3}
            textAnchor="middle"
            fontSize="14"
            fontWeight="700"
            fill={isNegative ? 'var(--color-accent-danger)' : 'var(--color-text-primary)'}
            fontFamily="'Caveat', cursive"
            style={{ pointerEvents: 'none' }}
          >
            {weight}
          </text>
        </g>
      )}
      {/* Hover tooltip */}
      {isHovered && (
        <g style={{ animation: 'tooltipFadeIn 0.15s ease-out' }}>
          <rect
            x={midX - 42} y={midY - perpY - 28}
            width="84" height="24"
            rx="6"
            fill="var(--color-bg-surface)"
            stroke="var(--color-border)"
            strokeWidth="1.5"
          />
          <text
            x={midX} y={midY - perpY - 12}
            textAnchor="middle"
            fontSize="13"
            fontWeight="600"
            fill="var(--color-text-secondary)"
            fontFamily="'Caveat', cursive"
          >
            {weighted ? `${edge.from} → ${edge.to} (w=${weight})` : `${edge.from} → ${edge.to}`}
          </text>
        </g>
      )}
    </g>
  );
}

function NodeCircle({
  node, isSelected, isHovered, onMouseDown, onMouseEnter, onMouseLeave,
  onClick, onContextMenu, algoState, isCurrent, isDestination, isSource,
  showDegrees, degreeCount, inDegreeCount, outDegreeCount, directed
}) {
  const isHighlighted = isSelected || isHovered;

  // Determine colors: algorithm state takes priority
  let fillColor, shadowColor;
  let inDegree = undefined;
  let customLabel = null;
  let isArticulationPoint = false;

  if (algoState) {
    if (typeof algoState === 'object') {
      const state = algoState.state;
      fillColor = algoState.fill || (ALGO_NODE_COLORS[state] ? ALGO_NODE_COLORS[state].fill : NODE_COLOR.fill);
      shadowColor = algoState.shadow || (ALGO_NODE_COLORS[state] ? ALGO_NODE_COLORS[state].shadow : NODE_COLOR.shadow);
      inDegree = algoState.inDegree;
      customLabel = algoState.label;
      isArticulationPoint = algoState.isArticulationPoint;
    } else {
      const state = algoState;
      if (ALGO_NODE_COLORS[state]) {
        fillColor = ALGO_NODE_COLORS[state].fill;
        shadowColor = ALGO_NODE_COLORS[state].shadow;
      } else {
        fillColor = NODE_COLOR.fill;
        shadowColor = NODE_COLOR.shadow;
      }
    }
  } else if (isSelected) {
    fillColor = 'var(--color-node-selected)';
    shadowColor = '#2a6ba4';
  } else {
    fillColor = NODE_COLOR.fill;
    shadowColor = NODE_COLOR.shadow;
  }

  return (
    <g
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onContextMenu={onContextMenu}
      style={{ cursor: 'grab' }}
    >
      {/* Current node glow ring */}
      {isCurrent && (
        <circle
          cx={node.x} cy={node.y}
          r={NODE_RADIUS + 8}
          fill="none"
          stroke={fillColor}
          strokeWidth="3"
          opacity="0.6"
          style={{ animation: 'algoNodePulse 1s ease-in-out infinite' }}
        />
      )}
      
      {/* Destination node glow/pulse ring */}
      {isDestination && (
        <circle
          cx={node.x} cy={node.y}
          r={NODE_RADIUS + 8}
          fill="none"
          stroke="#3b82c4"
          strokeWidth="3.5"
          opacity="0.8"
          style={{ animation: 'pulse-ring 1.5s ease-out infinite' }}
        />
      )}

      {/* Glow / highlight ring */}
      {isHighlighted && !isCurrent && !isDestination && (
        <circle
          cx={node.x} cy={node.y}
          r={NODE_RADIUS + 6}
          fill="none"
          stroke={isSelected ? 'var(--color-node-selected)' : fillColor}
          strokeWidth="2.5"
          strokeDasharray="4 3"
          opacity="0.5"
        />
      )}

      {/* Destination indicator ring */}
      {isDestination && (
        <circle
          cx={node.x} cy={node.y}
          r={NODE_RADIUS + 6}
          fill="none"
          stroke="#3b82c4"
          strokeWidth="2.5"
          strokeDasharray="4 3"
          opacity="0.9"
        />
      )}

      {/* Selection pulse ring */}
      {isSelected && !algoState && !isDestination && (
        <circle
          cx={node.x} cy={node.y}
          r={NODE_RADIUS}
          fill="none"
          stroke="var(--color-node-selected)"
          strokeWidth="2"
          opacity="0.5"
          style={{ animation: 'pulse-ring 1.5s ease-out infinite' }}
        />
      )}
      {/* Articulation point dashed ring */}
      {isArticulationPoint && (
        <circle
          cx={node.x} cy={node.y}
          r={NODE_RADIUS + 5}
          fill="none"
          stroke="#ef4444"
          strokeWidth="2.5"
          strokeDasharray="4 3"
        />
      )}
      {/* Hard drop shadow */}
      <circle
        cx={node.x + 3} cy={node.y + 3}
        r={NODE_RADIUS}
        fill={shadowColor}
        opacity="0.4"
      />
      {/* Main node circle */}
      <circle
        cx={node.x} cy={node.y}
        r={NODE_RADIUS}
        fill={fillColor}
        stroke={isHighlighted || isDestination ? '#fff' : 'rgba(255,255,255,0.4)'}
        strokeWidth={isHighlighted || isDestination ? 3 : 2}
        style={{ transition: 'fill 0.4s ease, stroke 0.2s, stroke-width 0.2s' }}
      />
      {/* Crayon shine highlight */}
      <ellipse
        cx={node.x - 6} cy={node.y - 7}
        rx={7} ry={5}
        fill="rgba(255,255,255,0.2)"
        transform={`rotate(-20 ${node.x - 6} ${node.y - 7})`}
      />
      {/* Node label */}
      <text
        x={node.x} y={node.y + 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="18"
        fontWeight="700"
        fill="#fff"
        fontFamily="'Caveat', cursive"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {node.label}
      </text>

      {/* Source node indicator badge */}
      {isSource && (
        <g transform={`translate(${node.x - 18}, ${node.y - 32})`}>
          <rect width="36" height="15" rx="4" fill="#3b82c4" stroke="#fff" strokeWidth="1" />
          <text x="18" y="10" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" fontFamily="Inter, sans-serif">
            START
          </text>
        </g>
      )}

      {/* Destination node indicator badge */}
      {isDestination && (
        <g transform={`translate(${node.x - 16}, ${node.y - 32})`}>
          <rect width="32" height="15" rx="4" fill="#10b981" stroke="#fff" strokeWidth="1" />
          <text x="16" y="10" textAnchor="middle" fill="#fff" fontSize="9" fontWeight="bold" fontFamily="Inter, sans-serif">
            DEST
          </text>
        </g>
      )}

      {/* Articulation point star badge */}
      {isArticulationPoint && (
        <g transform={`translate(${node.x - NODE_RADIUS - 8}, ${node.y - NODE_RADIUS - 8})`}>
          <circle cx="9" cy="9" r="9" fill="#f5c542" stroke="#fff" strokeWidth="1" />
          <text x="9" y="13" textAnchor="middle" fontSize="10" style={{ pointerEvents: 'none' }}>⭐</text>
        </g>
      )}

      {/* inDegree count badge */}
      {inDegree !== undefined && (
        <g transform={`translate(${node.x + NODE_RADIUS - 10}, ${node.y - NODE_RADIUS - 6})`}>
          <circle cx="9" cy="9" r="9" fill="#3b82c4" stroke="#fff" strokeWidth="1" />
          <text x="9" y="13" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="bold" fontFamily="Inter, sans-serif" style={{ pointerEvents: 'none' }}>
            {inDegree}
          </text>
        </g>
      )}

      {/* Custom algorithm sub-label (e.g. SCC-1, Red, Blue) */}
      {customLabel && (
        <g transform={`translate(${node.x - 28}, ${node.y + NODE_RADIUS + 4})`}>
          <rect width="56" height="15" rx="4" fill="var(--color-bg-surface)" stroke="var(--color-border)" strokeWidth="1.2" opacity="0.95" />
          <text x="28" y="11" textAnchor="middle" fill="var(--color-text-primary)" fontSize="9" fontWeight="bold" fontFamily="Inter, sans-serif" style={{ pointerEvents: 'none' }}>
            {customLabel}
          </text>
        </g>
      )}

      {/* Degree indicator text */}
      {showDegrees && (
        <text
          x={node.x}
          y={node.y + ((isSource || isDestination) ? -48 : -32)}
          textAnchor="middle"
          fontSize="13"
          fontWeight="700"
          fill="var(--color-text-secondary)"
          fontFamily="'Patrick Hand', cursive"
          stroke="var(--color-bg-primary)"
          strokeWidth="3"
          paintOrder="stroke"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {directed ? `i:${inDegreeCount} , o:${outDegreeCount}` : degreeCount}
        </text>
      )}
    </g>
  );
}

export default function GraphCanvas({
  nodes, edges, directed, weighted, mode,
  onAddNode, onRemoveNode, onUpdateNodePosition, onAddEdge, onRemoveEdge,
  onBeginDrag, onCommitDrag,
  onRequestWeight, onEditEdgeWeight,
  // Algorithm visualization props
  nodeColors,   // { [nodeId]: 'unvisited' | 'queued' | 'visited' | 'visiting' }
  edgeColors,   // { [edgeId]: 'default' | 'traversed' | 'active' }
  currentNode,  // nodeId currently being processed
  algoMode,     // bool — when true, disable editing clicks
  onNodeClickAlgo, // callback for source selection
  // Shortest path extensions
  queryPathEdges,
  queryPathNodes,
  shortestPathTreeEdges,
  destinationNode,
  sourceNode,
  isAlgoSp,
  isComplete,
  onNodeClickDest,
  showDegrees,
}) {
  const svgRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [edgeStartNode, setEdgeStartNode] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [pendingEdgeMouse, setPendingEdgeMouse] = useState(null);
  const dragOffset = useRef({ dx: 0, dy: 0 });

  const getSvgPoint = useCallback((clientX, clientY) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (dragging) {
        const pt = getSvgPoint(e.clientX, e.clientY);
        onUpdateNodePosition(dragging, pt.x - dragOffset.current.dx, pt.y - dragOffset.current.dy);
      }
      if (edgeStartNode !== null) {
        const pt = getSvgPoint(e.clientX, e.clientY);
        setPendingEdgeMouse(pt);
      }
    };
    const handleMouseUp = () => {
      if (dragging) {
        setDragging(null);
        onCommitDrag?.();
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, edgeStartNode, getSvgPoint, onUpdateNodePosition, onCommitDrag]);

  const handleSvgClick = useCallback((e) => {
    if (algoMode) return; // Disable canvas clicks during algorithm
    if (e.target !== svgRef.current && e.target.tagName !== 'rect') return;
    setContextMenu(null);

    if (mode === 'addNode') {
      const pt = getSvgPoint(e.clientX, e.clientY);
      onAddNode(pt.x, pt.y);
    }

    if (mode === 'addEdge') {
      setEdgeStartNode(null);
      setPendingEdgeMouse(null);
    }

    setSelectedNode(null);
  }, [mode, getSvgPoint, onAddNode, algoMode]);

  const handleNodeClick = useCallback((e, nodeId) => {
    e.stopPropagation();
    setContextMenu(null);

    // Source selection mode for algorithms
    if (mode === 'selectSource') {
      onNodeClickAlgo?.(nodeId);
      return;
    }

    if (algoMode) {
      // If shortest path visualizer is finished, let user pick destination
      if (isComplete && isAlgoSp && onNodeClickDest) {
        onNodeClickDest(nodeId);
      }
      return;
    }

    if (mode === 'delete') {
      onRemoveNode(nodeId);
      if (selectedNode === nodeId) setSelectedNode(null);
      if (edgeStartNode === nodeId) {
        setEdgeStartNode(null);
        setPendingEdgeMouse(null);
      }
      return;
    }

    if (mode === 'addEdge') {
      if (edgeStartNode === null) {
        setEdgeStartNode(nodeId);
        setSelectedNode(nodeId);
      } else {
        if (edgeStartNode === nodeId) {
          setEdgeStartNode(null);
          setSelectedNode(null);
          setPendingEdgeMouse(null);
          return;
        }
        const fromNode = nodes.find(n => n.id === edgeStartNode);
        const toNode = nodes.find(n => n.id === nodeId);
        if (fromNode && toNode) {
          const svgRect = svgRef.current?.getBoundingClientRect();
          const midX = (fromNode.x + toNode.x) / 2 + (svgRect?.left || 0);
          const midY = (fromNode.y + toNode.y) / 2 + (svgRect?.top || 0);
          
          if (weighted) {
            onRequestWeight?.(edgeStartNode, nodeId, midX, midY);
          } else {
            onAddEdge(edgeStartNode, nodeId, 1);
          }
        }
        setEdgeStartNode(null);
        setSelectedNode(null);
        setPendingEdgeMouse(null);
      }
      return;
    }

    setSelectedNode(prev => prev === nodeId ? null : nodeId);
  }, [mode, edgeStartNode, selectedNode, onRemoveNode, nodes, onRequestWeight, onAddEdge, algoMode, onNodeClickAlgo, weighted, isComplete, isAlgoSp, onNodeClickDest]);

  const handleNodeMouseDown = useCallback((e, nodeId) => {
    if (mode === 'addEdge' || mode === 'delete' || mode === 'selectSource') return;
    if (algoMode) return;
    e.stopPropagation();
    const pt = getSvgPoint(e.clientX, e.clientY);
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      dragOffset.current = { dx: pt.x - node.x, dy: pt.y - node.y };
      onBeginDrag?.();
      setDragging(nodeId);
    }
  }, [mode, nodes, getSvgPoint, onBeginDrag, algoMode]);

  const handleEdgeClick = useCallback((e, edgeId) => {
    if (algoMode) return;
    e.stopPropagation();
    if (mode === 'delete') {
      onRemoveEdge(edgeId);
    } else if (weighted && onEditEdgeWeight) {
      const edge = edges.find(ed => ed.id === edgeId);
      if (edge) {
        const fromNode = nodes.find(n => n.id === edge.from);
        const toNode = nodes.find(n => n.id === edge.to);
        if (fromNode && toNode) {
          const svgRect = svgRef.current?.getBoundingClientRect();
          const midX = (fromNode.x + toNode.x) / 2 + (svgRect?.left || 0);
          const midY = (fromNode.y + toNode.y) / 2 + (svgRect?.top || 0);
          onEditEdgeWeight(edgeId, edge.weight ?? 1, midX, midY);
        }
      }
    }
  }, [mode, onRemoveEdge, algoMode, weighted, edges, nodes, onEditEdgeWeight]);

  const handleContextMenu = useCallback((e, type, id) => {
    if (algoMode) { e.preventDefault(); return; }
    e.preventDefault();
    e.stopPropagation();
    const pt = getSvgPoint(e.clientX, e.clientY);
    setContextMenu({ x: pt.x, y: pt.y, type, id });
  }, [getSvgPoint, algoMode]);

  const handleContextAction = useCallback((action) => {
    if (!contextMenu) return;
    if (action === 'delete') {
      if (contextMenu.type === 'node') {
        onRemoveNode(contextMenu.id);
        if (selectedNode === contextMenu.id) setSelectedNode(null);
      } else if (contextMenu.type === 'edge') {
        onRemoveEdge(contextMenu.id);
      }
    }
    setContextMenu(null);
  }, [contextMenu, selectedNode, onRemoveNode, onRemoveEdge]);

  const nodeMap = {};
  nodes.forEach(n => { nodeMap[n.id] = n; });

  const edgeStartNodeData = edgeStartNode !== null ? nodeMap[edgeStartNode] : null;

  return (
    <svg
      ref={svgRef}
      id="graph-canvas"
      className="w-full h-full"
      style={{
        background: 'var(--color-bg-primary)',
        cursor: mode === 'addNode' ? 'crosshair'
          : mode === 'delete' ? 'not-allowed'
          : mode === 'selectSource' ? 'pointer'
          : 'default',
      }}
      onClick={handleSvgClick}
      onContextMenu={(e) => e.preventDefault()}
    >
      <defs>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(61,44,30,0.15)" />
        </filter>
        <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M 28 0 L 0 0 0 28" fill="none" stroke="var(--color-grid)" strokeWidth="0.8" />
        </pattern>
        <pattern id="gridLarge" width="140" height="140" patternUnits="userSpaceOnUse">
          <rect width="140" height="140" fill="url(#grid)" />
          <path d="M 140 0 L 0 0 0 140" fill="none" stroke="var(--color-grid-strong)" strokeWidth="1.2" />
        </pattern>
      </defs>

      {/* Background */}
      <rect width="100%" height="100%" fill="var(--color-bg-primary)" />
      <rect width="100%" height="100%" fill="url(#gridLarge)" />
      <line x1="90" y1="0" x2="90" y2="100%" stroke="#e8a0a0" strokeWidth="1.5" opacity="0.6" />

      {/* Edges */}
      {edges.map(edge => (
        <EdgeLine
          key={edge.id}
          edge={edge}
          fromNode={nodeMap[edge.from]}
          toNode={nodeMap[edge.to]}
          directed={directed}
          weighted={weighted}
          isHovered={hoveredEdge === edge.id}
          onMouseEnter={() => setHoveredEdge(edge.id)}
          onMouseLeave={() => setHoveredEdge(null)}
          onClick={(e) => handleEdgeClick(e, edge.id)}
          onContextMenu={(e) => handleContextMenu(e, 'edge', edge.id)}
          algoState={edgeColors?.[edge.id] || null}
          isSpTreeEdge={shortestPathTreeEdges?.has(edge.id)}
          isQueryPathEdge={queryPathEdges?.has(edge.id)}
          isAlgoSp={isAlgoSp}
          isComplete={isComplete}
        />
      ))}

      {/* Pending edge preview line */}
      {edgeStartNodeData && pendingEdgeMouse && (
        <line
          x1={edgeStartNodeData.x}
          y1={edgeStartNodeData.y}
          x2={pendingEdgeMouse.x}
          y2={pendingEdgeMouse.y}
          stroke="var(--color-accent-tertiary)"
          strokeWidth="2.5"
          strokeDasharray="8 5"
          opacity="0.5"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Nodes */}
      {(() => {
        // Compute degrees for display if showDegrees is enabled
        const degs = {};
        const inDegs = {};
        const outDegs = {};

        nodes.forEach(n => {
          degs[n.id] = 0;
          inDegs[n.id] = 0;
          outDegs[n.id] = 0;
        });

        edges.forEach(e => {
          if (outDegs[e.from] !== undefined) outDegs[e.from]++;
          if (inDegs[e.to] !== undefined) inDegs[e.to]++;
          if (degs[e.from] !== undefined) degs[e.from]++;
          if (degs[e.to] !== undefined) degs[e.to]++;
        });

        return nodes.map(node => (
          <NodeCircle
            key={node.id}
            node={node}
            isSelected={selectedNode === node.id || edgeStartNode === node.id}
            isHovered={hoveredNode === node.id}
            onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
            onClick={(e) => handleNodeClick(e, node.id)}
            onContextMenu={(e) => handleContextMenu(e, 'node', node.id)}
            algoState={nodeColors?.[node.id] || null}
            isCurrent={currentNode === node.id}
            isDestination={destinationNode === node.id}
            isSource={sourceNode === node.id}
            showDegrees={showDegrees}
            degreeCount={degs[node.id] || 0}
            inDegreeCount={inDegs[node.id] || 0}
            outDegreeCount={outDegs[node.id] || 0}
            directed={directed}
          />
        ));
      })()}

      {/* Context Menu */}
      {contextMenu && (
        <foreignObject x={contextMenu.x} y={contextMenu.y} width="170" height="60" style={{ overflow: 'visible' }}>
          <div
            className="rounded-xl py-1"
            style={{
              background: 'var(--color-bg-surface)',
              border: '2px solid var(--color-border)',
              animation: 'tooltipFadeIn 0.15s ease-out',
              minWidth: '150px',
              boxShadow: '3px 3px 0px var(--color-border)',
              fontFamily: 'var(--font-hand)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 rounded-lg transition-colors duration-150"
              style={{ color: 'var(--color-accent-danger)', fontSize: '1rem' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-surface-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              onClick={() => handleContextAction('delete')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z" />
                <line x1="18" y1="9" x2="12" y2="15" />
                <line x1="12" y1="9" x2="18" y2="15" />
              </svg>
              Erase {contextMenu.type === 'node' ? 'Node' : 'Edge'}
            </button>
          </div>
        </foreignObject>
      )}

      {/* Empty state */}
      {nodes.length === 0 && (
        <g>
          <text
            x="50%" y="45%"
            textAnchor="middle"
            fontSize="28"
            fontWeight="600"
            fill="var(--color-text-muted)"
            fontFamily="'Caveat', cursive"
            opacity="0.8"
          >
            ✏️ Click anywhere to start drawing!
          </text>
          <text
            x="50%" y="52%"
            textAnchor="middle"
            fontSize="18"
            fill="var(--color-text-muted)"
            fontFamily="'Patrick Hand', cursive"
            opacity="0.5"
          >
            Use the crayon tools on the left or press N, E, D
          </text>
        </g>
      )}
    </svg>
  );
}
