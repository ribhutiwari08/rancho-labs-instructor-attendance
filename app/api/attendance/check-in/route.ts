import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { data: profile } = await supabase.from('profiles').select('role,is_active').eq('id', user.id).single();
    if (!profile?.is_active || profile.role !== 'instructor') return NextResponse.json({ error: 'Only active instructors can check in.' }, { status: 403 });
    const form = await request.formData();
    const image = form.get('image');
    if (!(image instanceof File)) return NextResponse.json({ error: 'A camera image is required.' }, { status: 400 });
    if (!['image/jpeg','image/webp'].includes(image.type)) return NextResponse.json({ error: 'Only JPEG or WebP images are supported.' }, { status: 400 });
    if (image.size > 3 * 1024 * 1024) return NextResponse.json({ error: 'Image must be 3MB or smaller.' }, { status: 400 });
    const now = new Date();
    const indiaDate = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
    const path = `${user.id}/${indiaDate}/${now.toISOString().replace(/[:.]/g,'-')}.jpg`;
    const bytes = new Uint8Array(await image.arrayBuffer());
    const { error: uploadError } = await supabase.storage.from('attendance-selfies').upload(path, bytes, { contentType:'image/jpeg', upsert:false });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });
    const { data: record, error: insertError } = await supabase.from('attendance').insert({ user_id:user.id, selfie_path:path }).select('id,check_in_at,attendance_date,status').single();
    if (insertError) { await supabase.storage.from('attendance-selfies').remove([path]); if (insertError.code === '23505') return NextResponse.json({ error:'You have already checked in today.' }, { status:409 }); return NextResponse.json({ error:insertError.message }, { status:500 }); }
    return NextResponse.json({ success:true, attendance:record });
  } catch { return NextResponse.json({ error:'Unexpected server error.' },{status:500}); }
}
