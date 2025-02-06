
// Import necessary modules
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse form requests
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MongoDB connection
const MONGO_URI = 'mongodb://127.0.0.1:27017/cds-attendance_db';
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB...'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define attendance schema
const attendanceSchema = new mongoose.Schema({
  stateCode: { type: String, required: true },
  name: { type: String, required: true },
  comments: { type: String },
  attendancePresent: { type: Boolean, default: false },
  date: { type: Date, default: Date.now }
});

const Attendance = mongoose.model('Attendance', attendanceSchema);

// Define admin schema and model
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const Admin = mongoose.model('Admin', adminSchema);

//comments Schema

const commentSchema = new mongoose.Schema({
    username: { type: String, required: true },
    commentText: { type: String, required: true },
    likes: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
});
  
  const Comment = mongoose.model('Comment', commentSchema);
  

// Check if admin already exists and create a new one if it doesn't
async function createAdmin(username, password) {
  try {
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) return;
    const newAdmin = new Admin({ username, password });
    await newAdmin.save();
    console.log('Admin created successfully');
  } catch (err) {
    console.error('Error creating admin:', err);
  }
}

// Create default admin user
createAdmin('admin', 'Developer123');

// Home route
app.get('/', (req, res) => {
  res.render('Attendance'); // Ensure Attendance.ejs exists
});

// Handle attendance submission
app.post('/submit-attendance', async (req, res) => {
  try {
    const { name, stateCode, comments } = req.body;

    if (!stateCode) {
    //   return res.status(400).json({ message: 'State code is required.' });
      return res.redirect("/emptyLoginDetails");
  }

  

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Check if attendance already submitted today
    const existingRecord = await Attendance.findOne({
      stateCode,
      date: { $gte: startOfDay, $lt: endOfDay }
    });

    if (existingRecord) {
      return res.redirect('/AlreadySubmitted');
    }

    // Save attendance
    const attendanceRecord = new Attendance({
      name,
      stateCode,
      comments,
      attendancePresent: true
    });

    await attendanceRecord.save();

    // Redirect to confirmation page
    return res.redirect('/Confirmation');

  } catch (error) {
    console.error('Error saving attendance:', error);
    res.status(500).json({ message: 'Error marking attendance' });
  }
});

// Route to handle redirection if attendance was already submitted
app.get('/AlreadySubmitted', (req, res) => {
  res.render('submitted');
});

//error for wrong inputs
app.get("/emptyLoginDetails", (req, res)=> {
  res.render('verifyLogin');
})

// Route to handle redirection after successful attendance submission
app.get('/Confirmation', (req, res) => {
  res.render('Confirmation');
});


//Admin routes
app.get('/Admin-Login', (req, res) => {
    res.render('AdminLogin');
});

app.post('/admin-view-attendance', async (req, res) => {
    try {
      const { username, password } = req.body;
      const admin = await Admin.findOne({ username, password });
      if (!admin) {
        return res.render('errorAdminPage');
      }
      res.redirect('/viewList');
    } catch (err) {
      console.error('Error logging in admin:', err);
      res.status(500).json({ message: 'Error logging in admin' });
    }
  });

// Route to view attendance list
app.get('/viewList', async (req, res) => {
  try {
    const attendanceList = await Attendance.find({}, 'stateCode name date attendancePresent');
    res.render('attendanceList', { attendanceList });
  } catch (err) {
    console.error('Error fetching attendance list:', err);
    res.status(500).json({ message: 'Error fetching attendance list' });
  }
});


//CREATING AN ARRAY FOR THE COMMENTS
var comments = [];

//accepting comments and rendering comments
app.get("/submit-comment", (req, res) => {
  res.render("commentList", {comments});
});


app.post("/add-comment", (req, res) => {
  const { username, comment } = req.body;
  if (username && comment) {
    comments.push({ id: Date.now(), username, text: comment, replies: [] });
  }
  res.render("commentList", {comments});
});


// replying to using comments
app.post("/reply/:id", (req, res) => {
  const commentId = parseInt(req.params.id);
  const replyText = req.body.reply;
  const comment = comments.find(c => c.id === commentId);

  if (comment && replyText) {
    comment.replies.push(replyText);
  }
res.render("commentList", {comments});
});



// Start the server
app.listen(PORT, () => {
  console.log(`App running on port: ${PORT}`);
});
