import EventEmitter from 'eventemitter3';

/**
 * Events
 *
 * [progress](number, number, number, number)
 */

// Export class
export class FileProgress extends EventEmitter {
  private handler: number | null = null;
  private currentSize: number = 0;
  private lastSize: number = 0;
  private lastTime: number = 0;

  public constructor(public totalSize: number) {
    super();
  }

  public start() {
    if (this.handler === null) {
      this.lastSize = this.currentSize;
      this.lastTime = Date.now();
      this.handler = setInterval(() => {
        const now = Date.now();
        const elapsed = now - this.lastTime || 1;
        const speed = ((this.currentSize - this.lastSize) / elapsed) * 1000;
        const remainTime =
          speed > 0 ? (this.totalSize - this.currentSize) / speed : -1;
        const percent = (this.currentSize / this.totalSize) * 100;

        this.lastSize = this.currentSize;
        this.lastTime = now;
        this.emit('progress', speed, remainTime, percent, this.lastSize);
      }, 500);
    }
  }

  public end() {
    if (this.handler !== null) {
      clearInterval(this.handler);
    }
  }

  public add(size: number) {
    this.currentSize += size;
  }

  public set(size: number) {
    if (size > this.currentSize) {
      this.currentSize = size;
    }
  }
}
