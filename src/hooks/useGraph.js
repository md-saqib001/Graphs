import { useCallback, useReducer, useRef } from 'react';

// ── Preset graph definitions ──────────────────────────────────────────

function layoutCircle(count, cx = 500, cy = 350, r = 180) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count - Math.PI / 2;
    return { id: i + 1, x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), label: `${i + 1}` };
  });
}

export const PRESETS = {
  empty: { name: 'Empty Graph', icon: '⬜', build: () => ({ nodes: [], edges: [], directed: true, weighted: true, nextId: 1 }) },

  path: {
    name: 'Path P₅',
    icon: '➖',
    build: () => {
      const nodes = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1, x: 200 + i * 140, y: 350, label: `${i + 1}`,
      }));
      const edges = [];
      for (let i = 1; i < 5; i++) edges.push({ id: `${i}-${i + 1}`, from: i, to: i + 1, weight: 1 });
      return { nodes, edges, directed: false, weighted: false, nextId: 6 };
    },
  },

  cycle: {
    name: 'Cycle C₅',
    icon: '🔄',
    build: () => {
      const nodes = layoutCircle(5);
      const edges = [];
      for (let i = 1; i <= 5; i++) {
        const next = i === 5 ? 1 : i + 1;
        edges.push({ id: `${i}-${next}`, from: i, to: next, weight: 1 });
      }
      return { nodes, edges, directed: false, weighted: false, nextId: 6 };
    },
  },

  complete: {
    name: 'Complete K₅',
    icon: '🌐',
    build: () => {
      const nodes = layoutCircle(5);
      const edges = [];
      for (let i = 1; i <= 5; i++)
        for (let j = i + 1; j <= 5; j++)
          edges.push({ id: `${i}-${j}`, from: i, to: j, weight: 1 });
      return { nodes, edges, directed: false, weighted: false, nextId: 6 };
    },
  },

  tree: {
    name: 'Binary Tree',
    icon: '🌳',
    build: () => ({
      nodes: [
        { id: 1, x: 500, y: 180, label: '1' },
        { id: 2, x: 350, y: 300, label: '2' },
        { id: 3, x: 650, y: 300, label: '3' },
        { id: 4, x: 280, y: 420, label: '4' },
        { id: 5, x: 420, y: 420, label: '5' },
        { id: 6, x: 580, y: 420, label: '6' },
        { id: 7, x: 720, y: 420, label: '7' },
      ],
      edges: [
        { id: '1-2', from: 1, to: 2, weight: 4 },
        { id: '1-3', from: 1, to: 3, weight: 6 },
        { id: '2-4', from: 2, to: 4, weight: 2 },
        { id: '2-5', from: 2, to: 5, weight: 5 },
        { id: '3-6', from: 3, to: 6, weight: 3 },
        { id: '3-7', from: 3, to: 7, weight: 7 },
      ],
      directed: false,
      weighted: true,
      nextId: 8,
    }),
  },

  negative: {
    name: 'Negative Edges',
    icon: '➖',
    build: () => ({
      nodes: [
        { id: 1, x: 350, y: 220, label: '1' },
        { id: 2, x: 650, y: 220, label: '2' },
        { id: 3, x: 650, y: 480, label: '3' },
        { id: 4, x: 350, y: 480, label: '4' },
      ],
      edges: [
        { id: '1-2', from: 1, to: 2, weight: 5 },
        { id: '2-3', from: 2, to: 3, weight: -2 },
        { id: '3-4', from: 3, to: 4, weight: 3 },
        { id: '4-1', from: 4, to: 1, weight: -4 },
        { id: '1-3', from: 1, to: 3, weight: 8 },
        { id: '2-4', from: 2, to: 4, weight: -1 },
      ],
      directed: true,
      weighted: true,
      nextId: 5,
    }),
  },

  dijkstra_trap: {
    name: 'Dijkstra Greedy Trap',
    icon: '⚖️',
    build: () => ({
      nodes: [
        { id: 1, x: 220, y: 350, label: '1' },
        { id: 2, x: 450, y: 220, label: '2' },
        { id: 3, x: 450, y: 480, label: '3' },
        { id: 4, x: 680, y: 350, label: '4' },
        { id: 5, x: 450, y: 350, label: '5' },
      ],
      edges: [
        { id: '1-2', from: 1, to: 2, weight: 2 },
        { id: '2-4', from: 2, to: 4, weight: 5 },
        { id: '1-3', from: 1, to: 3, weight: 6 },
        { id: '3-4', from: 3, to: 4, weight: 1 },
        { id: '1-5', from: 1, to: 5, weight: 1 },
        { id: '5-3', from: 5, to: 3, weight: 2 },
      ],
      directed: true,
      weighted: true,
      nextId: 6,
    }),
  },

  bellman_cycle: {
    name: 'Bellman-Ford Cycle',
    icon: '🔄',
    build: () => ({
      nodes: [
        { id: 1, x: 180, y: 350, label: '1' },
        { id: 2, x: 400, y: 230, label: '2' },
        { id: 3, x: 620, y: 230, label: '3' },
        { id: 4, x: 620, y: 470, label: '4' },
        { id: 5, x: 400, y: 470, label: '5' },
      ],
      edges: [
        { id: '1-2', from: 1, to: 2, weight: 3 },
        { id: '2-3', from: 2, to: 3, weight: 2 },
        { id: '3-4', from: 3, to: 4, weight: -1 },
        { id: '4-5', from: 4, to: 5, weight: -2 },
        { id: '5-2', from: 5, to: 2, weight: -1 },
        { id: '4-1', from: 4, to: 1, weight: 4 },
      ],
      directed: true,
      weighted: true,
      nextId: 6,
    }),
  },

  floyd_warshall: {
    name: 'Floyd-Warshall 5-Node',
    icon: '🧮',
    build: () => ({
      nodes: [
        { id: 1, x: 280, y: 230, label: '1' },
        { id: 2, x: 520, y: 230, label: '2' },
        { id: 3, x: 280, y: 470, label: '3' },
        { id: 4, x: 520, y: 470, label: '4' },
        { id: 5, x: 720, y: 350, label: '5' },
      ],
      edges: [
        { id: '1-2', from: 1, to: 2, weight: 3 },
        { id: '2-3', from: 2, to: 3, weight: 8 },
        { id: '3-1', from: 3, to: 1, weight: -4 },
        { id: '1-4', from: 1, to: 4, weight: 2 },
        { id: '4-3', from: 4, to: 3, weight: 5 },
        { id: '2-4', from: 2, to: 4, weight: 1 },
        { id: '4-5', from: 4, to: 5, weight: 4 },
        { id: '5-2', from: 5, to: 2, weight: 2 },
      ],
      directed: true,
      weighted: true,
      nextId: 6,
    }),
  },

  mst_forest: {
    name: 'MST Spanning Forest',
    icon: '🌲',
    build: () => ({
      nodes: [
        { id: 1, x: 200, y: 250, label: '1' },
        { id: 2, x: 400, y: 250, label: '2' },
        { id: 3, x: 400, y: 450, label: '3' },
        { id: 4, x: 200, y: 450, label: '4' },
        { id: 5, x: 680, y: 250, label: '5' },
        { id: 6, x: 680, y: 450, label: '6' },
      ],
      edges: [
        { id: '1-2', from: 1, to: 2, weight: 4 },
        { id: '2-3', from: 2, to: 3, weight: 3 },
        { id: '3-4', from: 3, to: 4, weight: 2 },
        { id: '4-1', from: 4, to: 1, weight: 5 },
        { id: '1-3', from: 1, to: 3, weight: 6 },
        { id: '5-6', from: 5, to: 6, weight: 3 },
      ],
      directed: false,
      weighted: true,
      nextId: 7,
    }),
  },

  topo_dag: {
    name: 'Topological Sort DAG',
    icon: '🔢',
    build: () => ({
      nodes: [
        { id: 1, x: 180, y: 250, label: '1' },
        { id: 2, x: 180, y: 450, label: '2' },
        { id: 3, x: 430, y: 250, label: '3' },
        { id: 4, x: 430, y: 450, label: '4' },
        { id: 5, x: 680, y: 250, label: '5' },
        { id: 6, x: 680, y: 450, label: '6' },
      ],
      edges: [
        { id: '1-3', from: 1, to: 3, weight: 1 },
        { id: '1-4', from: 1, to: 4, weight: 1 },
        { id: '2-4', from: 2, to: 4, weight: 1 },
        { id: '3-5', from: 3, to: 5, weight: 1 },
        { id: '4-5', from: 4, to: 5, weight: 1 },
        { id: '4-6', from: 4, to: 6, weight: 1 },
        { id: '5-6', from: 5, to: 6, weight: 1 },
      ],
      directed: true,
      weighted: false,
      nextId: 7,
    }),
  },

  kosaraju_scc: {
    name: 'Kosaraju SCC Graph',
    icon: '🎨',
    build: () => ({
      nodes: [
        { id: 1, x: 200, y: 250, label: '1' },
        { id: 2, x: 400, y: 250, label: '2' },
        { id: 3, x: 300, y: 420, label: '3' },
        { id: 4, x: 600, y: 250, label: '4' },
        { id: 5, x: 780, y: 250, label: '5' },
        { id: 6, x: 690, y: 420, label: '6' },
      ],
      edges: [
        { id: '1-2', from: 1, to: 2, weight: 1 },
        { id: '2-3', from: 2, to: 3, weight: 1 },
        { id: '3-1', from: 3, to: 1, weight: 1 },
        { id: '2-4', from: 2, to: 4, weight: 1 },
        { id: '4-5', from: 4, to: 5, weight: 1 },
        { id: '5-6', from: 5, to: 6, weight: 1 },
        { id: '6-4', from: 6, to: 4, weight: 1 },
      ],
      directed: true,
      weighted: false,
      nextId: 7,
    }),
  },

  bipartite_grid: {
    name: 'Bipartite Grid',
    icon: '🔴',
    build: () => ({
      nodes: [
        { id: 1, x: 220, y: 250, label: '1' },
        { id: 2, x: 450, y: 250, label: '2' },
        { id: 3, x: 680, y: 250, label: '3' },
        { id: 4, x: 220, y: 450, label: '4' },
        { id: 5, x: 450, y: 450, label: '5' },
        { id: 6, x: 680, y: 450, label: '6' },
      ],
      edges: [
        { id: '1-2', from: 1, to: 2, weight: 1 },
        { id: '2-3', from: 2, to: 3, weight: 1 },
        { id: '4-5', from: 4, to: 5, weight: 1 },
        { id: '5-6', from: 5, to: 6, weight: 1 },
        { id: '1-4', from: 1, to: 4, weight: 1 },
        { id: '2-5', from: 2, to: 5, weight: 1 },
        { id: '3-6', from: 3, to: 6, weight: 1 },
      ],
      directed: false,
      weighted: false,
      nextId: 7,
    }),
  },

  non_bipartite: {
    name: 'Non-Bipartite Cycle',
    icon: '🔵',
    build: () => ({
      nodes: [
        { id: 1, x: 450, y: 200, label: '1' },
        { id: 2, x: 650, y: 320, label: '2' },
        { id: 3, x: 570, y: 520, label: '3' },
        { id: 4, x: 330, y: 520, label: '4' },
        { id: 5, x: 250, y: 320, label: '5' },
      ],
      edges: [
        { id: '1-2', from: 1, to: 2, weight: 1 },
        { id: '2-3', from: 2, to: 3, weight: 1 },
        { id: '3-4', from: 3, to: 4, weight: 1 },
        { id: '4-5', from: 4, to: 5, weight: 1 },
        { id: '5-1', from: 5, to: 1, weight: 1 },
      ],
      directed: false,
      weighted: false,
      nextId: 6,
    }),
  },

  tarjan_dumbbell: {
    name: 'Tarjan Dumbbell',
    icon: '🌉',
    build: () => ({
      nodes: [
        { id: 1, x: 250, y: 250, label: '1' },
        { id: 2, x: 150, y: 420, label: '2' },
        { id: 3, x: 350, y: 420, label: '3' },
        { id: 4, x: 650, y: 250, label: '4' },
        { id: 5, x: 550, y: 420, label: '5' },
        { id: 6, x: 750, y: 420, label: '6' },
      ],
      edges: [
        { id: '1-2', from: 1, to: 2, weight: 1 },
        { id: '2-3', from: 2, to: 3, weight: 1 },
        { id: '3-1', from: 3, to: 1, weight: 1 },
        { id: '3-5', from: 3, to: 5, weight: 1 },
        { id: '4-5', from: 4, to: 5, weight: 1 },
        { id: '5-6', from: 5, to: 6, weight: 1 },
        { id: '6-4', from: 6, to: 4, weight: 1 },
      ],
      directed: false,
      weighted: false,
      nextId: 7,
    }),
  },
};

// ── State shape & cloning ─────────────────────────────────────────────

function cloneState(s) {
  return {
    nodes: s.nodes.map(n => ({ ...n })),
    edges: s.edges.map(e => ({ ...e })),
    directed: s.directed,
    weighted: s.weighted,
    nextId: s.nextId,
  };
}

const INITIAL_STATE = { nodes: [], edges: [], directed: true, weighted: true, nextId: 1 };
const MAX_HISTORY = 50;

// ── Reducer ───────────────────────────────────────────────────────────

function graphReducer(state, action) {
  const { present, past, future } = state;

  // Helper: push present to past, set new present, clear future
  function commit(newPresent) {
    return {
      past: [...past.slice(-MAX_HISTORY), cloneState(present)],
      present: newPresent,
      future: [],
    };
  }

  // Helper: update present WITHOUT pushing to history (e.g. drag)
  function silent(newPresent) {
    return { past, present: newPresent, future };
  }

  switch (action.type) {
    case 'ADD_NODE': {
      const id = present.nextId;
      const newNode = { id, x: action.x, y: action.y, label: `${id}` };
      return commit({
        ...present,
        nodes: [...present.nodes, newNode],
        nextId: id + 1,
      });
    }

    case 'REMOVE_NODE': {
      return commit({
        ...present,
        nodes: present.nodes.filter(n => n.id !== action.nodeId),
        edges: present.edges.filter(e => e.from !== action.nodeId && e.to !== action.nodeId),
      });
    }

    case 'UPDATE_NODE_POSITION': {
      // Silent — no history push during drag
      return silent({
        ...present,
        nodes: present.nodes.map(n =>
          n.id === action.nodeId ? { ...n, x: action.x, y: action.y } : n
        ),
      });
    }

    case 'COMMIT_NODE_POSITION': {
      // Called on mouseUp — snapshot the state before drag started
      // action.snapshot is the pre-drag state
      return {
        past: [...past.slice(-MAX_HISTORY), action.snapshot],
        present,
        future: [],
      };
    }

    case 'ADD_EDGE': {
      const { fromId, toId, weight } = action;
      if (fromId === toId) return state;
      const exists = present.edges.some(e => e.from === fromId && e.to === toId);
      if (exists) return state;
      if (!present.directed) {
        const reverseExists = present.edges.some(e => e.from === toId && e.to === fromId);
        if (reverseExists) return state;
      }
      return commit({
        ...present,
        edges: [...present.edges, { id: `${fromId}-${toId}`, from: fromId, to: toId, weight: weight ?? 1 }],
      });
    }

    case 'REMOVE_EDGE': {
      return commit({
        ...present,
        edges: present.edges.filter(e => e.id !== action.edgeId),
      });
    }

    case 'TOGGLE_DIRECTED': {
      return commit({
        ...present,
        directed: !present.directed,
      });
    }

    case 'TOGGLE_WEIGHTED': {
      return commit({
        ...present,
        weighted: !present.weighted,
      });
    }

    case 'UPDATE_EDGE_WEIGHT': {
      const { edgeId, weight } = action;
      return commit({
        ...present,
        edges: present.edges.map(e => e.id === edgeId ? { ...e, weight } : e),
      });
    }

    case 'CLEAR_ALL': {
      return commit({ nodes: [], edges: [], directed: present.directed, weighted: present.weighted, nextId: 1 });
    }

    case 'LOAD_GRAPH': {
      return commit({
        nodes: action.data.nodes || [],
        edges: action.data.edges || [],
        directed: action.data.directed ?? true,
        weighted: action.data.weighted ?? true,
        nextId: action.data.nextId ?? (Math.max(0, ...(action.data.nodes || []).map(n => n.id)) + 1),
      });
    }

    case 'LOAD_PRESET': {
      const preset = PRESETS[action.presetKey];
      if (!preset) return state;
      const data = preset.build();
      return commit({
        nodes: data.nodes,
        edges: data.edges,
        directed: data.directed,
        weighted: data.weighted ?? true,
        nextId: data.nextId,
      });
    }

    case 'UNDO': {
      if (past.length === 0) return state;
      const previous = past[past.length - 1];
      return {
        past: past.slice(0, -1),
        present: previous,
        future: [cloneState(present), ...future],
      };
    }

    case 'REDO': {
      if (future.length === 0) return state;
      const next = future[0];
      return {
        past: [...past, cloneState(present)],
        present: next,
        future: future.slice(1),
      };
    }

    default:
      return state;
  }
}

// ── Hook ──────────────────────────────────────────────────────────────

export function useGraph() {
  const [state, dispatch] = useReducer(graphReducer, {
    past: [],
    present: cloneState(INITIAL_STATE),
    future: [],
  });

  const { present, past, future } = state;

  // Ref to capture pre-drag snapshot
  const preDragSnapshot = useRef(null);

  const addNode = useCallback((x, y) => dispatch({ type: 'ADD_NODE', x, y }), []);

  const removeNode = useCallback((nodeId) => dispatch({ type: 'REMOVE_NODE', nodeId }), []);

  const updateNodePosition = useCallback((nodeId, x, y) => {
    dispatch({ type: 'UPDATE_NODE_POSITION', nodeId, x, y });
  }, []);

  // Call before starting a drag to capture the snapshot
  const beginDrag = useCallback(() => {
    preDragSnapshot.current = cloneState(present);
  }, [present]);

  // Call on mouseUp to commit the drag to history
  const commitDrag = useCallback(() => {
    if (preDragSnapshot.current) {
      dispatch({ type: 'COMMIT_NODE_POSITION', snapshot: preDragSnapshot.current });
      preDragSnapshot.current = null;
    }
  }, []);

  const addEdge = useCallback((fromId, toId, weight = 1) => {
    dispatch({ type: 'ADD_EDGE', fromId, toId, weight });
  }, []);

  const removeEdge = useCallback((edgeId) => dispatch({ type: 'REMOVE_EDGE', edgeId }), []);

  const clearAll = useCallback(() => dispatch({ type: 'CLEAR_ALL' }), []);

  const toggleDirected = useCallback(() => dispatch({ type: 'TOGGLE_DIRECTED' }), []);
  const toggleWeighted = useCallback(() => dispatch({ type: 'TOGGLE_WEIGHTED' }), []);
  const updateEdgeWeight = useCallback((edgeId, weight) => dispatch({ type: 'UPDATE_EDGE_WEIGHT', edgeId, weight }), []);

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);

  const loadPreset = useCallback((presetKey) => dispatch({ type: 'LOAD_PRESET', presetKey }), []);

  const loadGraph = useCallback((data) => dispatch({ type: 'LOAD_GRAPH', data }), []);

  const getGraphJSON = useCallback(() => {
    return JSON.stringify({
      nodes: present.nodes,
      edges: present.edges,
      directed: present.directed,
      weighted: present.weighted,
      nextId: present.nextId,
    }, null, 2);
  }, [present]);

  return {
    nodes: present.nodes,
    edges: present.edges,
    directed: present.directed,
    weighted: present.weighted ?? true,
    addNode,
    removeNode,
    updateNodePosition,
    beginDrag,
    commitDrag,
    addEdge,
    removeEdge,
    clearAll,
    toggleDirected,
    toggleWeighted,
    updateEdgeWeight,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    loadPreset,
    loadGraph,
    getGraphJSON,
  };
}
