const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Staff = require('../models/Staff');
const Attendance = require('../models/Attendance');
const Transaction = require('../models/Transaction');
const protect = require('../middleware/auth');         // company admin
const staffProtect = require('../middleware/staffProtect'); // employee

const generateStaffToken = (staff) =>
  jwt.sign(
    { staffId: staff._id, companyId: staff.company, role: 'staff' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// ─── POST /api/staff/login ─────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: 'Email and password required' });

  try {
    const staff = await Staff.findOne({ email: email.toLowerCase().trim(), loginEnabled: true })
      .populate('company', 'companyName')
      .populate('department', 'name color');

    if (!staff || !staff.password)
      return res.status(401).json({ message: 'Invalid credentials' });

    const match = await bcrypt.compare(password, staff.password);
    if (!match)
      return res.status(401).json({ message: 'Invalid credentials' });

    return res.json({
      token: generateStaffToken(staff),
      role: 'staff',
      staff: {
        id: staff._id,
        name: staff.name,
        role: staff.role,
        email: staff.email,
        companyId: staff.company._id,
        companyName: staff.company.companyName,
        department: staff.department?.name || '',
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/staff/me ─────────────────────────────────────────────────────
router.get('/me', staffProtect, async (req, res) => {
  try {
    const staff = await Staff.findById(req.staffUser.staffId)
      .select('-password')
      .populate('department', 'name color description')
      .populate('company', 'companyName ownerName');
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    res.json(staff);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/staff/me/attendance?month=YYYY-MM ────────────────────────────
router.get('/me/attendance', staffProtect, async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ message: 'month query required' });
    const [y, m] = month.split('-').map(Number);
    const start = `${month}-01`;
    const end   = `${month}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`;
    const records = await Attendance.find({
      staff: req.staffUser.staffId,
      date: { $gte: start, $lte: end },
    });
    const result = {};
    records.forEach(r => { result[r.date] = r.status; });
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/staff/me/slips ───────────────────────────────────────────────
router.get('/me/slips', staffProtect, async (req, res) => {
  try {
    const slips = await Transaction.find({
      staff: req.staffUser.staffId,
      type: 'salary',
    }).sort({ date: -1 });
    res.json(slips);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/staff/me/ledger ──────────────────────────────────────────────
router.get('/me/ledger', staffProtect, async (req, res) => {
  try {
    const txns = await Transaction.find({ staff: req.staffUser.staffId })
      .sort({ date: 1 }); // oldest first so we can compute running balance

    let runBalance = 0;
    const withBalance = txns.map(tx => {
      const obj = tx.toObject();
      if (tx.type === 'advance') {
        obj.debit  = tx.amount;
        obj.credit = 0;
        runBalance -= tx.amount;
      } else if (tx.type === 'adjustment') {
        obj.debit  = 0;
        obj.credit = tx.amount;
        runBalance += tx.amount;
      } else if (tx.type === 'salary') {
        obj.debit  = 0;
        obj.credit = tx.amount;
        runBalance = tx.closingBalance ?? 0;
      }
      obj.runningBalance = runBalance;
      return obj;
    });

    // Return newest-first for display
    res.json(withBalance.reverse());
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PUT /api/staff/me/password ────────────────────────────────────────────
router.put('/me/password', staffProtect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: 'Both passwords required' });
  if (newPassword.length < 6)
    return res.status(400).json({ message: 'Password must be at least 6 characters' });

  try {
    const staff = await Staff.findById(req.staffUser.staffId);
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    const match = await bcrypt.compare(currentPassword, staff.password);
    if (!match) return res.status(401).json({ message: 'Current password is incorrect' });

    staff.password = await bcrypt.hash(newPassword, 10);
    await staff.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PUT /api/staff/:id/credentials (admin only) ──────────────────────────
router.put('/:id/credentials', protect, async (req, res) => {
  const { email, password } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const staff = await Staff.findOne({ _id: req.params.id, company: req.company.id });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    // Check email not used by another staff member
    const existing = await Staff.findOne({
      email: email.toLowerCase().trim(),
      company: req.company.id,
      _id: { $ne: staff._id },
    });
    if (existing)
      return res.status(409).json({ message: 'Email already used by another employee' });

    staff.email = email.toLowerCase().trim();
    if (password) {
      if (password.length < 6)
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
      staff.password = await bcrypt.hash(password, 10);
    }
    staff.loginEnabled = true;
    await staff.save();

    res.json({ message: 'Credentials saved. Employee can now log in.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
