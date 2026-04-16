const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Staff = require('../models/Staff');

// POST /api/payroll/process — process monthly salary
router.post('/process', protect, async (req, res) => {
  const {
    staffId, monthKey, amount, earnedSalary, overtime, otDays,
    bonus, deductions, presentDays, halfDays, absentDays,
    paidHolidayCount, plCount, slCount, openingBalance,
    closingBalance, paymentMode, note, date
  } = req.body;

  if (!staffId || !monthKey || amount === undefined) {
    return res.status(400).json({ message: 'staffId, monthKey and amount are required' });
  }

  try {
    const staff = await Staff.findOne({ _id: staffId, company: req.company.id });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    const tx = await Transaction.create({
      company: req.company.id,
      staff: staffId,
      type: 'salary',
      amount, monthKey, date, paymentMode, note,
      earnedSalary: earnedSalary || 0,
      overtime: overtime || 0,
      otDays: otDays || 0,
      bonus: bonus || 0,
      deductions: deductions || 0,
      presentDays: presentDays || 0,
      halfDays: halfDays || 0,
      absentDays: absentDays || 0,
      paidHolidayCount: paidHolidayCount || 0,
      plCount: plCount || 0,
      slCount: slCount || 0,
      openingBalance: openingBalance || 0,
      closingBalance: closingBalance || 0,
      status: 'paid'
    });

    // Update staff balance to closing balance
    await Staff.findByIdAndUpdate(staffId, { balance: closingBalance });

    res.status(201).json(tx);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/payroll/slips?month=YYYY-MM
router.get('/slips', protect, async (req, res) => {
  try {
    const query = { company: req.company.id, type: 'salary' };
    if (req.query.month) query.monthKey = req.query.month;

    const slips = await Transaction.find(query)
      .populate('staff', 'name role avatar')
      .sort({ date: -1 });

    res.json(slips);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;