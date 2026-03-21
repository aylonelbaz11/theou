"use client";

import { useRef } from "react";
import Image from "next/image";

interface Step1ScanProps {
  scanDataUri: string | undefined;
  onScanCaptured: (dataUri: string) => void;
  onNext: () => void;
}

export default function Step1Scan({ scanDataUri, onScanCaptured, onNext }: Step1ScanProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      onScanCaptured(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-[#111]">Scan Invoice</h2>
        <p className="mt-1 text-sm text-gray-500">
          Capture a clear photo of the paper invoice
        </p>
      </div>

      {!scanDataUri ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full h-48 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors"
        >
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="text-sm font-medium">Tap to scan invoice</span>
          <span className="text-xs">Opens camera on mobile</span>
        </button>
      ) : (
        <div className="space-y-3">
          <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            <Image
              src={scanDataUri}
              alt="Invoice scan"
              width={600}
              height={400}
              className="w-full h-auto object-contain max-h-64"
              unoptimized
            />
          </div>
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Retake
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        onClick={onNext}
        disabled={!scanDataUri}
        className="w-full h-12 rounded-xl bg-[#111] text-white font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-opacity mt-auto"
      >
        Continue
      </button>
    </div>
  );
}
