const pool = require('../config/db');

const createUser = async ({ fullName, email, passwordHash, role }) => {
  const query = `
    INSERT INTO users (full_name, email, password_hash, role)
    VALUES ($1, $2, $3, $4)
    RETURNING user_id, full_name, email, role, created_at
  `;
  const values = [fullName, email, passwordHash, role || 'student'];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

const findUserByEmail = async (email) => {
  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return rows[0];
};

const findUserByVerificationToken = async (token) => {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE verification_token = $1 AND verification_token_expires > NOW()',
    [token],
  );
  return rows[0];
};

const findUserByResetToken = async (token) => {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
    [token],
  );
  return rows[0];
};

const findUserByResetOTP = async (otp) => {
  const { rows } = await pool.query(
    'SELECT * FROM users WHERE reset_otp = $1 AND reset_otp_expires > NOW()',
    [otp],
  );
  return rows[0];
};

const updateVerificationToken = async (userId, token, expiresAt) => {
  const { rows } = await pool.query(
    `UPDATE users 
     SET verification_token = $2, verification_token_expires = $3 
     WHERE user_id = $1 
     RETURNING user_id, email, verification_token`,
    [userId, token, expiresAt],
  );
  return rows[0];
};

const verifyEmail = async (userId) => {
  const { rows } = await pool.query(
    `UPDATE users 
     SET email_verified = TRUE, verification_token = NULL, verification_token_expires = NULL 
     WHERE user_id = $1 
     RETURNING user_id, email, email_verified`,
    [userId],
  );
  return rows[0];
};

const updateResetOTP = async (userId, otp, expiresAt) => {
  const { rows } = await pool.query(
    `UPDATE users 
     SET reset_otp = $2, reset_otp_expires = $3 
     WHERE user_id = $1 
     RETURNING user_id, email, reset_otp`,
    [userId, otp, expiresAt],
  );
  return rows[0];
};

const updatePassword = async (userId, passwordHash) => {
  const { rows } = await pool.query(
    `UPDATE users 
     SET password_hash = $2, reset_token = NULL, reset_token_expires = NULL, 
         reset_otp = NULL, reset_otp_expires = NULL 
     WHERE user_id = $1 
     RETURNING user_id, email`,
    [userId, passwordHash],
  );
  return rows[0];
};

const findUserById = async (userId) => {
  const { rows } = await pool.query(
    'SELECT user_id, full_name, email, role, created_at FROM users WHERE user_id = $1',
    [userId],
  );
  return rows[0];
};

const getAllUsers = async () => {
  const { rows } = await pool.query('SELECT user_id, full_name, email, role, created_at FROM users');
  return rows;
};

const updateUser = async (userId, { fullName, role }) => {
  const { rows } = await pool.query(
    `
    UPDATE users
    SET full_name = COALESCE($2, full_name),
        role = COALESCE($3, role)
    WHERE user_id = $1
    RETURNING user_id, full_name, email, role, created_at
    `,
    [userId, fullName, role],
  );
  return rows[0];
};

const deleteUser = async (userId) => {
  await pool.query('DELETE FROM users WHERE user_id = $1', [userId]);
};

module.exports = {
  createUser,
  findUserByEmail,
  findUserById,
  getAllUsers,
  updateUser,
  deleteUser,
  findUserByVerificationToken,
  findUserByResetToken,
  findUserByResetOTP,
  updateVerificationToken,
  verifyEmail,
  updateResetOTP,
  updatePassword,
};

