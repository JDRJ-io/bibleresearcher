import { supabase } from '@/lib/supabaseClient';

export async function uploadAvatar(userId: string, file: File) {
  if (!userId) throw new Error('Not signed in');

  const ext = file.name.split('.').pop() || 'png';
  const path = `avatars/${userId}/${crypto.randomUUID()}.${ext}`;

  // 1) Upload (policy enforces avatars/{userId}/…)
  const up = await supabase().storage.from('avatars').upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (up.error) throw up.error;

  // 2) Persist to profile via RPC (so clients can't change other fields)
  const rpc = await supabase().rpc('fn_set_avatar', { p_path: path });
  if (rpc.error) throw rpc.error;

  // 3) Get URL
  const { data: pub } = supabase().storage.from('avatars').getPublicUrl(path);
  return pub?.publicUrl ?? null;
}