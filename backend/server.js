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

// JWT verification middleware
const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, process.env.JWT_SECRET || 'your_fallback_secret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

// Registration endpoint
app.post('/api/register', async (req, res) => {
  try {
    // Trim and validate all inputs
    const firstname = req.body.firstname?.trim();
    const lastname = req.body.lastname?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password?.trim();
    const role = 'user'; // Default role

    // Validate required fields
    if (!firstname || !lastname || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

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
app.get('/api/user/:id', authenticateJWT, async (req, res) => {
  try {
    const userId = req.params.id;
    const connection = await pool.getConnection();
    const [users] = await connection.query(
      `SELECT id, firstname, lastname, email, role 
       FROM studentstaffuser 
       WHERE id = ?`,
      [userId]
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
app.post('/api/submit-vehicle', authenticateJWT, async (req, res) => {
  try {
    const { email, numberplate, carDescription } = req.body;

    // Validate required fields
    if (!email || !numberplate) {
      return res.status(400).json({ error: 'Email and number plate are required' });
    }

    const connection = await pool.getConnection();
    
    // Check if user exists
    const [users] = await connection.query(
      'SELECT id FROM studentstaffuser WHERE email = ?', 
      [email]
    );

    if (users.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'User not found' });
    }

    
    // Check for duplicate number plate
    const [existing] = await connection.query(
      'SELECT * FROM vehicles WHERE numberplate = ? AND email = ?',
      [numberplate, email]
    );

    if (existing.length > 0) {
      connection.release();
      return res.status(409).json({ error: 'This vehicle has already been registered' });
    }
    
    // Insert into vehicles table WITHOUT specifying ID
    const [result] = await connection.query(
      `INSERT INTO vehicles 
      (email, numberplate, car_description, status, created_at) 
      VALUES (?, ?, ?, 'Pending', NOW())`,
      [email, numberplate, carDescription || null]
    );

    connection.release();

    res.json({ 
      message: 'Vehicle information submitted successfully',
      submissionId: result.insertId
    });

  } catch (err) {
    console.error('Submit vehicle error:', err);
    res.status(500).json({ 
      error: 'Failed to submit vehicle information',
      details: err.message
    });
  }
});

// Get user's submissions
app.get('/api/submissions', authenticateJWT, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [submissions] = await connection.query(
      `SELECT id, numberplate, car_description as carDescription, 
       status, created_at as createdAt
       FROM vehicles 
       WHERE email = ? 
       ORDER BY created_at DESC`,
      [req.user.email]
    );
    connection.release();

    res.json(submissions);
  } catch (err) {
    console.error('Fetch submissions error:', err);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Admin get all submissions
app.get('/api/admin/submissions', authenticateJWT, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const connection = await pool.getConnection();
    const [submissions] = await connection.query(
      `SELECT v.id, v.numberplate, v.car_description as carDescription, 
       v.status, v.created_at as createdAt,
       CONCAT(u.firstname, ' ', u.lastname) as userName
       FROM vehicles v
       JOIN studentstaffuser u ON v.user_id = u.id
       ORDER BY v.created_at DESC`
    );
    connection.release();

    res.json(submissions);
  } catch (err) {
    console.error('Admin fetch submissions error:', err);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Admin update submission status
app.put('/api/admin/submissions/:id', authenticateJWT, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'UPDATE vehicles SET status = ? WHERE id = ?',
      [status, id]
    );
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json({ message: 'Status updated successfully' });

  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update status' });
  }
});
app.delete('/api/delete-vehicle/:id', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user.email;
    const connection = await pool.getConnection();

    // Check ownership
    const [vehicle] = await connection.query(
      'SELECT * FROM vehicles WHERE id = ? AND email = ?',
      [id, userEmail]
    );

    if (vehicle.length === 0) {
      connection.release();
      return res.status(404).json({ error: 'Vehicle not found or unauthorized' });
    }

    // Delete the vehicle
    const [result] = await connection.query(
      'DELETE FROM vehicles WHERE id = ?',
      [id]
    );

    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (err) {
    console.error('Delete vehicle error:', err);
    res.status(500).json({ error: 'Failed to delete vehicle' });
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