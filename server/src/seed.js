import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import Movie from "./models/Movie.js";
import Showtime from "./models/Showtime.js";

const movies = [
  { title: "Neon Horizon", description: "A brilliant pilot discovers a signal that could change humanity's future.", genre: ["Sci-Fi", "Adventure"], durationMinutes: 128, rating: 8.4, language: "English", featured: true, posterUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=700&q=80" },
  { title: "The Last Encore", description: "A gifted musician gets one final chance to reunite a band and reclaim the stage.", genre: ["Drama", "Music"], durationMinutes: 112, rating: 7.9, language: "English", featured: true, posterUrl: "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=700&q=80" },
  { title: "Midnight Chase", description: "One night, one city, and a courier carrying a secret everyone wants.", genre: ["Action", "Thriller"], durationMinutes: 106, rating: 7.6, language: "English", featured: false, posterUrl: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=700&q=80" },
  { title: "Paper Moons", description: "Two strangers find unexpected friendship while restoring an old neighborhood cinema.", genre: ["Romance", "Drama"], durationMinutes: 101, rating: 8.1, language: "Hindi", featured: false, posterUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=700&q=80" },
  { title: "Wildwood", description: "A family expedition takes a turn when a forgotten forest reveals its mysteries.", genre: ["Adventure", "Family"], durationMinutes: 119, rating: 7.8, language: "English", featured: false, posterUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=700&q=80" },
  { title: "Crimson Code", description: "A cybersecurity analyst races to uncover a conspiracy hidden in plain sight.", genre: ["Thriller", "Action"], durationMinutes: 124, rating: 8.0, language: "English", featured: true, posterUrl: "https://images.unsplash.com/photo-1510519138101-570d1dca3d66?auto=format&fit=crop&w=700&q=80" }
];

try {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing from .env");
  await mongoose.connect(process.env.MONGO_URI);
  await Movie.deleteMany({});
  await Showtime.deleteMany({});
  const inserted = await Movie.insertMany(movies);
  const now = new Date();
  const showtimes = [];
  for (const movie of inserted) {
    for (const [index, hour] of [17, 20].entries()) {
      const startsAt = new Date(now);
      startsAt.setDate(now.getDate() + 1 + index);
      startsAt.setHours(hour, 0, 0, 0);
      showtimes.push({
        movie: movie._id, cinema: "iMovies Central", screen: `Screen ${index + 1}`,
        startsAt, price: 180 + index * 40,
        seats: Array.from({ length: 48 }, (_, i) => `${String.fromCharCode(65 + Math.floor(i / 8))}${(i % 8) + 1}`)
      });
    }
  }
  await Showtime.insertMany(showtimes);
  console.log(`Seeded ${inserted.length} movies and ${showtimes.length} showtimes.`);
} catch (error) {
  console.error("Seeding failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
