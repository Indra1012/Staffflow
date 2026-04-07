const express = require('express');
const router = express.Router();
const protectStaff = require('../middleware/staffAuth');
const Staff = require('../models/Staff');
const Attendance = require('../models/Attendance');
const Transaction = require('../models/Transaction');

// GET /api/staff-portal/me
router.get('/me', protectStaff, async (req, res) => {
  try {
    const staff = await Staff.findById(req.staffUser.id)
      .select('-password')
      .populate('department', 'name color description');
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/staff-portal/attendance?month=YYYY-MM
router.get('/attendance', protectStaff, async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ message: 'Month required' });
    const [year, m] = month.split('-').map(Number);
    const startDate = `${month}-01`;
    const endDate = `${month}-${String(new Date(year, m, 0).getDate()).padStart(2, '0')}`;
    const records = await Attendance.find({
      staff: req.staffUser.id,
      date: { $gte: startDate, $lte: endDate },
    });
    const result = {};
    records.forEach(r => { result[r.date] = r.status; });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/staff-portal/ledger
router.get('/ledger', protectStaff, async (req, res) => {
  try {
    const transactions = await Transaction.find({ staff: req.staffUser.id })
      .sort({ date: -1 });
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/staff-portal/payslips
router.get('/payslips', protectStaff, async (req, res) => {
  try {
    const slips = await Transaction.find({ staff: req.staffUser.id, type: 'salary' })
      .sort({ date: -1 });
    res.json(slips);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
