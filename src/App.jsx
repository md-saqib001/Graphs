import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Toolbar from './components/Toolbar.jsx';
import GraphCanvas from './components/GraphCanvas.jsx';
import InfoPanel from './components/InfoPanel.jsx';
import WeightPopup from './components/WeightPopup.jsx';
import AlgorithmPanel from './components/AlgorithmPanel.jsx';
import AlgorithmBar from './components/AlgorithmBar.jsx';
import CodeTracer from './components/CodeTracer.jsx';
import { useGraph } from './hooks/useGraph.js';
import { useAlgorithm } from './hooks/useAlgorithm.js';

export default function App() {
  const graph = useGraph();
  const algo = useAlgorithm();
  const [mode, setMode] = useState('addNode');
  const [toast, setToast] = useState(null);

  // Weight popup state
  const [weightPopup, setWeightPopup] = useState(null);

  // Track which algo type the user is selecting source for
  const pendingAlgoType = useRef(null);

  const showToast = useCallback((message) => {
    setToast({ message });
    setTimeout(() => setToast(null), 2000);
  }, []);

  const handleClearAll = useCallback(() => {
    graph.clearAll();
    algo.reset();
    showToast('Page cleared! ✨');
  }, [graph, algo, showToast]);

  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
    setWeightPopup(null);
    // Cancel source selection if switching modes
    if (algo.selectingSource) {
      algo.reset();
    }
  }, [algo]);

  // Weight popup flow
  const handleRequestWeight = useCallback((fromId, toId, x, y) => {
    setWeightPopup({ type: 'add', fromId, toId, x, y, initialValue: 1 });
  }, []);

  const handleEditEdgeWeight = useCallback((edgeId, currentWeight, x, y) => {
    setWeightPopup({ type: 'edit', edgeId, x, y, initialValue: currentWeight });
  }, []);

  const handleWeightConfirm = useCallback((weight) => {
    if (weightPopup) {
      if (weightPopup.type === 'add') {
        graph.addEdge(weightPopup.fromId, weightPopup.toId, weight);
      } else if (weightPopup.type === 'edit') {
        graph.updateEdgeWeight(weightPopup.edgeId, weight);
      }
    }
    setWeightPopup(null);
  }, [weightPopup, graph]);

  const handleWeightCancel = useCallback(() => {
    setWeightPopup(null);
  }, []);

  const handleSave = useCallback(() => {
    const json = graph.getGraphJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'graph.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Graph saved! 💾');
  }, [graph, showToast]);

  // Load handler
  const handleLoad = useCallback((data) => {
    graph.loadGraph(data);
    algo.reset();
    showToast('Graph loaded! 📂');
  }, [graph, algo, showToast]);

  // Preset handler
  const handleLoadPreset = useCallback((presetKey) => {
    graph.loadPreset(presetKey);
    algo.reset();
    showToast('Preset loaded! 🎨');
  }, [graph, algo, showToast]);

  // ── Algorithm launch ────────────────────────────────────────────────
  const handleRunBFS = useCallback(() => {
    if (graph.nodes.length === 0) {
      showToast('Add some nodes first! ✏️');
      return;
    }
    algo.reset();
    pendingAlgoType.current = 'bfs';
    algo.beginSelectSource('bfs');
    setMode('selectSource');
    showToast('🎯 Click a node to start BFS');
  }, [graph.nodes.length, algo, showToast]);

  const handleRunDFS = useCallback(() => {
    if (graph.nodes.length === 0) {
      showToast('Add some nodes first! ✏️');
      return;
    }
    algo.reset();
    pendingAlgoType.current = 'dfs';
    algo.beginSelectSource('dfs');
    setMode('selectSource');
    showToast('🎯 Click a node to start DFS');
  }, [graph.nodes.length, algo, showToast]);

  const handleRunDijkstra = useCallback(() => {
    if (graph.nodes.length === 0) {
      showToast('Add some nodes first! ✏️');
      return;
    }
    algo.reset();
    pendingAlgoType.current = 'dijkstra';
    algo.beginSelectSource('dijkstra');
    setMode('selectSource');
    showToast("🎯 Click a node to start Dijkstra's");
  }, [graph.nodes.length, algo, showToast]);

  const handleRunBFSSp = useCallback(() => {
    if (graph.nodes.length === 0) {
      showToast('Add some nodes first! ✏️');
      return;
    }
    algo.reset();
    pendingAlgoType.current = 'bfsSp';
    algo.beginSelectSource('bfsSp');
    setMode('selectSource');
    showToast('🎯 Click a node to start BFS Shortest Path');
  }, [graph.nodes.length, algo, showToast]);

  const handleRunBellmanFord = useCallback(() => {
    if (graph.nodes.length === 0) {
      showToast('Add some nodes first! ✏️');
      return;
    }
    algo.reset();
    pendingAlgoType.current = 'bellmanFord';
    algo.beginSelectSource('bellmanFord');
    setMode('selectSource');
    showToast('🎯 Click a node to start Bellman-Ford');
  }, [graph.nodes.length, algo, showToast]);

  const handleRunFloydWarshall = useCallback(() => {
    if (graph.nodes.length === 0) {
      showToast('Add some nodes first! ✏️');
      return;
    }
    algo.reset();
    algo.startAlgorithm('floydWarshall', null, graph.nodes, graph.edges, graph.directed);
    setMode('addNode');
    showToast('⚡ Floyd-Warshall started');
  }, [graph.nodes.length, algo, showToast]);

  const handleRunKruskal = useCallback(() => {
    if (graph.nodes.length === 0) {
      showToast('Add some nodes first! ✏️');
      return;
    }
    algo.reset();
    algo.startAlgorithm('kruskal', null, graph.nodes, graph.edges, graph.directed);
    setMode('addNode');
    showToast('⚡ Kruskal started');
  }, [graph.nodes, graph.edges, graph.directed, algo, showToast]);

  const handleRunPrim = useCallback(() => {
    if (graph.nodes.length === 0) {
      showToast('Add some nodes first! ✏️');
      return;
    }
    algo.reset();
    pendingAlgoType.current = 'prim';
    algo.beginSelectSource('prim');
    setMode('selectSource');
    showToast("🎯 Click a node to start Prim's");
  }, [graph.nodes.length, algo, showToast]);

  const handleRunKahn = useCallback(() => {
    if (graph.nodes.length === 0) {
      showToast('Add some nodes first! ✏️');
      return;
    }
    algo.reset();
    algo.startAlgorithm('topoSort', null, graph.nodes, graph.edges, graph.directed);
    setMode('addNode');
    showToast("🔢 Topological Sort (Kahn's) started");
  }, [graph.nodes, graph.edges, graph.directed, algo, showToast]);

  const handleRunKosaraju = useCallback(() => {
    if (graph.nodes.length === 0) {
      showToast('Add some nodes first! ✏️');
      return;
    }
    algo.reset();
    algo.startAlgorithm('kosaraju', null, graph.nodes, graph.edges, graph.directed);
    setMode('addNode');
    showToast("🎨 Kosaraju's SCC algorithm started");
  }, [graph.nodes, graph.edges, graph.directed, algo, showToast]);

  const handleRunBipartite = useCallback(() => {
    if (graph.nodes.length === 0) {
      showToast('Add some nodes first! ✏️');
      return;
    }
    algo.reset();
    algo.startAlgorithm('bipartite', null, graph.nodes, graph.edges, graph.directed);
    setMode('addNode');
    showToast("🔴🔵 Bipartite Check started");
  }, [graph.nodes, graph.edges, graph.directed, algo, showToast]);

  const handleRunBridgesAndAPs = useCallback(() => {
    if (graph.nodes.length === 0) {
      showToast('Add some nodes first! ✏️');
      return;
    }
    algo.reset();
    algo.startAlgorithm('bridgesAndAPs', null, graph.nodes, graph.edges, graph.directed);
    setMode('addNode');
    showToast("🌉 Bridges & Articulation Points started");
  }, [graph.nodes, graph.edges, graph.directed, algo, showToast]);

  const handleRunCycleDetection = useCallback(() => {
    if (graph.nodes.length === 0) {
      showToast('Add some nodes first! ✏️');
      return;
    }
    algo.reset();
    algo.startAlgorithm('cycleDetection', null, graph.nodes, graph.edges, graph.directed);
    setMode('addNode');
    showToast("🔄 Cycle Detection started");
  }, [graph.nodes, graph.edges, graph.directed, algo, showToast]);

  // Source node selected
  const handleNodeClickAlgo = useCallback((nodeId) => {
    const type = pendingAlgoType.current || algo.selectingSource;
    if (!type) return;
    algo.startAlgorithm(type, nodeId, graph.nodes, graph.edges, graph.directed);
    setMode('addNode'); // Exit selectSource mode
    pendingAlgoType.current = null;
  }, [algo, graph]);

  // Algorithm reset handler
  const handleAlgoReset = useCallback(() => {
    algo.reset();
    setMode('addNode');
  }, [algo]);

  // Check if graph contains negative edge weights
  const hasNegativeWeights = useMemo(() => {
    return graph.edges.some(e => (e.weight ?? 1) < 0);
  }, [graph.edges]);

  // SP Tab Switcher callback
  const handleSpTabChange = useCallback((newTab) => {
    algo.switchSpTab(newTab, graph.nodes, graph.edges, graph.directed);
  }, [algo, graph]);

  // Reactive synchronizer for selecting source mode
  useEffect(() => {
    if (algo.selectingSource) {
      setMode('selectSource');
      pendingAlgoType.current = algo.selectingSource;
    } else if (mode === 'selectSource' && !pendingAlgoType.current) {
      setMode('addNode');
    }
  }, [algo.selectingSource, mode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Undo
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        graph.undo();
        return;
      }
      // Redo
      if (e.ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        graph.redo();
        return;
      }
      // Save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
        return;
      }

      // Algorithm shortcuts
      if (algo.isActive) {
        if (e.key === ' ') {
          e.preventDefault();
          algo.togglePlay();
          return;
        }
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          algo.nextStep();
          return;
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          algo.prevStep();
          return;
        }
      }

      switch (e.key.toLowerCase()) {
        case 'n':
          if (!algo.isActive) setMode('addNode');
          break;
        case 'e':
          if (!algo.isActive) setMode('addEdge');
          break;
        case 'd':
          if (!algo.isActive) setMode('delete');
          break;
        case 'x':
          if (e.ctrlKey && e.shiftKey) handleClearAll();
          break;
        case 'escape':
          setWeightPopup(null);
          if (algo.isActive || algo.selectingSource) {
            handleAlgoReset();
          } else {
            setMode('addNode');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClearAll, handleSave, graph, algo, handleAlgoReset]);

  const modeMessages = {
    addNode: '🖍️ Click on the page to place a node',
    addEdge: '📏 Click two nodes to draw a line',
    delete: '🧹 Click a node or edge to erase',
    selectSource: '🎯 Click a node to start the algorithm',
  };

  const modeColors = {
    addNode: '#5bba6f',
    addEdge: '#3b82c4',
    delete: '#e8573a',
    selectSource: '#f28c28',
  };

  // Extract algo visualization data from current step
  const algoNodeColors = algo.currentData?.nodeStates || null;
  const algoEdgeColors = algo.currentData?.edgeStates || null;
  const algoCurrentNode = algo.currentData?.currentNode || null;

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Top Algorithm Bar */}
      <AlgorithmBar
        onRunBFS={handleRunBFS}
        onRunDFS={handleRunDFS}
        onRunDijkstra={handleRunDijkstra}
        onRunBFSSp={handleRunBFSSp}
        onRunBellmanFord={handleRunBellmanFord}
        onRunFloydWarshall={handleRunFloydWarshall}
        onRunKruskal={handleRunKruskal}
        onRunPrim={handleRunPrim}
        onRunKahn={handleRunKahn}
        onRunKosaraju={handleRunKosaraju}
        onRunBipartite={handleRunBipartite}
        onRunBridgesAndAPs={handleRunBridgesAndAPs}
        onRunCycleDetection={handleRunCycleDetection}
        algoActive={algo.isActive}
        selectingSource={algo.selectingSource}
        weighted={graph.weighted}
      />

      {/* Left Toolbar */}
      <Toolbar
        mode={mode}
        onModeChange={handleModeChange}
        directed={graph.directed}
        onToggleDirected={graph.toggleDirected}
        weighted={graph.weighted}
        onToggleWeighted={graph.toggleWeighted}
        onClearAll={handleClearAll}
        nodeCount={graph.nodes.length}
        edgeCount={graph.edges.length}
        canUndo={graph.canUndo}
        canRedo={graph.canRedo}
        onUndo={graph.undo}
        onRedo={graph.redo}
        onSave={handleSave}
        onLoad={handleLoad}
        onLoadPreset={handleLoadPreset}
        algoActive={algo.isActive}
      />

      {/* Canvas — full screen, panels float over it */}
      <div className="absolute inset-0">
        <GraphCanvas
          nodes={graph.nodes}
          edges={graph.edges}
          directed={graph.directed}
          weighted={graph.weighted}
          mode={mode}
          onAddNode={graph.addNode}
          onRemoveNode={graph.removeNode}
          onUpdateNodePosition={graph.updateNodePosition}
          onAddEdge={graph.addEdge}
          onRemoveEdge={graph.removeEdge}
          onBeginDrag={graph.beginDrag}
          onCommitDrag={graph.commitDrag}
          onRequestWeight={handleRequestWeight}
          onEditEdgeWeight={handleEditEdgeWeight}
          nodeColors={algoNodeColors}
          edgeColors={algoEdgeColors}
          currentNode={algoCurrentNode}
          algoMode={algo.isActive}
          onNodeClickAlgo={handleNodeClickAlgo}
          queryPathEdges={algo.queryPathEdges}
          queryPathNodes={algo.queryPathNodes}
          shortestPathTreeEdges={algo.shortestPathTreeEdges}
          destinationNode={algo.algorithmType === 'floydWarshall' ? (algo.hoveredCell?.to ?? null) : algo.destinationNode}
          sourceNode={algo.algorithmType === 'floydWarshall' ? (algo.hoveredCell?.from ?? null) : algo.sourceNode}
          isAlgoSp={
            algo.algorithmType === 'dijkstra' || 
            algo.algorithmType === 'bfsSp' || 
            algo.algorithmType === 'bellmanFord' || 
            algo.algorithmType === 'floydWarshall'
          }
          isComplete={algo.isComplete}
          onNodeClickDest={algo.setDestinationNode}
        />
      </div>

      {/* Right Info Panel */}
      <InfoPanel
        nodes={graph.nodes}
        edges={graph.edges}
        directed={graph.directed}
        weighted={graph.weighted}
        algoActive={algo.isActive}
        algorithmType={algo.algorithmType}
        currentData={algo.currentData}
        onCellHover={algo.setHoveredCell}
      />

      {/* Weight Popup */}
      {weightPopup && (
        <WeightPopup
          x={weightPopup.x}
          y={weightPopup.y}
          initialValue={weightPopup.initialValue}
          onConfirm={handleWeightConfirm}
          onCancel={handleWeightCancel}
        />
      )}

      {/* Algorithm Panel — bottom overlay */}
      <AlgorithmPanel
        algorithmType={algo.algorithmType}
        currentData={algo.currentData}
        currentStep={algo.currentStep}
        totalSteps={algo.totalSteps}
        isPlaying={algo.isPlaying}
        isComplete={algo.isComplete}
        speed={algo.speed}
        onTogglePlay={algo.togglePlay}
        onNextStep={algo.nextStep}
        onPrevStep={algo.prevStep}
        onReset={handleAlgoReset}
        onSetSpeed={algo.setSpeed}
        sourceNode={algo.algorithmType === 'floydWarshall' ? (algo.hoveredCell?.from ?? null) : algo.sourceNode}
        hasNegativeWeights={hasNegativeWeights}
        onSpTabChange={handleSpTabChange}
        nodes={graph.nodes}
        directed={graph.directed}
      />

      {/* Draggable Code Tracer overlay */}
      {algo.isActive && (
        <CodeTracer
          algorithmType={algo.algorithmType}
          currentData={algo.currentData}
        />
      )}

      {/* Mode indicator pill — hide when algo panel is showing */}
      {!algo.isActive && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-6 py-3 rounded-xl text-base z-50"
          style={{
            background: 'var(--color-bg-surface)',
            border: '2px solid var(--color-border)',
            boxShadow: '3px 3px 0px var(--color-border), 0 4px 16px rgba(61,44,30,0.08)',
            color: 'var(--color-text-secondary)',
            fontFamily: "'Patrick Hand', cursive",
            fontSize: '1.05rem',
          }}
        >
          <div
            className="w-3 h-3 rounded-full"
            style={{
              background: modeColors[mode],
              boxShadow: `0 0 8px ${modeColors[mode]}60`,
            }}
          />
          {modeMessages[mode]}
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div
          className="fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl z-[200]"
          style={{
            background: 'var(--color-bg-surface)',
            border: '2px solid var(--color-border)',
            color: 'var(--color-text-primary)',
            animation: 'tooltipFadeIn 0.2s ease-out',
            boxShadow: '3px 3px 0px var(--color-border)',
            fontFamily: "'Patrick Hand', cursive",
            fontSize: '1.1rem',
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Help badge */}
      {!algo.isActive && (
        <div
          className="fixed bottom-6 right-6 flex items-center gap-2 px-3 py-2 rounded-lg z-30"
          style={{
            background: 'var(--color-bg-surface)',
            border: '1.5px solid var(--color-border)',
            color: 'var(--color-text-muted)',
            fontFamily: "'Patrick Hand', cursive",
            fontSize: '0.85rem',
          }}
        >
          <span style={{ fontSize: '0.75rem' }}>💡</span>
          Ctrl+Z undo · Ctrl+Y redo · Right-click erase
        </div>
      )}
    </div>
  );
}
