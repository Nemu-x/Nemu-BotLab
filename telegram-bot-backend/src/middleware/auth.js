const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    console.log('Auth headers:', req.headers); // Debug log
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      console.log('No authorization header provided'); // Debug log
      return res.status(401).json({ error: 'No token provided' });
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.log('Invalid token format'); // Debug log
      return res.status(401).json({ error: 'Invalid token format' });
    }

    const token = authHeader.split(' ')[1];
    console.log('Received token:', token); // Debug log

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded); // Debug log

    const user = await User.findByPk(decoded.id, {
      include: [{
        model: Role,
        as: 'role',
        attributes: ['name']
      }]
    });

    if (!user) {
      console.log('User not found:', decoded.id); // Debug log
      return res.status(401).json({ error: 'User not found' });
    }

    if (!user.is_active) {
      console.log('User is inactive:', decoded.id); // Debug log
      return res.status(401).json({ error: 'User is inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = authMiddleware; 