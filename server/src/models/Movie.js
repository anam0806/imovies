import mongoose from "mongoose";
const movieSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  genre: { type: [String], default: [] },
  durationMinutes: { type: Number, required: true, min: 1 },
  posterUrl: { type: String, default: "" },
  releaseDate: { type: Date },
  rating: { type: Number, min: 0, max: 10, default: 0 },
  language: { type: String, default: "English" },
  featured: { type: Boolean, default: false }
}, { timestamps: true });
movieSchema.index(
  { title: "text", description: "text" },
  { default_language: "english", language_override: "textIndexLanguage" }
);

export default mongoose.model("Movie", movieSchema);

