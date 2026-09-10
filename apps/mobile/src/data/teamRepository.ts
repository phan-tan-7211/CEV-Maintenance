import { supabase } from '../lib/supabase';
import { getNextManagementCode } from './managementCodes';

export type TeamMemberPreview = { userId: string; role: string };
export type TeamListItem = {
  id: string; code: string; name: string; description?: string; active: boolean; createdAt?: string; memberCount: number; members: TeamMemberPreview[];
};

export async function listTeamsWithMembers(): Promise<TeamListItem[]> {
  const { data: teamRows, error: teamError } = await supabase.from('teams').select('id,code,name,description,active,created_at').eq('active', true).order('name');
  if (teamError) throw teamError;
  const ids = (teamRows ?? []).map((row: any) => row.id);
  if (!ids.length) return [];

  const { data: memberRows, error: memberError } = await supabase.from('team_members').select('team_id,user_id,role').in('team_id', ids);
  if (memberError) throw memberError;
  const byTeam = new Map<string, TeamMemberPreview[]>();
  for (const row of memberRows ?? []) {
    const list = byTeam.get((row as any).team_id) ?? [];
    list.push({ userId: (row as any).user_id, role: (row as any).role || 'member' });
    byTeam.set((row as any).team_id, list);
  }

  return (teamRows ?? []).map((row: any) => {
    const members = byTeam.get(row.id) ?? [];
    return { id: row.id, code: row.code ?? '', name: row.name, description: row.description ?? undefined, active: row.active !== false, createdAt: row.created_at ?? undefined, memberCount: members.length, members };
  });
}

export async function createTeam(input: { name: string; description?: string }): Promise<TeamListItem> {
  const name = input.name.trim();
  if (!name) throw new Error('Tên nhóm là bắt buộc.');
  const duplicate = await supabase.from('teams').select('id,name').ilike('name', name).eq('active', true).limit(1).maybeSingle();
  if (duplicate.error) throw duplicate.error;
  if (duplicate.data?.id) throw new Error(`Nhóm "${duplicate.data.name}" đã tồn tại.`);

  const code = await getNextManagementCode('teams');
  const { data, error } = await supabase.from('teams').insert({ code, name, description: input.description?.trim() || null, active: true }).select('id,code,name,description,active,created_at').single();
  if (error) throw error;

  const session = await supabase.auth.getSession();
  const userId = session.data.session?.user.id;
  if (userId) {
    const { error: memberError } = await supabase.from('team_members').insert({ team_id: data.id, user_id: userId, role: 'manager' });
    if (memberError && memberError.code !== '23505') throw memberError;
  }

  return { id: data.id, code: data.code ?? '', name: data.name, description: data.description ?? undefined, active: data.active !== false, createdAt: data.created_at ?? undefined, memberCount: userId ? 1 : 0, members: userId ? [{ userId, role: 'manager' }] : [] };
}
