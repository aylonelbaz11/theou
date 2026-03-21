"use client";

import { useState } from "react";
import Image from "next/image";
import SignaturePad from "@/components/SignaturePad";

interface Step2SignaturesProps {
  driverSignatureUri: string | undefined;
  receiverSignatureUri: string | undefined;
  onDriverSigned: (uri: string) => void;
  onReceiverSigned: (uri: string) => void;
  onNext: () => void;
  onBack: () => void;
}

type PadTarget = "driver" | "receiver" | null;

export default function Step2Signatures({
  driverSignatureUri,
  receiverSignatureUri,
  onDriverSigned,
  onReceiverSigned,
  onNext,
  onBack,
}: Step2SignaturesProps) {
  const [activePad, setActivePad] = useState<PadTarget>(null);

  const canProceed = !!driverSignatureUri && !!receiverSignatureUri;

  const handleSave = (dataUri: string) => {
    if (activePad === "driver") onDriverSigned(dataUri);
    else if (activePad === "receiver") onReceiverSigned(dataUri);
    setActivePad(null);
  };

  return (
    <>
      {activePad && (
        <SignaturePad
          title={activePad === "driver" ? "Driver Signature" : "Receiver Signature"}
          onSave={handleSave}
          onCancel={() => setActivePad(null)}
        />
      )}

      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-semibold text-[#111]">Signatures</h2>
          <p className="mt-1 text-sm text-gray-500">
            Both signatures are required
          </p>
        </div>

        {/* Driver Signature */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#111]">Driver Signature</span>
            {driverSignatureUri && (
              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Driver signed
              </span>
            )}
          </div>

          {driverSignatureUri ? (
            <div className="space-y-2">
              <div className="w-full h-28 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                <Image
                  src={driverSignatureUri}
                  alt="Driver signature"
                  width={400}
                  height={112}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              </div>
              <button
                onClick={() => setActivePad("driver")}
                className="w-full h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Re-sign
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActivePad("driver")}
              className="w-full h-28 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className="text-sm font-medium">Tap to add driver signature</span>
            </button>
          )}
        </div>

        {/* Receiver Signature */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#111]">Your Signature</span>
            {receiverSignatureUri && (
              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                You signed
              </span>
            )}
          </div>

          {receiverSignatureUri ? (
            <div className="space-y-2">
              <div className="w-full h-28 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                <Image
                  src={receiverSignatureUri}
                  alt="Receiver signature"
                  width={400}
                  height={112}
                  className="w-full h-full object-contain"
                  unoptimized
                />
              </div>
              <button
                onClick={() => setActivePad("receiver")}
                className="w-full h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Re-sign
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActivePad("receiver")}
              className="w-full h-28 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className="text-sm font-medium">Tap to add your signature</span>
            </button>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="flex-1 h-12 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={onNext}
            disabled={!canProceed}
            className="flex-1 h-12 rounded-xl bg-[#111] text-white font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          >
            Continue
          </button>
        </div>
      </div>
    </>
  );
}
