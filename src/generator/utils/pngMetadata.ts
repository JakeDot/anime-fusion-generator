import * as CRC32 from 'crc-32';

export const injectMetadata = (base64: string, metadata: Record<string, string>): string => {
  const [header, data] = base64.split(';base64,');
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  // PNG signature is 8 bytes
  let offset = 8;
  const chunks: { type: string; data: Uint8Array; length: number }[] = [];

  while (offset < bytes.length) {
    const view = new DataView(bytes.buffer, offset, 4);
    const length = view.getUint32(0);
    const type = String.fromCharCode(bytes[offset + 4], bytes[offset + 5], bytes[offset + 6], bytes[offset + 7]);
    const chunkData = bytes.slice(offset + 8, offset + 8 + length);
    chunks.push({ type, data: chunkData, length });
    offset += 12 + length;
  }

  const newChunks: Uint8Array[] = [];
  // Add PNG signature
  newChunks.push(bytes.slice(0, 8));

  // Add IHDR (first chunk)
  const ihdr = chunks.find(c => c.type === 'IHDR');
  if (ihdr) {
    const chunkBytes = new Uint8Array(12 + ihdr.length);
    const view = new DataView(chunkBytes.buffer);
    view.setUint32(0, ihdr.length);
    chunkBytes.set(new TextEncoder().encode('IHDR'), 4);
    chunkBytes.set(ihdr.data, 8);
    const crc = CRC32.buf(chunkBytes.slice(4, 8 + ihdr.length));
    view.setUint32(8 + ihdr.length, crc);
    newChunks.push(chunkBytes);
  }

  // Add metadata as tEXt chunks
  for (const [key, value] of Object.entries(metadata)) {
    const text = `${key}\0${value}`;
    const textBytes = new TextEncoder().encode(text);
    const chunkBytes = new Uint8Array(12 + textBytes.length);
    const view = new DataView(chunkBytes.buffer);
    view.setUint32(0, textBytes.length);
    chunkBytes.set(new TextEncoder().encode('tEXt'), 4);
    chunkBytes.set(textBytes, 8);
    const crc = CRC32.buf(chunkBytes.slice(4, 8 + textBytes.length));
    view.setUint32(8 + textBytes.length, crc);
    newChunks.push(chunkBytes);
  }

  // Add remaining chunks (except IHDR and IEND)
  chunks.forEach(c => {
    if (c.type !== 'IHDR' && c.type !== 'IEND') {
      const chunkBytes = new Uint8Array(12 + c.length);
      const view = new DataView(chunkBytes.buffer);
      view.setUint32(0, c.length);
      chunkBytes.set(new TextEncoder().encode(c.type), 4);
      chunkBytes.set(c.data, 8);
      const crc = CRC32.buf(chunkBytes.slice(4, 8 + c.length));
      view.setUint32(8 + c.length, crc);
      newChunks.push(chunkBytes);
    }
  });

  // Add IEND
  const iend = chunks.find(c => c.type === 'IEND');
  if (iend) {
    const iendBytes = new Uint8Array(12);
    const view = new DataView(iendBytes.buffer);
    view.setUint32(0, 0);
    iendBytes.set(new TextEncoder().encode('IEND'), 4);
    const crc = CRC32.buf(iendBytes.slice(4, 8));
    view.setUint32(8, crc);
    newChunks.push(iendBytes);
  }

  const totalLength = newChunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(totalLength);
  let currentOffset = 0;
  newChunks.forEach(c => {
    result.set(c, currentOffset);
    currentOffset += c.length;
  });

  let binaryResult = '';
  for (let i = 0; i < result.length; i++) {
    binaryResult += String.fromCharCode(result[i]);
  }

  return `${header};base64,${btoa(binaryResult)}`;
};
