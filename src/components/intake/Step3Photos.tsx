"use client";

import { useRef } from "react";
import Image from "next/image";

interface Step3PhotosProps {
  conditionStatus: "normal" | "defective";
  photoDataUris: string[];
  defectDescription: string | undefined;
  onStatusChange: (status: "normal" | "defective") => void;
  onPhotosAdded: (uris: string[]) => void;
  onPhotoDeleted: (index: number) => void;
  onDefectDescriptionChange: (desc: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step3Photos({
  conditionStatus,
  photoDataUris,
  defectDescription,
  onStatusChange,
  onPhotosAdded,
  onPhotoDeleted,
  onDefectDescriptionChange,
  onNext,
  onBack,
}: Step3PhotosProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const minPhotos = conditionStatus === "defective" ? 3 : 1;
  const hasEnoughPhotos = photoDataUris.length >= minPhotos;
  const hasDefectDesc = conditionStatus === "normal" || (defectDescription ?? "").trim().length > 0;
  const canProceed = hasEnoughPhotos && hasDefectDesc;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;

    const promises = files.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.readAsDataURL(file);
        })
    );

    Promise.all(promises).then((uris) => {
      onPhotosAdded(uris);
    });

    // Reset input so same files can be re-selected
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-[#111]">Condition & Photos</h2>
        <p className="mt-1 text-sm text-gray-500">
          Document the delivery condition
        </p>
      </div>

      {/* Status Toggle */}
      <div>
        <p className="text-sm font-medium text-[#111] mb-2">Delivery condition</p>
        <div className="flex gap-2">
          <button
            onClick={() => onStatusChange("normal")}
            className={`flex-1 h-11 rounded-xl text-sm font-medium transition-colors ${
              conditionStatus === "normal"
                ? "bg-green-100 text-green-700 border border-green-200"
                : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            Normal
          </button>
          <button
            onClick={() => onStatusChange("defective")}
            className={`flex-1 h-11 rounded-xl text-sm font-medium transition-colors ${
              conditionStatus === "defective"
                ? "bg-red-100 text-red-700 border border-red-200"
                : "bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100"
            }`}
          >
            Defective
          </button>
        </div>
      </div>

      {/* Defect description */}
      {conditionStatus === "defective" && (
        <div>
          <label className="block text-sm font-medium text-[#111] mb-1">
            Defect description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={defectDescription ?? ""}
            onChange={(e) => onDefectDescriptionChange(e.target.value)}
            placeholder="Describe what's damaged or wrong..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-[#111] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111] focus:border-transparent text-sm resize-none"
          />
        </div>
      )}

      {/* Photos */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-[#111]">
            Photos
            <span className="text-gray-400 ml-1 font-normal">
              (min {minPhotos} required)
            </span>
          </p>
          <span className={`text-xs font-medium ${hasEnoughPhotos ? "text-green-600" : "text-gray-400"}`}>
            {photoDataUris.length}/{minPhotos}
          </span>
        </div>

        {/* Photo grid */}
        {photoDataUris.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {photoDataUris.map((uri, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                <Image
                  src={uri}
                  alt={`Photo ${i + 1}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <button
                  onClick={() => onPhotoDeleted(i)}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center"
                >
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => inputRef.current?.click()}
          className="w-full h-12 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center gap-2 text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="text-sm font-medium">Add photos</span>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
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
  );
}
