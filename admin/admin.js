// Import necessary modules
const express = require('express');
const router = express.Router();
const Admin = require('./models/adminModel'); // Ensure correct path
const bcrypt = require('bcrypt');

// Admin login route
router.get('/login', (req, res) => {
  res.render('admin-login'); // Render the admin login page
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).send("Invalid login credentials");
    }

    // Redirect to admin dashboard
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Admin dashboard route
router.get('/dashboard', (req, res) => {
  res.render('admin-dashboard'); // Ensure this EJS file exists
});

// Export the admin router
module.exports = router;
