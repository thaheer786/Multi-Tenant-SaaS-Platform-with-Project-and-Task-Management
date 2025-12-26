// Password hashing utilities
const bcrypt = require('bcryptjs');

// Hash password with bcrypt
async function hashPassword(password) {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  } catch (error) {
    throw new Error('Password hashing failed: ' + error.message);
  }
}

// Compare password with hash
async function comparePassword(password, hash) {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    throw new Error('Password comparison failed: ' + error.message);
  }
}

module.exports = {
  hashPassword,
  comparePassword
};
