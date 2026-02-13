function validatePassword(password) {
  const errors = [];
  if (!password || password.length < 6) errors.push('Password must be at least 6 characters');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain at least one uppercase letter');
  if (!/[0-9]/.test(password)) errors.push('Password must contain at least one number');
  return errors;
}

module.exports = { validatePassword };
