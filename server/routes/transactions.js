const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Staff = require('../models/Staff');

// GET /api/transactions?staffId=xxx&month=YYYY-MM
router.get('/', protect, async (req, res) => {
  try {
    const query = { company: req.company.id };
    if (req.query.staffId) query.staff = req.query.staffId;
    if (req.query.month) query.monthKey = req.query.month;

    const transactions = await Transaction.find(query).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/transactions — advance or adjustment
router.post('/', protect, async (req, res) => {
  const { staffId, type, amount, date, paymentMode, note } = req.body;

  if (!staffId || !type || !amount || !date) {
    return res.status(400).json({ message: 'staffId, type, amount and date are required' });
  }

  try {
    const staff = await Staff.findOne({ _id: staffId, company: req.company.id });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    const tx = await Transaction.create({
      company: req.company.id,
      staff: staffId,
      type, amount, date, paymentMode, note,
      status: 'unsettled'
    });

    // Update staff balance
    const balanceDelta = type === 'advance' ? -amount : amount;
    await Staff.findByIdAndUpdate(staffId, { $inc: { balance: balanceDelta } });

    res.status(201).json(tx);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;