
import { Router } from "express";
import crypto from "node:crypto";
import Booking from "../models/Booking.js";
import Showtime from "../models/Showtime.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect);

// Create a booking and leave it pending until demo payment succeeds
router.post("/", async (req, res, next) => {
  try {
    const { showtimeId, seats } = req.body;

    if (
      !showtimeId ||
      !Array.isArray(seats) ||
      seats.length < 1 ||
      seats.length > 10
    ) {
      return res.status(400).json({
        message: "Choose between 1 and 10 seats."
      });
    }

    const uniqueSeats = [
      ...new Set(seats.map((seat) => String(seat).trim().toUpperCase()))
    ];

    if (
      uniqueSeats.length !== seats.length ||
      uniqueSeats.some((seat) => !/^[A-F][1-8]$/.test(seat))
    ) {
      return res.status(400).json({
        message: "One or more seat selections are invalid."
      });
    }

    const showtime = await Showtime.findById(showtimeId);

    if (!showtime || showtime.startsAt <= new Date()) {
      return res.status(404).json({
        message: "Showtime not found or already started."
      });
    }

    const current = await Booking.find({
      showtime: showtimeId,
      status: "confirmed"
    }).select("seats");

    const booked = new Set(current.flatMap((booking) => booking.seats));

    const unavailable = uniqueSeats.filter((seat) => booked.has(seat));

    if (unavailable.length) {
      return res.status(409).json({
        message: `These seats are no longer available: ${unavailable.join(", ")}`
      });
    }

    const booking = await Booking.create({
      user: req.user._id,
      showtime: showtime._id,
      movie: showtime.movie,
      seats: uniqueSeats,
      totalPrice: showtime.price * uniqueSeats.length,
      bookingCode: crypto.randomBytes(4).toString("hex").toUpperCase(),
      status: "pending_payment"
    });

    const populated = await booking.populate([
      { path: "movie", select: "title posterUrl" },
      { path: "showtime", select: "cinema screen startsAt price" }
    ]);

    res.status(201).json({ booking: populated });
  } catch (err) {
    next(err);
  }
});

// Get the logged-in user's bookings
router.get("/my", async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("movie", "title posterUrl")
      .populate("showtime", "cinema screen startsAt price")
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (err) {
    next(err);
  }
});

// Simulate a demo payment. No real money is processed.
router.post("/:id/demo-payment", async (req, res, next) => {
  try {
    const { outcome } = req.body;

    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found."
      });
    }

    if (booking.status !== "pending_payment") {
      return res.status(400).json({
        message: "This booking is no longer awaiting payment."
      });
    }

    // Simulate failure without confirming tickets.
    if (outcome === "failure") {
      return res.json({
        success: false,
        message: "Demo payment failed. No tickets were confirmed."
      });
    }

    if (outcome !== "success") {
      return res.status(400).json({
        message: "Choose a valid demo payment outcome."
      });
    }

    const showtime = await Showtime.findById(booking.showtime);

    if (!showtime || showtime.startsAt <= new Date()) {
      booking.status = "cancelled";
      await booking.save();

      return res.status(400).json({
        message: "This showtime has already started or is unavailable."
      });
    }

    // Check seat availability again before confirming payment.
    const current = await Booking.find({
      showtime: booking.showtime,
      status: "confirmed"
    }).select("seats");

    const booked = new Set(current.flatMap((item) => item.seats));

    const unavailable = booking.seats.filter((seat) => booked.has(seat));

    if (unavailable.length) {
      booking.status = "cancelled";
      await booking.save();

      return res.status(409).json({
        message: `These seats are no longer available: ${unavailable.join(", ")}. Please choose different seats.`
      });
    }

    booking.status = "confirmed";
    await booking.save();

    const populated = await booking.populate([
      { path: "movie", select: "title posterUrl" },
      { path: "showtime", select: "cinema screen startsAt price" }
    ]);

    res.json({
      success: true,
      message: "Demo payment successful. Your tickets are confirmed.",
      booking: populated
    });
  } catch (err) {
    next(err);
  }
});

// Cancel a booking
router.patch("/:id/cancel", async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      user: req.user._id
    });

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found."
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        message: "This booking is already cancelled."
      });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({
      booking,
      message: "Booking cancelled."
    });
  } catch (err) {
    next(err);
  }
});

export default router;
