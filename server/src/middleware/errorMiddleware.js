export function notFound(req, res, _next) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}
export function errorHandler(err, _req, res, _next) {
  console.error("BOOKING DATABASE ERROR:", err.message);
console.error("DUPLICATE KEY DETAILS:", err.keyPattern, err.keyValue);
  if (err.code === 11000) return res.status(409).json({ message: "That record already exists." });
  if (err.name === "ValidationError") return res.status(400).json({ message: err.message });
  if (err.name === "CastError") return res.status(400).json({ message: "Invalid ID format." });
  res.status(err.status || 500).json({ message: err.status ? err.message : "Internal server error." });
}
