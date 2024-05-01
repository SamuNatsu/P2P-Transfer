/// P2P cache
import Dexie, { Table } from 'dexie';
import streamSaver from 'streamsaver';

// Types
interface DataBlock {
  id?: number;
  ch: number;
  data: ArrayBuffer;
}

// Config
streamSaver.mitm = import.meta.env.BASE_URL + 'mitm.html?version=2.0.0';

// Export class
class P2PCache extends Dexie {
  private dataBlocks!: Table<DataBlock>;

  /// Constructor
  public constructor() {
    super('P2PCache');

    this.version(1).stores({ dataBlocks: 'id, ch' });
  }

  /// Clear cache
  public async clear(): Promise<void> {
    await this.dataBlocks.clear();
  }

  /// Set cache
  public async set(id: number, ch: number, data: ArrayBuffer): Promise<void> {
    await this.dataBlocks.put({ id, ch, data });
  }

  /// Get cache
  public async get(id: number): Promise<ArrayBuffer | null> {
    return (await this.dataBlocks.get(id))?.data ?? null;
  }

  /// Memory download
  public async memoryDownload(name: string, type: string): Promise<void> {
    const blocks: ArrayBuffer[] = [];

    for (let i = 0; true; i++) {
      const block: ArrayBuffer | null = await this.get(i);
      if (block === null) {
        break;
      }

      blocks.push(block);
    }
    this.clear();

    const blob: Blob = new Blob(blocks, { type });
    const url: string = URL.createObjectURL(blob);

    const el: HTMLAnchorElement = document.createElement('a');
    el.download = name;
    el.href = url;
    el.click();
  }

  /// Stream download
  public async streamDownload(name: string, size: number): Promise<void> {
    const stream: WritableStream = streamSaver.createWriteStream(name, {
      size
    });
    const writer: WritableStreamDefaultWriter = stream.getWriter();

    for (let i = 0; true; i++) {
      const block: ArrayBuffer | null = await this.get(i);
      if (block === null) {
        break;
      }

      await writer.write(new Uint8Array(block));
    }
    this.clear();
    await writer.close();
  }
}

// Export cache
export const cache: P2PCache = new P2PCache();
