"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { getSignedUrl } from "@/lib/storage";
import StatusBadge from "@/components/StatusBadge";

interface ProofFile {
  id: string;
  type: "scan" | "driver_signature" | "receiver_signature" | "condition_photo";
  storage_path: string;
  signedUrl?: string;
}

interface DeliveryProof {
  id: string;
  created_at: string;
  status: "normal" | "defective" | "treated";
  received_by_name: string;
  delivery_note_number: string | null;
  defect_description: string | null;
  treatment_note: string | null;
  treated_at: string | null;
  suppliers: { name: string; phone: string | null; email: string | null } | null;
}

export default function DeliveryRecordPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [ready, setReady] = useState(false);
  const [proof, setProof] = useState<DeliveryProof | null>(null);
  const [files, setFiles] = useState<ProofFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
      } else {
        setReady(true);
        fetchRecord();
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, id]);

  const fetchRecord = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch proof
      const { data: proofData, error: proofErr } = await supabase
        .from("delivery_proofs")
        .select("id, created_at, status, received_by_name, delivery_note_number, defect_description, treatment_note, treated_at, suppliers(name, phone, email)")
        .eq("id", id)
        .single();

      if (proofErr) throw new Error(proofErr.message);
      setProof(proofData as unknown as DeliveryProof);

      // Fetch files
      const { data: filesData, error: filesErr } = await supabase
        .from("proof_files")
        .select("id, type, storage_path")
        .eq("proof_id", id);

      if (filesErr) throw new Error(filesErr.message);

      // Get signed URLs
      const filesWithUrls = await Promise.all(
        (filesData ?? []).map(async (f) => {
          try {
            const signedUrl = await getSignedUrl(f.storage_path, 3600);
            return { ...f, signedUrl } as ProofFile;
          } catch {
            return { ...f, signedUrl: undefined } as ProofFile;
          }
        })
      );

      setFiles(filesWithUrls);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load record");
    } finally {
      setLoading(false);
    }
  };

  const getFile = (type: ProofFile["type"]) => files.find((f) => f.type === type);
  const getFiles = (type: ProofFile["type"]) => files.filter((f) => f.type === type);

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleString([], {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#111] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-4 pb-10">
        {/* Header */}
        <div className="flex items-center gap-4 py-5 border-b border-gray-100 mb-6">
          <Link
            href="/home"
            className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4 text-[#111]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-base font-semibold text-[#111]">Delivery Record</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#111] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : proof ? (
          <div className="space-y-6">
            {/* Main info */}
            <div className="rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-semibold text-[#111]">
                    {proof.suppliers?.name ?? "Unknown supplier"}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {formatDateTime(proof.created_at)}
                  </p>
                </div>
                <StatusBadge status={proof.status} />
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Received by</span>
                  <span className="font-medium text-[#111]">{proof.received_by_name}</span>
                </div>
                {proof.delivery_note_number && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Delivery note #</span>
                    <span className="font-medium text-[#111]">{proof.delivery_note_number}</span>
                  </div>
                )}
                {proof.suppliers?.phone && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Supplier phone</span>
                    <span className="font-medium text-[#111]">{proof.suppliers.phone}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Defect description */}
            {proof.status === "defective" && proof.defect_description && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Defect Description</p>
                <p className="text-sm text-red-800">{proof.defect_description}</p>
              </div>
            )}

            {/* Treatment note */}
            {proof.status === "treated" && proof.treatment_note && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
                <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Treatment Note</p>
                <p className="text-sm text-blue-800">{proof.treatment_note}</p>
                {proof.treated_at && (
                  <p className="text-xs text-blue-500 mt-1">{formatDateTime(proof.treated_at)}</p>
                )}
              </div>
            )}

            {/* Scan */}
            {getFile("scan")?.signedUrl && (
              <div>
                <p className="text-sm font-semibold text-[#111] mb-2">Invoice Scan</p>
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <Image
                    src={getFile("scan")!.signedUrl!}
                    alt="Invoice scan"
                    width={600}
                    height={800}
                    className="w-full h-auto"
                    unoptimized
                  />
                </div>
              </div>
            )}

            {/* Signatures */}
            {(getFile("driver_signature")?.signedUrl || getFile("receiver_signature")?.signedUrl) && (
              <div>
                <p className="text-sm font-semibold text-[#111] mb-2">Signatures</p>
                <div className="grid grid-cols-2 gap-3">
                  {getFile("driver_signature")?.signedUrl && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1 text-center">Driver</p>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                        <Image
                          src={getFile("driver_signature")!.signedUrl!}
                          alt="Driver signature"
                          width={200}
                          height={100}
                          className="w-full h-auto object-contain"
                          unoptimized
                        />
                      </div>
                    </div>
                  )}
                  {getFile("receiver_signature")?.signedUrl && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1 text-center">Receiver</p>
                      <div className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                        <Image
                          src={getFile("receiver_signature")!.signedUrl!}
                          alt="Receiver signature"
                          width={200}
                          height={100}
                          className="w-full h-auto object-contain"
                          unoptimized
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Condition photos */}
            {getFiles("condition_photo").length > 0 && (
              <div>
                <p className="text-sm font-semibold text-[#111] mb-2">
                  Condition Photos ({getFiles("condition_photo").length})
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {getFiles("condition_photo").map((f, i) =>
                    f.signedUrl ? (
                      <div key={f.id} className="rounded-xl overflow-hidden border border-gray-200 aspect-square">
                        <Image
                          src={f.signedUrl}
                          alt={`Condition photo ${i + 1}`}
                          width={300}
                          height={300}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
