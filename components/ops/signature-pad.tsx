"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, forwardRef, type PointerEvent } from "react";
import { GhostButton } from "./form-primitives";

export type SignaturePadHandle = {
  /** Base64 del PNG (sin prefijo) o `null` si no hay trazo */
  getPngBase64: () => string | null;
  clear: () => void;
  isEmpty: () => boolean;
};

type Props = { label: string };

export const SignaturePad = forwardRef<SignaturePadHandle, Props>(function SignaturePad({ label }, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasInk = useRef(false);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);

  const initCanvas = useCallback((resetInk: boolean) => {
    const c = canvasRef.current;
    if (!c) return;
    if (resetInk) {
      hasInk.current = false;
    }
    const w = c.offsetWidth;
    const h = c.offsetHeight;
    if (w < 2 || h < 2) return;
    const dpr = globalThis.devicePixelRatio ?? 1;
    c.width = Math.floor(w * dpr);
    c.height = Math.floor(h * dpr);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0a0a0a";
  }, []);

  useEffect(() => {
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => initCanvas(true));
    });
    return () => cancelAnimationFrame(t);
  }, [initCanvas]);

  useImperativeHandle(
    ref,
    () => ({
      getPngBase64: () => {
        const c = canvasRef.current;
        if (!c || !hasInk.current) return null;
        return c.toDataURL("image/png").split(",")[1] ?? null;
      },
      clear: () => initCanvas(true),
      isEmpty: () => !hasInk.current,
    }),
    [initCanvas],
  );

  const getPos = (e: PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current;
    if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const onPointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const c = e.currentTarget;
    c.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = getPos(e);
    const ctx = c.getContext("2d");
    if (!ctx || !last.current) return;
    hasInk.current = true;
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
  };

  const onPointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!drawing.current) return;
    const c = canvasRef.current;
    if (!c) return;
    const p = getPos(e);
    const ctx = c.getContext("2d");
    if (!ctx || !last.current) return;
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    hasInk.current = true;
    last.current = p;
  };

  const endStroke = (e: PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    drawing.current = false;
    last.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="overflow-hidden rounded-lg border-2 border-dashed border-border bg-white shadow-inner">
        <canvas
          ref={canvasRef}
          className="h-[120px] w-full min-h-[120px] max-w-full cursor-crosshair touch-none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endStroke}
          onPointerLeave={endStroke}
          onPointerCancel={endStroke}
        />
      </div>
      <div className="flex justify-end">
        <GhostButton type="button" onClick={() => initCanvas(true)}>
          Limpiar
        </GhostButton>
      </div>
    </div>
  );
});
