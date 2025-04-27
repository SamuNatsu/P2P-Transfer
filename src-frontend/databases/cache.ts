import type { EntityTable } from 'dexie';
import Dexie from 'dexie';

/* Tables */
export interface Fragment {
  seq: number;
  data: Uint8Array;
}

// Create & export database
export const cacheDb = new Dexie('cache') as Dexie & {
  fragments: EntityTable<Fragment, 'seq'>;
};

// Declare schema
cacheDb.version(1).stores({ fragments: 'seq' });
