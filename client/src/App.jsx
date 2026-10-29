
import { useEffect, useMemo, useState } from "react";
import { api, getToken } from "./api";
import AdminDashboard from "./AdminDashboard.jsx";
import {
  Film, Search, Ticket, UserRound, Clapperboard, CalendarDays,
  Clock3, MapPin, Star, X, Armchair, LogOut, Popcorn,
  CheckCircle2, Menu, Smartphone, CreditCard, Landmark,
  ShieldCheck, LoaderCircle
} from "lucide-react";

const fallbackMovies = [
  { _id:"demo1", title:"Neon Horizon", description:"A brilliant pilot discovers a signal that could change humanity's future.", genre:["Sci-Fi","Adventure"], durationMinutes:128, rating:8.4, language:"English", featured:true, posterUrl:"https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=700&q=80" },
  { _id:"demo2", title:"The Last Encore", description:"A gifted musician gets one final chance to reunite a band and reclaim the stage.", genre:["Drama","Music"], durationMinutes:112, rating:7.9, language:"English", featured:true, posterUrl:"https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=700&q=80" },
  { _id:"demo3", title:"Midnight Chase", description:"One night, one city, and a courier carrying a secret everyone wants.", genre:["Action","Thriller"], durationMinutes:106, rating:7.6, language:"English", featured:false, posterUrl:"https://images.unsplash.com/photo-1510519138101-570d1dca3d66?auto=format&fit=crop&w=700&q=80" },
  { _id:"demo4", title:"Paper Moons", description:"Two strangers find unexpected friendship while restoring an old neighborhood cinema.", genre:["Romance","Drama"], durationMinutes:101, rating:8.1, language:"Hindi", featured:false, posterUrl:"https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=700&q=80" },
  { _id:"demo5", title:"Wildwood", description:"A family expedition takes a turn when a forgotten forest reveals its mysteries.", genre:["Adventure","Family"], durationMinutes:119, rating:7.8, language:"English", featured:false, posterUrl:"https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=700&q=80" },
  { _id:"demo6", title:"Crimson Code", description:"A cybersecurity analyst races to uncover a conspiracy hidden in plain sight.", genre:["Thriller","Action"], durationMinutes:124, rating:8.0, language:"English", featured:true, posterUrl:"https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=700&q=80" }
];

const genres = ["All", "Action", "Adventure", "Drama", "Romance", "Sci-Fi", "Thriller", "Family", "Music"];

const fmt = (date) =>
  new Date(date).toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });

export default function App() {
  if (window.location.pathname === "/admin") return <AdminDashboard />;

  const [movies, setMovies] = useState(fallbackMovies);
  const [apiReady, setApiReady] = useState(false);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("All");
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);

  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("imovies_user") || "null");
    } catch {
      return null;
    }
  });

  const [bookings, setBookings] = useState([]);
  const [bookingOpen, setBookingOpen] = useState(false);

  // Demo checkout state
  const [paymentBooking, setPaymentBooking] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("upi");
  const [paymentError, setPaymentError] = useState("");

  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    api("/movies")
      .then((data) => {
        setMovies(data.movies?.length ? data.movies : fallbackMovies);
        setApiReady(true);
      })
      .catch(() => {
        setApiReady(false);
      });
  }, []);

  const filteredMovies = useMemo(
    () =>
      movies.filter(
        (movie) =>
          movie.title.toLowerCase().includes(search.toLowerCase()) &&
          (genre === "All" ||
            (movie.genre || []).some(
              (item) => item.toLowerCase() === genre.toLowerCase()
            ))
      ),
    [movies, search, genre]
  );

  async function openMovie(movie) {
    setSelectedMovie(movie);
    setSelectedShowtime(null);
    setSelectedSeats([]);
    setNotice("");

    try {
      const data = await api(`/showtimes?movieId=${movie._id}`);
      setShowtimes(data.showtimes || []);
    } catch {
      setShowtimes([]);
    }
  }

  function closeMovie() {
    setSelectedMovie(null);
    setSelectedShowtime(null);
    setSelectedSeats([]);
  }

  function toggleSeat(seat) {
    setSelectedSeats((prev) =>
      prev.includes(seat)
        ? prev.filter((item) => item !== seat)
        : prev.length < 10
          ? [...prev, seat]
          : prev
    );
  }

  async function submitAuth(e) {
    e.preventDefault();
    setBusy(true);
    setNotice("");

    try {
      const data = await api(`/auth/${authMode}`, {
        method: "POST",
        body: JSON.stringify(authForm)
      });

      localStorage.setItem("imovies_token", data.token);
      localStorage.setItem("imovies_user", JSON.stringify(data.user));

      setUser(data.user);
      setAuthOpen(false);
      setAuthForm({ name: "", email: "", password: "" });
      setNotice(
        `Welcome${data.user.name ? `, ${data.user.name}` : ""}! You're signed in.`
      );
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    localStorage.removeItem("imovies_token");
    localStorage.removeItem("imovies_user");
    setUser(null);
    setBookings([]);
    setNotice("You have been signed out.");
  }

  async function loadBookings() {
    if (!getToken()) {
      setAuthOpen(true);
      setNotice("Log in to view your bookings.");
      return;
    }

    try {
      const data = await api("/bookings/my");
      setBookings(data.bookings || []);
      setBookingOpen(true);
    } catch (err) {
      setNotice(err.message);
    }
  }

  // Create a pending booking, then open the demo checkout.
  async function bookSeats() {
    if (!getToken()) {
      setAuthOpen(true);
      setNotice("Log in before booking your seats.");
      return;
    }

    if (!selectedShowtime || !selectedSeats.length || busy) return;

    setBusy(true);
    setNotice("");

    try {
      const data = await api("/bookings", {
        method: "POST",
        body: JSON.stringify({
          showtimeId: selectedShowtime._id,
          seats: selectedSeats
        })
      });

      setPaymentBooking(data.booking);
      setPaymentMethod("upi");
      setPaymentError("");
    } catch (err) {
      setNotice(err.message);
    } finally {
      setBusy(false);
    }
  }

  // Simulate a payment result through our demo-only backend route.
  async function processDemoPayment(outcome) {
    if (!paymentBooking || busy) return;

    setBusy(true);
    setPaymentError("");
    setNotice("");

    try {
      const data = await api(
        `/bookings/${paymentBooking._id}/demo-payment`,
        {
          method: "POST",
          body: JSON.stringify({ outcome })
        }
      );

      if (!data.success) {
        setPaymentError(data.message || "Demo payment failed. Please try again.");
        return;
      }

      const confirmedBooking = data.booking || paymentBooking;

      setPaymentBooking(null);
      setSelectedSeats([]);
      setSelectedShowtime(null);
      setNotice(
        `Demo payment successful! Your tickets are confirmed. Booking code: ${confirmedBooking.bookingCode}`
      );

      // Refresh available showtimes after successful confirmation.
      if (selectedMovie) {
        try {
          const refreshed = await api(
            `/showtimes?movieId=${selectedMovie._id}`
          );
          setShowtimes(refreshed.showtimes || []);
        } catch {
          // The successful booking remains confirmed even if refresh fails.
        }
      }

      // Refresh booking history if it is currently open.
      if (bookingOpen) {
        try {
          const refreshedBookings = await api("/bookings/my");
          setBookings(refreshedBookings.bookings || []);
        } catch {
          // Booking history can be refreshed when reopened.
        }
      }
    } catch (err) {
      setPaymentError(err.message || "Unable to process the demo payment.");
    } finally {
      setBusy(false);
    }
  }

  // Closing checkout cancels the unpaid pending booking.
  async function closePaymentCheckout() {
    if (!paymentBooking || busy) return;

    setBusy(true);

    try {
      await api(`/bookings/${paymentBooking._id}/cancel`, {
        method: "PATCH"
      });

      setPaymentBooking(null);
      setPaymentError("");
      setNotice("Checkout cancelled. No tickets were confirmed.");
    } catch (err) {
      setPaymentError(err.message || "Could not cancel this checkout.");
    } finally {
      setBusy(false);
    }
  }

  async function cancelBooking(id) {
    try {
      await api(`/bookings/${id}/cancel`, { method: "PATCH" });
      const data = await api("/bookings/my");
      setBookings(data.bookings || []);
      setNotice("Booking cancelled.");
    } catch (err) {
      setNotice(err.message);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          href="#home"
          className="brand"
          onClick={() => {
            closeMovie();
            setBookingOpen(false);
          }}
        >
          <span className="brand-icon"><Ticket size={22} /></span>
          <span>
            iMovies<span className="brand-dot">.</span>
            <small>YOUR NEXT MOVIE AWAITS</small>
          </span>
        </a>

        <button
          className="mobile-toggle icon-btn"
          onClick={() => setMobileMenu(!mobileMenu)}
          aria-label="Toggle menu"
        >
          <Menu size={21} />
        </button>

        <nav className={mobileMenu ? "nav-links nav-open" : "nav-links"}>
          <a href="#movies" onClick={() => setMobileMenu(false)}>
            Explore movies
          </a>

          <button
            className="nav-button"
            onClick={() => {
              setMobileMenu(false);
              loadBookings();
            }}
          >
            <Ticket size={16} /> My bookings
          </button>

          {user?.role === "admin" && (
            <a className="nav-button" href="/admin">
              <Clapperboard size={16} /> Admin studio
            </a>
          )}

          {user ? (
            <button className="user-pill" onClick={logout}>
              <span className="avatar">
                {user.name?.[0]?.toUpperCase() || "U"}
              </span>
              {user.name?.split(" ")[0]} <LogOut size={14} />
            </button>
          ) : (
            <button
              className="login-button"
              onClick={() => {
                setAuthMode("login");
                setAuthOpen(true);
              }}
            >
              Sign in <UserRound size={16} />
            </button>
          )}
        </nav>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-glow"></div>

          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-dot"></span>
              THE MAGIC OF THE BIG SCREEN
            </div>

            <h1>
              Make tonight
              <br />a <span>movie night.</span>
            </h1>

            <p>
              Big stories. Bigger screens. Your perfect seat is just a few clicks away.
            </p>

            <a href="#movies" className="primary-cta">
              Explore movies <span>↗</span>
            </a>

            <div className="hero-proof">
              <div className="proof-avatars">
                <span>✦</span><span>★</span><span>♥</span>
              </div>
              <span><b>Good stories.</b> Great memories.</span>
            </div>
          </div>

          <div className="hero-art">
            <div className="poster-stack poster-back">
              <img
                src="https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=700&q=80"
                alt="Night sky"
              />
            </div>

            <div className="poster-stack poster-mid">
              <img
                src="https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&w=700&q=80"
                alt="Cinema screen"
              />
            </div>

            <div className="poster-stack poster-front">
              <img
                src="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=700&q=80"
                alt="A cinematic landscape"
              />
              <div className="poster-caption">
                <span>TONIGHT'S ESCAPE</span>
                <b>Find your next favourite.</b>
              </div>
            </div>

            <div className="floating-ticket">
              <Ticket size={18} />
              <div>
                <b>Your seat is waiting</b>
                <small>Choose. Book. Enjoy.</small>
              </div>
              <span>↗</span>
            </div>
          </div>

          <div className="hero-bottom">
            <span><Clapperboard size={16} /> STORIES WORTH LEAVING HOME FOR</span>
            <span>01 / DISCOVER YOUR NEXT FAVOURITE</span>
          </div>
        </section>

        <section className="catalog-section" id="movies">
          <div className="section-heading">
            <div>
              <div className="eyebrow">THE CURRENT LINEUP</div>
              <h2>Now showing<span>.</span></h2>
              <p>Pick a story. We'll save you a seat.</p>
            </div>

            <div className="catalog-count">
              <b>{filteredMovies.length.toString().padStart(2, "0")}</b>
              <span>FILMS TO DISCOVER</span>
            </div>
          </div>

          <div className="catalog-tools">
            <label className="search-box">
              <Search size={18} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search movies, moods, magic..."
              />
            </label>

            <div className="genre-list">
              {genres.map((item) => (
                <button
                  key={item}
                  className={genre === item ? "genre-chip active" : "genre-chip"}
                  onClick={() => setGenre(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {!apiReady && (
            <div className="demo-notice">
              <span></span>
              Preview mode: showing sample films. Start the API and seed MongoDB to enable live data and bookings.
            </div>
          )}

          <div className="movie-grid">
            {filteredMovies.map((movie, i) => (
              <article className="movie-card" key={movie._id}>
                <button
                  className="poster-button"
                  onClick={() => openMovie(movie)}
                  aria-label={`View ${movie.title}`}
                >
                  <div className="movie-poster">
                    <img
                      src={movie.posterUrl || fallbackMovies[i % fallbackMovies.length].posterUrl}
                      alt={`${movie.title} poster`}
                      loading="lazy"
                    />
                    <span className="poster-rating">
                      <Star size={13} fill="currentColor" />{" "}
                      {Number(movie.rating || 0).toFixed(1)}
                    </span>
                    <span className="poster-open">View details ↗</span>
                  </div>
                </button>

                <div className="movie-info">
                  <div className="movie-meta">
                    <span>{movie.genre?.[0] || "Cinema"}</span>
                    <span>{movie.durationMinutes || 120} min</span>
                  </div>

                  <h3>{movie.title}</h3>

                  <p>
                    {movie.language || "English"} <span>·</span>{" "}
                    {movie.genre?.slice(1, 3).join(" / ") || "Feature film"}
                  </p>

                  <button className="book-link" onClick={() => openMovie(movie)}>
                    Find showtimes <span>↗</span>
                  </button>
                </div>
              </article>
            ))}
          </div>

          {!filteredMovies.length && (
            <div className="empty-state">
              <Film size={30} />
              <h3>No movies found</h3>
              <p>Try another title or genre. The popcorn is patient.</p>
              <button onClick={() => { setSearch(""); setGenre("All"); }}>
                Clear filters
              </button>
            </div>
          )}
        </section>

        <section className="experience-strip">
          <div className="experience-icon"><Popcorn size={25} /></div>
          <div>
            <div className="eyebrow">YOUR NIGHT, YOUR WAY</div>
            <h2>Less scrolling. More <span>storytelling.</span></h2>
            <p>Find a film, pick your seats, and let the opening credits roll.</p>
          </div>
          <a href="#movies">Find your film <span>↗</span></a>
        </section>
      </main>

      <footer>
        <a href="#home" className="footer-brand">
          <Ticket size={19} /> iMovies<span>.</span>
        </a>
        <p>Made for movie people, one seat at a time.</p>
        <span>© {new Date().getFullYear()} iMovies · Individual Project</span>
      </footer>

      {notice && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Movie details and seat selection */}
      {selectedMovie && (
        <div className="modal-backdrop" onClick={closeMovie}>
          <section className="movie-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close icon-btn" onClick={closeMovie} aria-label="Close">
              <X size={20} />
            </button>

            <div className="modal-hero">
              <img src={selectedMovie.posterUrl || fallbackMovies[0].posterUrl} alt="" />
              <div className="modal-hero-shade"></div>

              <div className="modal-title">
                <div className="eyebrow">YOUR NEXT BIG-SCREEN MOMENT</div>
                <h2>{selectedMovie.title}</h2>
                <div className="modal-meta">
                  <span><Star size={14} fill="currentColor" /> {Number(selectedMovie.rating || 0).toFixed(1)}</span>
                  <span><Clock3 size={14} /> {selectedMovie.durationMinutes || 120} min</span>
                  <span>{selectedMovie.language || "English"}</span>
                </div>
              </div>
            </div>

            <div className="modal-content">
              <p className="movie-description">{selectedMovie.description}</p>
              <h3><CalendarDays size={18} /> Choose a showtime</h3>

              {!apiReady && (
                <p className="helper-text">
                  Connect the backend and seed the database to load real showtimes.
                </p>
              )}

              {apiReady && !showtimes.length && (
                <p className="helper-text">
                  No upcoming showtimes for this film yet. Run the seed command if this is a fresh database.
                </p>
              )}

              <div className="showtime-list">
                {showtimes.map((show) => (
                  <button
                    key={show._id}
                    className={selectedShowtime?._id === show._id ? "showtime-option selected" : "showtime-option"}
                    onClick={() => {
                      setSelectedShowtime(show);
                      setSelectedSeats([]);
                    }}
                  >
                    <span className="show-time">{fmt(show.startsAt)}</span>
                    <span className="show-cinema">
                      <MapPin size={13} /> {show.cinema} · {show.screen}
                    </span>
                    <b>₹{show.price}</b>
                  </button>
                ))}
              </div>

              {selectedShowtime && (
                <div className="seat-area">
                  <div className="seat-heading">
                    <h3><Armchair size={18} /> Pick your seats</h3>
                    <span>Up to 10 seats</span>
                  </div>

                  <div className="screen-curve">SCREEN</div>

                  <div className="seat-grid">
                    {Array.from({ length: 48 }, (_, i) =>
                      `${String.fromCharCode(65 + Math.floor(i / 8))}${i % 8 + 1}`
                    ).map((seat) => {
                      const taken = (selectedShowtime.bookedSeats || []).includes(seat);

                      return (
                        <button
                          key={seat}
                          disabled={taken}
                          title={taken ? "Already booked" : seat}
                          onClick={() => toggleSeat(seat)}
                          className={`seat ${taken ? "taken" : selectedSeats.includes(seat) ? "chosen" : ""}`}
                        >
                          {seat}
                        </button>
                      );
                    })}
                  </div>

                  <div className="seat-legend">
                    <span><i></i> Available</span>
                    <span><i className="chosen-legend"></i> Selected</span>
                    <span><i className="taken-legend"></i> Booked</span>
                  </div>

                  <div className="booking-summary">
                    <div>
                      <span>
                        {selectedSeats.length} seat{selectedSeats.length !== 1 ? "s" : ""} selected
                      </span>
                      <b>₹{selectedSeats.length * selectedShowtime.price}</b>
                    </div>

                    <button
                      disabled={!selectedSeats.length || busy || !apiReady}
                      onClick={bookSeats}
                    >
                      {busy ? "Preparing checkout..." : "Proceed to payment"} <span>↗</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Demo payment checkout */}
      {paymentBooking && (
        <div className="modal-backdrop payment-backdrop" onClick={(e) => {
          if (e.target === e.currentTarget) closePaymentCheckout();
        }}>
          <section
            className="payment-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close icon-btn"
              onClick={closePaymentCheckout}
              disabled={busy}
              aria-label="Close checkout"
            >
              <X size={20} />
            </button>

            <div className="payment-heading">
              <div className="payment-mark"><ShieldCheck size={25} /></div>
              <div className="eyebrow">SECURE-STYLE DEMO CHECKOUT</div>
              <h2 id="payment-title">One last step<span>.</span></h2>
              <p>Choose a demo payment method to complete your booking.</p>
            </div>

            <div className="payment-disclaimer">
              <ShieldCheck size={18} />
              <div>
                <strong>Demo mode · No real payment</strong>
                <span>This is a project simulation. No money will be charged. Never enter actual payment details.</span>
              </div>
            </div>

            <div className="payment-order">
              <div className="payment-movie">
                <div>
                  <span className="payment-label">YOUR MOVIE</span>
                  <h3>{paymentBooking.movie?.title || selectedMovie?.title || "Your movie"}</h3>
                  <p>{paymentBooking.showtime?.cinema || selectedShowtime?.cinema || "Cinema"} · {paymentBooking.showtime?.screen || selectedShowtime?.screen || "Screen"}</p>
                  <p>
                    {paymentBooking.showtime?.startsAt
                      ? fmt(paymentBooking.showtime.startsAt)
                      : selectedShowtime?.startsAt
                        ? fmt(selectedShowtime.startsAt)
                        : "Selected showtime"}
                  </p>
                </div>
                <Ticket size={25} />
              </div>

              <div className="payment-seats">
                <span>Selected seats</span>
                <strong>{paymentBooking.seats?.join(", ")}</strong>
              </div>

              <div className="payment-total">
                <span>Total amount</span>
                <strong>₹{paymentBooking.totalPrice}</strong>
              </div>
            </div>

            <div className="payment-method-heading">Choose a demo payment method</div>

            <div className="payment-options">
              <button
                type="button"
                className={paymentMethod === "upi" ? "payment-option active" : "payment-option"}
                onClick={() => setPaymentMethod("upi")}
                aria-pressed={paymentMethod === "upi"}
              >
                <Smartphone size={21} />
                <span><strong>UPI</strong><small>Simulated UPI payment</small></span>
                <span className="payment-radio">{paymentMethod === "upi" ? "✓" : ""}</span>
              </button>

              <button
                type="button"
                className={paymentMethod === "card" ? "payment-option active" : "payment-option"}
                onClick={() => setPaymentMethod("card")}
                aria-pressed={paymentMethod === "card"}
              >
                <CreditCard size={21} />
                <span><strong>Debit / Credit card</strong><small>No card details required</small></span>
                <span className="payment-radio">{paymentMethod === "card" ? "✓" : ""}</span>
              </button>

              <button
                type="button"
                className={paymentMethod === "netbanking" ? "payment-option active" : "payment-option"}
                onClick={() => setPaymentMethod("netbanking")}
                aria-pressed={paymentMethod === "netbanking"}
              >
                <Landmark size={21} />
                <span><strong>Net banking</strong><small>Simulated bank payment</small></span>
                <span className="payment-radio">{paymentMethod === "netbanking" ? "✓" : ""}</span>
              </button>
            </div>

            {paymentError && (
              <div className="payment-error" role="alert">
                <X size={17} />
                <span>{paymentError}</span>
              </div>
            )}

            <div className="payment-actions">
              <button
                className="payment-success"
                disabled={busy}
                onClick={() => processDemoPayment("success")}
              >
                {busy ? <LoaderCircle size={18} className="payment-spinner" /> : <CheckCircle2 size={18} />}
                {busy ? "Processing demo..." : "Simulate successful payment"}
              </button>

              <button
                className="payment-fail"
                disabled={busy}
                onClick={() => processDemoPayment("failure")}
              >
                Simulate failed payment
              </button>
            </div>

            <p className="payment-footnote">
              Selected method: {paymentMethod === "upi" ? "UPI" : paymentMethod === "card" ? "Debit / Credit card" : "Net banking"}. All outcomes are simulated for demonstration.
            </p>
          </section>
        </div>
      )}

      {/* Login and registration */}
      {authOpen && (
        <div className="modal-backdrop" onClick={() => setAuthOpen(false)}>
          <section className="auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close icon-btn" onClick={() => setAuthOpen(false)}>
              <X size={20} />
            </button>

            <div className="auth-mark"><Ticket size={25} /></div>
            <div className="eyebrow">WELCOME TO THE SHOW</div>
            <h2>{authMode === "login" ? "Good to see you." : "Your story starts here."}</h2>
            <p>
              {authMode === "login"
                ? "Sign in to pick up where your next movie night begins."
                : "Create an account and make movie nights yours."}
            </p>

            <form onSubmit={submitAuth}>
              {authMode === "register" && (
                <label>
                  Full name
                  <input
                    required
                    minLength="2"
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    placeholder="Your name"
                  />
                </label>
              )}

              <label>
                Email address
                <input
                  type="email"
                  required
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  required
                  minLength="8"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  placeholder="At least 8 characters"
                />
              </label>

              <button className="auth-submit" disabled={busy}>
                {busy ? "One moment..." : authMode === "login" ? "Sign in" : "Create account"} <span>↗</span>
              </button>
            </form>

            <div className="auth-switch">
              {authMode === "login" ? "New around here?" : "Already have an account?"}{" "}
              <button
                onClick={() => {
                  setAuthMode(authMode === "login" ? "register" : "login");
                  setNotice("");
                }}
              >
                {authMode === "login" ? "Create account" : "Sign in"}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Booking history */}
      {bookingOpen && (
        <div className="modal-backdrop" onClick={() => setBookingOpen(false)}>
          <section className="bookings-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close icon-btn" onClick={() => setBookingOpen(false)}>
              <X size={20} />
            </button>

            <div className="eyebrow">YOUR CINEMA DIARY</div>
            <h2>My bookings<span>.</span></h2>
            <p className="helper-text">Your tickets, all in one place.</p>

            {!bookings.length ? (
              <div className="empty-state">
                <Ticket size={28} />
                <h3>No bookings yet</h3>
                <p>Your next movie night is waiting to happen.</p>
                <button onClick={() => setBookingOpen(false)}>Explore movies</button>
              </div>
            ) : (
              <div className="booking-list">
                {bookings.map((booking) => (
                  <article className="booking-item" key={booking._id}>
                    <div className="booking-poster">
                      <img
                        src={booking.movie?.posterUrl || fallbackMovies[0].posterUrl}
                        alt=""
                      />
                    </div>

                    <div className="booking-details">
                      <span className={`booking-status ${booking.status}`}>
                        {booking.status === "pending_payment"
                          ? "Pending payment"
                          : booking.status}
                      </span>

                      <h3>{booking.movie?.title || "Movie"}</h3>
                      <p>
                        {booking.showtime?.cinema} ·{" "}
                        {booking.showtime?.startsAt
                          ? fmt(booking.showtime.startsAt)
                          : "Showtime"}
                      </p>
                      <p>Seats: {booking.seats.join(", ")} · ₹{booking.totalPrice}</p>
                      <small>Booking code: {booking.bookingCode}</small>

                      {booking.status === "confirmed" && (
                        <button
                          className="cancel-link"
                          onClick={() => cancelBooking(booking._id)}
                        >
                          Cancel booking
                        </button>
                      )}

                      {booking.status === "pending_payment" && (
                        <button
                          className="cancel-link"
                          onClick={() => cancelBooking(booking._id)}
                        >
                          Cancel pending booking
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
