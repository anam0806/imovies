import { Router } from "express";
import Showtime from "../models/Showtime.js";
import Booking from "../models/Booking.js";
const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const filter = { startsAt: { $gte: new Date() } };
    if (req.query.movieId) filter.movie = req.query.movieId;
    const showtimes = await Showtime.find(filter).populate("movie", "title posterUrl").sort({ startsAt: 1 }).limit(100);
    const result = await Promise.all(showtimes.map(async (showtime) => {
      const bookings = await Booking.find({ showtime: showtime._id, status: "confirmed" }).select("seats");
      const bookedSeats = [...new Set(bookings.flatMap((b) => b.seats))];
      return { ...showtime.toObject(), bookedSeats };
    }));
    res.json({ showtimes: result });
  } catch (err) { next(err); }
});
export default router;
