import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { PlaceHolderImages } from "./placeholder-images";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getAvatarUrl = (avatarId: string) => {
  const image = PlaceHolderImages.find(img => img.id === avatarId);
  return image ? image.imageUrl : `https://picsum.photos/seed/${avatarId}/100/100`;
};

export const getAiHint = (avatarId: string) => {
  const image = PlaceHolderImages.find(img => img.id === avatarId);
  return image ? image.imageHint : 'person face';
}
