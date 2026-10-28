import { Router } from "express";
import mongoose from "mongoose";
import Movie from "../models/Movie.js";
import Showtime from "../models/Showtime.js";
import Booking from "../models/Booking.js";
import { protect } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

const router = Router();
router.use(protect, requireAdmin);
const validId = (id) => mongoose.isValidObjectId(id);
const movieFields = ["title", "description", "genre", "durationMinutes", "posterUrl", "releaseDate", "rating", "language", "featured"];
function moviePayload(body) {
  const data = {};
  for (const key of movieFields) if (body[key] !== undefined) data[key] = body[key];
  if (data.title !== undefined && (typeof data.title !== "string" || !data.title.trim())) throw Object.assign(new Error("Movie title is required."), { status: 400 });
  if (data.description !== undefined && (typeof data.description !== "string" || !data.description.trim())) throw Object.assign(new Error("Movie description is required."), { status: 400 });
  if (data.genre !== undefined && (!Array.isArray(data.genre) || data.genre.some(g => typeof g !== "string"))) throw Object.assign(new Error("Genres must be a list of text values."), { status: 400 });
  if (data.durationMinutes !== undefined && (!Number.isFinite(Number(data.durationMinutes)) || Number(data.durationMinutes) < 1)) throw Object.assign(new Error("Duration must be at least one minute."), { status: 400 });
  if (data.rating !== undefined && (!Number.isFinite(Number(data.rating)) || Number(data.rating) < 0 || Number(data.rating) > 10)) throw Object.assign(new Error("Rating must be between 0 and 10."), { status: 400 });
  if (data.posterUrl !== undefined && data.posterUrl && !/^https?:\/\//i.test(data.posterUrl)) throw Object.assign(new Error("Poster URL must start with http:// or https://."), { status: 400 });
  if (data.title !== undefined) data.title = data.title.trim();
  if (data.description !== undefined) data.description = data.description.trim();
  if (data.genre) data.genre = [...new Set(data.genre.map(g => g.trim()).filter(Boolean))];
  if (data.durationMinutes !== undefined) data.durationMinutes = Number(data.durationMinutes);
  if (data.rating !== undefined) data.rating = Number(data.rating);
  if (data.language !== undefined) data.language = String(data.language).trim();
  return data;
}
router.get("/movies", async (_req, res, next) => { try { res.json({ movies: await Movie.find().sort({ createdAt: -1 }) }); } catch (e) { next(e); } });
router.post("/movies", async (req, res, next) => { try { const data = moviePayload(req.body); for (const key of ["title", "description", "durationMinutes"]) if (data[key] === undefined) return res.status(400).json({ message: `${key} is required.` }); const movie = await Movie.create(data); res.status(201).json({ movie }); } catch (e) { next(e); } });
router.patch("/movies/:id", async (req, res, next) => { try { if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid movie ID." }); const movie = await Movie.findByIdAndUpdate(req.params.id, moviePayload(req.body), { new: true, runValidators: true }); if (!movie) return res.status(404).json({ message: "Movie not found." }); res.json({ movie }); } catch (e) { next(e); } });
router.delete("/movies/:id", async (req, res, next) => { try { if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid movie ID." }); const movie = await Movie.findById(req.params.id); if (!movie) return res.status(404).json({ message: "Movie not found." }); const shows = await Showtime.find({ movie: movie._id }).select("_id"); const showIds = shows.map(s => s._id); if (showIds.length && await Booking.exists({ showtime: { $in: showIds } })) return res.status(409).json({ message: "This movie has bookings. Keep it to preserve booking history; remove future showtimes instead." }); await Showtime.deleteMany({ movie: movie._id }); await movie.deleteOne(); res.json({ message: "Movie and its unbooked showtimes deleted." }); } catch (e) { next(e); } });
router.get("/showtimes", async (_req, res, next) => { try { res.json({ showtimes: await Showtime.find().populate("movie", "title posterUrl").sort({ startsAt: 1 }) }); } catch (e) { next(e); } });
router.post("/showtimes", async (req, res, next) => { try { const { movie, cinema, screen, startsAt, price } = req.body; if (!validId(movie) || !await Movie.exists({ _id: movie })) return res.status(400).json({ message: "Choose a valid movie." }); if (!String(cinema || "").trim() || !startsAt || !Number.isFinite(Number(price)) || Number(price) < 0 || !Number.isFinite(new Date(startsAt).getTime())) return res.status(400).json({ message: "Cinema, valid start time and a non-negative ticket price are required." }); const showtime = await Showtime.create({ movie, cinema: String(cinema).trim(), screen: String(screen || "Screen 1").trim(), startsAt: new Date(startsAt), price: Number(price), seats: Array.from({ length: 48 }, (_, i) => `${String.fromCharCode(65 + Math.floor(i / 8))}${i % 8 + 1}`) }); res.status(201).json({ showtime: await showtime.populate("movie", "title posterUrl") }); } catch (e) { next(e); } });
router.patch("/showtimes/:id", async (req, res, next) => { try { if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid showtime ID." }); const show = await Showtime.findById(req.params.id); if (!show) return res.status(404).json({ message: "Showtime not found." }); const { movie, cinema, screen, startsAt, price } = req.body; if (movie !== undefined) { if (!validId(movie) || !await Movie.exists({ _id: movie })) return res.status(400).json({ message: "Choose a valid movie." }); show.movie = movie; } if (cinema !== undefined) { if (!String(cinema).trim()) return res.status(400).json({ message: "Cinema is required." }); show.cinema = String(cinema).trim(); } if (screen !== undefined) show.screen = String(screen).trim(); if (startsAt !== undefined) { if (!Number.isFinite(new Date(startsAt).getTime())) return res.status(400).json({ message: "Enter a valid start time." }); show.startsAt = new Date(startsAt); } if (price !== undefined) { if (!Number.isFinite(Number(price)) || Number(price) < 0) return res.status(400).json({ message: "Ticket price cannot be negative." }); show.price = Number(price); } const hasBookings = await Booking.exists({ showtime: show._id }); if (hasBookings && (movie !== undefined || startsAt !== undefined)) return res.status(409).json({ message: "This showtime has booking history. Do not change its movie or start time." }); await show.save(); res.json({ showtime: await show.populate("movie", "title posterUrl") }); } catch (e) { next(e); } });
router.delete("/showtimes/:id", async (req, res, next) => { try { if (!validId(req.params.id)) return res.status(400).json({ message: "Invalid showtime ID." }); const show = await Showtime.findById(req.params.id); if (!show) return res.status(404).json({ message: "Showtime not found." }); if (await Booking.exists({ showtime: show._id })) return res.status(409).json({ message: "This showtime has booking history and cannot be deleted." }); await show.deleteOne(); res.json({ message: "Showtime deleted." }); } catch (e) { next(e); } });
export default router;
