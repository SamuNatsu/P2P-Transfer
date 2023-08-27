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
  const { log } = useDebugInfo();

  if (blobMode) {
    log('Create download stream under blob mode');

    let blobs: Blob[] = [];

    return {
      fileName,
      fileSize,
      write(data: ArrayBuffer): void {
        blobs.push(new Blob([data]));
      },
      abort(): void {
        log('Download stream abort');
        blobs = [];
      },
      close(): void {
        log('Download stream close');

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
    log('Create download stream under stream mode');

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
        log('Download stream abort');
        writer.abort();
      },
      close(): void {
        log('Download stream close');
        writer.close();
      }
    };
  }
}
