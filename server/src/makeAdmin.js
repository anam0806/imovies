import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import User from "./models/User.js";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: npm run make-admin -- your-email@example.com");
  process.exit(1);
}
if (!process.env.MONGO_URI) {
  console.error("MONGO_URI is missing. Configure server/.env first.");
  process.exit(1);
}
try {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOneAndUpdate({ email }, { $set: { role: "admin" } }, { new: true });
  if (!user) {
    console.error(`No account found for ${email}. Register that account in iMovies first, then run this command again.`);
    process.exitCode = 1;
  } else {
    console.log(`Admin access granted to ${user.email}. Sign out and sign back in on iMovies to refresh your session data.`);
  }
} catch (error) {
  console.error("Could not update admin role:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
