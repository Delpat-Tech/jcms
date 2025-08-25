// middlewares/auth.js
const auth = (req, res, next) => {
  const apiKey = req.header('X-API-Key');

  // Check if API key is provided in the header
  if (!apiKey) {
    return res.status(401).json({ success: false, message: 'Unauthorized: API Key is missing' });
  }

  // Check if the provided API key is valid
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid API Key' });
  }

  // If the key is valid, proceed to the next middleware or route handler
  next();
};

module.exports = auth;