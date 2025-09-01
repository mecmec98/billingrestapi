const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-development';

// Default test token for development/testing
const DEFAULT_TEST_TOKEN = jwt.sign(
  { 
    id: 'test-user-123', 
    username: 'testuser',
    role: 'user'
  }, 
  JWT_SECRET,
  { expiresIn: '24h' }
);

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];
  
  // Use default test token if no token provided and in development mode
  if (!token && process.env.NODE_ENV !== 'production') {
    console.log('⚠️  Using default test token for development');
    token = DEFAULT_TEST_TOKEN;
  }
  
  if (!token) return res.status(401).json({ error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Export both the middleware and the test token for convenience
module.exports = {
  authenticateToken,
  DEFAULT_TEST_TOKEN
};

// For backward compatibility, export the function as default
module.exports.default = authenticateToken;