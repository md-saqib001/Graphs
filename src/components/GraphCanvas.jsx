import { useRef, useState, useCallback, useEffect } from 'react';

const NODE_RADIUS = 24;
const ARROW_SIZE = 11;

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

function getCrayonColor() {
  return NODE_COLOR;
}

function EdgeLine({ edge, fromNode, toNode, directed, isHovered, onMouseEnter, onMouseLeave, onClick, onContextMenu }) {
  if (!fromNode || !toNode) return null;
  const path = getEdgePath(fromNode, toNode, directed);
  if (!path) return null;

  const { x1, y1, x2, y2, ux, uy } = path;
  const midX = (fromNode.x + toNode.x) / 2;
  const midY = (fromNode.y + toNode.y) / 2;
  const weight = edge.weight ?? 1;
  const isNegative = weight < 0;

  // Offset the weight label perpendicular to the edge for readability
  const perpX = -uy * 16;
  const perpY = ux * 16;

  return (
    <g
      className="edge-group"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onContextMenu={onContextMenu}
      style={{ cursor: 'pointer' }}
    >
      {/* Invisible wider line for easier interaction */}
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke="transparent"
        strokeWidth="16"
      />
      {/* Visible edge — pencil-drawn look */}
      <line
        x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={isHovered ? 'var(--color-accent-primary)' : '#6b5744'}
        strokeWidth={isHovered ? 3.5 : 2.5}
        strokeLinecap="round"
        opacity={isHovered ? 1 : 0.7}
        style={{ transition: 'stroke 0.2s, stroke-width 0.2s, opacity 0.2s' }}
      />
      {/* Arrowhead for directed graphs */}
      {directed && (
        <polygon
          points={`
            ${toNode.x - ux * NODE_RADIUS},${toNode.y - uy * NODE_RADIUS}
            ${toNode.x - ux * (NODE_RADIUS + ARROW_SIZE) - uy * (ARROW_SIZE / 2)},${toNode.y - uy * (NODE_RADIUS + ARROW_SIZE) + ux * (ARROW_SIZE / 2)}
            ${toNode.x - ux * (NODE_RADIUS + ARROW_SIZE) + uy * (ARROW_SIZE / 2)},${toNode.y - uy * (NODE_RADIUS + ARROW_SIZE) - ux * (ARROW_SIZE / 2)}
          `}
          fill={isHovered ? 'var(--color-accent-primary)' : '#6b5744'}
          opacity={isHovered ? 1 : 0.7}
          style={{ transition: 'fill 0.2s, opacity 0.2s' }}
        />
      )}
      {/* Weight label — always visible */}
      <g>
        <rect
          x={midX + perpX - 16}
          y={midY + perpY - 12}
          width="32"
          height="22"
          rx="6"
          fill="var(--color-bg-surface)"
          stroke={isHovered ? 'var(--color-accent-primary)' : 'var(--color-border)'}
          strokeWidth="1.5"
          opacity="0.95"
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
      {/* Hover tooltip — from → to */}
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
            {edge.from} → {edge.to} (w={weight})
          </text>
        </g>
      )}
    </g>
  );
}

function NodeCircle({ node, isSelected, isHovered, onMouseDown, onMouseEnter, onMouseLeave, onClick, onContextMenu }) {
  const isHighlighted = isSelected || isHovered;
  const crayon = getCrayonColor();

  return (
    <g
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      onContextMenu={onContextMenu}
      style={{ cursor: 'grab', animation: 'nodeEnter 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
    >
      {/* Glow / highlight ring */}
      {isHighlighted && (
        <circle
          cx={node.x} cy={node.y}
          r={NODE_RADIUS + 6}
          fill="none"
          stroke={isSelected ? 'var(--color-node-selected)' : crayon.fill}
          strokeWidth="2.5"
          strokeDasharray="4 3"
          opacity="0.5"
        />
      )}
      {/* Selection pulse ring */}
      {isSelected && (
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
      {/* Hard drop shadow */}
      <circle
        cx={node.x + 3} cy={node.y + 3}
        r={NODE_RADIUS}
        fill={crayon.shadow}
        opacity="0.4"
      />
      {/* Main node circle */}
      <circle
        cx={node.x} cy={node.y}
        r={NODE_RADIUS}
        fill={isSelected ? 'var(--color-node-selected)' : crayon.fill}
        stroke={isHighlighted ? '#fff' : 'rgba(255,255,255,0.4)'}
        strokeWidth={isHighlighted ? 3 : 2}
        style={{ transition: 'fill 0.2s, stroke 0.2s, stroke-width 0.2s' }}
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
    </g>
  );
}

export default function GraphCanvas({
  nodes, edges, directed, mode,
  onAddNode, onRemoveNode, onUpdateNodePosition, onAddEdge, onRemoveEdge,
  onBeginDrag, onCommitDrag,
  onRequestWeight,
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

  // Close context menu on click elsewhere
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Mouse move for dragging & pending edge preview
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
  }, [mode, getSvgPoint, onAddNode]);

  const handleNodeClick = useCallback((e, nodeId) => {
    e.stopPropagation();
    setContextMenu(null);

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
          // Self-loop — cancel
          setEdgeStartNode(null);
          setSelectedNode(null);
          setPendingEdgeMouse(null);
          return;
        }
        // Request weight via popup before committing
        const fromNode = nodes.find(n => n.id === edgeStartNode);
        const toNode = nodes.find(n => n.id === nodeId);
        if (fromNode && toNode) {
          const svgRect = svgRef.current?.getBoundingClientRect();
          const midX = (fromNode.x + toNode.x) / 2 + (svgRect?.left || 0);
          const midY = (fromNode.y + toNode.y) / 2 + (svgRect?.top || 0);
          onRequestWeight?.(edgeStartNode, nodeId, midX, midY);
        }
        setEdgeStartNode(null);
        setSelectedNode(null);
        setPendingEdgeMouse(null);
      }
      return;
    }

    setSelectedNode(prev => prev === nodeId ? null : nodeId);
  }, [mode, edgeStartNode, selectedNode, onRemoveNode, nodes, onRequestWeight]);

  const handleNodeMouseDown = useCallback((e, nodeId) => {
    if (mode === 'addEdge' || mode === 'delete') return;
    e.stopPropagation();
    const pt = getSvgPoint(e.clientX, e.clientY);
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      dragOffset.current = { dx: pt.x - node.x, dy: pt.y - node.y };
      onBeginDrag?.();
      setDragging(nodeId);
    }
  }, [mode, nodes, getSvgPoint, onBeginDrag]);

  const handleEdgeClick = useCallback((e, edgeId) => {
    e.stopPropagation();
    if (mode === 'delete') {
      onRemoveEdge(edgeId);
    }
  }, [mode, onRemoveEdge]);

  const handleContextMenu = useCallback((e, type, id) => {
    e.preventDefault();
    e.stopPropagation();
    const pt = getSvgPoint(e.clientX, e.clientY);
    setContextMenu({ x: pt.x, y: pt.y, type, id });
  }, [getSvgPoint]);

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
        cursor: mode === 'addNode' ? 'crosshair' : mode === 'delete' ? 'not-allowed' : 'default',
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
          isHovered={hoveredEdge === edge.id}
          onMouseEnter={() => setHoveredEdge(edge.id)}
          onMouseLeave={() => setHoveredEdge(null)}
          onClick={(e) => handleEdgeClick(e, edge.id)}
          onContextMenu={(e) => handleContextMenu(e, 'edge', edge.id)}
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
      {nodes.map(node => (
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
        />
      ))}

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
