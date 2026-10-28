import { Router } from "express";
import Movie from "../models/Movie.js";
const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(24, Math.max(1, Number.parseInt(req.query.limit, 10) || 12));
    const filter = {};
    if (req.query.genre && req.query.genre !== "All") filter.genre = req.query.genre;
    if (req.query.search?.trim()) filter.title = { $regex: req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    const [movies, total] = await Promise.all([
      Movie.find(filter).sort({ featured: -1, title: 1 }).skip((page - 1) * limit).limit(limit),
      Movie.countDocuments(filter)
    ]);
    res.json({ movies, page, pages: Math.ceil(total / limit), total });
  } catch (err) { next(err); }
});

router.get("/:id", async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) return res.status(404).json({ message: "Movie not found." });
    res.json({ movie });
  } catch (err) { next(err); }
});
export default router;
