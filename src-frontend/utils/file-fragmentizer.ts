import EventEmitter from 'eventemitter3';

/**
 * Events
 *
 * [load](Uint8Array | null)
 */

// Export class
export class FileFragmentizer extends EventEmitter {
  private reader: FileReader;
  private offset: number = 0;
  private sequenceNumber: number = 0;

  public static extractPacket(p: Uint8Array) {
    const view = new DataView(p.buffer);
    const seq = Number(view.getBigUint64(0));
    return { seq, data: p.slice(8) };
  }

  public constructor(
    private file: File,
    private fragmentSize: number,
  ) {
    super();

    this.reader = new FileReader();
    this.reader.addEventListener('load', () => {
      const data = this.reader.result as ArrayBuffer;
      const packet = new Uint8Array(8 + data.byteLength);
      const view = new DataView(packet.buffer);
      view.setBigUint64(0, BigInt(this.sequenceNumber++));
      packet.set(new Uint8Array(data), 8);

      this.emit('load', packet);
    });
  }

  public readNext() {
    if (this.offset >= this.file.size) {
      this.emit('load', null);
      return;
    }

    if (this.reader.readyState === this.reader.LOADING) {
      return;
    }

    this.reader.readAsArrayBuffer(
      this.file.slice(this.offset, this.offset + this.fragmentSize),
    );
    this.offset += this.fragmentSize;
  }
}
