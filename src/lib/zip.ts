// A minimal ZIP writer: files are stored, not compressed (Mermaid source is
// tiny), and names are flagged as UTF-8 so Chinese titles survive.

export type ZipEntry = { path: string; text: string | null }

const crcTable = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array) {
  let c = 0xffffffff
  for (const b of bytes) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

/** `text: null` makes a folder entry, so empty folders survive too. */
export function zip(entries: ZipEntry[]) {
  const encoder = new TextEncoder()
  const now = new Date()
  const time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1)
  const date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate()
  const local: BlobPart[] = []
  const central: BlobPart[] = []
  let offset = 0
  let centralSize = 0

  for (const entry of entries) {
    const name = encoder.encode(entry.path)
    const data = entry.text === null ? new Uint8Array() : encoder.encode(entry.text)
    const crc = crc32(data)

    const head = new DataView(new ArrayBuffer(30))
    head.setUint32(0, 0x04034b50, true)
    head.setUint16(4, 20, true)
    head.setUint16(6, 0x0800, true) // UTF-8 names
    head.setUint16(10, time, true)
    head.setUint16(12, date, true)
    head.setUint32(14, crc, true)
    head.setUint32(18, data.length, true)
    head.setUint32(22, data.length, true)
    head.setUint16(26, name.length, true)
    local.push(head, name, data)

    const record = new DataView(new ArrayBuffer(46))
    record.setUint32(0, 0x02014b50, true)
    record.setUint16(4, 20, true)
    record.setUint16(6, 20, true)
    record.setUint16(8, 0x0800, true)
    record.setUint16(12, time, true)
    record.setUint16(14, date, true)
    record.setUint32(16, crc, true)
    record.setUint32(20, data.length, true)
    record.setUint32(24, data.length, true)
    record.setUint16(28, name.length, true)
    record.setUint32(38, entry.text === null ? 0x10 : 0, true) // directory flag
    record.setUint32(42, offset, true)
    central.push(record, name)

    offset += 30 + name.length + data.length
    centralSize += 46 + name.length
  }

  const end = new DataView(new ArrayBuffer(22))
  end.setUint32(0, 0x06054b50, true)
  end.setUint16(8, entries.length, true)
  end.setUint16(10, entries.length, true)
  end.setUint32(12, centralSize, true)
  end.setUint32(16, offset, true)
  return new Blob([...local, ...central, end], { type: "application/zip" })
}
