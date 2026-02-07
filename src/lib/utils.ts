import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { PlaceHolderImages } from "./placeholder-images";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getAvatarUrl = (avatarId: string) => {
  if (!avatarId) return `https://picsum.photos/seed/placeholder/100/100`;
  if (avatarId.startsWith('data:image')) {
    return avatarId;
  }
  const image = PlaceHolderImages.find(img => img.id === avatarId);
  return image ? image.imageUrl : `https://picsum.photos/seed/${avatarId}/100/100`;
};

export const getAiHint = (avatarId: string) => {
  if (!avatarId || avatarId.startsWith('data:image')) {
    return '';
  }
  const image = PlaceHolderImages.find(img => img.id === avatarId);
  return image ? image.imageHint : 'person face';
}

export function exportToCsv(filename: string, rows: object[]) {
  if (!rows || !rows.length) {
    return;
  }
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows.map((row: any) => {
      return keys.map(k => {
        let cell = row[k] === null || row[k] === undefined ? '' : row[k];
        cell = cell instanceof Date
          ? cell.toLocaleString()
          : cell.toString().replace(/"/g, '""');
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell}"`;
        }
        return cell;
      }).join(separator);
    }).join('\n');

  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
