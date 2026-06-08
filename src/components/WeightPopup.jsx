import { useState, useRef, useEffect } from 'react';

export default function WeightPopup({ x, y, onConfirm, onCancel }) {
  const [value, setValue] = useState('1');
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus & select on mount
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    const num = parseFloat(value);
    if (!isNaN(num)) {
      onConfirm(num);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div
      className="fixed z-[100]"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 px-4 py-3 rounded-xl"
        style={{
          background: 'var(--color-bg-surface)',
          border: '2px solid var(--color-border)',
          boxShadow: '4px 4px 0px var(--color-border), 0 8px 24px rgba(61,44,30,0.15)',
          fontFamily: "'Patrick Hand', cursive",
          animation: 'tooltipFadeIn 0.15s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <label
          className="text-sm whitespace-nowrap"
          style={{ color: 'var(--color-text-secondary)', fontSize: '1rem' }}
        >
          Weight:
        </label>
        <input
          ref={inputRef}
          type="number"
          step="any"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-20 px-2 py-1.5 rounded-lg text-center outline-none"
          style={{
            background: 'var(--color-bg-primary)',
            border: '1.5px solid var(--color-border)',
            color: 'var(--color-text-primary)',
            fontFamily: "'Caveat', cursive",
            fontSize: '1.2rem',
            fontWeight: 600,
          }}
        />
        <button
          type="submit"
          className="px-3 py-1.5 rounded-lg transition-all duration-150"
          style={{
            background: '#5bba6f',
            color: '#fff',
            border: 'none',
            fontFamily: "'Patrick Hand', cursive",
            fontSize: '0.95rem',
            boxShadow: '2px 2px 0px #459a56',
            cursor: 'pointer',
          }}
        >
          ✓
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg transition-all duration-150"
          style={{
            background: 'transparent',
            color: 'var(--color-accent-danger)',
            border: '1.5px solid var(--color-accent-danger)',
            fontFamily: "'Patrick Hand', cursive",
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          ✗
        </button>
      </form>
    </div>
  );
}
