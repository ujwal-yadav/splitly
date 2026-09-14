import { supabase } from '@/lib/supabase';
import type { DbGroup, GroupMember, Profile } from '@/types/database';

export interface GroupWithMembers extends DbGroup {
  member_count: number;
  members: (GroupMember & { profile: Profile })[];
}

export async function getGroups(userId: string): Promise<DbGroup[]> {
  const { data, error } = await supabase
    .from('groups')
    .select('*, group_members!inner(user_id)')
    .eq('group_members.user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getGroup(groupId: string): Promise<GroupWithMembers | null> {
  const { data, error } = await supabase
    .from('groups')
    .select('*, group_members(*, profile:profiles(*))')
    .eq('id', groupId)
    .single();

  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    member_count: data.group_members?.length ?? 0,
    members: data.group_members ?? [],
  } as GroupWithMembers;
}

export async function createGroup(
  name: string,
  icon: string,
  type: string,
  createdBy: string,
  memberIds: string[],
): Promise<DbGroup> {
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({ name, icon, type, created_by: createdBy })
    .select()
    .single();

  if (groupError || !group) throw groupError ?? new Error('Failed to create group');

  const members = [
    { group_id: group.id, user_id: createdBy, role: 'admin' as const },
    ...memberIds
      .filter((id) => id !== createdBy)
      .map((id) => ({ group_id: group.id, user_id: id, role: 'member' as const })),
  ];

  const { error: memberError } = await supabase.from('group_members').insert(members);
  if (memberError) throw memberError;

  return group;
}

export async function updateGroup(
  groupId: string,
  updates: Partial<Pick<DbGroup, 'name' | 'icon' | 'type' | 'image_url'>>,
): Promise<void> {
  const { error } = await supabase.from('groups').update(updates).eq('id', groupId);
  if (error) throw error;
}

export async function addGroupMember(groupId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('group_members')
    .insert({ group_id: groupId, user_id: userId, role: 'member' });
  if (error) throw error;
}

export async function removeGroupMember(groupId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function searchUsers(query: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,username.ilike.%${query}%`)
    .limit(10);

  if (error) throw error;
  return data ?? [];
}
