import { useState, useEffect, useCallback } from 'react';
import Toolbar from './components/Toolbar.jsx';
import GraphCanvas from './components/GraphCanvas.jsx';
import InfoPanel from './components/InfoPanel.jsx';
import WeightPopup from './components/WeightPopup.jsx';
import { useGraph } from './hooks/useGraph.js';

export default function App() {
  const graph = useGraph();
  const [mode, setMode] = useState('addNode');
  const [toast, setToast] = useState(null);
  const [infoPanelOpen, setInfoPanelOpen] = useState(true);

  // Weight popup state
  const [weightPopup, setWeightPopup] = useState(null);
  // { fromId, toId, x, y } — screen coords for positioning

  const showToast = useCallback((message) => {
    setToast({ message });
    setTimeout(() => setToast(null), 2000);
  }, []);

  const handleClearAll = useCallback(() => {
    graph.clearAll();
    showToast('Page cleared! ✨');
  }, [graph, showToast]);

  const handleModeChange = useCallback((newMode) => {
    setMode(newMode);
    setWeightPopup(null);
  }, []);

  // Weight popup flow
  const handleRequestWeight = useCallback((fromId, toId, x, y) => {
    setWeightPopup({ fromId, toId, x, y });
  }, []);

  const handleWeightConfirm = useCallback((weight) => {
    if (weightPopup) {
      graph.addEdge(weightPopup.fromId, weightPopup.toId, weight);
    }
    setWeightPopup(null);
  }, [weightPopup, graph]);

  const handleWeightCancel = useCallback(() => {
    setWeightPopup(null);
  }, []);

  // Save handler
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
    showToast('Graph loaded! 📂');
  }, [graph, showToast]);

  // Preset handler
  const handleLoadPreset = useCallback((presetKey) => {
    graph.loadPreset(presetKey);
    showToast('Preset loaded! 🎨');
  }, [graph, showToast]);

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

      switch (e.key.toLowerCase()) {
        case 'n':
          setMode('addNode');
          break;
        case 'e':
          setMode('addEdge');
          break;
        case 'd':
          setMode('delete');
          break;
        case 'x':
          if (e.ctrlKey && e.shiftKey) {
            handleClearAll();
          }
          break;
        case 'escape':
          setWeightPopup(null);
          setMode('addNode');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClearAll, handleSave, graph]);

  const modeMessages = {
    addNode: '🖍️ Click on the page to place a node',
    addEdge: '📏 Click two nodes to draw a line',
    delete: '🧹 Click a node or edge to erase',
  };

  const modeColors = {
    addNode: '#5bba6f',
    addEdge: '#3b82c4',
    delete: '#e8573a',
  };

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: 'var(--color-bg-primary)' }}>
      {/* Left Toolbar */}
      <Toolbar
        mode={mode}
        onModeChange={handleModeChange}
        directed={graph.directed}
        onToggleDirected={graph.toggleDirected}
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
      />

      {/* Canvas — full screen, panels float over it */}
      <div className="absolute inset-0">
        <GraphCanvas
          nodes={graph.nodes}
          edges={graph.edges}
          directed={graph.directed}
          mode={mode}
          onAddNode={graph.addNode}
          onRemoveNode={graph.removeNode}
          onUpdateNodePosition={graph.updateNodePosition}
          onAddEdge={graph.addEdge}
          onRemoveEdge={graph.removeEdge}
          onBeginDrag={graph.beginDrag}
          onCommitDrag={graph.commitDrag}
          onRequestWeight={handleRequestWeight}
        />
      </div>

      {/* Right Info Panel */}
      <InfoPanel
        nodes={graph.nodes}
        edges={graph.edges}
        directed={graph.directed}
      />

      {/* Weight Popup */}
      {weightPopup && (
        <WeightPopup
          x={weightPopup.x}
          y={weightPopup.y}
          onConfirm={handleWeightConfirm}
          onCancel={handleWeightCancel}
        />
      )}

      {/* Mode indicator pill */}
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
    </div>
  );
}
