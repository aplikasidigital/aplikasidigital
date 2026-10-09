import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, CheckCircle2, ShieldCheck, PenTool } from 'lucide-react';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onClear?: () => void;
  juryName: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, onClear, juryName }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [integrityChecked, setIntegrityChecked] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI display
    const ratio = Math.ceil(window.devicePixelRatio || 1);
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.scale(ratio, ratio);

    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Clear background to clean white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
  }, []);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.setPointerCapture(e.pointerId);
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
      setIsDrawing(false);
      onSave(canvas.toDataURL('image/png'));
    }
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasSignature(false);
    if (onClear) onClear();
  };

  return (
    <div className="bg-slate-800/90 border border-amber-500/30 rounded-xl p-4 sm:p-5 shadow-lg">
      <div className="flex items-center gap-2 mb-3">
        <PenTool className="w-5 h-5 text-amber-400" />
        <h4 className="font-semibold text-amber-200 text-sm sm:text-base">
          Tanda Tangan Digital & Pakta Integritas Dewan Juri
        </h4>
      </div>

      <div className="bg-amber-950/40 border border-amber-600/30 rounded-lg p-3 text-xs sm:text-sm text-amber-100/90 mb-4 leading-relaxed flex items-start gap-2">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-amber-300">PAKTA INTEGRITAS RESMI: </span>
          Saya, <span className="underline font-semibold text-white">{juryName}</span>, menyatakan dengan sesungguhnya bahwa penilaian ini dilakukan secara jujur, objektif, independen, tanpa intervensi pihak manapun, serta dapat dipertanggungjawabkan secara moral dan hukum.
        </div>
      </div>

      <label className="flex items-center gap-2 mb-3 cursor-pointer text-xs sm:text-sm text-slate-200">
        <input
          type="checkbox"
          checked={integrityChecked}
          onChange={e => setIntegrityChecked(e.target.checked)}
          className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
        />
        <span className="select-none font-medium">Saya menyetujui dan mematuhi seluruh isi Pakta Integritas di atas.</span>
      </label>

      <div className="relative rounded-lg overflow-hidden border-2 border-dashed border-amber-400/50 bg-white">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-36 sm:h-44 touch-none cursor-crosshair block"
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs sm:text-sm">
            Goreskan tanda tangan Anda di area putih ini (Sentuh / Mouse)
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mt-3">
        <button
          type="button"
          onClick={handleClear}
          className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Hapus Tanda Tangan
        </button>

        <div className="flex items-center gap-2">
          {hasSignature && integrityChecked ? (
            <span className="text-emerald-400 text-xs sm:text-sm flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Tanda Tangan & Pakta Sah
            </span>
          ) : (
            <span className="text-amber-400 text-xs">
              {!integrityChecked ? 'Harap centang Pakta Integritas' : 'Harap bubuhkan tanda tangan'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
