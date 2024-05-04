/// File cache
import Dexie, { Table } from 'dexie';
import streamSaver from 'streamsaver';
import { useStore } from '@/stores';
import { P2P_CONNECTION_COUNT } from '@/utils/config';

// Types
interface DataBlock {
  id?: number;
  ch: number;
  data: ArrayBuffer;
}

// Config
streamSaver.mitm = import.meta.env.BASE_URL + 'mitm.html?version=2.0.0';

// Export class
class FileCache extends Dexie {
  private dataBlocks!: Table<DataBlock>;

  /// Constructor
  public constructor() {
    super('File Cache');

    this.version(1).stores({ dataBlocks: 'id, ch' });
    this.clear();
  }

  /// Clear cache
  public async clear(): Promise<void> {
    const { logger } = useStore();

    await this.dataBlocks.clear();
    logger.info('[file-cache] Cleared');
  }

  /// Set cache
  public async set(id: number, ch: number, data: ArrayBuffer): Promise<void> {
    await this.dataBlocks.put({ id, ch, data });
  }

  /// Get cache
  private async get(id: number): Promise<ArrayBuffer | undefined> {
    return (await this.dataBlocks.get(id))?.data;
  }

  /// Memory download
  public async memoryDownload(name: string, type: string): Promise<void> {
    const { logger } = useStore();

    await this.statistic();

    const blocks: ArrayBuffer[] = [];
    for (let i = 0; true; i++) {
      const block: ArrayBuffer | undefined = await this.get(i);
      if (block === undefined) {
        break;
      }

      blocks.push(block);
    }
    this.clear();
    logger.debug(`[file-cache] Blocks collected: count=${blocks.length}`);

    const blob: Blob = new Blob(blocks, { type });
    const url: string = URL.createObjectURL(blob);
    logger.debug(`[file-cache] Blob merged: size=${blob.size}, type=${type}`);

    const el: HTMLAnchorElement = document.createElement('a');
    el.download = name;
    el.href = url;
    el.click();

    logger.info(`[file-cache] Memory downloaded: name=${name}`);
  }

  /// Stream download
  public async streamDownload(name: string, size: number): Promise<void> {
    const { logger } = useStore();

    await this.statistic();

    const stream: WritableStream = streamSaver.createWriteStream(name, {
      size
    });
    const writer: WritableStreamDefaultWriter = stream.getWriter();
    logger.debug(`[file-cache] Writer stream created: size=${size}`);

    let i: number = 0;
    while (true) {
      const block: ArrayBuffer | undefined = await this.get(i);
      if (block === undefined) {
        break;
      }

      i++;
      await writer.write(new Uint8Array(block));
    }
    this.clear();
    logger.debug(`[file-cache] Blocks collected: count=${i}`);

    await writer.close();

    logger.info(`[file-cache] Stream downloaded: name=${name}`);
  }

  /// Statistic
  private async statistic(): Promise<void> {
    const { logger } = useStore();

    const count: number[] = [];
    for (let i = 0; i < P2P_CONNECTION_COUNT; i++) {
      count.push(await this.dataBlocks.where({ ch: i }).count());
    }

    logger.debug(`[file-cache] Statistic: list=${count}`);
  }
}

// Export cache
export const cache: FileCache = new FileCache();
