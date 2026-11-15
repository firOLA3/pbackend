import { connectDB } from '../config/db.js';
import { Exercise } from '../models/exercise.model.js';

const run = async () => {
  await connectDB();
  const list = await Exercise.find({}, 'slug name category difficulty primaryMuscles met').lean();
  console.log(`TOTAL EXERCISES IN DB: ${list.length}`);
  list.forEach((e: any, i: number) => {
    console.log(`${i + 1}. [${e.slug}] "${e.name?.en}" (${e.category}, ${e.difficulty}) - MET: ${e.met} - Muscles: ${e.primaryMuscles?.join(', ')}`);
  });
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

