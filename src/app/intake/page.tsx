"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import IntakeWizard from "@/components/intake/IntakeWizard";

export default function IntakePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/login");
      } else {
        setReady(true);
      }
    });
  }, [router]);

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
          <h1 className="text-base font-semibold text-[#111]">New Delivery Intake</h1>
        </div>

        <IntakeWizard />
      </div>
    </div>
  );
}
