import mongoose from "mongoose";
const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  showtime: { type: mongoose.Schema.Types.ObjectId, ref: "Showtime", required: true },
  movie: { type: mongoose.Schema.Types.ObjectId, ref: "Movie", required: true },
  seats: { type: [String], required: true },
  totalPrice: { type: Number, required: true, min: 0 },
  status: {
  type: String,
  enum: ["pending_payment", "confirmed", "cancelled"],
  default: "pending_payment"
},
  bookingCode: { type: String, required: true, unique: true }
}, { timestamps: true });
bookingSchema.index({ showtime: 1, status: 1, seats: 1 });
export default mongoose.model("Booking", bookingSchema);
