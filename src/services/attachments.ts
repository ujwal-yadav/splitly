import * as ImagePicker from 'expo-image-picker';
/** Small embedded images survive relaunch on web and native; no public receipt URLs. */
export async function choosePhoto(camera = false, avatar = false): Promise<string | null> {
  if (camera) {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted)
      throw new Error('Camera access was denied. You can choose an image instead.');
  }
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    base64: true,
    quality: 0.35,
    allowsEditing: avatar,
    ...(avatar ? { aspect: [1, 1] as [number, number] } : {}),
  };
  const result = camera
    ? await ImagePicker.launchCameraAsync(options)
    : await ImagePicker.launchImageLibraryAsync(options);
  if (result.canceled) return null;
  const image = result.assets[0];
  if (!image.base64) throw new Error('This image could not be read. Try another image.');
  if (image.base64.length > 900000) throw new Error('Choose a smaller image (under about 650 KB).');
  return `data:${image.mimeType ?? 'image/jpeg'};base64,${image.base64}`;
}
