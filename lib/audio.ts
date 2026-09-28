export function encodeWav(samples: Float32Array, sampleRate = 16000): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  const write = (at: number, text: string) => [...text].forEach((char, i) => view.setUint8(at + i, char.charCodeAt(0)))
  write(0, 'RIFF'); view.setUint32(4, buffer.byteLength - 8, true); write(8, 'WAVE')
  write(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true)
  view.setUint16(22, 1, true); view.setUint32(24, sampleRate, true); view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true); view.setUint16(34, 16, true); write(36, 'data'); view.setUint32(40, samples.length * 2, true)
  samples.forEach((value, index) => { const sample = Math.max(-1, Math.min(1, value)); view.setInt16(44 + index * 2, sample * (sample < 0 ? 32768 : 32767), true) })
  return buffer
}

export async function recordingToWav(blob: Blob): Promise<string> {
  const context = new AudioContext()
  try {
    const decoded = await context.decodeAudioData(await blob.arrayBuffer())
    if (decoded.duration > 61) throw new Error('每段录音请控制在 60 秒以内')
    const offline = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000)
    const source = offline.createBufferSource()
    source.buffer = decoded; source.connect(offline.destination); source.start()
    const rendered = await offline.startRendering()
    const bytes = new Uint8Array(encodeWav(rendered.getChannelData(0)))
    let binary = ''
    for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192))
    return 'data:audio/wav;base64,' + btoa(binary)
  } finally { await context.close() }
}

export function speechChunks(text: string): string[] {
  const plain = text.replace(/[*#`]/g, '').trim()
  const chunks: string[] = []
  let chunk = ''
  for (const char of plain) {
    if (chunk.length + char.length > 450) { chunks.push(chunk); chunk = '' }
    chunk += char
  }
  if (chunk) chunks.push(chunk)
  return chunks
}
