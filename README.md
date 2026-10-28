# iMovies 🎬
A full-stack individual movie ticket booking project built with React, Vite, Express, MongoDB, and JWT.

## Features
- Browse/search/filter movies
- Register and log in with JWT authentication
- Browse showtimes
- Choose seats and book tickets
- View and cancel your bookings
- MongoDB models for users, movies, showtimes, and bookings
- Seed sample movies and showtimes

## Requirements
- Node.js 18+ (recommended)
- npm
- MongoDB Atlas account or local MongoDB
- Git (optional)

## Project structure
```text
imovies/
  server/       Express REST API + Mongoose
  client/       React + Vite frontend
```

## 1. Configure the backend
```bash
cd server
npm install
```
Copy `.env.example` to `.env` and set `MONGO_URI` and `JWT_SECRET`.

## 2. Seed sample data
Make sure MongoDB is running/reachable, then:
```bash
npm run seed
```
This inserts sample movies and showtimes. It does not create a user; register through the website.

## 3. Start the backend
```bash
npm run dev
```
API runs at `http://localhost:5000`. Health check: `http://localhost:5000/api/health`.

## 4. Start the frontend
Open a second terminal:
```bash
cd client
npm install
npm run dev
```
Open the URL Vite prints, usually `http://localhost:5173`.

## Environment variables
`server/.env`
```env
PORT=5000
MONGO_URI=mongodb+srv://YOUR_USER:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/imovies?retryWrites=true&w=majority
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Never commit `.env` or share your MongoDB URI/JWT secret publicly.

## Main API routes
| Method | Endpoint | Auth | Purpose |
|---|---|---:|---|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Log in and receive token |
| GET | `/api/movies` | No | List, search and filter movies |
| GET | `/api/movies/:id` | No | Movie details |
| GET | `/api/showtimes?movieId=...` | No | List showtimes |
| POST | `/api/bookings` | Yes | Book seats |
| GET | `/api/bookings/my` | Yes | Current user's bookings |
| PATCH | `/api/bookings/:id/cancel` | Yes | Cancel a booking |

## Important implementation note
This is a learning-project baseline. The booking route checks existing confirmed bookings before creating a new booking, but a production ticketing system should use atomic seat reservations/transactions and robust concurrency handling to prevent two simultaneous requests from claiming the same seat. Deploy only after reviewing security, validation, and operational requirements.

## Epics
1. Project setup and configuration
2. Backend development
3. Database development
4. Frontend development
5. Authentication and booking workflow
6. Project execution and testing

## Suggested demo checklist
- Register a new user
- Log in
- Search for a movie
- Open a movie and choose a showtime
- Select seats and book
- Open My Bookings
- Cancel a booking
- Show the MongoDB collections and API health endpoint


## Admin dashboard

1. Start the API and client as usual. Register a normal iMovies account first.
2. In a terminal, open the `server` folder and run `npm run make-admin -- your-email@example.com`, replacing the email with the account you registered. This changes that existing account's role to `admin`. Never expose this command through the public website.
3. Sign out and sign back in. The **Admin studio** link appears for admin accounts, and the dashboard is available at `http://localhost:5173/admin`.
4. Use **Movies** to create/edit/delete movie metadata and poster URLs. Use **Showtimes** to manage cinema, screen, start time and ticket price. New showtimes start with 48 seats.

### Booking-history protections

The admin API refuses to delete a movie or showtime with booking history. It also refuses to change the movie or start time of a showtime that has booking history. Ticket-price changes do not rewrite existing booking totals. These safeguards help preserve customer reservations.

### Poster images

The six starter films use themed Unsplash images rather than unrelated TMDB poster files. You can replace them in Admin Studio with direct image URLs for images you have permission to use. To update the six existing starter records without deleting anything, run `npm run fix-posters` from the `server` folder. This updates only poster URLs by matching the six starter movie titles; it does not delete movies, showtimes or bookings. You can also change poster URLs in Admin Studio. **Do not rerun the seed script on a database with real bookings**, because the starter seed script clears movie and showtime records.

### Environment security

Keep `server/.env` local and private. It is intentionally excluded from the project ZIP. Use `server/.env.example` as the template and set your own MongoDB URI and JWT secret.
