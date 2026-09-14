import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

export type StorageBucket = 'avatars' | 'group-images' | 'receipts';

export async function pickImage(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

export async function takePhoto(): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') return null;

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0].uri;
}

export async function uploadImage(
  bucket: StorageBucket,
  uri: string,
  fileName: string,
): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();

  const fileExt = uri.split('.').pop() ?? 'jpg';
  const path = `${fileName}.${fileExt}`;

  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
    upsert: true,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadAvatar(userId: string, uri: string): Promise<string> {
  const publicUrl = await uploadImage('avatars', uri, userId);

  await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId);

  return publicUrl;
}

export async function uploadGroupImage(groupId: string, uri: string): Promise<string> {
  const publicUrl = await uploadImage('group-images', uri, groupId);

  await supabase.from('groups').update({ image_url: publicUrl }).eq('id', groupId);

  return publicUrl;
}

export async function uploadReceipt(expenseId: string, uri: string): Promise<string> {
  const publicUrl = await uploadImage('receipts', uri, expenseId);

  await supabase.from('expenses').update({ receipt_url: publicUrl }).eq('id', expenseId);

  return publicUrl;
}

export async function deleteImage(bucket: StorageBucket, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}
