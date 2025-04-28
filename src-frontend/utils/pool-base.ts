import EventEmitter from 'eventemitter3';

// Export class
export class PoolBase extends EventEmitter {
  protected static readonly MAX_CONNECTION: number = 4;
}
