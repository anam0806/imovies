import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Movie from "./models/Movie.js";

const posters = {
  "Neon Horizon": "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=700&q=80",
  "The Last Encore": "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=700&q=80",
  "Midnight Chase": "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=700&q=80",
  "Paper Moons": "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=700&q=80",
  "Wildwood": "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=700&q=80",
  "Crimson Code": "https://images.unsplash.com/photo-1510519138101-570d1dca3d66?auto=format&fit=crop&w=700&q=80"
};
if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing from server/.env");
try {
  await mongoose.connect(process.env.MONGO_URI);
  let updated = 0;
  for (const [title, posterUrl] of Object.entries(posters)) {
    const result = await Movie.updateOne({ title }, { $set: { posterUrl } });
    updated += result.modifiedCount;
  }
  console.log(`Poster update complete. Updated ${updated} existing movie record(s); no movies, showtimes or bookings were deleted.`);
} catch (error) {
  console.error("Poster update failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
