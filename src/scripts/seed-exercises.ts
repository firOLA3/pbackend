import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Exercise, type IExerciseMedia } from '../models/exercise.model.js';

const repDbDir = path.resolve(process.cwd(), '../repdb-preview');
const publicDir = path.resolve(process.cwd(), 'public');
const exercisesPublicDir = path.join(publicDir, 'exercises');

// Destination subdirectories
const destClassic = path.join(exercisesPublicDir, 'classic');
const destAnimations = path.join(exercisesPublicDir, 'animations');
const destExports = path.join(exercisesPublicDir, 'exports');
const destEquipment = path.join(publicDir, 'equipment');
const destMuscles = path.join(publicDir, 'muscles');

function ensureDirectories() {
  [destClassic, destAnimations, destExports, destEquipment, destMuscles].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

function safeCopy(src: string, dest: string): boolean {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    return true;
  }
  return false;
}

export async function seedExercises() {
  console.log('🚀 Starting RepDB exercise import (Phase 1.2)...');
  console.log(`📂 Sourcing from: ${repDbDir}`);

  ensureDirectories();

  // 1. Copy equipment & muscle images
  const srcEquipment = path.join(repDbDir, 'images', 'equipment');
  if (fs.existsSync(srcEquipment)) {
    fs.readdirSync(srcEquipment).forEach((file) => {
      safeCopy(path.join(srcEquipment, file), path.join(destEquipment, file));
    });
  }

  const srcMuscles = path.join(repDbDir, 'images', 'muscles');
  if (fs.existsSync(srcMuscles)) {
    fs.readdirSync(srcMuscles).forEach((file) => {
      safeCopy(path.join(srcMuscles, file), path.join(destMuscles, file));
    });
  }

  // 2. Read RepDB preview dataset
  const previewPath = path.join(repDbDir, 'preview.json');
  if (!fs.existsSync(previewPath)) {
    throw new Error(`RepDB preview file not found at ${previewPath}`);
  }

  const previewData = JSON.parse(fs.readFileSync(previewPath, 'utf8'));
  const exercisesRaw: any[] = previewData.exercises || [];

  console.log(`Found ${exercisesRaw.length} detailed exercises in RepDB preview dataset.`);

  const auditReport = {
    total: exercisesRaw.length,
    imported: 0,
    missingImages: [] as string[],
    missingMet: [] as string[],
    missingInstructions: [] as string[],
    failed: [] as { slug: string; reason: string }[],
  };

  const attributionText = 'Exercise data & images: RepDB (https://repdb.co)';

  for (const raw of exercisesRaw) {
    const slug: string = raw.id;
    try {
      const media: IExerciseMedia[] = [];

      // Classic images (start / peak or main)
      const srcClassicStart = path.join(repDbDir, 'images', 'classic', `${slug}-start.webp`);
      const srcClassicPeak = path.join(repDbDir, 'images', 'classic', `${slug}-peak.webp`);
      const srcClassicMain = path.join(repDbDir, 'images', 'classic', `${slug}-main.webp`);

      let hasImage = false;

      if (fs.existsSync(srcClassicStart)) {
        safeCopy(srcClassicStart, path.join(destClassic, `${slug}-start.webp`));
        media.push({
          type: 'image',
          subtype: 'start',
          url: `/static/exercises/classic/${slug}-start.webp`,
        });
        hasImage = true;
      }

      if (fs.existsSync(srcClassicPeak)) {
        safeCopy(srcClassicPeak, path.join(destClassic, `${slug}-peak.webp`));
        media.push({
          type: 'image',
          subtype: 'peak',
          url: `/static/exercises/classic/${slug}-peak.webp`,
        });
        hasImage = true;
      }

      if (fs.existsSync(srcClassicMain)) {
        safeCopy(srcClassicMain, path.join(destClassic, `${slug}-main.webp`));
        media.push({
          type: 'image',
          subtype: 'main',
          url: `/static/exercises/classic/${slug}-main.webp`,
        });
        hasImage = true;
      }

      if (!hasImage) {
        auditReport.missingImages.push(slug);
      }

      // Motion animations
      const srcAnim = path.join(repDbDir, 'images', 'animations', `${slug}.webp`);
      if (fs.existsSync(srcAnim)) {
        safeCopy(srcAnim, path.join(destAnimations, `${slug}.webp`));
        media.push({
          type: 'animation',
          url: `/static/exercises/animations/${slug}.webp`,
        });
      }

      // Video mp4 and gif exports
      const srcVideo = path.join(repDbDir, 'exports', `${slug}.mp4`);
      if (fs.existsSync(srcVideo)) {
        safeCopy(srcVideo, path.join(destExports, `${slug}.mp4`));
        media.push({
          type: 'video',
          url: `/static/exercises/exports/${slug}.mp4`,
        });
      }

      const srcGif = path.join(repDbDir, 'exports', `${slug}.gif`);
      if (fs.existsSync(srcGif)) {
        safeCopy(srcGif, path.join(destExports, `${slug}.gif`));
      }

      // Check MET
      const metValue = typeof raw.met === 'number' ? raw.met : 5.0;
      if (typeof raw.met !== 'number') {
        auditReport.missingMet.push(slug);
      }

      // Check instructions
      const hasInstructions = (raw.instructions_en && raw.instructions_en.length > 0);
      if (!hasInstructions) {
        auditReport.missingInstructions.push(slug);
      }

      // Map document
      const exerciseDoc = {
        slug,
        name: {
          en: raw.name_en || raw.name || slug,
          de: raw.name_de || undefined,
          es: raw.name_es || undefined,
          fr: raw.name_fr || undefined,
        },
        description: {
          en: raw.description_en || raw.description || '',
          de: raw.description_de || undefined,
          es: raw.description_es || undefined,
          fr: raw.description_fr || undefined,
        },
        instructions: {
          en: raw.instructions_en || raw.instructions || [],
          de: raw.instructions_de || [],
          es: raw.instructions_es || [],
          fr: raw.instructions_fr || [],
        },
        tips: {
          en: raw.tips_en || raw.tips || [],
          de: raw.tips_de || [],
          es: raw.tips_es || [],
          fr: raw.tips_fr || [],
        },
        category: raw.category || 'strength',
        forceType: raw.force_type || undefined,
        mechanic: raw.mechanic || undefined,
        difficulty: raw.difficulty || 'beginner',
        equipment: raw.equipment || 'bodyweight',
        bodyPart: raw.body_part || 'full_body',
        primaryMuscles: raw.primary_muscles || [],
        secondaryMuscles: raw.secondary_muscles || [],
        goals: raw.goals || [],
        tags: raw.tags || [],
        met: metValue,
        isUnilateral: Boolean(raw.is_unilateral),
        isBodyweight: Boolean(raw.is_bodyweight),
        media,
        relations: (raw.relations || []).map((r: any) => ({
          to: r.to,
          relationType: r.type,
        })),
        attribution: attributionText,
      };

      await Exercise.findOneAndUpdate(
        { slug },
        { $set: exerciseDoc },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      auditReport.imported++;
    } catch (err: any) {
      console.error(`Error importing ${slug}:`, err.message);
      auditReport.failed.push({ slug, reason: err.message });
    }
  }

  console.log('\n========================================');
  console.log('       REMARK / AUDIT REPORT');
  console.log('========================================');
  console.log(`Total processed:     ${auditReport.total}`);
  console.log(`Successfully stored: ${auditReport.imported}`);
  console.log(`Missing images:      ${auditReport.missingImages.length} ${auditReport.missingImages.length > 0 ? `(${auditReport.missingImages.join(', ')})` : '✅ All have pictures'}`);
  console.log(`Missing MET:         ${auditReport.missingMet.length} ${auditReport.missingMet.length > 0 ? `(${auditReport.missingMet.join(', ')})` : '✅ All have MET values'}`);
  console.log(`Missing instructions:${auditReport.missingInstructions.length} ${auditReport.missingInstructions.length > 0 ? `(${auditReport.missingInstructions.join(', ')})` : '✅ All have instructions'}`);
  console.log(`Failed imports:      ${auditReport.failed.length}`);
  console.log('========================================\n');

  return auditReport;
}

// Direct execution
if (process.argv[1] && process.argv[1].endsWith('seed-exercises.ts')) {
  (async () => {
    try {
      await connectDB();
      await seedExercises();
      console.log('✅ RepDB import completed successfully!');
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('❌ Exercise seed failed:', err);
      process.exit(1);
    }
  })();
}

