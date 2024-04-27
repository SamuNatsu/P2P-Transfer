/// Net package module

// Types
export type WsPackage = {
  type: 'register';
  code: string;
};

// Export parser
export const parsePackage = (buffer: ArrayBuffer): WsPackage => {
  const view: DataView = new DataView(buffer);
  const cmd: number = view.getUint8(0);

  switch (cmd) {
    case 1: {
      return {
        type: 'register',
        code: new TextDecoder().decode(buffer.slice(1))
      };
    }
  }

  throw Error('Unknown package');
};

// Export factory
export class PackageFactory {
  // Heartbeat
  public static heartbeat(): Uint8Array {
    return new Uint8Array([0x1]);
  }

  // Register
  public static register(): Uint8Array {
    return new Uint8Array([0x2]);
  }

  // Interrupt
  public static interrupt(): Uint8Array {
    return new Uint8Array([0x3]);
  }

  // Progress
  public static progress(size: number): Uint8Array {
    const buffer: Uint8Array = new Uint8Array(9);
    const view: DataView = new DataView(buffer.buffer);
    view.setUint8(0, 0x4);
    view.setBigUint64(1, BigInt(size));
    return buffer;
  }
}
