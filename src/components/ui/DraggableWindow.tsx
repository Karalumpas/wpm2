'use client';

import { useEffect, useRef, useState } from 'react';

type Pos = { x: number; y: number };

export type DraggableWindowProps = {
  id: string; // used for localStorage persistence
  title: string;
  initialPos?: Pos;
  initialSize?: { w: number; h?: number };
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
};

const storageKey = (id: string) => `wpm2.window.${id}`;

export default function DraggableWindow({
  id,
  title,
  initialPos = { x: 80, y: 80 },
  initialSize = { w: 380, h: undefined },
  children,
  onClose,
  className,
}: DraggableWindowProps) {
  const [pos, setPos] = useState<Pos>(initialPos);
  const [collapsed, setCollapsed] = useState(false);
  const draggingRef = useRef<{
    dx: number;
    dy: number;
    startX: number;
    startY: number;
  } | null>(null);

  // Load persisted position/collapsed state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey(id));
      if (raw) {
        const saved = JSON.parse(raw) as { pos?: Pos; collapsed?: boolean };
        if (saved.pos) setPos(saved.pos);
        if (typeof saved.collapsed === 'boolean') setCollapsed(saved.collapsed);
      }
    } catch {}
  }, [id]);

  // Persist position/collapsed
  useEffect(() => {
    try {
      localStorage.setItem(storageKey(id), JSON.stringify({ pos, collapsed }));
    } catch {}
  }, [id, pos, collapsed]);

  function onPointerDownHeader(e: React.PointerEvent<HTMLDivElement>) {
    // Only left button
    if (e.button !== 0) return;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    draggingRef.current = {
      dx: pos.x,
      dy: pos.y,
      startX: e.clientX,
      startY: e.clientY,
    };
  }

  function onPointerMoveHeader(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    const { dx, dy, startX, startY } = draggingRef.current;
    const nx = dx + (e.clientX - startX);
    const ny = dy + (e.clientY - startY);
    setPos({ x: nx, y: ny });
  }

  function onPointerUpHeader(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    draggingRef.current = null;
  }

  return (
    <div
      className={`fixed z-40 shadow-lg border border-gray-200 rounded-lg bg-white ${className || ''}`}
      style={{
        left: pos.x,
        top: pos.y,
        width: initialSize.w,
        maxHeight: '80vh',
      }}
    >
      <div
        className="cursor-move select-none px-3 py-2 border-b bg-gray-50 rounded-t-lg flex items-center justify-between gap-2"
        onPointerDown={onPointerDownHeader}
        onPointerMove={onPointerMoveHeader}
        onPointerUp={onPointerUpHeader}
      >
        <div
          className="text-sm font-semibold text-gray-900 truncate"
          title={title}
        >
          {title}
        </div>
        <div className="flex items-center gap-1">
          <button
            className="text-xs px-2 py-1 rounded border hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed((c) => !c);
            }}
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? 'Expand' : 'Collapse'}
          </button>
          <button
            className="text-xs px-2 py-1 rounded border hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              onClose?.();
            }}
            aria-label="Close"
          >
            Close
          </button>
        </div>
      </div>
      {!collapsed && (
        <div
          className="p-3 overflow-auto"
          style={{
            height: initialSize.h ? initialSize.h : 'auto',
            maxHeight: initialSize.h ? initialSize.h : 'calc(80vh - 42px)',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
