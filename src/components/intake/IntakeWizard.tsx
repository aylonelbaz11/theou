"use client";

import { useState, useEffect } from "react";
import { saveDraft, loadDraft } from "@/lib/draft";
import Step1Scan from "./Step1Scan";
import Step2Signatures from "./Step2Signatures";
import Step3Photos from "./Step3Photos";
import Step4Details from "./Step4Details";

const STEPS = ["Scan", "Signatures", "Photos", "Details"];

interface WizardState {
  step: number;
  scanDataUri?: string;
  driverSignatureUri?: string;
  receiverSignatureUri?: string;
  conditionStatus: "normal" | "defective";
  photoDataUris: string[];
  defectDescription?: string;
  supplierId?: string;
  supplierName?: string;
  deliveryNoteNumber?: string;
  receivedByName?: string;
}

const DEFAULT_STATE: WizardState = {
  step: 1,
  conditionStatus: "normal",
  photoDataUris: [],
};

export default function IntakeWizard() {
  const [state, setState] = useState<WizardState>(DEFAULT_STATE);
  const [loaded, setLoaded] = useState(false);

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setState({
        step: draft.step,
        scanDataUri: draft.scanDataUri,
        driverSignatureUri: draft.driverSignatureUri,
        receiverSignatureUri: draft.receiverSignatureUri,
        conditionStatus: draft.conditionStatus,
        photoDataUris: draft.photoDataUris,
        defectDescription: draft.defectDescription,
        supplierId: draft.supplierId,
        supplierName: draft.supplierName,
        deliveryNoteNumber: draft.deliveryNoteNumber,
        receivedByName: draft.receivedByName,
      });
    }
    setLoaded(true);
  }, []);

  // Auto-save draft on every state change
  useEffect(() => {
    if (!loaded) return;
    saveDraft({
      step: state.step,
      scanDataUri: state.scanDataUri,
      driverSignatureUri: state.driverSignatureUri,
      receiverSignatureUri: state.receiverSignatureUri,
      conditionStatus: state.conditionStatus,
      photoDataUris: state.photoDataUris,
      defectDescription: state.defectDescription,
      supplierId: state.supplierId,
      supplierName: state.supplierName,
      deliveryNoteNumber: state.deliveryNoteNumber,
      receivedByName: state.receivedByName,
    });
  }, [state, loaded]);

  const update = (partial: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#111] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Step progress */}
      <div className="flex items-center gap-1">
        {STEPS.map((label, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === state.step;
          const isDone = stepNum < state.step;
          return (
            <div key={label} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1 flex-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                    isDone
                      ? "bg-[#111] text-white"
                      : isActive
                      ? "bg-[#111] text-white ring-4 ring-gray-200"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isDone ? (
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    stepNum
                  )}
                </div>
                <span className={`text-[10px] font-medium ${isActive ? "text-[#111]" : "text-gray-400"}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mb-4 transition-colors ${
                    isDone ? "bg-[#111]" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      {state.step === 1 && (
        <Step1Scan
          scanDataUri={state.scanDataUri}
          onScanCaptured={(uri) => update({ scanDataUri: uri })}
          onNext={() => update({ step: 2 })}
        />
      )}

      {state.step === 2 && (
        <Step2Signatures
          driverSignatureUri={state.driverSignatureUri}
          receiverSignatureUri={state.receiverSignatureUri}
          onDriverSigned={(uri) => update({ driverSignatureUri: uri })}
          onReceiverSigned={(uri) => update({ receiverSignatureUri: uri })}
          onNext={() => update({ step: 3 })}
          onBack={() => update({ step: 1 })}
        />
      )}

      {state.step === 3 && (
        <Step3Photos
          conditionStatus={state.conditionStatus}
          photoDataUris={state.photoDataUris}
          defectDescription={state.defectDescription}
          onStatusChange={(status) => update({ conditionStatus: status })}
          onPhotosAdded={(uris) => update({ photoDataUris: [...state.photoDataUris, ...uris] })}
          onPhotoDeleted={(i) => update({ photoDataUris: state.photoDataUris.filter((_, idx) => idx !== i) })}
          onDefectDescriptionChange={(desc) => update({ defectDescription: desc })}
          onNext={() => update({ step: 4 })}
          onBack={() => update({ step: 2 })}
        />
      )}

      {state.step === 4 && state.scanDataUri && state.driverSignatureUri && state.receiverSignatureUri && (
        <Step4Details
          supplierId={state.supplierId}
          supplierName={state.supplierName}
          deliveryNoteNumber={state.deliveryNoteNumber}
          receivedByName={state.receivedByName}
          conditionStatus={state.conditionStatus}
          defectDescription={state.defectDescription}
          scanDataUri={state.scanDataUri}
          driverSignatureUri={state.driverSignatureUri}
          receiverSignatureUri={state.receiverSignatureUri}
          photoDataUris={state.photoDataUris}
          onSupplierChange={(id, name) => update({ supplierId: id, supplierName: name })}
          onDeliveryNoteChange={(val) => update({ deliveryNoteNumber: val })}
          onReceivedByChange={(val) => update({ receivedByName: val })}
          onBack={() => update({ step: 3 })}
        />
      )}
    </div>
  );
}
