'use client';

import { AsteriaMark } from './AsteriaMark';

export function AsteriaSpinner({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={`relative inline-flex items-center justify-center animate-spin ${className}`}
      style={{ width: size, height: size }}
      aria-label="Loading..."
    >
      <AsteriaMark className="w-full h-full text-os-accent drop-shadow-[0_0_12px_rgba(6,182,212,0.45)]" />
    </div>
  );
}

export function ScanlineShimmer() {
  return (
    <div className="relative w-full h-1 overflow-hidden bg-os-surface2 rounded">
      <div className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-os-accent to-transparent animate-pulse" />
    </div>
  );
}
