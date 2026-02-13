const User = require('../models/User');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { signToken } = require('../utils/jwt');
const { sendOtpEmail, sendResetEmail } = require('../utils/email');
const { validatePassword } = require('../utils/validation');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });

    const pwErrors = validatePassword(password);
    if (pwErrors.length) return res.status(400).json({ error: pwErrors.join('. ') });

    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash, role: role || 'Buyer' });

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    user.otpCode = otpHash;
    user.otpExpiry = new Date(Date.now() + 50 * 1000); // 50 seconds
    await user.save();

    await sendOtpEmail(user.email, otp, user.name);

    return res.status(200).json({ message: 'OTP sent to your email', email: user.email });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid email or password' });

    // Generate 6-digit OTP
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    user.otpCode = otpHash;
    user.otpExpiry = new Date(Date.now() + 50 * 1000); // 50 seconds
    await user.save();

    await sendOtpEmail(user.email, otp, user.name);

    res.status(200).json({ message: 'OTP sent to your email', email: user.email });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Server error during login' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid verification code' });

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    if (user.otpCode !== otpHash || !user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired verification code' });
    }

    // Clear OTP fields
    user.otpCode = null;
    user.otpExpiry = null;
    await user.save();

    const token = signToken(user);
    res.status(200).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Server error during verification' });
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(200).json({ message: 'If the account exists, a new code has been sent' });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    user.otpCode = otpHash;
    user.otpExpiry = new Date(Date.now() + 50 * 1000); // 50 seconds
    await user.save();

    await sendOtpEmail(user.email, otp, user.name);

    res.status(200).json({ message: 'A new verification code has been sent' });
  } catch (err) {
    console.error('Resend OTP error:', err);
    res.status(500).json({ error: 'Server error resending code' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: 'No account found with this email' });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    user.otpCode = otpHash;
    user.otpExpiry = new Date(Date.now() + 50 * 1000); // 50 seconds
    await user.save();

    await sendOtpEmail(user.email, otp, user.name);

    res.status(200).json({ message: 'OTP sent to your email', email: user.email });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error processing request' });
  }
};

exports.verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid verification code' });

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    if (user.otpCode !== otpHash || !user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired verification code' });
    }

    // OTP valid — generate a short-lived reset token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.otpCode = null;
    user.otpExpiry = null;
    user.resetToken = tokenHash;
    user.resetTokenExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes to set new password
    await user.save();

    res.status(200).json({ message: 'OTP verified', resetToken: rawToken });
  } catch (err) {
    console.error('Verify reset OTP error:', err);
    res.status(500).json({ error: 'Server error during verification' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { email, resetToken, password } = req.body;
    if (!email || !resetToken || !password) return res.status(400).json({ error: 'Email, token, and password are required' });

    const pwErrors = validatePassword(password);
    if (pwErrors.length) return res.status(400).json({ error: pwErrors.join('. ') });

    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const user = await User.findOne({ where: { email, resetToken: tokenHash } });

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset session. Please try again.' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error resetting password' });
  }
};

exports.profile = async (req, res) => {
  res.json({ user: req.user });
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current password and new password are required' });

    const pwErrors = validatePassword(newPassword);
    if (pwErrors.length) return res.status(400).json({ error: pwErrors.join('. ') });

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) return res.status(403).json({ error: 'Current password is incorrect' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Server error changing password' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required' });

    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(403).json({ error: 'Incorrect password' });

    await user.destroy();
    res.status(200).json({ message: 'Account deleted' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Server error deleting account' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email are required' });
    if (email !== req.user.email) {
      const exists = await User.findOne({ where: { email } });
      if (exists) return res.status(409).json({ error: 'Email already in use' });
    }
    await User.update({ name, email, phone: phone || null }, { where: { id: req.user.id } });
    const updated = await User.findByPk(req.user.id, { attributes: ['id', 'name', 'email', 'role', 'phone', 'avatar_url'] });
    res.json({ user: updated });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error updating profile' });
  }
};
