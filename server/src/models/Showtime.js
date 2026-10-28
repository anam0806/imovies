import mongoose from "mongoose";
const showtimeSchema = new mongoose.Schema({
  movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
  cinema: { type: String, required: true },
  screen: { type: String, default: "Screen 1" },
  startsAt: { type: Date, required: true },
  price: { type: Number, required: true, min: 0 },
  seats: { type: [String], default: [] }
}, { timestamps: true });
showtimeSchema.index({ movie: 1, startsAt: 1 });
export default mongoose.model("Showtime", showtimeSchema);
