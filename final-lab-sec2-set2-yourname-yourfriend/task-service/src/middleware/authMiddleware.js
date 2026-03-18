const { verifyToken } = require('./jwtUtils');

function authMiddleware(req, res, next) {

  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'missing token' });
  }

  const token = authHeader.split(' ')[1];

  try {

    const decoded = verifyToken(token);

    req.user = decoded;

    next();

  } catch (err) {

    return res.status(401).json({ error: 'invalid token' });

  }

}

module.exports = authMiddleware;