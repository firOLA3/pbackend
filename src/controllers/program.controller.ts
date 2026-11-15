import { type Request, type Response } from 'express';
import { Program } from '../models/program.model.js';
import { Workout } from '../models/workout.model.js';

export const getPrograms = async (req: Request, res: Response) => {
  try {
    const { level, featured, search, page = '1', limit = '10' } = req.query;

    const query: Record<string, any> = {};

    if (level && level !== 'all') {
      query.level = String(level).toLowerCase();
    }

    if (featured === 'true') {
      query.isFeatured = true;
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { subtitle: searchRegex },
        { description: searchRegex },
        { tags: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(String(limit), 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [programs, total] = await Promise.all([
      Program.find(query).sort({ isFeatured: -1, createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Program.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: programs.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: programs,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch programs',
      error: error.message,
    });
  }
};

export const getProgramBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const program = await Program.findOne({ slug }).lean();

    if (!program) {
      return res.status(404).json({
        success: false,
        message: `Program with slug '${slug}' not found`,
      });
    }

    // Collect all referenced workout slugs
    const workoutSlugs: string[] = [];
    program.weeks.forEach((w) => {
      w.schedule.forEach((s) => {
        if (s.workoutSlug) {
          workoutSlugs.push(s.workoutSlug);
        }
      });
    });

    const workouts = await Workout.find({ slug: { $in: workoutSlugs } }).lean();
    const workoutMap = new Map<string, any>();
    workouts.forEach((w) => workoutMap.set(w.slug, w));

    // Enrich schedule days with workout info
    const enrichedWeeks = program.weeks.map((week) => ({
      ...week,
      schedule: week.schedule.map((day) => {
        if (!day.workoutSlug) return day;
        const w = workoutMap.get(day.workoutSlug);
        return {
          ...day,
          workout: w
            ? {
                title: w.title,
                durationMinutes: w.durationMinutes,
                estimatedCalories: w.estimatedCalories,
                difficulty: w.difficulty,
                category: w.category,
                bannerImage: w.bannerImage,
              }
            : null,
        };
      }),
    }));

    res.status(200).json({
      success: true,
      data: {
        ...program,
        weeks: enrichedWeeks,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch program details',
      error: error.message,
    });
  }
};

