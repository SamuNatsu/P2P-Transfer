/// P2P cache
import Dexie, { Table } from 'dexie';

import { P2P_CONNECTION_COUNT } from '@/utils/p2p';

// Types
export interface DataBlock {
  id?: number;
  ch: number;
  data: ArrayBuffer;
}

// Export class
export class P2PCache extends Dexie {
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

  /// Get cache statistic
  public async statistic(): Promise<void> {
    for (let i = 0; i < P2P_CONNECTION_COUNT; i++) {
      const count: number = await this.dataBlocks.where({ ch: i }).count();

      console.debug(`[cache] Packets from channel #${i}: ${count}`);
    }
  }
}

// Export cache
export const cache: P2PCache = new P2PCache();
