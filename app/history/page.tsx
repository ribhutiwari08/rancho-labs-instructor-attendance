import AppShell from '@/components/AppShell';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function HistoryPage(){
 const supabase=await createServerSupabaseClient(); const {data:{user}}=await supabase.auth.getUser();
 const {data}=await supabase.from('attendance').select('*').eq('user_id',user?.id ?? '').order('check_in_at',{ascending:false}).limit(100);
 return <AppShell><div><p className="text-sm font-semibold text-indigo-600">Attendance</p><h1 className="mt-1 text-3xl font-bold">My history</h1><div className="surface mt-7 overflow-hidden rounded-2xl"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-slate-500"><tr><th className="px-5 py-4">Date</th><th className="px-5 py-4">Check-in</th><th className="px-5 py-4">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{(data??[]).map(r=><tr key={r.id}><td className="px-5 py-4 font-medium">{new Date(`${r.attendance_date}T00:00:00+05:30`).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}</td><td className="px-5 py-4 text-slate-600">{new Date(r.check_in_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</td><td className="px-5 py-4"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{r.status}</span></td></tr>)}{(!data||data.length===0)&&<tr><td colSpan={3} className="px-5 py-12 text-center text-slate-400">No attendance records yet.</td></tr>}</tbody></table></div></div></div></AppShell>;
}
