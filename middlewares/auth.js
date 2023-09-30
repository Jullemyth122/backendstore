// middleware/auth.js
const passport = require('passport');

const authMiddleware = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (error, user) => {
    if (error || !user) {
      res.status(401).json({ message: 'Unauthorized' });
    } else {
      req.user = user;
      next();
    }
  })(req, res, next);
};

module.exports = authMiddleware;
