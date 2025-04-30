import { cacheDb } from '@/databases/cache';
import { FileFragmentizer } from '@/utils/file-fragmentizer';

// Export class
export class FileComposer {
  private totalSize: number = 0;

  public constructor(public targetSize: number) {
    cacheDb.delete({ disableAutoOpen: false });
  }

  public addPacket(p: Uint8Array) {
    const { seq, data } = FileFragmentizer.extractPacket(p);
    cacheDb.fragments.add({ seq, data });

    this.totalSize += data.byteLength;
    return data.byteLength;
  }

  public async memoryDownload(fileName: string, fileMime: string) {
    if (this.totalSize !== this.targetSize) {
      throw Error('file currupted');
    }

    const fragments: Uint8Array[] = [];
    for (let i = 0; ; i++) {
      const fragment = await cacheDb.fragments.get(i);
      if (fragment === undefined) {
        break;
      }

      fragments.push(fragment.data);
    }

    const blob = new Blob(fragments, { type: fileMime });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.download = fileName;
    el.href = url;
    el.click();

    URL.revokeObjectURL(url);
  }
}
