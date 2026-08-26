export type Role = 'instructor' | 'manager' | 'admin';
export type Profile = { id:string; full_name:string; email:string; role:Role; is_active:boolean; created_at:string };
export type Attendance = { id:string; user_id:string; check_in_at:string; attendance_date:string; selfie_path:string; status:'present'|'late'; created_at:string; profiles?:Pick<Profile,'full_name'|'email'> };
