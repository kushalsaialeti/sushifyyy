import { type DocumentPickerAsset } from 'expo-document-picker';
import { Directory, File, Paths } from 'expo-file-system';

import { useCreatorStudio } from '../store/creatorStudio';
import { karaokeExtension, type KaraokeAsset } from './projectMedia';

let sequence = 0;
function karaokeDirectory() {
  return new Directory(Paths.cache, 'sushifyyyy-karaoke');
}

export async function copyKaraokeFile(asset: DocumentPickerAsset): Promise<KaraokeAsset> {
  const extension = karaokeExtension(asset.name, asset.mimeType);
  if (!extension) throw new Error('Unsupported karaoke format');
  const directory = karaokeDirectory();
  directory.create({ intermediates: true, idempotent: true });
  const copy = new File(directory, `track-${Date.now()}-${++sequence}.${extension}`);
  try {
    await new File(asset.uri).copy(copy);
    return { name: asset.name, localUri: copy.uri };
  } catch (error) {
    discardKaraokeCopy(copy.uri);
    throw error;
  }
}

export function discardKaraokeCopy(uri: string) {
  const base = karaokeDirectory().uri.replace(/\/$/, '');
  const relative = uri.startsWith(`${base}/`) ? uri.slice(base.length + 1) : '';
  if (!/^track-\d+-\d+\.(mp3|m4a|wav)$/.test(relative)) return;
  const copy = new File(uri);
  try {
    if (copy.exists) copy.delete();
  } catch {
    // Leave failed cleanup to the operating system's cache eviction.
  }
}

export function discardUnreferencedKaraokeCopy(uri: string) {
  if (Object.values(useCreatorStudio.getState().projectMedia).every((media) => media.karaoke?.localUri !== uri)) discardKaraokeCopy(uri);
}
