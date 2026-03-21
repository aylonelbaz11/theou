"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { uploadBlob, buildStoragePath } from "@/lib/storage";
import { clearDraft } from "@/lib/draft";

interface Supplier {
  id: string;
  name: string;
}

interface Step4DetailsProps {
  supplierId: string | undefined;
  supplierName: string | undefined;
  deliveryNoteNumber: string | undefined;
  receivedByName: string | undefined;
  conditionStatus: "normal" | "defective";
  defectDescription: string | undefined;
  scanDataUri: string;
  driverSignatureUri: string;
  receiverSignatureUri: string;
  photoDataUris: string[];
  onSupplierChange: (id: string | undefined, name: string) => void;
  onDeliveryNoteChange: (val: string) => void;
  onReceivedByChange: (val: string) => void;
  onBack: () => void;
}

export default function Step4Details({
  supplierId,
  supplierName,
  deliveryNoteNumber,
  receivedByName,
  conditionStatus,
  defectDescription,
  scanDataUri,
  driverSignatureUri,
  receiverSignatureUri,
  photoDataUris,
  onSupplierChange,
  onDeliveryNoteChange,
  onReceivedByChange,
  onBack,
}: Step4DetailsProps) {
  const router = useRouter();
  const [supplierSearch, setSupplierSearch] = useState(supplierName ?? "");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveProgress, setSaveProgress] = useState("");

  const canSave = (supplierName ?? supplierSearch).trim().length > 0 && (receivedByName ?? "").trim().length > 0;

  const searchSuppliers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuppliers([]);
      return;
    }
    const { data } = await supabase
      .from("suppliers")
      .select("id, name")
      .ilike("name", `%${query}%`)
      .limit(10);
    setSuppliers(data ?? []);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchSuppliers(supplierSearch);
    }, 200);
    return () => clearTimeout(timer);
  }, [supplierSearch, searchSuppliers]);

  const dataUriToBlob = async (dataUri: string): Promise<Blob> => {
    const res = await fetch(dataUri);
    return res.blob();
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Get current user's org
      setSaveProgress("Getting organization...");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data: allowedEmail, error: emailErr } = await supabase
        .from("allowed_emails")
        .select("organization_id")
        .eq("email", session.user.email)
        .single();

      if (emailErr || !allowedEmail) throw new Error("Organization not found for your email");
      const orgId = allowedEmail.organization_id;

      // Create supplier if new, or use existing
      let finalSupplierId = supplierId;
      const finalSupplierName = supplierName ?? supplierSearch.trim();

      if (!finalSupplierId) {
        setSaveProgress("Creating supplier...");
        // Check if supplier with this name exists
        const { data: existingSupplier } = await supabase
          .from("suppliers")
          .select("id")
          .eq("organization_id", orgId)
          .ilike("name", finalSupplierName)
          .single();

        if (existingSupplier) {
          finalSupplierId = existingSupplier.id;
        } else {
          const { data: newSupplier, error: supplierErr } = await supabase
            .from("suppliers")
            .insert({ organization_id: orgId, name: finalSupplierName })
            .select("id")
            .single();
          if (supplierErr) throw new Error(`Failed to create supplier: ${supplierErr.message}`);
          finalSupplierId = newSupplier.id;
        }
      }

      // Insert delivery_proof record
      setSaveProgress("Creating delivery record...");
      const proofPayload: Record<string, unknown> = {
        organization_id: orgId,
        supplier_id: finalSupplierId,
        delivery_note_number: (deliveryNoteNumber ?? "").trim() || null,
        received_by_name: (receivedByName ?? "").trim(),
        status: conditionStatus,
        defect_description: conditionStatus === "defective" ? (defectDescription ?? "") : null,
      };

      const { data: proof, error: proofErr } = await supabase
        .from("delivery_proofs")
        .insert(proofPayload)
        .select("id")
        .single();
      if (proofErr) throw new Error(`Failed to create proof: ${proofErr.message}`);
      const proofId = proof.id;

      // Upload files
      const uploadFile = async (dataUri: string, filename: string, type: string, contentType: string) => {
        const blob = await dataUriToBlob(dataUri);
        const path = buildStoragePath(orgId, finalSupplierId!, proofId, filename);
        await uploadBlob(path, blob, contentType);
        await supabase.from("proof_files").insert({
          organization_id: orgId,
          proof_id: proofId,
          type,
          storage_path: path,
        });
      };

      setSaveProgress("Uploading invoice scan...");
      await uploadFile(scanDataUri, "scan.png", "scan", "image/png");

      setSaveProgress("Uploading driver signature...");
      await uploadFile(driverSignatureUri, "driver_signature.png", "driver_signature", "image/png");

      setSaveProgress("Uploading receiver signature...");
      await uploadFile(receiverSignatureUri, "receiver_signature.png", "receiver_signature", "image/png");

      for (let i = 0; i < photoDataUris.length; i++) {
        setSaveProgress(`Uploading photo ${i + 1} of ${photoDataUris.length}...`);
        await uploadFile(photoDataUris[i], `condition_photo_${i + 1}.png`, "condition_photo", "image/png");
      }

      clearDraft();
      router.push("/home");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(msg);
      setSaving(false);
      setSaveProgress("");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-[#111]">Delivery Details</h2>
        <p className="mt-1 text-sm text-gray-500">Almost done — fill in the details</p>
      </div>

      {/* Supplier */}
      <div className="relative">
        <label className="block text-sm font-medium text-[#111] mb-1">
          Supplier <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={supplierSearch}
          onChange={(e) => {
            setSupplierSearch(e.target.value);
            onSupplierChange(undefined, e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search or type supplier name..."
          className="w-full h-12 px-4 rounded-xl border border-gray-200 text-[#111] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111] focus:border-transparent text-sm"
        />

        {/* Dropdown */}
        {showDropdown && suppliers.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
            {suppliers.map((s) => (
              <button
                key={s.id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setSupplierSearch(s.name);
                  onSupplierChange(s.id, s.name);
                  setShowDropdown(false);
                }}
                className="w-full text-left px-4 py-3 text-sm text-[#111] hover:bg-gray-50 border-b border-gray-100 last:border-0"
              >
                {s.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Delivery note number */}
      <div>
        <label className="block text-sm font-medium text-[#111] mb-1">
          Delivery Note Number <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={deliveryNoteNumber ?? ""}
          onChange={(e) => onDeliveryNoteChange(e.target.value)}
          placeholder="e.g. DN-12345"
          className="w-full h-12 px-4 rounded-xl border border-gray-200 text-[#111] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111] focus:border-transparent text-sm"
        />
      </div>

      {/* Received by */}
      <div>
        <label className="block text-sm font-medium text-[#111] mb-1">
          Received by <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={receivedByName ?? ""}
          onChange={(e) => onReceivedByChange(e.target.value)}
          placeholder="Your name"
          className="w-full h-12 px-4 rounded-xl border border-gray-200 text-[#111] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#111] focus:border-transparent text-sm"
        />
      </div>

      {/* Summary */}
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Summary</p>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${conditionStatus === "normal" ? "bg-green-500" : "bg-red-500"}`} />
          <span className="text-sm text-[#111] capitalize">{conditionStatus} delivery</span>
        </div>
        <p className="text-sm text-gray-600">
          {photoDataUris.length} photo{photoDataUris.length !== 1 ? "s" : ""} · Scan ✓ · Driver signature ✓ · Receiver signature ✓
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {saving && saveProgress && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
          {saveProgress}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onBack}
          disabled={saving}
          className="flex-1 h-12 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave || saving}
          className="flex-1 h-12 rounded-xl bg-[#111] text-white font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            "Save Delivery"
          )}
        </button>
      </div>
    </div>
  );
}
