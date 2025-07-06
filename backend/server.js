require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fileUpload = require('express-fileupload');
const FormData = require('form-data');



const app = express();
const port = process.env.PORT || 5000;
const saltRounds = 10;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(bodyParser.json());
app.use(fileUpload());


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
    const role = 'user'; 

    
    if (!firstname || !lastname || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    
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

    
    const trimmedPlate = numberplate?.trim().toUpperCase();
    const trimmedDate = visitDate?.trim();

    if (!firstName || !lastName || !email || !trimmedPlate || !trimmedDate || !visitReason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const connection = await pool.getConnection();

    // Check for duplicate plate on same date
    const [existing] = await connection.query(
      `SELECT id FROM visitors WHERE number_plate = ? AND visit_date = ?`,
      [trimmedPlate, trimmedDate]
    );

    if (existing.length > 0) {
      connection.release();
      return res.status(409).json({ error: 'This car is already registered for that date.' });
    }

    // Insert if no duplicate
    const [result] = await connection.query(
      `INSERT INTO visitors 
       (first_name, last_name, email, number_plate, visit_date, car_description, visit_reason, other_reason) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [firstName.trim(), lastName.trim(), email.trim().toLowerCase(), trimmedPlate, trimmedDate, carDescription, visitReason, otherReason]
    );

    connection.release();

    const parkingPassId = `PASS-${String(result.insertId).padStart(5, '0')}`;
    
    res.status(201).json({
      message: 'Visitor registered successfully!',
      parkingPassId
    });

  } catch (err) {
    console.error('Visitor registration error:', err);
    res.status(500).json({ error: 'Failed to register visitor' });
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
    
    // Insert into vehicles table
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
   JOIN studentstaffuser u ON v.email = u.email
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
// Admin stats endpoint
app.get('/api/admin/stats', authenticateJWT, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const connection = await pool.getConnection();
    
    // Debug: Verify tables exist
    const [tables] = await connection.query(
      "SHOW TABLES LIKE 'studentstaffuser'"
    );
    if (tables.length === 0) {
      connection.release();
      return res.status(500).json({ error: 'studentstaffuser table does not exist' });
    }

    // Get counts 
    let usersCount, visitorsCount, pendingVehicles;
    
    try {
      [usersCount] = await connection.query(
        'SELECT COUNT(id) as count FROM studentstaffuser'
      );
    } catch (err) {
      console.error('Error counting users:', err);
      usersCount = [{ count: 0 }];
    }

    try {
      [visitorsCount] = await connection.query(
        'SELECT COUNT(id) as count FROM visitors'
      );
    } catch (err) {
      console.error('Error counting visitors:', err);
      visitorsCount = [{ count: 0 }];
    }

    try {
      [pendingVehicles] = await connection.query(
        `SELECT COUNT(id) as count FROM vehicles WHERE status = 'Pending'`
      );
    } catch (err) {
      console.error('Error counting pending vehicles:', err);
      pendingVehicles = [{ count: 0 }];
    }
    
    connection.release();

   
    res.json({
      totalUsers: usersCount[0].count,
      totalVisitors: visitorsCount[0].count,
      pendingVehicles: pendingVehicles[0].count
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ 
      error: 'Failed to fetch stats',
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Get all users 
app.get('/api/admin/users', authenticateJWT, async (req, res) => {
  try {

    const connection = await pool.getConnection();
    const [users] = await connection.query(
      'SELECT id, firstname, lastname, email, role FROM studentstaffuser ORDER BY id DESC'
    );
    connection.release();

    res.json(users);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Delete user 
app.delete('/api/admin/users/:id', authenticateJWT, async (req, res) => {
  try {
    
    const userId = req.params.id;
    const connection = await pool.getConnection();
  
    if (req.user.id === parseInt(userId)) {
      connection.release();
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const [result] = await connection.query(
      'DELETE FROM studentstaffuser WHERE id = ?',
      [userId]
    );
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});     
// Get all visitors
app.get('/api/admin/visitors', authenticateJWT, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [visitors] = await connection.query(
      'SELECT * FROM visitors ORDER BY visit_date DESC'
    );
    connection.release();
    res.json(visitors);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch visitors' });
  }
});

// Get all vehicles with status
app.get('/api/admin/vehicles', authenticateJWT, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [vehicles] = await connection.query(
      `SELECT v.*, CONCAT(u.firstname, ' ', u.lastname) as owner_name 
       FROM vehicles v
       JOIN studentstaffuser u ON v.email = u.email
       ORDER BY v.created_at DESC`
    );
    connection.release();
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

// Update vehicle status
app.put('/api/admin/vehicles/:id/status', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
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
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ message: 'Status updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Approve all pending vehicles
app.put('/api/admin/vehicles/approve-all', authenticateJWT, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'UPDATE vehicles SET status = "Approved" WHERE status = "Pending"'
    );
    connection.release();

    res.json({ 
      message: `${result.affectedRows} vehicles approved successfully` 
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve vehicles' });
  }
});
// Delete vehicle
app.delete('/api/admin/vehicles/:id', authenticateJWT, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'DELETE FROM vehicles WHERE id = ?',
      [req.params.id]
    );
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});  
// Get entry logs
app.get('/api/admin/entry-logs', authenticateJWT, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const connection = await pool.getConnection();
    const [logs] = await connection.query(`
      SELECT 
        id,
        plate_number,
        entry_time,
        exit_time,
        entry_status,
        exit_status
      FROM entry_logs
      ORDER BY entry_time DESC
      LIMIT 100
    `);
    connection.release();

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch entry logs' });
  }
});

// Add new entry log
app.post('/api/admin/entry-logs', authenticateJWT, async (req, res) => {
  try {
    const { plate_number, user_id, entry_status, access_method, notes } = req.body;
    
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      `INSERT INTO entry_logs 
       (plate_number, user_id, entry_status, access_method, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [plate_number, user_id || null, entry_status, access_method, notes || null]
    );
    connection.release();

    res.status(201).json({ 
      message: 'Entry log created successfully',
      logId: result.insertId
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create entry log' });
  }
});

// Update exit status
app.put('/api/admin/entry-logs/:id/exit', authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params;
    const { exit_status, notes } = req.body;

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      `UPDATE entry_logs 
       SET exit_time = NOW(), exit_status = ?, notes = CONCAT(IFNULL(notes, ''), ?)
       WHERE id = ? AND exit_time IS NULL`,
      [exit_status, notes ? `\nExit note: ${notes}` : '', id]
    );
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Entry not found or already exited' });
    }

    res.json({ message: 'Exit recorded successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update exit status' });
  }
}); 
// process license plate image
app.post('/api/process-plate', authenticateJWT, async (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const imageFile = req.files.image;
    const action = req.body.action || 'entry';

    const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('image', imageFile.data, imageFile.name);
    formData.append('action', action);

    const pythonResponse = await fetch('http://localhost:5000/api/process-plate', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': req.headers['authorization'],
        ...formData.getHeaders()
      }
    });

    const result = await pythonResponse.json();
    const plate = result.plate_number;
    let status = result.status || 'granted';

    const connection = await pool.getConnection();

    const [lastLogs] = await connection.query(
      `SELECT * FROM entry_logs 
       WHERE plate_number = ? 
       ORDER BY entry_time DESC 
       LIMIT 1`,
      [plate]
    );

    const lastLog = lastLogs[0];

    if (action === 'entry') {
      if (lastLog && !lastLog.exit_time) {
        status = 'denied';
      } else {
        await connection.query(
          `INSERT INTO entry_logs (plate_number, entry_status, access_method) 
           VALUES (?, ?, 'automatic')`,
          [plate, status]
        );
        connection.release();
        return res.json({ plate_number: plate, status });
      }
    }

    if (action === 'exit') {
  if (!lastLog || lastLog.exit_time || lastLog.entry_status !== 'granted') {
    status = 'denied';
  } else {
    status = 'granted'; 
    await connection.query(
      `UPDATE entry_logs 
       SET exit_time = NOW(), exit_status = ?, access_method = 'automatic' 
       WHERE id = ?`,
      [status, lastLog.id]
    );
    connection.release();
    return res.json({ plate_number: plate, status });
  }
}


    connection.release();
    return res.json({ plate_number: plate, status });

  } catch (err) {
    console.error('Plate processing error:', err);
    res.status(500).json({ error: 'Failed to process license plate' });
  }
});


// Getting license plate logs
app.get('/api/plate-logs', authenticateJWT, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [logs] = await connection.query(
      'SELECT * FROM entry_logs ORDER BY entry_time DESC LIMIT 50'
    );
    connection.release();
    
    res.json(logs);
  } catch (err) {
    console.error('Error fetching plate logs:', err);
    res.status(500).json({ error: 'Failed to fetch plate logs' });
  }
}); 
app.post('/api/manual-plate', authenticateJWT, async (req, res) => {
  try {
    const { plate_number, action } = req.body;

    if (!plate_number || !action) {
      return res.status(400).json({ error: 'Missing plate number or action' });
    }

    const connection = await pool.getConnection();

    
    const [lastLogs] = await connection.query(
      `SELECT * FROM entry_logs 
       WHERE plate_number = ? 
       ORDER BY entry_time DESC 
       LIMIT 1`,
      [plate_number]
    );

    const lastLog = lastLogs[0];
    let status = 'granted';

    if (action === 'entry') {
      
      if (lastLog && !lastLog.exit_time) {
        status = 'denied';
      } else {
        
        await connection.query(
          `INSERT INTO entry_logs (plate_number, entry_status, access_method) 
           VALUES (?, ?, 'manual')`,
          [plate_number, status]
        );
        connection.release();
        return res.json({ plate_number, status });
      }
    }

    if (action === 'exit') {
  if (!lastLog || lastLog.exit_time || lastLog.entry_status !== 'granted') {
    status = 'denied';
  } else {
    status = 'granted'; 
    await connection.query(
      `UPDATE entry_logs 
       SET exit_time = NOW(), exit_status = ?, access_method = 'manual' 
       WHERE id = ?`,
      [status, lastLog.id]
    );
    connection.release();
    return res.json({ plate_number, status });
  }
}

    connection.release();
    return res.json({ plate_number, status });

  } catch (err) {
    console.error('Manual plate forwarding error:', err);
    res.status(500).json({ error: 'Failed to log manual plate' });
  }
});
app.delete('/api/admin/visitors/:id', authenticateJWT, async (req, res) => {
  try {
    const visitorId = req.params.id;

    const connection = await pool.getConnection();
    const [result] = await connection.query('DELETE FROM visitors WHERE id = ?', [visitorId]);
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    res.json({ message: 'Visitor deleted successfully' });
  } catch (err) {
    console.error('Error deleting visitor:', err);
    res.status(500).json({ error: 'Failed to delete visitor' });
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