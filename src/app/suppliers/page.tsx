"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
interface Supplier { id: string; name: string; contact_name?: string; phone?: string; email?: string; }
export default function SuppliersPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace("/login"); return; }
      const { data: ae } = await supabase.from("allowed_emails").select("organization_id").eq("email", session.user.email).single();
      if (ae) { setOrgId(ae.organization_id); fetchSuppliers(ae.organization_id); }
      setReady(true);
    });
  }, [router]);
  const fetchSuppliers = async (oid: string) => {
    setLoading(true);
    const { data } = await supabase.from("suppliers").select("id,name,contact_name,phone,email").eq("organization_id", oid).order("name");
    setSuppliers(data ?? []); setLoading(false);
  };
  const handleAdd = async () => {
    if (!name.trim()) return;
    setSaving(true); setError(null);
    const { error: err } = await supabase.from("suppliers").insert({ organization_id: orgId, name: name.trim(), contact_name: contactName.trim()||null, phone: phone.trim()||null, email: email.trim()||null });
    if (err) { setError(err.message); setSaving(false); return; }
    setName(""); setContactName(""); setPhone(""); setEmail(""); setShowForm(false); setSaving(false); fetchSuppliers(orgId);
  };
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this supplier?")) return;
    await supabase.from("suppliers").delete().eq("id", id); fetchSuppliers(orgId);
  };
  const filtered = suppliers.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  if (!ready) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#111] border-t-transparent rounded-full animate-spin"/></div>;
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-lg mx-auto px-4 pb-24">
        <div className="flex items-center justify-between py-6">
          <h1 className="text-3xl font-bold tracking-tight text-[#111]">Suppliers</h1>
          <button onClick={() => { setShowForm(true); setError(null); }} className="flex items-center gap-2 h-10 px-4 rounded-xl bg-[#111] text-white text-sm font-semibold">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>Add
          </button>
        </div>
        <div className="relative mb-4">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search suppliers..." className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#111]"/>
        </div>
        {showForm && (
          <div className="mb-4 rounded-xl border border-gray-200 p-4 space-y-3 bg-gray-50">
            <h3 className="text-sm font-semibold text-[#111]">New Supplier</h3>
            <input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Supplier name *" className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#111]"/>
            <input type="text" value={contactName} onChange={e=>setContactName(e.target.value)} placeholder="Contact name (optional)" className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#111]"/>
            <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="Phone (optional)" className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#111]"/>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email (optional)" className="w-full h-11 px-4 rounded-xl border border-gray-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#111]"/>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button onClick={()=>{setShowForm(false);setError(null);}} className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-600">Cancel</button>
              <button onClick={handleAdd} disabled={!name.trim()||saving} className="flex-1 h-11 rounded-xl bg-[#111] text-white text-sm font-semibold disabled:opacity-40">{saving?"Saving...":"Save Supplier"}</button>
            </div>
          </div>
        )}
        {loading ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin"/></div>
        : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            <p className="text-sm font-medium">{search?"No suppliers match":"No suppliers yet"}</p>
            <p className="text-xs mt-1">{search?"Try a different search":"Tap Add to create your first supplier"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(s => (
              <div key={s.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-all">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-gray-500">{s.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#111] truncate">{s.name}</p>
                  {(s.contact_name||s.phone||s.email)&&<p className="text-xs text-gray-400 mt-0.5 truncate">{[s.contact_name,s.phone,s.email].filter(Boolean).join(" · ")}</p>}
                </div>
                <button onClick={()=>handleDelete(s.id)} className="p-2 text-gray-300 hover:text-red-400 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex">
        <Link href="/home" className="flex-1 flex flex-col items-center py-3 text-gray-400 hover:text-[#111] transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
          <span className="text-xs mt-1">Home</span>
        </Link>
        <Link href="/suppliers" className="flex-1 flex flex-col items-center py-3 text-[#111] border-t-2 border-[#111]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          <span className="text-xs mt-1 font-semibold">Suppliers</span>
        </Link>
      </div>
    </div>
  );
}
