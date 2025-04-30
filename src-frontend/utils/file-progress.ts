import EventEmitter from 'eventemitter3';

/**
 * Events
 *
 * [progress](number, number, number, number)
 */

// Export class
export class FileProgress extends EventEmitter {
  private handle: number | null = null;
  private lastTime: number = -1;
  private lastSize: number = 0;
  private lastSpeed: number = 0;
  private currentSize: number = 0;

  private update() {
    const now = performance.now();
    if (this.lastTime < 0) {
      this.lastTime = now - 500;
    }
    const elapse = now - this.lastTime || 1;

    const spd =
      this.lastSpeed * 0.9 +
      (((this.currentSize - this.lastSize) * 1000) / elapse) * 0.1;
    const rt = (this.totalSize - this.currentSize) / spd;
    const pct = (this.currentSize * 100) / this.totalSize;

    this.lastTime = now;
    this.lastSize = this.currentSize;
    this.lastSpeed = spd;
    this.emit('progress', spd, rt, pct, this.currentSize);
  }

  public constructor(public totalSize: number) {
    super();
  }

  public start() {
    if (this.handle !== null) return;

    this.lastTime = -1;
    this.lastSize = 0;
    this.lastSpeed = 0;
    this.currentSize = 0;
    this.handle = setInterval(() => this.update(), 500);
  }

  public end() {
    if (this.handle === null) return;

    clearInterval(this.handle);
  }

  public add(size: number) {
    if (this.handle === null) {
      this.start();
    }

    this.currentSize += size;
  }

  public set(size: number) {
    if (this.handle === null) {
      this.start();
    }

    if (size > this.currentSize) {
      this.currentSize = size;
    }
  }
}
