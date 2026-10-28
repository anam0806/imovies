import { Router } from "express";
import crypto from "node:crypto";
import Booking from "../models/Booking.js";
import Showtime from "../models/Showtime.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();
router.use(protect);

router.post("/", async (req, res, next) => {
  try {
    const { showtimeId, seats } = req.body;
    if (!showtimeId || !Array.isArray(seats) || seats.length < 1 || seats.length > 10) {
      return res.status(400).json({ message: "Choose between 1 and 10 seats." });
    }
    const uniqueSeats = [...new Set(seats.map((s) => String(s).trim().toUpperCase()))];
    if (uniqueSeats.length !== seats.length || uniqueSeats.some((s) => !/^[A-F][1-8]$/.test(s))) {
      return res.status(400).json({ message: "One or more seat selections are invalid." });
    }
    const showtime = await Showtime.findById(showtimeId);
    if (!showtime || showtime.startsAt <= new Date()) return res.status(404).json({ message: "Showtime not found or already started." });
    const current = await Booking.find({ showtime: showtimeId, status: "confirmed" }).select("seats");
    const booked = new Set(current.flatMap((b) => b.seats));
    const unavailable = uniqueSeats.filter((seat) => booked.has(seat));
    if (unavailable.length) return res.status(409).json({ message: `These seats are no longer available: ${unavailable.join(", ")}` });
    const booking = await Booking.create({
      user: req.user._id, showtime: showtime._id, movie: showtime.movie,
      seats: uniqueSeats, totalPrice: showtime.price * uniqueSeats.length,
      bookingCode: crypto.randomBytes(4).toString("hex").toUpperCase()
    });
    const populated = await booking.populate([{ path: "movie", select: "title posterUrl" }, { path: "showtime", select: "cinema screen startsAt price" }]);
    res.status(201).json({ booking: populated });
  } catch (err) { next(err); }
});

router.get("/my", async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("movie", "title posterUrl")
      .populate("showtime", "cinema screen startsAt price")
      .sort({ createdAt: -1 });
    res.json({ bookings });
  } catch (err) { next(err); }
});

router.patch("/:id/cancel", async (req, res, next) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, user: req.user._id });
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (booking.status === "cancelled") return res.status(400).json({ message: "This booking is already cancelled." });
    booking.status = "cancelled";
    await booking.save();
    res.json({ booking, message: "Booking cancelled." });
  } catch (err) { next(err); }
});
export default router;
