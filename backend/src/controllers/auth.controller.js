const User = require('../models/User.model');
const { validationResult } = require('express-validator');
const { auditLog } = require('../utils/auditLogger');

class AuthController {
  async login(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { username, password } = req.body;
      const user = await User.getByUsername(username);

      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'User account is inactive' });
      }

      const isPasswordValid = await User.verifyPassword(user, password);
      if (!isPasswordValid) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const token = User.generateToken(user);
      const userData = await User.getById(user.id);

      auditLog({ user: userData, action: 'LOGIN', entity: 'auth', entityLabel: userData.name, description: 'User logged in', ip: req.ip });

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: userData
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      auditLog({ user: req.user, action: 'LOGOUT', entity: 'auth', entityLabel: req.user?.name, description: 'User logged out', ip: req.ip });
      res.json({ success: true, message: 'Logout successful' });
    } catch (error) {
      next(error);
    }
  }

  async getCurrentUser(req, res, next) {
    try {
      const user = await User.getById(req.user.id);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req, res, next) {
    try {
      const { oldPassword, newPassword } = req.body;
      await User.changePassword(req.user.id, oldPassword, newPassword);
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      if (error.message === 'Old password is incorrect') {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }
}

module.exports = new AuthController();
