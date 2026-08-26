import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth:{autoRefreshToken:false,persistSession:false} });
  const cutoff = new Date(Date.now() - 60*24*60*60*1000);
  const cutoffDate = cutoff.toISOString().slice(0,10);
  const { data: oldRows, error } = await service.from('attendance').select('id,selfie_path,attendance_date,check_in_at,user_id').lt('attendance_date', cutoffDate).order('attendance_date',{ascending:true});
  if(error) return NextResponse.json({error:error.message},{status:500});
  if(!oldRows?.length) return NextResponse.json({success:true,archived:0,deleted:0});
  const periodStart=oldRows[0].attendance_date; const periodEnd=oldRows[oldRows.length-1].attendance_date;
  const report = { generated_at:new Date().toISOString(), period_start:periodStart, period_end:periodEnd, records:oldRows.map(r=>({id:r.id,user_id:r.user_id,attendance_date:r.attendance_date,check_in_at:r.check_in_at,status:'present'})) };
  const archivePath=`archives/${periodStart}_to_${periodEnd}.json`;
  const upload = await service.storage.from('attendance-selfies').upload(archivePath,new TextEncoder().encode(JSON.stringify(report,null,2)),{contentType:'application/json',upsert:true});
  if(upload.error) return NextResponse.json({error:upload.error.message},{status:500});
  const archive = await service.from('attendance_archives').insert({period_start:periodStart,period_end:periodEnd,file_path:archivePath}).select('id').single();
  if(archive.error) return NextResponse.json({error:archive.error.message},{status:500});
  const paths=oldRows.map(r=>r.selfie_path).filter(Boolean);
  if(paths.length){const removed=await service.storage.from('attendance-selfies').remove(paths);if(removed.error)return NextResponse.json({error:`Archive created but selfie deletion failed: ${removed.error.message}`,archiveId:archive.data?.id},{status:500});}
  const ids=oldRows.map(r=>r.id); const deletion=await service.from('attendance').delete().in('id',ids);
  if(deletion.error)return NextResponse.json({error:`Archive created and selfies removed, but database deletion failed: ${deletion.error.message}`,archiveId:archive.data?.id},{status:500});
  return NextResponse.json({success:true,archiveId:archive.data?.id,archived:oldRows.length,deleted:ids.length});
}
