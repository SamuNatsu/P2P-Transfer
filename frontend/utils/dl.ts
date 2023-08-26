/// Download utils

/* Types */
export interface DLStream {
  readonly fileName: string;
  readonly fileSize: number;
  readonly write: (data: ArrayBuffer) => void;
  readonly abort: () => void;
  readonly close: () => void;
}

/* Create download stream */
export async function createDlStream(
  fileName: string,
  fileSize: number,
  blobMode: boolean
): Promise<DLStream> {
  if (blobMode) {
    let blobs: Blob[] = [];

    return {
      fileName,
      fileSize,
      write(data: ArrayBuffer): void {
        blobs.push(new Blob([data]));
      },
      abort(): void {
        blobs = [];
      },
      close(): void {
        const fileBlob: Blob = new Blob(blobs);
        const el: HTMLAnchorElement = document.createElement('a');

        el.href = URL.createObjectURL(fileBlob);
        el.setAttribute('download', fileName);
        document.body.appendChild(el);
        el.click();
        document.body.removeChild(el);
      }
    };
  } else {
    const streamSaver = (await import('streamsaver')).default;
    streamSaver.mitm = '/mitm.html';

    const stream: WritableStream = streamSaver.createWriteStream(fileName, {
      size: fileSize
    });
    const writer: WritableStreamDefaultWriter = stream.getWriter();

    return {
      fileName,
      fileSize,
      write(data: ArrayBuffer): void {
        writer.write(new Uint8Array(data));
      },
      abort(): void {
        writer.abort();
      },
      close(): void {
        writer.close();
      }
    };
  }
}
