const express = require('express');
const router = express.Router();
const { auth } = require('../middlewares/authMiddleware');
const { register, login, googleAuth, profile, updateProfile, changePassword, deleteAccount, verifyOtp, resendOtp, forgotPassword, verifyResetOtp, resetPassword } = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/google-auth', googleAuth);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);
router.get('/profile', auth, profile);
router.put('/profile', auth, updateProfile);
router.put('/profile/password', auth, changePassword);
router.delete('/profile', auth, deleteAccount);

module.exports = router;
