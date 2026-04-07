const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'StaffFlow API is running' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/staff', require('./routes/staffAuth')); // employee portal routes (before staff.js)
app.use('/api/staff', require('./routes/staff'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/payroll', require('./routes/payroll'));
app.use('/api/company', require('./routes/company'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/staff-portal', require('./routes/staffPortal'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});