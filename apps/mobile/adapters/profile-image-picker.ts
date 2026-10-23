import * as ImagePicker from "expo-image-picker";

export type ProfileImageAsset = ImagePicker.ImagePickerAsset;

export const mobileProfileImagePicker = {
  async pickImage(): Promise<ProfileImageAsset | null> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    return result.canceled ? null : result.assets[0] ?? null;
  },
};
