import fs from 'fs';
import path from 'path';

const repDbDir = path.resolve(process.cwd(), '../repdb-preview');

console.log('Reading files from:', repDbDir);

const previewEn = JSON.parse(fs.readFileSync(path.join(repDbDir, 'preview.en.json'), 'utf8'));
const previewEs = JSON.parse(fs.readFileSync(path.join(repDbDir, 'preview.es.json'), 'utf8'));
const previewDe = JSON.parse(fs.readFileSync(path.join(repDbDir, 'preview.de.json'), 'utf8'));
const previewFr = JSON.parse(fs.readFileSync(path.join(repDbDir, 'preview.fr.json'), 'utf8'));
const previewFull = JSON.parse(fs.readFileSync(path.join(repDbDir, 'preview.json'), 'utf8'));
const exerciseList = JSON.parse(fs.readFileSync(path.join(repDbDir, 'exercise-list.json'), 'utf8'));

console.log('--- Counts ---');
console.log('preview.en.json exercises:', previewEn.exercises?.length);
console.log('preview.es.json exercises:', previewEs.exercises?.length);
console.log('preview.de.json exercises:', previewDe.de?.exercises?.length || previewDe.exercises?.length);
console.log('preview.fr.json exercises:', previewFr.fr?.exercises?.length || previewFr.exercises?.length);
console.log('preview.json exercises:', previewFull.exercises?.length);
console.log('exercise-list.json exercises:', exerciseList.exercises?.length);

console.log('\n--- Exercise IDs in preview.en.json ---');
const ids = previewEn.exercises?.map((e: any) => e.id);
console.log(ids);

console.log('\n--- First Exercise in preview.en.json ---');
console.log(JSON.stringify(previewEn.exercises?.[0], null, 2));

console.log('\n--- First Exercise in preview.json ---');
console.log(JSON.stringify(previewFull.exercises?.[0], null, 2));

console.log('\n--- Check for MET values ---');
const withMet = previewEn.exercises?.filter((e: any) => e.met !== undefined);
console.log('Exercises with MET in preview.en.json:', withMet?.length);

const withMetFull = previewFull.exercises?.filter((e: any) => e.met !== undefined);
console.log('Exercises with MET in preview.json:', withMetFull?.length);

