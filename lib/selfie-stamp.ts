import sharp from 'sharp';

const escapeXml = (text: string) => text.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]!));

/** Append a readable footer without covering the employee's face. */
export async function stampSelfie(bytes: ArrayBuffer, name: string, checkedInAt: Date): Promise<ArrayBuffer> {
  const photo = await sharp(Buffer.from(bytes), { limitInputPixels: 25_000_000 })
    .rotate().resize({ width: 1400, height: 1400, fit: 'inside', withoutEnlargement: true })
    .toBuffer({ resolveWithObject: true });
  const width = photo.info.width;
  const fontSize = Math.max(12, Math.round(width / 36));
  const padding = Math.round(width / 24);
  const lines = name.match(/.{1,30}(?:\s|$)|.{1,30}/gu)?.map(line => line.trim()) || ['Staff'];
  const date = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta', day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).format(checkedInAt) + ' WIB';
  const lineHeight = Math.ceil(fontSize * 1.5);
  const footerHeight = padding * 2 + lineHeight * (lines.length + 1);
  const labels = [...lines, date].map((line, index) =>
    `<text x="${padding}" y="${padding + fontSize + index * lineHeight}" font-family="DejaVu Sans, Arial, sans-serif" font-size="${fontSize}" fill="white">${escapeXml(line)}</text>`
  ).join('');
  const footer = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${footerHeight}"><rect width="100%" height="100%" fill="#164e63"/>${labels}</svg>`);
  const result = await sharp(photo.data)
    .extend({ bottom: footerHeight, background: '#164e63' })
    .composite([{ input: footer, left: 0, top: photo.info.height }])
    .jpeg({ quality: 88 }).toBuffer();
  return result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength) as ArrayBuffer;
}
