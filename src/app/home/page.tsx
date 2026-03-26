"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { hasDraft } from "@/lib/draft";
import StatusBadge from "@/components/StatusBadge";

interface DeliveryProof {
  id: string;
  created_at: string;
  status: "normal" | "defective" | "treated";
  received_by_name: string;
  suppliers: { name: string } | null;
}

export default function HomePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [deliveries, setDeliveries] = useState<DeliveryProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftExists, setDraftExists] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
      } else {
        setUserEmail(session.user.email ?? "");
        setReady(true);
        fetchDeliveries();
      }
    });
    setDraftExists(hasDraft());
  }, [router]);

  const fetchDeliveries = async () => {
    setLoading(true);
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("delivery_proofs")
      .select("id, created_at, status, received_by_name, suppliers(name)")
      .gte("created_at", today + "T00:00:00")
      .lte("created_at", today + "T23:59:59")
      .order("created_at", { ascending: false });

    setDeliveries((data as unknown as DeliveryProof[]) ?? []);
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

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
        <div className="flex items-center justify-between py-6">
          <h1 className="text-3xl font-bold tracking-tight text-[#111]">Theou.</h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block truncate max-w-[160px]">{userEmail}</span>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-500 hover:text-[#111] transition-colors font-medium"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Draft Resume Banner */}
        {draftExists && (
          <Link
            href="/intake"
            className="flex items-center gap-3 w-full rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3.5 mb-4 hover:bg-yellow-100 transition-colors"
          >
            <span className="text-xl">ð</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-800">×××©× ×××××</p>
              <p className="text-xs text-yellow-700 mt-0.5">Resume draft in progress</p>
            </div>
            <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}

        {/* New Intake Button */}
        <Link
          href="/intake"
          className="flex items-center justify-center gap-3 w-full h-16 rounded-xl bg-[#111] text-white font-bold text-lg mb-6 hover:bg-gray-900 transition-colors active:scale-[0.98]"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          ×§××× ××¡×¤×§×
        </Link>

        {/* Today's Deliveries */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-[#111]">Today&apos;s Deliveries</h2>
            <button
              onClick={fetchDeliveries}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
            </div>
          ) : deliveries.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-sm font-medium">No deliveries yet today</p>
              <p className="text-xs mt-1">Tap the button above to log a delivery</p>
            </div>
          ) : (
            <div className="space-y-2">
              {deliveries.map((d) => (
                <Link
                  key={d.id}
                  href={`/delivery/${d.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#111] truncate">
                      {d.suppliers?.name ?? "Unknown supplier"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatTime(d.created_at)} Â· {d.received_by_name}
                    </p>
                  </div>
                  <StatusBadge status={d.status} />
                  <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
