require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;
const saltRounds = 10;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());

// Database connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Nicole,12345678',
  database: process.env.DB_NAME || 'gatesecurity',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Token verification middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, process.env.JWT_SECRET || 'your_fallback_secret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
}

// Registration endpoint
app.post('/api/register', async (req, res) => {
  // Trim and validate all inputs
  const firstname = req.body.firstname?.trim();
  const lastname = req.body.lastname?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password?.trim();
  const role = 'user'; // Hardcoded default role

  // Validate required fields
  if (!firstname || !lastname || !email || !password) {
    return res.status(400).json({ error: 'All fields must contain valid non-whitespace characters' });
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const connection = await pool.getConnection();
    
    // Check if user exists
    const [existingUsers] = await connection.query(
      'SELECT * FROM studentstaffuser WHERE email = ?', 
      [email]
    );

    if (existingUsers.length > 0) {
      connection.release();
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insert new user
    const [result] = await connection.query(
      'INSERT INTO studentstaffuser (firstname, lastname, email, role, password) VALUES (?, ?, ?, ?, ?)',
      [firstname, lastname, email, role, hashedPassword]
    );

    connection.release();

    // Create token
    const token = jwt.sign(
      {
        id: result.insertId,
        role: role,
        email: email,
        name: `${firstname} ${lastname}`
      },
      process.env.JWT_SECRET || 'your_fallback_secret',
      { expiresIn: '1h' }
    );

    res.status(201).json({ 
      message: 'User registered successfully',
      token,
      user: {
        id: result.insertId,
        name: `${firstname} ${lastname}`,
        email,
        role
      }
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// Staff login endpoint
app.post('/api/staff/login', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const connection = await pool.getConnection();
    const [users] = await connection.query(
      'SELECT * FROM studentstaffuser WHERE email = ?', 
      [email]
    );
    connection.release();

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email,
        name: `${user.firstname} ${user.lastname}`
      },
      process.env.JWT_SECRET || 'your_fallback_secret',
      { expiresIn: '1h' }
    );

    res.json({ 
      token,
      user: {
        id: user.id,
        name: `${user.firstname} ${user.lastname}`,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// User profile endpoint
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.query(
      `SELECT id, firstname, lastname, email, role 
       FROM studentstaffuser 
       WHERE id = ?`,
      [req.user.id]
    );
    connection.release();

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];
    res.json({
      id: user.id,
      name: `${user.firstname} ${user.lastname}`,
      email: user.email,
      role: user.role
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Visitor registration endpoint
app.post('/api/visitor/register', async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      numberplate,
      visitDate,
      carDescription,
      visitReason,
      otherReason
    } = req.body;

    // Trim and validate inputs
    const trimmedFirstName = firstName?.trim();
    const trimmedLastName = lastName?.trim();
    const trimmedEmail = email?.trim().toLowerCase();
    const trimmedNumberplate = numberplate?.trim();

    if (!trimmedFirstName || !trimmedLastName || !trimmedEmail || !trimmedNumberplate || !visitDate || !visitReason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const connection = await pool.getConnection();

    const [result] = await connection.query(
      `INSERT INTO visitors 
      (first_name, last_name, email, number_plate, visit_date, car_description, visit_reason, other_reason) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [trimmedFirstName, trimmedLastName, trimmedEmail, trimmedNumberplate, visitDate, carDescription, visitReason, otherReason]
    );

    connection.release();

    const parkingPassId = `PASS-${String(result.insertId).padStart(5, '0')}`;
    

    res.status(201).json({
      message: 'Visitor registered successfully!',
      parkingPassId
    });

  } catch (err) {
    console.error('Visitor registration error:', err);
    res.status(500).json({ error: 'Database error during visitor registration' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});