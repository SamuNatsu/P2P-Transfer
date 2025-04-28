import EventEmitter from "eventemitter3";

/**
 * Events
 * 
 * [progress](number, number, number)
 */

// Export class
export class FileProgress extends EventEmitter {
  private handler: number | null = null;
  private currentSize: number = 0;
  private lastSize: number = 0;

  public constructor(private totalSize: number) {
    super();
  }

  public start() {
    if (this.handler === null) {
      this.lastSize = this.currentSize;
      this.handler = setInterval(() => {
        const speed = (this.currentSize - this.lastSize) * 2;
        const remainTime =
          speed > 0 ? (this.totalSize - this.currentSize) / speed : -1;
        const percent = (this.currentSize / this.totalSize) * 100;

        this.lastSize = this.currentSize;
        this.emit("progress", speed, remainTime, percent);
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
}
