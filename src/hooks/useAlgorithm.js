import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ── Speed presets (ms per step) ───────────────────────────────────────
const SPEEDS = { slow: 1200, medium: 600, fast: 200 };

// ── Build adjacency list with weights ─────────────────────────────────
function buildAdjListWithWeights(nodes, edges, directed) {
  const adj = {};
  nodes.forEach(n => { adj[n.id] = []; });
  edges.forEach(e => {
    adj[e.from]?.push({ to: e.to, edgeId: e.id, weight: e.weight ?? 1 });
    if (!directed) {
      adj[e.to]?.push({ to: e.from, edgeId: e.id, weight: e.weight ?? 1 });
    }
  });
  // Sort neighbors by ID for deterministic traversal
  Object.values(adj).forEach(arr => arr.sort((a, b) => a.to - b.to));
  return adj;
}

// ── BFS step generator ───────────────────────────────────────────────
function generateBFSSteps(sourceId, nodes, edges, directed) {
  const steps = [];
  const adjList = buildAdjListWithWeights(nodes, edges, directed);
  const nodeStates = {};
  const edgeStates = {};
  nodes.forEach(n => { nodeStates[n.id] = 'unvisited'; });
  edges.forEach(e => { edgeStates[e.id] = 'default'; });

  const queue = [sourceId];
  nodeStates[sourceId] = 'queued';
  const traversalOrder = [];

  // Initial step — source enqueued
  steps.push({
    nodeStates: { ...nodeStates },
    edgeStates: { ...edgeStates },
    frontier: [...queue],
    currentNode: null,
    traversalOrder: [...traversalOrder],
    description: `Start BFS from node ${sourceId}. Enqueue source.`,
    activeLine: 1,
  });

  while (queue.length > 0) {
    const current = queue.shift();
    nodeStates[current] = 'visiting';

    steps.push({
      nodeStates: { ...nodeStates },
      edgeStates: { ...edgeStates },
      frontier: [...queue],
      currentNode: current,
      traversalOrder: [...traversalOrder],
      description: `Dequeue node ${current}. Processing…`,
      activeLine: 3,
    });

    const neighbors = adjList[current] || [];
    const enqueuedNeighbors = [];

    for (const { to, edgeId } of neighbors) {
      if (nodeStates[to] === 'unvisited') {
        nodeStates[to] = 'queued';
        edgeStates[edgeId] = 'traversed';
        queue.push(to);
        enqueuedNeighbors.push(to);
      }
    }

    nodeStates[current] = 'visited';
    traversalOrder.push(current);

    const desc = enqueuedNeighbors.length > 0
      ? `Visited node ${current}. Enqueued: [${enqueuedNeighbors.join(', ')}]`
      : `Visited node ${current}. No new neighbors.`;

    steps.push({
      nodeStates: { ...nodeStates },
      edgeStates: { ...edgeStates },
      frontier: [...queue],
      currentNode: current,
      traversalOrder: [...traversalOrder],
      description: desc,
      activeLine: 6,
    });
  }

  // Final step
  steps.push({
    nodeStates: { ...nodeStates },
    edgeStates: { ...edgeStates },
    frontier: [],
    currentNode: null,
    traversalOrder: [...traversalOrder],
    description: `BFS complete! Traversal order: [${traversalOrder.join(' → ')}]`,
    activeLine: 2,
  });

  return steps;
}

// ── DFS step generator (iterative with explicit stack) ────────────────
function generateDFSSteps(sourceId, nodes, edges, directed) {
  const steps = [];
  const adjList = buildAdjListWithWeights(nodes, edges, directed);
  const nodeStates = {};
  const edgeStates = {};
  nodes.forEach(n => { nodeStates[n.id] = 'unvisited'; });
  edges.forEach(e => { edgeStates[e.id] = 'default'; });

  const stack = [sourceId];
  nodeStates[sourceId] = 'queued';
  const traversalOrder = [];

  steps.push({
    nodeStates: { ...nodeStates },
    edgeStates: { ...edgeStates },
    frontier: [...stack],
    currentNode: null,
    traversalOrder: [...traversalOrder],
    description: `Start DFS from node ${sourceId}. Push source onto stack.`,
    activeLine: 1,
  });

  while (stack.length > 0) {
    const current = stack.pop();

    // Skip if already visited
    if (nodeStates[current] === 'visited') continue;

    nodeStates[current] = 'visiting';

    steps.push({
      nodeStates: { ...nodeStates },
      edgeStates: { ...edgeStates },
      frontier: [...stack],
      currentNode: current,
      traversalOrder: [...traversalOrder],
      description: `Pop node ${current} from stack. Processing…`,
      activeLine: 3,
    });

    const neighbors = adjList[current] || [];
    const pushedNeighbors = [];

    // Reverse to process in natural order
    for (let i = neighbors.length - 1; i >= 0; i--) {
      const { to, edgeId } = neighbors[i];
      if (nodeStates[to] === 'unvisited') {
        nodeStates[to] = 'queued';
        edgeStates[edgeId] = 'traversed';
        stack.push(to);
        pushedNeighbors.push(to);
      }
    }

    nodeStates[current] = 'visited';
    traversalOrder.push(current);

    const desc = pushedNeighbors.length > 0
      ? `Visited node ${current}. Pushed: [${pushedNeighbors.reverse().join(', ')}]`
      : `Visited node ${current}. No new neighbors.`;

    steps.push({
      nodeStates: { ...nodeStates },
      edgeStates: { ...edgeStates },
      frontier: [...stack],
      currentNode: current,
      traversalOrder: [...traversalOrder],
      description: desc,
      activeLine: 6,
    });
  }

  steps.push({
    nodeStates: { ...nodeStates },
    edgeStates: { ...edgeStates },
    frontier: [],
    currentNode: null,
    traversalOrder: [...traversalOrder],
    description: `DFS complete! Traversal order: [${traversalOrder.join(' → ')}]`,
    activeLine: 2,
  });

  return steps;
}

// ── Dijkstra step generator ──────────────────────────────────────────
function generateDijkstraSteps(sourceId, nodes, edges, directed) {
  const steps = [];
  const adjList = buildAdjListWithWeights(nodes, edges, directed);
  
  const nodeStates = {};
  const edgeStates = {};
  const distances = {};
  const parentMap = {};
  
  nodes.forEach(n => {
    nodeStates[n.id] = 'unvisited';
    distances[n.id] = Infinity;
    parentMap[n.id] = null;
  });
  edges.forEach(e => { edgeStates[e.id] = 'default'; });
  
  distances[sourceId] = 0;
  nodeStates[sourceId] = 'queued';
  
  let pq = [{ id: sourceId, dist: 0 }];

  steps.push({
    nodeStates: { ...nodeStates },
    edgeStates: { ...edgeStates },
    distances: { ...distances },
    parentMap: { ...parentMap },
    frontier: [...pq],
    currentNode: null,
    traversalOrder: [],
    description: `Initialize Dijkstra's from source ${sourceId}. Set source distance to 0, all others to ∞.`,
    activeLine: 1,
  });

  const traversalOrder = [];
  
  while (pq.length > 0) {
    pq.sort((a, b) => a.dist - b.dist);
    const { id: u, dist: d } = pq.shift();
    
    if (d > distances[u]) continue;
    
    nodeStates[u] = 'visiting';
    traversalOrder.push(u);
    
    steps.push({
      nodeStates: { ...nodeStates },
      edgeStates: { ...edgeStates },
      distances: { ...distances },
      parentMap: { ...parentMap },
      frontier: [...pq],
      currentNode: u,
      traversalOrder: [...traversalOrder],
      description: `Extract node ${u} with min distance ${d} from the Priority Queue.`,
      activeLine: 4,
    });

    const neighbors = adjList[u] || [];
    
    for (const { to: v, weight, edgeId } of neighbors) {
      if (nodeStates[v] === 'visited') continue;
      
      const newDist = distances[u] + weight;
      const oldDist = distances[v];
      
      nodeStates[v] = 'queued';
      const prevEdgeState = edgeStates[edgeId];
      edgeStates[edgeId] = 'active'; // yellow checking
      
      steps.push({
        nodeStates: { ...nodeStates },
        edgeStates: { ...edgeStates },
        distances: { ...distances },
        parentMap: { ...parentMap },
        frontier: [...pq],
        currentNode: u,
        traversalOrder: [...traversalOrder],
        description: `Check edge ${u} → ${v} (weight = ${weight}). New path distance = ${distances[u]} + ${weight} = ${newDist}.`,
        activeLine: 6,
      });
      
      if (newDist < oldDist) {
        distances[v] = newDist;
        parentMap[v] = u;
        pq.push({ id: v, dist: newDist });
        edgeStates[edgeId] = 'traversed'; // green relaxed
        
        steps.push({
          nodeStates: { ...nodeStates },
          edgeStates: { ...edgeStates },
          distances: { ...distances },
          parentMap: { ...parentMap },
          frontier: [...pq],
          currentNode: u,
          traversalOrder: [...traversalOrder],
          description: `Relaxed edge ${u} → ${v}: ${newDist} < ${oldDist === Infinity ? '∞' : oldDist}. Update dist[${v}] = ${newDist}, parent[${v}] = ${u}.`,
          activeLine: 7,
        });
      } else {
        edgeStates[edgeId] = prevEdgeState;
        steps.push({
          nodeStates: { ...nodeStates },
          edgeStates: { ...edgeStates },
          distances: { ...distances },
          parentMap: { ...parentMap },
          frontier: [...pq],
          currentNode: u,
          traversalOrder: [...traversalOrder],
          description: `No update for edge ${u} → ${v}: path distance ${newDist} >= current dist[${v}] (${oldDist}).`,
          activeLine: 6,
        });
      }
    }
    
    nodeStates[u] = 'visited';
    steps.push({
      nodeStates: { ...nodeStates },
      edgeStates: { ...edgeStates },
      distances: { ...distances },
      parentMap: { ...parentMap },
      frontier: [...pq],
      currentNode: u,
      traversalOrder: [...traversalOrder],
      description: `Finished processing node ${u}. Shortest distance to ${u} is finalized at ${distances[u]}.`,
      activeLine: 5,
    });
  }

  steps.push({
    nodeStates: { ...nodeStates },
    edgeStates: { ...edgeStates },
    distances: { ...distances },
    parentMap: { ...parentMap },
    frontier: [],
    currentNode: null,
    traversalOrder: [...traversalOrder],
    description: `Dijkstra's complete! Click any node to highlight its shortest path from source ${sourceId}.`,
    activeLine: 3,
  });

  return steps;
}

// ── BFS Shortest Path step generator ─────────────────────────────────
function generateBFSSpSteps(sourceId, nodes, edges, directed) {
  const steps = [];
  const adjList = buildAdjListWithWeights(nodes, edges, directed);
  
  const nodeStates = {};
  const edgeStates = {};
  const distances = {};
  const parentMap = {};
  
  nodes.forEach(n => {
    nodeStates[n.id] = 'unvisited';
    distances[n.id] = Infinity;
    parentMap[n.id] = null;
  });
  edges.forEach(e => { edgeStates[e.id] = 'default'; });
  
  distances[sourceId] = 0;
  nodeStates[sourceId] = 'queued';
  
  let queue = [sourceId];

  steps.push({
    nodeStates: { ...nodeStates },
    edgeStates: { ...edgeStates },
    distances: { ...distances },
    parentMap: { ...parentMap },
    frontier: [...queue],
    currentNode: null,
    traversalOrder: [],
    description: `Initialize BFS Shortest Path from source ${sourceId}. Set source distance to 0, all others to ∞.`,
    activeLine: 1,
  });

  const traversalOrder = [];
  
  while (queue.length > 0) {
    const u = queue.shift();
    nodeStates[u] = 'visiting';
    traversalOrder.push(u);
    
    steps.push({
      nodeStates: { ...nodeStates },
      edgeStates: { ...edgeStates },
      distances: { ...distances },
      parentMap: { ...parentMap },
      frontier: [...queue],
      currentNode: u,
      traversalOrder: [...traversalOrder],
      description: `Dequeue node ${u} from the front of the Queue.`,
      activeLine: 3,
    });

    const neighbors = adjList[u] || [];
    
    for (const { to: v, edgeId } of neighbors) {
      if (nodeStates[v] === 'unvisited') {
        nodeStates[v] = 'queued';
        distances[v] = distances[u] + 1;
        parentMap[v] = u;
        queue.push(v);
        edgeStates[edgeId] = 'traversed';
        
        steps.push({
          nodeStates: { ...nodeStates },
          edgeStates: { ...edgeStates },
          distances: { ...distances },
          parentMap: { ...parentMap },
          frontier: [...queue],
          currentNode: u,
          traversalOrder: [...traversalOrder],
          description: `Discovered unvisited node ${v} from ${u}. Update dist[${v}] = ${distances[v]} hops, parent[${v}] = ${u}. Enqueue.`,
          activeLine: 6,
        });
      }
    }
    
    nodeStates[u] = 'visited';
    steps.push({
      nodeStates: { ...nodeStates },
      edgeStates: { ...edgeStates },
      distances: { ...distances },
      parentMap: { ...parentMap },
      frontier: [...queue],
      currentNode: u,
      traversalOrder: [...traversalOrder],
      description: `Finished processing node ${u}. Shortest path is finalized at ${distances[u]} hops.`,
      activeLine: 5,
    });
  }

  steps.push({
    nodeStates: { ...nodeStates },
    edgeStates: { ...edgeStates },
    distances: { ...distances },
    parentMap: { ...parentMap },
    frontier: [],
    currentNode: null,
    traversalOrder: [...traversalOrder],
    description: `BFS Shortest Path complete! Click any node to highlight its path from source ${sourceId}.`,
    activeLine: 2,
  });

  return steps;
}

// ── Bellman-Ford step generator ──────────────────────────────────────
function generateBellmanFordSteps(sourceId, nodes, edges, directed) {
  const steps = [];
  const V = nodes.length;
  
  const nodeStates = {};
  const edgeStates = {};
  const distances = {};
  const parentMap = {};
  
  nodes.forEach(n => {
    nodeStates[n.id] = 'unvisited';
    distances[n.id] = Infinity;
    parentMap[n.id] = null;
  });
  edges.forEach(e => { edgeStates[e.id] = 'default'; });
  
  distances[sourceId] = 0;
  nodeStates[sourceId] = 'queued';

  steps.push({
    nodeStates: { ...nodeStates },
    edgeStates: { ...edgeStates },
    distances: { ...distances },
    parentMap: { ...parentMap },
    currentNode: null,
    traversalOrder: [],
    description: `Initialize Bellman-Ford from source ${sourceId}. Set dist[${sourceId}] = 0, all others to ∞.`,
    round: 0,
    edgeChecked: null,
    negativeCycle: null,
    activeLine: 1,
  });

  let relaxedAny = false;
  
  for (let r = 1; r <= V - 1; r++) {
    relaxedAny = false;
    for (let i = 0; i < edges.length; i++) {
      const edge = edges[i];
      const u = edge.from;
      const v = edge.to;
      const w = edge.weight ?? 1;

      const passes = [];
      passes.push({ from: u, to: v, weight: w, edgeId: edge.id });
      if (!directed) {
        passes.push({ from: v, to: u, weight: w, edgeId: edge.id });
      }

      for (const pass of passes) {
        const fromNode = pass.from;
        const toNode = pass.to;
        const weight = pass.weight;
        const edgeId = pass.edgeId;

        const stepNodeStates = { ...nodeStates };
        const stepEdgeStates = { ...edgeStates };
        
        stepNodeStates[fromNode] = 'visiting';
        stepNodeStates[toNode] = 'queued';
        stepEdgeStates[edgeId] = 'active'; // yellow highlight

        steps.push({
          nodeStates: stepNodeStates,
          edgeStates: stepEdgeStates,
          distances: { ...distances },
          parentMap: { ...parentMap },
          currentNode: fromNode,
          traversalOrder: [],
          description: `Round ${r}/${V-1}: Checking edge ${fromNode} → ${toNode} (weight = ${weight}).`,
          round: r,
          edgeChecked: edgeId,
          negativeCycle: null,
          activeLine: 4,
        });

        if (distances[fromNode] !== Infinity && distances[fromNode] + weight < distances[toNode]) {
          const oldDist = distances[toNode];
          distances[toNode] = distances[fromNode] + weight;
          parentMap[toNode] = fromNode;
          relaxedAny = true;

          nodeStates[toNode] = 'visited';
          edgeStates[edgeId] = 'traversed'; // green relaxed

          const nextNodeStates = { ...nodeStates };
          const nextEdgeStates = { ...edgeStates };
          nextNodeStates[fromNode] = 'visiting';
          nextNodeStates[toNode] = 'visited';
          nextEdgeStates[edgeId] = 'traversed';

          steps.push({
            nodeStates: nextNodeStates,
            edgeStates: nextEdgeStates,
            distances: { ...distances },
            parentMap: { ...parentMap },
            currentNode: fromNode,
            traversalOrder: [],
            description: `Round ${r}/${V-1}: Relaxed edge ${fromNode} → ${toNode}: ${distances[fromNode]} + ${weight} = ${distances[toNode]} < ${oldDist === Infinity ? '∞' : oldDist}.`,
            round: r,
            edgeChecked: edgeId,
            negativeCycle: null,
            activeLine: 5,
          });
        } else {
          const desc = distances[fromNode] === Infinity
            ? `Round ${r}/${V-1}: Edge ${fromNode} → ${toNode} skipped (dist[${fromNode}] is ∞).`
            : `Round ${r}/${V-1}: Checked edge ${fromNode} → ${toNode}. No update: ${distances[fromNode]} + ${weight} >= ${distances[toNode] === Infinity ? '∞' : distances[toNode]}.`;

          steps.push({
            nodeStates: { ...nodeStates },
            edgeStates: { ...edgeStates },
            distances: { ...distances },
            parentMap: { ...parentMap },
            currentNode: fromNode,
            traversalOrder: [],
            description: desc,
            round: r,
            edgeChecked: edgeId,
            negativeCycle: null,
            activeLine: 4,
          });
        }
      }
    }

    if (!relaxedAny) {
      steps.push({
        nodeStates: { ...nodeStates },
        edgeStates: { ...edgeStates },
        distances: { ...distances },
        parentMap: { ...parentMap },
        currentNode: null,
        traversalOrder: [],
        description: `Round ${r}/${V-1} finished with no edge relaxations. Shortest paths are optimized.`,
        round: r,
        edgeChecked: null,
        negativeCycle: null,
        activeLine: 2,
      });
      break;
    }
  }

  // 1 final check round to detect negative cycle
  let negativeCycleInfo = null;
  for (let i = 0; i < edges.length; i++) {
    const edge = edges[i];
    const u = edge.from;
    const v = edge.to;
    const w = edge.weight ?? 1;

    const passes = [];
    passes.push({ from: u, to: v, weight: w, edgeId: edge.id });
    if (!directed) {
      passes.push({ from: v, to: u, weight: w, edgeId: edge.id });
    }

    for (const pass of passes) {
      const fromNode = pass.from;
      const toNode = pass.to;
      const weight = pass.weight;
      const edgeId = pass.edgeId;

      if (distances[fromNode] !== Infinity && distances[fromNode] + weight < distances[toNode]) {
        let cycleNode = toNode;
        for (let j = 0; j < V; j++) {
          cycleNode = parentMap[cycleNode] || cycleNode;
        }

        const cycleNodesList = [];
        let curr = cycleNode;
        const visitedInBacktrack = new Set();
        while (curr !== null && !visitedInBacktrack.has(curr)) {
          visitedInBacktrack.add(curr);
          cycleNodesList.push(curr);
          curr = parentMap[curr];
        }
        
        const startIndex = cycleNodesList.indexOf(curr);
        let cycle = [];
        if (startIndex !== -1) {
          cycle = cycleNodesList.slice(startIndex);
        } else {
          cycle = cycleNodesList;
        }
        cycle.push(cycle[0]);
        cycle.reverse();

        const cycleNodesSet = new Set(cycle);
        const cycleEdgesSet = new Set();

        for (let j = 0; j < cycle.length - 1; j++) {
          const cFrom = cycle[j];
          const cTo = cycle[j + 1];
          const cEdge = edges.find(e =>
            (e.from === cFrom && e.to === cTo) ||
            (!directed && e.to === cFrom && e.from === cTo)
          );
          if (cEdge) {
            cycleEdgesSet.add(cEdge.id);
          }
        }

        negativeCycleInfo = {
          nodes: cycleNodesSet,
          edges: cycleEdgesSet,
          nodeList: cycle,
        };

        const cycleNodeStates = { ...nodeStates };
        const cycleEdgeStates = { ...edgeStates };

        cycleNodesSet.forEach(nid => { cycleNodeStates[nid] = 'negative_cycle'; });
        cycleEdgesSet.forEach(eid => { cycleEdgeStates[eid] = 'negative_cycle'; });

        steps.push({
          nodeStates: cycleNodeStates,
          edgeStates: cycleEdgeStates,
          distances: { ...distances },
          parentMap: { ...parentMap },
          currentNode: null,
          traversalOrder: [],
          description: `⚠️ Negative cycle detected! Cycle: [${cycle.join(' → ')}]. Shortest paths are undefined!`,
          round: V,
          edgeChecked: edgeId,
          negativeCycle: negativeCycleInfo,
          activeLine: 7,
        });

        return steps;
      }
    }
  }

  const finalNodeStates = { ...nodeStates };
  nodes.forEach(n => {
    if (distances[n.id] !== Infinity) finalNodeStates[n.id] = 'visited';
  });

  steps.push({
    nodeStates: finalNodeStates,
    edgeStates: { ...edgeStates },
    distances: { ...distances },
    parentMap: { ...parentMap },
    currentNode: null,
    traversalOrder: [],
    description: `Bellman-Ford complete! No negative cycle detected. Click any node to check its path.`,
    round: V,
    edgeChecked: null,
    negativeCycle: null,
    activeLine: 6,
  });

  return steps;
}

// ── Floyd-Warshall step generator ────────────────────────────────────
function generateFloydWarshallSteps(nodes, edges, directed) {
  const steps = [];
  const N = nodes.length;

  const sortedIds = nodes.map(n => n.id).sort((a, b) => a - b);
  const idxMap = {};
  sortedIds.forEach((id, i) => { idxMap[id] = i; });

  let dist = Array.from({ length: N }, () => Array(N).fill(Infinity));
  let next = Array.from({ length: N }, () => Array(N).fill(null));

  for (let i = 0; i < N; i++) {
    dist[i][i] = 0;
  }

  edges.forEach(e => {
    const uIdx = idxMap[e.from];
    const vIdx = idxMap[e.to];
    if (uIdx !== undefined && vIdx !== undefined) {
      const weight = e.weight ?? 1;
      if (weight < dist[uIdx][vIdx]) {
        dist[uIdx][vIdx] = weight;
        next[uIdx][vIdx] = vIdx;
      }
      if (!directed) {
        if (weight < dist[vIdx][uIdx]) {
          dist[vIdx][uIdx] = weight;
          next[vIdx][uIdx] = uIdx;
        }
      }
    }
  });

  const cloneMatrix = (m) => m.map(row => [...row]);

  steps.push({
    matrix: cloneMatrix(dist),
    next: cloneMatrix(next),
    kNodeId: null,
    currentNode: null,
    nodeStates: {},
    edgeStates: {},
    traversalOrder: [],
    description: `Initialize Floyd-Warshall. base cases: dist[i][i] = 0, dist[i][j] = weight for active edges, all others = ∞.`,
    activeLine: 1,
  });

  for (let k = 0; k < N; k++) {
    const kId = sortedIds[k];
    const prevDist = cloneMatrix(dist);
    const prevNext = cloneMatrix(next);

    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        if (prevDist[i][k] !== Infinity && prevDist[k][j] !== Infinity) {
          if (prevDist[i][k] + prevDist[k][j] < prevDist[i][j]) {
            dist[i][j] = prevDist[i][k] + prevDist[k][j];
            next[i][j] = prevNext[i][k];
          }
        }
      }
    }

    const nodeStates = {};
    nodeStates[kId] = 'visiting'; // orange pulsing intermediate

    steps.push({
      matrix: cloneMatrix(dist),
      next: cloneMatrix(next),
      kNodeId: kId,
      currentNode: kId,
      nodeStates: nodeStates,
      edgeStates: {},
      traversalOrder: [],
      description: `Step ${k + 1}/${N}: Using Node ${kId} as intermediate. Checked all pairs (i, j) for paths via Node ${kId}.`,
      activeLine: 2,
    });
  }

  steps.push({
    matrix: cloneMatrix(dist),
    next: cloneMatrix(next),
    kNodeId: null,
    currentNode: null,
    nodeStates: {},
    edgeStates: {},
    traversalOrder: [],
    description: `Floyd-Warshall complete! Hover over any cell in the matrix to see the shortest path highlighted on the canvas.`,
    activeLine: 2,
  });

  return steps;
}

// Path reconstruction for Floyd-Warshall
function getFloydWarshallPath(uId, vId, sortedIds, nextMatrix) {
  if (uId === vId) return [uId];

  const idxMap = {};
  sortedIds.forEach((id, i) => { idxMap[id] = i; });

  const uIdx = idxMap[uId];
  const vIdx = idxMap[vId];

  if (uIdx === undefined || vIdx === undefined) return [];
  if (!nextMatrix || !nextMatrix[uIdx] || nextMatrix[uIdx][vIdx] === null) return [];

  const pathIndices = [uIdx];
  let curr = uIdx;
  const visited = new Set([curr]);

  while (curr !== vIdx) {
    curr = nextMatrix[curr][vIdx];
    if (curr === null || curr === undefined || visited.has(curr)) {
      return [];
    }
    visited.add(curr);
    pathIndices.push(curr);
  }

  return pathIndices.map(idx => sortedIds[idx]);
}

// ── Kruskal step generator ───────────────────────────────────────────
function generateKruskalSteps(nodes, edges) {
  const steps = [];
  const sorted = [...edges].map(e => ({
    id: e.id,
    from: e.from,
    to: e.to,
    weight: e.weight ?? 1,
    status: 'pending' // 'pending' | 'checking' | 'mst' | 'cycle'
  })).sort((a, b) => a.weight - b.weight);

  const dsuParent = {};
  nodes.forEach(n => { dsuParent[n.id] = n.id; });

  const nodeStates = {};
  const edgeStates = {};
  nodes.forEach(n => { nodeStates[n.id] = 'unvisited'; });
  edges.forEach(e => { edgeStates[e.id] = 'default'; });

  let mstWeight = 0;

  // Helper find root function
  const findDsuRoot = (id, parentMap) => {
    let curr = id;
    while (parentMap[curr] !== undefined && parentMap[curr] !== curr) {
      curr = parentMap[curr];
    }
    return curr;
  };

  // Step 1: Initialization
  steps.push({
    nodeStates: { ...nodeStates },
    edgeStates: { ...edgeStates },
    sortedEdges: sorted.map(se => ({ ...se })),
    dsuParent: { ...dsuParent },
    mstWeight: 0,
    currentNode: null,
    traversalOrder: [],
    description: `Initialize Kruskal's algorithm. Sort edges by weight. Initialize DSU components.`,
    activeLine: 1,
  });

  // Step 2: Edge-by-edge check
  for (let i = 0; i < sorted.length; i++) {
    const edge = sorted[i];
    edge.status = 'checking';

    const stepNodeStates = { ...nodeStates };
    const stepEdgeStates = { ...edgeStates };
    stepNodeStates[edge.from] = 'visiting';
    stepNodeStates[edge.to] = 'visiting';
    stepEdgeStates[edge.id] = 'active'; // yellow

    steps.push({
      nodeStates: stepNodeStates,
      edgeStates: stepEdgeStates,
      sortedEdges: sorted.map(se => ({ ...se })),
      dsuParent: { ...dsuParent },
      mstWeight: mstWeight,
      currentNode: null,
      traversalOrder: [],
      description: `Check edge ${edge.from} — ${edge.to} with minimum weight ${edge.weight}.`,
      activeLine: 4,
    });

    const rootFrom = findDsuRoot(edge.from, dsuParent);
    const rootTo = findDsuRoot(edge.to, dsuParent);

    if (rootFrom !== rootTo) {
      // Union
      dsuParent[rootFrom] = rootTo;
      edge.status = 'mst';
      mstWeight += edge.weight;
      edgeStates[edge.id] = 'traversed'; // green
      nodeStates[edge.from] = 'visited';
      nodeStates[edge.to] = 'visited';

      steps.push({
        nodeStates: { ...nodeStates },
        edgeStates: { ...edgeStates },
        sortedEdges: sorted.map(se => ({ ...se })),
        dsuParent: { ...dsuParent },
        mstWeight: mstWeight,
        currentNode: null,
        traversalOrder: [],
        description: `No cycle created. Union components of node ${edge.from} and ${edge.to}. Add edge to MST.`,
        activeLine: 6,
      });
    } else {
      // Cycle
      edge.status = 'cycle';
      const cycleEdgeStates = { ...edgeStates };
      const cycleNodeStates = { ...nodeStates };
      cycleEdgeStates[edge.id] = 'negative_cycle'; // red
      cycleNodeStates[edge.from] = 'negative_cycle';
      cycleNodeStates[edge.to] = 'negative_cycle';

      steps.push({
        nodeStates: cycleNodeStates,
        edgeStates: cycleEdgeStates,
        sortedEdges: sorted.map(se => ({ ...se })),
        dsuParent: { ...dsuParent },
        mstWeight: mstWeight,
        currentNode: null,
        traversalOrder: [],
        description: `Edge ${edge.from} — ${edge.to} creates a cycle (both nodes are in the same component)! Skip it.`,
        activeLine: 7,
      });
    }
  }

  // Final step
  const finalEdgeStates = {};
  edges.forEach(e => {
    const isMstEdge = sorted.some(se => se.id === e.id && se.status === 'mst');
    finalEdgeStates[e.id] = isMstEdge ? 'mst' : 'default';
  });

  const finalNodeStates = {};
  nodes.forEach(n => { finalNodeStates[n.id] = 'visited'; });

  steps.push({
    nodeStates: finalNodeStates,
    edgeStates: finalEdgeStates,
    sortedEdges: sorted.map(se => ({ ...se })),
    dsuParent: { ...dsuParent },
    mstWeight: mstWeight,
    currentNode: null,
    traversalOrder: [],
    description: `Kruskal's algorithm complete! Final MST total weight is ${mstWeight}.`,
    activeLine: 3,
  });

  return steps;
}

// ── Prim step generator ──────────────────────────────────────────────
function generatePrimSteps(sourceId, nodes, edges) {
  const steps = [];
  const adj = buildAdjListWithWeights(nodes, edges, false); // treat as undirected

  const visited = new Set();
  const pq = []; // list of { id, key, parent, parentEdge }
  const parentMap = {};
  const distances = {}; // stores current key weight for distances table view
  
  const nodeStates = {};
  const edgeStates = {};
  nodes.forEach(n => {
    nodeStates[n.id] = 'unvisited';
    distances[n.id] = Infinity;
    parentMap[n.id] = null;
  });
  edges.forEach(e => { edgeStates[e.id] = 'default'; });

  let mstWeight = 0;
  const mstEdges = new Set();

  // Push source node
  pq.push({ id: sourceId, key: 0, parent: null, parentEdge: null });
  nodeStates[sourceId] = 'queued';
  distances[sourceId] = 0;

  // Step 1: Initialization
  steps.push({
    nodeStates: { ...nodeStates },
    edgeStates: { ...edgeStates },
    frontier: pq.map(item => ({ ...item })),
    distances: { ...distances },
    parentMap: { ...parentMap },
    mstWeight: 0,
    currentNode: null,
    traversalOrder: [],
    description: `Initialize Prim's algorithm from source node ${sourceId}.`,
    activeLine: 1,
  });

  while (visited.size < nodes.length) {
    if (pq.length === 0) {
      // Disconnected component: find first unvisited node
      const nextSource = nodes.find(n => !visited.has(n.id))?.id;
      if (nextSource === undefined) break;

      pq.push({ id: nextSource, key: 0, parent: null, parentEdge: null });
      nodeStates[nextSource] = 'queued';
      distances[nextSource] = 0;

      steps.push({
        nodeStates: { ...nodeStates },
        edgeStates: { ...edgeStates },
        frontier: pq.map(item => ({ ...item })),
        distances: { ...distances },
        parentMap: { ...parentMap },
        mstWeight: mstWeight,
        currentNode: null,
        traversalOrder: Array.from(visited),
        description: `Graph is disconnected. Start a new tree in the spanning forest from node ${nextSource}.`,
        activeLine: 3,
      });
      continue;
    }

    // Sort priority queue by key weight
    pq.sort((a, b) => a.key - b.key);
    const curr = pq.shift();

    if (visited.has(curr.id)) continue;

    // Add to visited
    visited.add(curr.id);
    nodeStates[curr.id] = 'visited';
    if (curr.parentEdge !== null) {
      mstEdges.add(curr.parentEdge);
      edgeStates[curr.parentEdge] = 'traversed';
      mstWeight += curr.key;
    }
    parentMap[curr.id] = curr.parent;

    steps.push({
      nodeStates: { ...nodeStates },
      edgeStates: { ...edgeStates },
      frontier: pq.map(item => ({ ...item })),
      distances: { ...distances },
      parentMap: { ...parentMap },
      mstWeight: mstWeight,
      currentNode: curr.id,
      traversalOrder: Array.from(visited),
      description: `Extract node ${curr.id} with min weight crossing edge (${curr.key})${curr.parent !== null ? ` via edge from node ${curr.parent}` : ''}. Add to MST.`,
      activeLine: 4,
    });

    const neighbors = adj[curr.id] || [];
    for (const { to: v, weight: w, edgeId } of neighbors) {
      if (visited.has(v)) continue;

      // Animate checking the crossing edge
      const stepEdgeStates = { ...edgeStates };
      stepEdgeStates[edgeId] = 'active'; // yellow checking

      steps.push({
        nodeStates: { ...nodeStates },
        edgeStates: stepEdgeStates,
        frontier: pq.map(item => ({ ...item })),
        distances: { ...distances },
        parentMap: { ...parentMap },
        mstWeight: mstWeight,
        currentNode: curr.id,
        traversalOrder: Array.from(visited),
        description: `Check crossing edge ${curr.id} — ${v} (weight = ${w}).`,
        activeLine: 6,
      });

      const existingIndex = pq.findIndex(item => item.id === v);

      if (existingIndex === -1) {
        pq.push({ id: v, key: w, parent: curr.id, parentEdge: edgeId });
        nodeStates[v] = 'queued';
        distances[v] = w;

        steps.push({
          nodeStates: { ...nodeStates },
          edgeStates: { ...edgeStates },
          frontier: pq.map(item => ({ ...item })),
          distances: { ...distances },
          parentMap: { ...parentMap },
          mstWeight: mstWeight,
          currentNode: curr.id,
          traversalOrder: Array.from(visited),
          description: `Node ${v} is not in priority queue. Enqueue with key = ${w} via node ${curr.id}.`,
          activeLine: 7,
        });
      } else {
        if (w < pq[existingIndex].key) {
          const oldKey = pq[existingIndex].key;
          pq[existingIndex].key = w;
          pq[existingIndex].parent = curr.id;
          pq[existingIndex].parentEdge = edgeId;
          nodeStates[v] = 'queued';
          distances[v] = w;

          steps.push({
            nodeStates: { ...nodeStates },
            edgeStates: { ...edgeStates },
            frontier: pq.map(item => ({ ...item })),
            distances: { ...distances },
            parentMap: { ...parentMap },
            mstWeight: mstWeight,
            currentNode: curr.id,
            traversalOrder: Array.from(visited),
            description: `Found a smaller crossing edge weight to node ${v}: ${w} < ${oldKey}. Update priority queue.`,
            activeLine: 7,
          });
        }
      }
    }
  }

  // Final step
  const finalEdgeStates = {};
  edges.forEach(e => {
    finalEdgeStates[e.id] = mstEdges.has(e.id) ? 'mst' : 'default';
  });

  const finalNodeStates = {};
  nodes.forEach(n => {
    finalNodeStates[n.id] = visited.has(n.id) ? 'visited' : 'unvisited';
  });

  steps.push({
    nodeStates: finalNodeStates,
    edgeStates: finalEdgeStates,
    frontier: [],
    distances: { ...distances },
    parentMap: { ...parentMap },
    mstWeight: mstWeight,
    currentNode: null,
    traversalOrder: Array.from(visited),
    description: `Prim's algorithm complete! Spanning forest weight is ${mstWeight}.`,
    activeLine: 3,
  });

  return steps;
}

// ── Kahn's Topological Sort step generator ───────────────────────────
function generateKahnSteps(nodes, edges) {
  const steps = [];
  const adj = buildAdjListWithWeights(nodes, edges, true); // Kahn is for DAGs (directed)

  const inDegree = {};
  nodes.forEach(n => { inDegree[n.id] = 0; });
  edges.forEach(e => {
    if (inDegree[e.to] !== undefined) {
      inDegree[e.to]++;
    }
  });

  const nodeStates = {};
  const edgeStates = {};
  nodes.forEach(n => {
    nodeStates[n.id] = { state: 'unvisited', inDegree: inDegree[n.id] };
  });
  edges.forEach(e => { edgeStates[e.id] = 'default'; });

  const queue = [];
  nodes.forEach(n => {
    if (inDegree[n.id] === 0) {
      queue.push(n.id);
      nodeStates[n.id].state = 'queued';
    }
  });
  queue.sort((a, b) => a - b);

  const topologicalOrder = [];

  steps.push({
    nodeStates: JSON.parse(JSON.stringify(nodeStates)),
    edgeStates: { ...edgeStates },
    frontier: [...queue],
    currentNode: null,
    traversalOrder: [...topologicalOrder],
    description: "Initialize Kahn's algorithm. Compute in-degrees and enqueue all nodes with in-degree 0.",
    activeLine: 1,
  });

  while (queue.length > 0) {
    const u = queue.shift();
    nodeStates[u].state = 'visiting';

    steps.push({
      nodeStates: JSON.parse(JSON.stringify(nodeStates)),
      edgeStates: { ...edgeStates },
      frontier: [...queue],
      currentNode: u,
      traversalOrder: [...topologicalOrder],
      description: `Dequeue node ${u} with in-degree 0. Add it to the topological order.`,
      activeLine: 4,
    });

    topologicalOrder.push(u);
    nodeStates[u].state = 'visited';

    const neighbors = adj[u] || [];
    for (const { to: v, edgeId } of neighbors) {
      const stepEdgeStates = { ...edgeStates };
      stepEdgeStates[edgeId] = 'active';

      inDegree[v]--;
      nodeStates[v].inDegree = inDegree[v];

      steps.push({
        nodeStates: JSON.parse(JSON.stringify(nodeStates)),
        edgeStates: stepEdgeStates,
        frontier: [...queue],
        currentNode: u,
        traversalOrder: [...topologicalOrder],
        description: `Decrement in-degree of neighbor ${v} to ${inDegree[v]} via edge ${u} → ${v}.`,
        activeLine: 6,
      });

      if (inDegree[v] === 0) {
        queue.push(v);
        queue.sort((a, b) => a - b);
        nodeStates[v].state = 'queued';

        steps.push({
          nodeStates: JSON.parse(JSON.stringify(nodeStates)),
          edgeStates: { ...edgeStates },
          frontier: [...queue],
          currentNode: u,
          traversalOrder: [...topologicalOrder],
          description: `Node ${v} now has in-degree 0. Enqueue ${v}.`,
          activeLine: 7,
        });
      }
    }
  }

  const hasCycle = topologicalOrder.length < nodes.length;
  if (hasCycle) {
    nodes.forEach(n => {
      if (!topologicalOrder.includes(n.id)) {
        nodeStates[n.id].state = 'negative_cycle';
      }
    });

    steps.push({
      nodeStates: JSON.parse(JSON.stringify(nodeStates)),
      edgeStates: { ...edgeStates },
      frontier: [],
      currentNode: null,
      traversalOrder: [...topologicalOrder],
      hasCycle: true,
      description: `⚠️ Cycle detected! Topological sort is impossible. Only visited ${topologicalOrder.length} out of ${nodes.length} nodes.`,
      activeLine: 3,
    });
  } else {
    steps.push({
      nodeStates: JSON.parse(JSON.stringify(nodeStates)),
      edgeStates: { ...edgeStates },
      frontier: [],
      currentNode: null,
      traversalOrder: [...topologicalOrder],
      hasCycle: false,
      description: `Kahn's Topological Sort complete! Final order: [${topologicalOrder.join(', ')}].`,
      activeLine: 3,
    });
  }

  return steps;
}

// ── Kosaraju's SCC step generator ────────────────────────────────────
function generateKosarajuSteps(nodes, edges) {
  const steps = [];
  const adj = buildAdjListWithWeights(nodes, edges, true);
  
  const adjTransposed = {};
  nodes.forEach(n => { adjTransposed[n.id] = []; });
  edges.forEach(e => {
    adjTransposed[e.to]?.push({ to: e.from, edgeId: e.id, weight: e.weight ?? 1 });
  });

  const nodeStates = {};
  const edgeStates = {};
  nodes.forEach(n => { nodeStates[n.id] = { state: 'unvisited' }; });
  edges.forEach(e => { edgeStates[e.id] = 'default'; });

  const finishingStack = [];
  const visitedPass1 = new Set();

  steps.push({
    nodeStates: JSON.parse(JSON.stringify(nodeStates)),
    edgeStates: { ...edgeStates },
    finishingStack: [...finishingStack],
    sccsList: [],
    description: "Kosaraju's SCC: Start Pass 1. Run DFS to compute node finishing times.",
    activeLine: 1,
  });

  const dfsPass1 = (u) => {
    visitedPass1.add(u);
    nodeStates[u].state = 'visiting';

    steps.push({
      nodeStates: JSON.parse(JSON.stringify(nodeStates)),
      edgeStates: { ...edgeStates },
      finishingStack: [...finishingStack],
      sccsList: [],
      description: `Pass 1 DFS: Visiting node ${u}.`,
      activeLine: 1,
    });

    const neighbors = adj[u] || [];
    for (const { to: v, edgeId } of neighbors) {
      if (!visitedPass1.has(v)) {
        const stepEdgeStates = { ...edgeStates };
        stepEdgeStates[edgeId] = 'active';

        steps.push({
          nodeStates: JSON.parse(JSON.stringify(nodeStates)),
          edgeStates: stepEdgeStates,
          finishingStack: [...finishingStack],
          sccsList: [],
          description: `Pass 1 DFS: Traverse edge ${u} → ${v}.`,
          activeLine: 1,
        });

        dfsPass1(v);
      }
    }

    nodeStates[u].state = 'visited';
    finishingStack.push(u);

    steps.push({
      nodeStates: JSON.parse(JSON.stringify(nodeStates)),
      edgeStates: { ...edgeStates },
      finishingStack: [...finishingStack],
      sccsList: [],
      description: `Pass 1 DFS: Finished processing node ${u}. Push to stack. Stack: [${finishingStack.join(', ')}].`,
      activeLine: 1,
    });
  };

  nodes.map(n => n.id).sort((a, b) => a - b).forEach(id => {
    if (!visitedPass1.has(id)) {
      dfsPass1(id);
    }
  });

  nodes.forEach(n => {
    nodeStates[n.id] = { state: 'unvisited' };
  });
  edges.forEach(e => {
    edgeStates[e.id] = 'default';
  });

  steps.push({
    nodeStates: JSON.parse(JSON.stringify(nodeStates)),
    edgeStates: { ...edgeStates },
    finishingStack: [...finishingStack],
    sccsList: [],
    description: "Kosaraju's SCC: Reset visited states and transpose all edge directions for Pass 2.",
    activeLine: 2,
  });

  const visitedPass2 = new Set();
  const SCC_COLORS = ['#5bba6f', '#3b82c4', '#f59e0b', '#ec4899', '#a855f7', '#0d9488', '#e8573a', '#94a3b8'];
  const sccsList = [];
  let sccCount = 0;

  const dfsPass2 = (u, currentScc) => {
    visitedPass2.add(u);
    const color = SCC_COLORS[sccCount % SCC_COLORS.length];
    nodeStates[u] = {
      state: 'visited',
      fill: color,
      shadow: color,
      label: `SCC-${sccCount + 1}`,
    };
    currentScc.push(u);

    steps.push({
      nodeStates: JSON.parse(JSON.stringify(nodeStates)),
      edgeStates: { ...edgeStates },
      finishingStack: [...finishingStack],
      sccsList: JSON.parse(JSON.stringify(sccsList)),
      description: `Pass 2 DFS: Node ${u} belongs to strongly connected component SCC-${sccCount + 1}.`,
      activeLine: 6,
    });

    const neighbors = adjTransposed[u] || [];
    for (const { to: v, edgeId } of neighbors) {
      if (!visitedPass2.has(v)) {
        const stepEdgeStates = { ...edgeStates };
        stepEdgeStates[edgeId] = 'active';

        steps.push({
          nodeStates: JSON.parse(JSON.stringify(nodeStates)),
          edgeStates: stepEdgeStates,
          finishingStack: [...finishingStack],
          sccsList: JSON.parse(JSON.stringify(sccsList)),
          description: `Pass 2 DFS: Traverse transposed edge ${u} ← ${v}.`,
          activeLine: 6,
        });

        edgeStates[edgeId] = 'traversed';
        dfsPass2(v, currentScc);
      }
    }
  };

  const stackOrder = [...finishingStack].reverse();
  for (const id of stackOrder) {
    finishingStack.pop();

    if (!visitedPass2.has(id)) {
      const currentScc = [];
      sccsList.push(currentScc);
      
      steps.push({
        nodeStates: JSON.parse(JSON.stringify(nodeStates)),
        edgeStates: { ...edgeStates },
        finishingStack: [...finishingStack],
        sccsList: JSON.parse(JSON.stringify(sccsList)),
        description: `Kosaraju Pass 2: Pop node ${id} from stack. Node is unvisited, starting new DFS tree.`,
        activeLine: 4,
      });

      dfsPass2(id, currentScc);
      sccCount++;
    } else {
      steps.push({
        nodeStates: JSON.parse(JSON.stringify(nodeStates)),
        edgeStates: { ...edgeStates },
        finishingStack: [...finishingStack],
        sccsList: JSON.parse(JSON.stringify(sccsList)),
        description: `Kosaraju Pass 2: Pop node ${id} from stack. Already visited in SCC-${sccsList.findIndex(s => s.includes(id)) + 1}. Skip.`,
        activeLine: 5,
      });
    }
  }

  steps.push({
    nodeStates: JSON.parse(JSON.stringify(nodeStates)),
    edgeStates: { ...edgeStates },
    finishingStack: [],
    sccsList: JSON.parse(JSON.stringify(sccsList)),
    description: `Kosaraju's SCC complete! Found ${sccCount} Strongly Connected Component(s).`,
    activeLine: 3,
  });

  return steps;
}

// ── Bipartite Check (BFS 2-coloring) step generator ──────────────────
function generateBipartiteSteps(nodes, edges) {
  const steps = [];
  const adj = buildAdjListWithWeights(nodes, edges, false); // treat as undirected

  const nodeStates = {};
  const edgeStates = {};
  const color = {};
  
  nodes.forEach(n => {
    nodeStates[n.id] = { state: 'unvisited' };
  });
  edges.forEach(e => { edgeStates[e.id] = 'default'; });

  steps.push({
    nodeStates: JSON.parse(JSON.stringify(nodeStates)),
    edgeStates: { ...edgeStates },
    bipartiteColors: { ...color },
    frontier: [],
    description: "Initialize Bipartite Check. Try 2-coloring nodes using BFS (Red vs Blue).",
    activeLine: 1,
  });

  const visited = new Set();
  let isBipartite = true;

  for (const startNode of nodes.map(n => n.id).sort((a,b)=>a-b)) {
    if (visited.has(startNode)) continue;

    const queue = [startNode];
    visited.add(startNode);
    color[startNode] = 0; // Red
    nodeStates[startNode] = {
      state: 'queued',
      fill: '#ef4444',
      shadow: '#b91c1c',
      label: 'Red',
    };

    steps.push({
      nodeStates: JSON.parse(JSON.stringify(nodeStates)),
      edgeStates: { ...edgeStates },
      bipartiteColors: { ...color },
      frontier: [...queue],
      description: `Start BFS from unvisited node ${startNode}. Color it Red and enqueue.`,
      activeLine: 2,
    });

    while (queue.length > 0) {
      const u = queue.shift();
      nodeStates[u].state = 'visiting';

      steps.push({
        nodeStates: JSON.parse(JSON.stringify(nodeStates)),
        edgeStates: { ...edgeStates },
        bipartiteColors: { ...color },
        frontier: [...queue],
        description: `Dequeue node ${u} (Colored: ${color[u] === 0 ? 'Red' : 'Blue'}).`,
        activeLine: 4,
      });

      const neighbors = adj[u] || [];
      for (const { to: v, edgeId } of neighbors) {
        const stepEdgeStates = { ...edgeStates };
        stepEdgeStates[edgeId] = 'active'; // yellow

        steps.push({
          nodeStates: JSON.parse(JSON.stringify(nodeStates)),
          edgeStates: stepEdgeStates,
          bipartiteColors: { ...color },
          frontier: [...queue],
          description: `Check neighbor ${v} of node ${u}.`,
          activeLine: 5,
        });

        if (!visited.has(v)) {
          visited.add(v);
          color[v] = 1 - color[u];
          nodeStates[v] = {
            state: 'queued',
            fill: color[v] === 0 ? '#ef4444' : '#3b82c4',
            shadow: color[v] === 0 ? '#b91c1c' : '#2a6ba4',
            label: color[v] === 0 ? 'Red' : 'Blue',
          };
          queue.push(v);
          edgeStates[edgeId] = 'traversed'; // green

          steps.push({
            nodeStates: JSON.parse(JSON.stringify(nodeStates)),
            edgeStates: { ...edgeStates },
            bipartiteColors: { ...color },
            frontier: [...queue],
            description: `Neighbor ${v} is unvisited. Color it opposite color (${color[v] === 0 ? 'Red' : 'Blue'}) and enqueue.`,
            activeLine: 6,
          });
        } else {
          if (color[v] === color[u]) {
            isBipartite = false;
            edgeStates[edgeId] = 'conflict'; // Red edge conflict
            
            nodeStates[u] = {
              state: 'negative_cycle',
              fill: '#ef4444',
              shadow: '#b91c1c',
              label: `Conflict (${color[u] === 0 ? 'Red' : 'Blue'})`,
            };
            nodeStates[v] = {
              state: 'negative_cycle',
              fill: '#ef4444',
              shadow: '#b91c1c',
              label: `Conflict (${color[v] === 0 ? 'Red' : 'Blue'})`,
            };

            steps.push({
              nodeStates: JSON.parse(JSON.stringify(nodeStates)),
              edgeStates: { ...edgeStates },
              bipartiteColors: { ...color },
              frontier: [...queue],
              isBipartite: false,
              description: `⚠️ Conflict found! Edge connects nodes ${u} and ${v} with the same color (${color[u] === 0 ? 'Red' : 'Blue'}). Graph is NOT Bipartite.`,
              activeLine: 7,
            });
            return steps;
          }
        }
      }

      nodeStates[u].state = 'visited';
      nodeStates[u].fill = color[u] === 0 ? '#ef4444' : '#3b82c4';
      nodeStates[u].shadow = color[u] === 0 ? '#b91c1c' : '#2a6ba4';
      nodeStates[u].label = color[u] === 0 ? 'Red' : 'Blue';
    }
  }

  steps.push({
    nodeStates: JSON.parse(JSON.stringify(nodeStates)),
    edgeStates: { ...edgeStates },
    bipartiteColors: { ...color },
    frontier: [],
    isBipartite: true,
    description: "Bipartite check complete. The graph is Bipartite! (2-colorable).",
    activeLine: 3,
  });

  return steps;
}

// ── Tarjan's AP & Bridges step generator ─────────────────────────────
function generateBridgesAndAPsSteps(nodes, edges) {
  const steps = [];
  const adj = buildAdjListWithWeights(nodes, edges, false); // treat as undirected

  const tin = {};
  const low = {};
  const visited = new Set();
  const parent = {};
  const isAP = {};
  const bridges = new Set();

  nodes.forEach(n => {
    tin[n.id] = null;
    low[n.id] = null;
    parent[n.id] = null;
    isAP[n.id] = false;
  });

  const nodeStates = {};
  const edgeStates = {};
  nodes.forEach(n => { nodeStates[n.id] = { state: 'unvisited' }; });
  edges.forEach(e => { edgeStates[e.id] = 'default'; });

  steps.push({
    nodeStates: JSON.parse(JSON.stringify(nodeStates)),
    edgeStates: { ...edgeStates },
    tin: { ...tin },
    low: { ...low },
    bridgesList: [],
    apsList: [],
    description: "Tarjan's AP & Bridge detection: Start DFS. Initialize tin and low maps.",
    activeLine: 1,
  });

  let timer = 0;

  const dfs = (u) => {
    visited.add(u);
    tin[u] = low[u] = timer++;
    nodeStates[u].state = 'visiting';

    steps.push({
      nodeStates: JSON.parse(JSON.stringify(nodeStates)),
      edgeStates: { ...edgeStates },
      tin: { ...tin },
      low: { ...low },
      bridgesList: Array.from(bridges),
      apsList: Object.keys(isAP).filter(k => isAP[k]),
      currentNode: u,
      description: `DFS visiting node ${u}. Set tin[${u}] = low[${u}] = ${tin[u]}.`,
      activeLine: 1,
    });

    const neighbors = adj[u] || [];
    let childrenCount = 0;

    for (const { to: v, edgeId } of neighbors) {
      if (v === parent[u]) continue;

      if (visited.has(v)) {
        low[u] = Math.min(low[u], tin[v]);
        const stepEdgeStates = { ...edgeStates };
        stepEdgeStates[edgeId] = 'active'; // yellow

        steps.push({
          nodeStates: JSON.parse(JSON.stringify(nodeStates)),
          edgeStates: stepEdgeStates,
          tin: { ...tin },
          low: { ...low },
          bridgesList: Array.from(bridges),
          apsList: Object.keys(isAP).filter(k => isAP[k]),
          currentNode: u,
          description: `Checked back-edge ${u} — ${v}. Update low[${u}] = min(low[${u}], tin[${v}]) = ${low[u]}.`,
          activeLine: 3,
        });
      } else {
        parent[v] = u;
        childrenCount++;

        const stepEdgeStates = { ...edgeStates };
        stepEdgeStates[edgeId] = 'active';

        steps.push({
          nodeStates: JSON.parse(JSON.stringify(nodeStates)),
          edgeStates: stepEdgeStates,
          tin: { ...tin },
          low: { ...low },
          bridgesList: Array.from(bridges),
          apsList: Object.keys(isAP).filter(k => isAP[k]),
          currentNode: u,
          description: `Recurse DFS on unvisited node ${v} from node ${u}.`,
          activeLine: 4,
        });

        dfs(v);

        low[u] = Math.min(low[u], low[v]);
        edgeStates[edgeId] = 'default';

        steps.push({
          nodeStates: JSON.parse(JSON.stringify(nodeStates)),
          edgeStates: { ...edgeStates },
          tin: { ...tin },
          low: { ...low },
          bridgesList: Array.from(bridges),
          apsList: Object.keys(isAP).filter(k => isAP[k]),
          currentNode: u,
          description: `Returned from DFS on ${v}. Update low[${u}] = min(low[${u}], low[${v}]) = ${low[u]}.`,
          activeLine: 5,
        });

        if (low[v] > tin[u]) {
          bridges.add(edgeId);
          edgeStates[edgeId] = 'bridge';

          steps.push({
            nodeStates: JSON.parse(JSON.stringify(nodeStates)),
            edgeStates: { ...edgeStates },
            tin: { ...tin },
            low: { ...low },
            bridgesList: Array.from(bridges),
            apsList: Object.keys(isAP).filter(k => isAP[k]),
            currentNode: u,
            description: `Bridge found! low[${v}] (${low[v]}) > tin[${u}] (${tin[u]}). Edge ${u} — ${v} is a bridge.`,
            activeLine: 6,
          });
        }

        if (parent[u] !== null && low[v] >= tin[u]) {
          isAP[u] = true;
          nodeStates[u].isArticulationPoint = true;

          steps.push({
            nodeStates: JSON.parse(JSON.stringify(nodeStates)),
            edgeStates: { ...edgeStates },
            tin: { ...tin },
            low: { ...low },
            bridgesList: Array.from(bridges),
            apsList: Object.keys(isAP).filter(k => isAP[k]),
            currentNode: u,
            description: `⭐ Articulation Point found! low[${v}] (${low[v]}) >= tin[${u}] (${tin[u]}). Node ${u} is an AP.`,
            activeLine: 7,
          });
        }
      }
    }

    if (parent[u] === null && childrenCount > 1) {
      isAP[u] = true;
      nodeStates[u].isArticulationPoint = true;

      steps.push({
        nodeStates: JSON.parse(JSON.stringify(nodeStates)),
        edgeStates: { ...edgeStates },
        tin: { ...tin },
        low: { ...low },
        bridgesList: Array.from(bridges),
        apsList: Object.keys(isAP).filter(k => isAP[k]),
        currentNode: u,
        description: `⭐ Articulation Point found! Node ${u} is the root of DFS tree and has ${childrenCount} children.`,
        activeLine: 7,
      });
    }

    nodeStates[u].state = 'visited';
  };

  nodes.map(n => n.id).sort((a,b)=>a-b).forEach(id => {
    if (!visited.has(id)) {
      dfs(id);
    }
  });

  steps.push({
    nodeStates: JSON.parse(JSON.stringify(nodeStates)),
    edgeStates: { ...edgeStates },
    tin: { ...tin },
    low: { ...low },
    bridgesList: Array.from(bridges),
    apsList: Object.keys(isAP).filter(k => isAP[k]),
    currentNode: null,
    description: `Tarjan's AP & Bridge detection complete! Found ${bridges.size} bridge(s) and ${Object.keys(isAP).filter(k=>isAP[k]).length} articulation point(s).`,
    activeLine: 1,
  });

  return steps;
}

// ── Cycle Detection step generator ───────────────────────────────────
function generateCycleDetectionSteps(nodes, edges, directed) {
  const steps = [];
  const adj = buildAdjListWithWeights(nodes, edges, directed);

  const nodeStates = {};
  const edgeStates = {};
  nodes.forEach(n => { nodeStates[n.id] = { state: 'unvisited' }; });
  edges.forEach(e => { edgeStates[e.id] = 'default'; });

  steps.push({
    nodeStates: JSON.parse(JSON.stringify(nodeStates)),
    edgeStates: { ...edgeStates },
    description: `Initialize Cycle Detection for ${directed ? 'Directed' : 'Undirected'} graph.`,
    activeLine: 1,
  });

  const visited = new Set();
  const parent = {};

  if (directed) {
    const recStack = new Set();
    const dfsPath = [];

    const dfsDirected = (u) => {
      visited.add(u);
      recStack.add(u);
      dfsPath.push(u);
      nodeStates[u].state = 'visiting';

      steps.push({
        nodeStates: JSON.parse(JSON.stringify(nodeStates)),
        edgeStates: { ...edgeStates },
        description: `DFS visit node ${u}. Push to recursion stack. Stack: [${dfsPath.join(' → ')}].`,
        activeLine: 1,
      });

      const neighbors = adj[u] || [];
      for (const { to: v, edgeId } of neighbors) {
        const stepEdgeStates = { ...edgeStates };
        stepEdgeStates[edgeId] = 'active';

        steps.push({
          nodeStates: JSON.parse(JSON.stringify(nodeStates)),
          edgeStates: stepEdgeStates,
          description: `Check neighbor edge ${u} → ${v}.`,
          activeLine: 2,
        });

        if (recStack.has(v)) {
          edgeStates[edgeId] = 'cycle';
          const startIdx = dfsPath.indexOf(v);
          const cycleNodes = dfsPath.slice(startIdx);
          cycleNodes.push(v);

          cycleNodes.forEach(nid => {
            nodeStates[nid] = {
              state: 'negative_cycle',
              label: 'In Cycle',
            };
          });

          for (let j = 0; j < cycleNodes.length - 1; j++) {
            const fromN = cycleNodes[j];
            const toN = cycleNodes[j + 1];
            const cEdge = edges.find(e =>
              (e.from === fromN && e.to === toN) ||
              (!directed && ((e.from === fromN && e.to === toN) || (e.to === fromN && e.from === toN)))
            );
            if (cEdge) {
              edgeStates[cEdge.id] = 'cycle';
            }
          }

          steps.push({
            nodeStates: JSON.parse(JSON.stringify(nodeStates)),
            edgeStates: { ...edgeStates },
            hasCycle: true,
            description: `⚠️ Cycle detected! Node ${v} is already in recursion stack. Cycle: [${cycleNodes.join(' → ')}].`,
            activeLine: 3,
          });
          return true;
        }

        if (!visited.has(v)) {
          parent[v] = u;
          edgeStates[edgeId] = 'traversed';
          if (dfsDirected(v)) return true;
          edgeStates[edgeId] = 'default';
        }
      }

      recStack.delete(u);
      dfsPath.pop();
      nodeStates[u].state = 'visited';

      steps.push({
        nodeStates: JSON.parse(JSON.stringify(nodeStates)),
        edgeStates: { ...edgeStates },
        description: `Backtrack from node ${u}. Pop from recursion stack.`,
        activeLine: 5,
      });

      return false;
    };

    let cycleFound = false;
    for (const n of nodes.map(nd => nd.id).sort((a,b)=>a-b)) {
      if (!visited.has(n)) {
        if (dfsDirected(n)) {
          cycleFound = true;
          break;
        }
      }
    }

    if (!cycleFound) {
      steps.push({
        nodeStates: JSON.parse(JSON.stringify(nodeStates)),
        edgeStates: { ...edgeStates },
        hasCycle: false,
        description: "Cycle detection complete. No cycle found! Graph is a DAG.",
        activeLine: 1,
      });
    }

  } else {
    const dfsUndirected = (u, p) => {
      visited.add(u);
      nodeStates[u].state = 'visiting';

      steps.push({
        nodeStates: JSON.parse(JSON.stringify(nodeStates)),
        edgeStates: { ...edgeStates },
        description: `DFS visit node ${u} (parent = ${p ?? 'None'}).`,
        activeLine: 1,
      });

      const neighbors = adj[u] || [];
      for (const { to: v, edgeId } of neighbors) {
        if (v === p) continue;

        const stepEdgeStates = { ...edgeStates };
        stepEdgeStates[edgeId] = 'active';

        steps.push({
          nodeStates: JSON.parse(JSON.stringify(nodeStates)),
          edgeStates: stepEdgeStates,
          description: `Check neighbor edge ${u} — ${v}.`,
          activeLine: 2,
        });

        if (visited.has(v)) {
          edgeStates[edgeId] = 'cycle';
          const cycleNodes = [];
          let curr = u;
          while (curr !== v && curr !== null) {
            cycleNodes.push(curr);
            curr = parent[curr] || null;
          }
          cycleNodes.push(v);
          cycleNodes.push(u);

          cycleNodes.forEach(nid => {
            nodeStates[nid] = {
              state: 'negative_cycle',
              label: 'In Cycle',
            };
          });

          for (let j = 0; j < cycleNodes.length - 1; j++) {
            const fromN = cycleNodes[j];
            const toN = cycleNodes[j + 1];
            const cEdge = edges.find(e =>
              (e.from === fromN && e.to === toN) || (e.to === fromN && e.from === toN)
            );
            if (cEdge) {
              edgeStates[cEdge.id] = 'cycle';
            }
          }

          steps.push({
            nodeStates: JSON.parse(JSON.stringify(nodeStates)),
            edgeStates: { ...edgeStates },
            hasCycle: true,
            description: `⚠️ Cycle detected! Node ${v} is already visited. Cycle: [${cycleNodes.join(' — ')}].`,
            activeLine: 4,
          });
          return true;
        } else {
          parent[v] = u;
          edgeStates[edgeId] = 'traversed';
          if (dfsUndirected(v, u)) return true;
          edgeStates[edgeId] = 'default';
        }
      }

      nodeStates[u].state = 'visited';
      return false;
    };

    let cycleFound = false;
    for (const n of nodes.map(nd => nd.id).sort((a,b)=>a-b)) {
      if (!visited.has(n)) {
        if (dfsUndirected(n, null)) {
          cycleFound = true;
          break;
        }
      }
    }

    if (!cycleFound) {
      steps.push({
        nodeStates: JSON.parse(JSON.stringify(nodeStates)),
        edgeStates: { ...edgeStates },
        hasCycle: false,
        description: "Cycle detection complete. No cycle found! Graph is a forest/tree.",
        activeLine: 1,
      });
    }
  }

  return steps;
}

// ── Hook ──────────────────────────────────────────────────────────────
export function useAlgorithm() {
  const [algorithmType, setAlgorithmType] = useState(null); // 'bfs' | 'dfs' | 'dijkstra' | 'bfsSp' | 'bellmanFord' | 'floydWarshall' | 'kruskal' | 'prim' | 'topoSort' | 'kosaraju' | 'bipartite' | 'bridgesAndAPs' | 'cycleDetection' | null
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState('medium');
  const [sourceNode, setSourceNode] = useState(null);
  const [selectingSource, setSelectingSource] = useState(null);
  
  // Interactive path-query state
  const [destinationNode, setDestinationNode] = useState(null);
  const [savedEdges, setSavedEdges] = useState([]);
  const [savedDirected, setSavedDirected] = useState(true);
  const [savedNodeIds, setSavedNodeIds] = useState([]);

  // Floyd-Warshall hover cell state
  const [hoveredCell, setHoveredCell] = useState(null);

  // Dictionary of states to remember per SP/MST/Analysis algorithm
  const [algoStates, setAlgoStates] = useState({
    dijkstra: { steps: [], currentStep: 0, speed: 'medium', sourceNode: null, destinationNode: null },
    bellmanFord: { steps: [], currentStep: 0, speed: 'medium', sourceNode: null, destinationNode: null },
    floydWarshall: { steps: [], currentStep: 0, speed: 'medium', hoveredCell: null },
    kruskal: { steps: [], currentStep: 0, speed: 'medium' },
    prim: { steps: [], currentStep: 0, speed: 'medium', sourceNode: null },
    topoSort: { steps: [], currentStep: 0, speed: 'medium' },
    kosaraju: { steps: [], currentStep: 0, speed: 'medium' },
    bipartite: { steps: [], currentStep: 0, speed: 'medium' },
    bridgesAndAPs: { steps: [], currentStep: 0, speed: 'medium' },
    cycleDetection: { steps: [], currentStep: 0, speed: 'medium' },
  });

  const intervalRef = useRef(null);

  // Current step data
  const currentData = steps[currentStep] || null;
  const totalSteps = steps.length;
  const isActive = algorithmType !== null;
  const isComplete = currentStep >= totalSteps - 1;

  // Stop the auto-play interval
  const stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start algorithm
  const startAlgorithm = useCallback((type, srcId, nodes, edges, directed) => {
    stopInterval();
    setSavedEdges(edges);
    setSavedDirected(directed);
    const sortedIds = nodes.map(n => n.id).sort((a, b) => a - b);
    setSavedNodeIds(sortedIds);
    setDestinationNode(null);
    setHoveredCell(null);

    let genSteps = [];
    if (type === 'bfs') {
      genSteps = generateBFSSteps(srcId, nodes, edges, directed);
    } else if (type === 'dfs') {
      genSteps = generateDFSSteps(srcId, nodes, edges, directed);
    } else if (type === 'dijkstra') {
      genSteps = generateDijkstraSteps(srcId, nodes, edges, directed);
    } else if (type === 'bfsSp') {
      genSteps = generateBFSSpSteps(srcId, nodes, edges, directed);
    } else if (type === 'bellmanFord') {
      genSteps = generateBellmanFordSteps(srcId, nodes, edges, directed);
    } else if (type === 'floydWarshall') {
      genSteps = generateFloydWarshallSteps(nodes, edges, directed);
    } else if (type === 'kruskal') {
      genSteps = generateKruskalSteps(nodes, edges);
    } else if (type === 'prim') {
      genSteps = generatePrimSteps(srcId, nodes, edges);
    } else if (type === 'topoSort') {
      genSteps = generateKahnSteps(nodes, edges);
    } else if (type === 'kosaraju') {
      genSteps = generateKosarajuSteps(nodes, edges);
    } else if (type === 'bipartite') {
      genSteps = generateBipartiteSteps(nodes, edges);
    } else if (type === 'bridgesAndAPs') {
      genSteps = generateBridgesAndAPsSteps(nodes, edges);
    } else if (type === 'cycleDetection') {
      genSteps = generateCycleDetectionSteps(nodes, edges, directed);
    }

    setSteps(genSteps);
    setCurrentStep(0);
    setAlgorithmType(type);
    setSourceNode(srcId);
    setIsPlaying(false);
    setSelectingSource(null);

    // Update active SP/MST/Analysis tab states record
    if (type === 'dijkstra' || type === 'bellmanFord' || type === 'floydWarshall' || type === 'kruskal' || type === 'prim' || type === 'topoSort' || type === 'kosaraju' || type === 'bipartite' || type === 'bridgesAndAPs' || type === 'cycleDetection') {
      setAlgoStates(prev => ({
        ...prev,
        [type]: {
          steps: genSteps,
          currentStep: 0,
          speed: speed,
          sourceNode: srcId,
          destinationNode: null,
          hoveredCell: null,
        }
      }));
    }
  }, [stopInterval, speed]);

  // Begin source selection mode
  const beginSelectSource = useCallback((type) => {
    stopInterval();
    setAlgorithmType(null);
    setSteps([]);
    setCurrentStep(0);
    setIsPlaying(false);
    setSourceNode(null);
    setSelectingSource(type);
    setDestinationNode(null);
    setSavedEdges([]);
    setSavedNodeIds([]);
  }, [stopInterval]);

  // Play / Pause
  const play = useCallback(() => {
    if (isComplete) return;
    setIsPlaying(true);
  }, [isComplete]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    stopInterval();
  }, [stopInterval]);

  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  // Next step
  const nextStep = useCallback(() => {
    setCurrentStep(prev => {
      if (prev >= totalSteps - 1) {
        setIsPlaying(false);
        stopInterval();
        return prev;
      }
      return prev + 1;
    });
  }, [totalSteps, stopInterval]);

  // Previous step
  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);

  // Reset — clear algorithm state but keep the graph
  const reset = useCallback(() => {
    stopInterval();
    setAlgorithmType(null);
    setSteps([]);
    setCurrentStep(0);
    setIsPlaying(false);
    setSourceNode(null);
    setSelectingSource(null);
    setDestinationNode(null);
    setSavedEdges([]);
    setSavedNodeIds([]);
    setHoveredCell(null);
    setAlgoStates({
      dijkstra: { steps: [], currentStep: 0, speed: 'medium', sourceNode: null, destinationNode: null },
      bellmanFord: { steps: [], currentStep: 0, speed: 'medium', sourceNode: null, destinationNode: null },
      floydWarshall: { steps: [], currentStep: 0, speed: 'medium', hoveredCell: null },
      kruskal: { steps: [], currentStep: 0, speed: 'medium' },
      prim: { steps: [], currentStep: 0, speed: 'medium', sourceNode: null },
      topoSort: { steps: [], currentStep: 0, speed: 'medium' },
      kosaraju: { steps: [], currentStep: 0, speed: 'medium' },
      bipartite: { steps: [], currentStep: 0, speed: 'medium' },
      bridgesAndAPs: { steps: [], currentStep: 0, speed: 'medium' },
      cycleDetection: { steps: [], currentStep: 0, speed: 'medium' },
    });
  }, [stopInterval]);

  // Switch tab and load saved states
  const switchSpTab = useCallback((newTab, nodes, edges, directed) => {
    stopInterval();
    const oldTab = algorithmType;

    // Save current active tab state
    let updatedStates = { ...algoStates };
    if (oldTab === 'dijkstra' || oldTab === 'bellmanFord' || oldTab === 'floydWarshall' || oldTab === 'kruskal' || oldTab === 'prim' || oldTab === 'topoSort' || oldTab === 'kosaraju' || oldTab === 'bipartite' || oldTab === 'bridgesAndAPs' || oldTab === 'cycleDetection') {
      updatedStates[oldTab] = {
        steps,
        currentStep,
        speed,
        sourceNode,
        destinationNode,
        hoveredCell,
      };
      setAlgoStates(updatedStates);
    }

    // Load target tab state
    const targetState = updatedStates[newTab];
    setAlgorithmType(newTab);
    setIsPlaying(false);
    setSpeed(targetState.speed);

    if (targetState.steps.length === 0) {
      // Not initialized yet
      setSteps([]);
      setCurrentStep(0);
      setSourceNode(null);
      setDestinationNode(null);
      setHoveredCell(null);
      setSavedEdges(edges);
      setSavedDirected(directed);
      const sortedIds = nodes.map(n => n.id).sort((a, b) => a - b);
      setSavedNodeIds(sortedIds);

      if (newTab === 'floydWarshall') {
        const genSteps = generateFloydWarshallSteps(nodes, edges, directed);
        setSteps(genSteps);
        setCurrentStep(0);
        
        setAlgoStates(prev => ({
          ...prev,
          floydWarshall: {
            steps: genSteps,
            currentStep: 0,
            speed: targetState.speed,
            hoveredCell: null,
          }
        }));
      } else if (newTab === 'kruskal' || newTab === 'topoSort' || newTab === 'kosaraju' || newTab === 'bipartite' || newTab === 'bridgesAndAPs' || newTab === 'cycleDetection') {
        let genSteps = [];
        if (newTab === 'kruskal') genSteps = generateKruskalSteps(nodes, edges);
        else if (newTab === 'topoSort') genSteps = generateKahnSteps(nodes, edges);
        else if (newTab === 'kosaraju') genSteps = generateKosarajuSteps(nodes, edges);
        else if (newTab === 'bipartite') genSteps = generateBipartiteSteps(nodes, edges);
        else if (newTab === 'bridgesAndAPs') genSteps = generateBridgesAndAPsSteps(nodes, edges);
        else if (newTab === 'cycleDetection') genSteps = generateCycleDetectionSteps(nodes, edges, directed);

        setSteps(genSteps);
        setCurrentStep(0);
        
        setAlgoStates(prev => ({
          ...prev,
          [newTab]: {
            steps: genSteps,
            currentStep: 0,
            speed: targetState.speed,
          }
        }));
      } else {
        setSelectingSource(newTab);
      }
    } else {
      // Restore
      setSteps(targetState.steps);
      setCurrentStep(targetState.currentStep);
      setSourceNode(targetState.sourceNode);
      setDestinationNode(targetState.destinationNode);
      setHoveredCell(targetState.hoveredCell);
      setSelectingSource(null);
    }
  }, [algorithmType, steps, currentStep, speed, sourceNode, destinationNode, hoveredCell, algoStates, stopInterval]);

  // Auto-play effect
  useEffect(() => {
    if (isPlaying && !isComplete) {
      const ms = SPEEDS[speed] || SPEEDS.medium;
      intervalRef.current = setInterval(() => {
        setCurrentStep(prev => {
          if (prev >= totalSteps - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, ms);
    } else {
      stopInterval();
    }
    return stopInterval;
  }, [isPlaying, isComplete, speed, totalSteps, stopInterval]);

  // When step reaches end, stop playing
  useEffect(() => {
    if (currentStep >= totalSteps - 1 && totalSteps > 0) {
      setIsPlaying(false);
      stopInterval();
    }
  }, [currentStep, totalSteps, stopInterval]);

  // Backtrack logic for selected query path
  const queryPathEdges = useMemo(() => {
    if (steps.length === 0 || savedEdges.length === 0) return new Set();

    if (algorithmType === 'floydWarshall') {
      if (!hoveredCell || !currentData || !currentData.next) return new Set();
      const { from, to } = hoveredCell;
      const pathNodesList = getFloydWarshallPath(from, to, savedNodeIds, currentData.next);

      const pathEdges = new Set();
      for (let i = 0; i < pathNodesList.length - 1; i++) {
        const u = pathNodesList[i];
        const v = pathNodesList[i + 1];
        const edge = savedEdges.find(e =>
          (e.from === u && e.to === v) ||
          (!savedDirected && e.to === u && e.from === v)
        );
        if (edge) {
          pathEdges.add(edge.id);
        }
      }
      return pathEdges;
    }

    // Dijkstra or Bellman-Ford
    const finalDestNode = destinationNode;
    const finalSourceNode = sourceNode;
    if (!finalDestNode || !finalSourceNode) return new Set();

    const finalStep = steps[steps.length - 1];
    if (!finalStep || !finalStep.parentMap) return new Set();

    const pathEdges = new Set();
    let current = finalDestNode;

    while (current !== null && current !== finalSourceNode) {
      const parent = finalStep.parentMap[current];
      if (parent === undefined || parent === null) break;

      const edge = savedEdges.find(e =>
        (e.from === parent && e.to === Number(current)) ||
        (!savedDirected && e.to === parent && e.from === Number(current))
      );
      if (edge) {
        pathEdges.add(edge.id);
      }
      current = parent;
    }
    return pathEdges;
  }, [destinationNode, sourceNode, steps, savedEdges, savedDirected, algorithmType, hoveredCell, currentData, savedNodeIds]);

  const queryPathNodes = useMemo(() => {
    if (steps.length === 0) return new Set();

    if (algorithmType === 'floydWarshall') {
      if (!hoveredCell || !currentData || !currentData.next) return new Set();
      const { from, to } = hoveredCell;
      const pathNodesList = getFloydWarshallPath(from, to, savedNodeIds, currentData.next);
      return new Set(pathNodesList);
    }

    const finalDestNode = destinationNode;
    const finalSourceNode = sourceNode;
    if (!finalDestNode || !finalSourceNode) return new Set();

    const finalStep = steps[steps.length - 1];
    if (!finalStep || !finalStep.parentMap) return new Set();

    const pathNodes = new Set();
    let current = finalDestNode;
    pathNodes.add(current);

    while (current !== null && current !== finalSourceNode) {
      const parent = finalStep.parentMap[current];
      if (parent === undefined || parent === null) break;
      pathNodes.add(parent);
      current = parent;
    }
    return pathNodes;
  }, [destinationNode, sourceNode, steps, algorithmType, hoveredCell, currentData, savedNodeIds]);

  // Dijkstra & Bellman-Ford shortest path tree edges
  const shortestPathTreeEdges = useMemo(() => {
    if (steps.length === 0 || savedEdges.length === 0) return new Set();
    if (algorithmType === 'floydWarshall') return new Set();
    
    const finalStep = steps[steps.length - 1];
    if (!finalStep || !finalStep.parentMap || finalStep.negativeCycle) return new Set();

    const treeEdges = new Set();
    Object.entries(finalStep.parentMap).forEach(([child, parent]) => {
      if (parent !== null) {
        const edge = savedEdges.find(e =>
          (e.from === parent && e.to === Number(child)) ||
          (!savedDirected && e.to === parent && e.from === Number(child))
        );
        if (edge) {
          treeEdges.add(edge.id);
        }
      }
    });
    return treeEdges;
  }, [steps, savedEdges, savedDirected, algorithmType]);

  return {
    // State
    algorithmType,
    steps,
    currentStep,
    totalSteps,
    currentData,
    isPlaying,
    isActive,
    isComplete,
    speed,
    sourceNode,
    selectingSource,
    destinationNode,
    hoveredCell,
    queryPathEdges,
    queryPathNodes,
    shortestPathTreeEdges,

    // Actions
    startAlgorithm,
    beginSelectSource,
    play,
    pause,
    togglePlay,
    nextStep,
    prevStep,
    reset,
    setSpeed,
    setDestinationNode,
    setHoveredCell,
    switchSpTab,
  };
}
