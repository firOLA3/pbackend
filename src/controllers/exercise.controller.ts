import { type Request, type Response, type NextFunction } from 'express';
import { Exercise } from '../models/exercise.model.js';

export const getExercises = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      category,
      difficulty,
      bodyPart,
      equipment,
      search,
      page = '1',
      limit = '20',
      locale = 'en',
    } = req.query;

    const query: Record<string, any> = {};

    if (category && typeof category === 'string') {
      query.category = category.toLowerCase();
    }

    if (difficulty && typeof difficulty === 'string') {
      query.difficulty = difficulty.toLowerCase();
    }

    if (bodyPart && typeof bodyPart === 'string') {
      query.bodyPart = bodyPart.toLowerCase();
    }

    if (equipment && typeof equipment === 'string') {
      query.equipment = equipment.toLowerCase();
    }

    if (search && typeof search === 'string') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { 'name.en': searchRegex },
        { 'name.es': searchRegex },
        { 'name.de': searchRegex },
        { 'name.fr': searchRegex },
        { slug: searchRegex },
        { primaryMuscles: searchRegex },
        { equipment: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [total, exercises] = await Promise.all([
      Exercise.countDocuments(query),
      Exercise.find(query).sort({ slug: 1 }).skip(skip).limit(limitNum).lean(),
    ]);

    res.status(200).json({
      success: true,
      meta: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
      data: exercises,
    });
  } catch (error) {
    next(error);
  }
};

export const getExerciseBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;
    const exercise = await Exercise.findOne({ slug }).lean();

    if (!exercise) {
      res.status(404).json({
        success: false,
        message: `Exercise '${slug}' not found.`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: exercise,
    });
  } catch (error) {
    next(error);
  }
};

