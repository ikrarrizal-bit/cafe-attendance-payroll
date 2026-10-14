import sharp from 'sharp';
import path from 'node:path';

const escapeXml = (text: string) => text.replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[char]!));

/** Append a readable footer without covering the employee's face. */
export async function stampSelfie(bytes: ArrayBuffer, name: string, checkedInAt: Date, late = false): Promise<ArrayBuffer> {
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
  // Explicitly load the bundled font: serverless hosts may have no system fonts.
  const labels = await Promise.all([...lines, date].map(async (line, index) => ({
    input: await sharp({ text: {
      text: `<span foreground="white">${escapeXml(line)}</span>`,
      font: `Geist ${fontSize}`, fontfile: path.join(process.cwd(), 'public/fonts/Geist-Regular.ttf'),
      rgba: true, dpi: 72,
    } }).png().toBuffer(),
    left: padding, top: photo.info.height + padding + index * lineHeight,
  })));
  const result = await sharp(photo.data)
    .extend({ bottom: footerHeight, background: late ? '#b91c1c' : '#164e63' })
    .composite(labels)
    .jpeg({ quality: 88 }).toBuffer();
  return result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength) as ArrayBuffer;
}
