import fs from 'fs';

const filePath = 'C:/Users/Olaoluwa/.gemini/antigravity/brain/50bb20fb-bb37-40c9-821d-4fb907f41bb3/.system_generated/steps/308/output.txt';
const text = fs.readFileSync(filePath, 'utf8');

// Match sections
const sectionRegex = /\[SECTION\]\s+\"([^\"]+)\"\s+#([0-9:]+)/g;
console.log('=== SECTIONS IN FIGMA ===');
let sMatch;
while ((sMatch = sectionRegex.exec(text)) !== null) {
  console.log(`Section: "${sMatch[1]}" (#${sMatch[2]})`);
}

// Match frames
const frameRegex = /\[FRAME\]\s+\"([^\"]+)\"\s+#([0-9:]+)/g;
console.log('\n=== FRAMES ===');
let fMatch;
const frames: { name: string; id: string; index: number }[] = [];
while ((fMatch = frameRegex.exec(text)) !== null) {
  frames.push({ name: fMatch[1], id: fMatch[2], index: fMatch.index });
}

console.log(`Total frames found: ${frames.length}`);

// Group by section or find screens with "iPhone" or width/height
frames.forEach((f, i) => {
  const nextIndex = i + 1 < frames.length ? frames[i + 1].index : text.length;
  const chunk = text.slice(f.index, Math.min(f.index + 2000, nextIndex));
  const textMatches = Array.from(chunk.matchAll(/text=\"([^\"]+)\"/g)).map(m => m[1].replace(/\\n/g, ' '));
  const uniqueTexts = Array.from(new Set(textMatches)).slice(0, 4);
  console.log(`[#${f.id}] "${f.name}" -> Texts: ${uniqueTexts.join(' | ')}`);
});
