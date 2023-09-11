/// Download utils

/* Variables */
let name: string;
let blobMode: boolean;
let bufferList: ArrayBuffer[];
let streamSaver: typeof import('streamsaver');
let stream: WritableStream;
let writer: WritableStreamDefaultWriter;

/* Initialize download stream */
export async function dlStreamInit(
  fileName: string,
  fileSize: number,
  isBlobMode: boolean
): Promise<void> {
  name = fileName;
  blobMode = isBlobMode;

  if (isBlobMode) {
    bufferList = [];
  } else {
    if (streamSaver === undefined) {
      streamSaver = (await import('streamsaver')).default;
      streamSaver.mitm = '/mitm.html';
    }

    stream = streamSaver.createWriteStream(fileName, { size: fileSize });
    writer = stream.getWriter();
  }
}

/* Write download stream */
export function dlStreamWrite(data: ArrayBuffer): void {
  if (blobMode) {
    bufferList.push(data);
  } else {
    writer.write(new Uint8Array(data));
  }
}

/* Close download stream */
export function dlStreamClose(): void {
  if (blobMode) {
    const el: HTMLAnchorElement = document.createElement('a');
    el.href = URL.createObjectURL(new Blob(bufferList));
    el.setAttribute('download', name);

    document.body.appendChild(el);
    el.click();
    document.body.removeChild(el);
  } else {
    writer.close();
  }
}

/* Abort download stream */
export function dlStreamAbort(): void {
  if (blobMode) {
    bufferList = [];
  } else {
    writer.abort();
  }
}
