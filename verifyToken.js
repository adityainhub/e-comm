const jwt = require('jsonwebtoken');

// Middleware function to verify JWT
function verifyToken(req, res, next) {
  // Get token from headers
  const token = req.headers.authorization;

  // Check if token is provided
  if (!token) {
    return res.status(401).json({ error: 'Access denied. Token not provided.' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token.split(' ')[1], 'your_secret_key');
    // Attach the decoded user information to the request object
    req.user = decoded;

    // Call the next middleware
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(403).json({ error: 'Invalid token.' });
  }
}

module.exports = verifyToken;
