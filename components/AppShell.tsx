'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, CalendarCheck, FileText, LayoutDashboard, LogOut, Settings, Users, Camera } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';

const items=[
  {href:'/dashboard',label:'Dashboard',icon:LayoutDashboard},
  {href:'/check-in',label:'Check In',icon:Camera},
  {href:'/history',label:'My History',icon:CalendarCheck},
  {href:'/admin',label:'Admin',icon:BarChart3,admin:true},
  {href:'/admin/attendance',label:'Attendance',icon:CalendarCheck,admin:true},
  {href:'/admin/instructors',label:'Instructors',icon:Users,admin:true},
  {href:'/admin/reports',label:'Reports',icon:FileText,admin:true},
  {href:'/admin/settings',label:'Settings',icon:Settings,admin:true},
];
export default function AppShell({children}:{children:React.ReactNode}){
 const path=usePathname(); const supabase=createBrowserSupabaseClient();
 async function logout(){await supabase.auth.signOut(); window.location.href='/login';}
 return <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(99,102,241,.12),transparent_34%),radial-gradient(circle_at_90%_10%,rgba(34,211,238,.10),transparent_32%),#f5f7ff]"><aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200/70 bg-white/85 p-5 backdrop-blur-xl lg:block"><div className="flex items-center gap-3 px-2 pb-7"><div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-500 text-white flex items-center justify-center font-bold">RL</div><div><div className="font-bold">Rancho Labs</div><div className="text-xs text-slate-400">Attendance System</div></div></div><nav className="space-y-1">{items.map(i=>{const Icon=i.icon; const active=path===i.href||path.startsWith(i.href+'/'); return <Link key={i.href} href={i.href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${active?'bg-indigo-50 text-indigo-700':'text-slate-600 hover:bg-slate-50'}`}><Icon className="h-4 w-4"/>{i.label}</Link>})}</nav><button onClick={logout} className="absolute bottom-6 left-5 right-5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600"><LogOut className="h-4 w-4"/>Logout</button></aside><main className="min-h-screen lg:pl-64"><div className="mx-auto max-w-7xl p-5 md:p-8">{children}</div></main></div>;
}
