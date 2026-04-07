const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const protect = require('../middleware/auth');
const Staff = require('../models/Staff');

// GET /api/staff — get all staff for this company (excludes password hash)
router.get('/', protect, async (req, res) => {
  try {
    const staff = await Staff.find({ company: req.company.id })
      .select('-password')
      .populate('department')
      .sort({ createdAt: -1 });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/staff — add new staff member
router.post('/', protect, async (req, res) => {
  const { name, role, salary, fixedAllowance, fixedDeduction, weeklyOff, department, email, password, loginEnabled } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  try {
    let hashedPassword = '';
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Check if email already used by another staff in this company
    if (email) {
      const existing = await Staff.findOne({ email, company: req.company.id });
      if (existing) {
        return res.status(409).json({ message: 'A staff member with this email already exists' });
      }
    }

    const staff = await Staff.create({
      company: req.company.id,
      name, role,
      salary: salary || 0,
      fixedAllowance: fixedAllowance || 0,
      fixedDeduction: fixedDeduction || 0,
      weeklyOff: weeklyOff || 0,
      department: department || null,
      balance: 0,
      isActive: true,
      salaryHistory: [{ amount: salary || 0, effectiveDate: new Date().toISOString().split('T')[0] }],
      email: email || '',
      password: hashedPassword,
      loginEnabled: !!(email && hashedPassword) || !!loginEnabled,
    });

    const populated = await staff.populate('department');
    const result = populated.toObject();
    delete result.password;
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/staff/:id — update staff
router.put('/:id', protect, async (req, res) => {
  try {
    const staff = await Staff.findOne({ _id: req.params.id, company: req.company.id });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    const { name, role, isActive, salary, effectiveDate, fixedAllowance, fixedDeduction, weeklyOff, balance, department, email, password, loginEnabled } = req.body;

    if (name !== undefined) staff.name = name;
    if (role !== undefined) staff.role = role;
    if (isActive !== undefined) staff.isActive = isActive;
    if (fixedAllowance !== undefined) staff.fixedAllowance = fixedAllowance;
    if (fixedDeduction !== undefined) staff.fixedDeduction = fixedDeduction;
    if (weeklyOff !== undefined) staff.weeklyOff = weeklyOff;
    if (balance !== undefined) staff.balance = balance;
    if (department !== undefined) staff.department = department || null;
    if (email !== undefined) staff.email = email;
    if (loginEnabled !== undefined) staff.loginEnabled = loginEnabled;

    // Hash new password if provided
    if (password) {
      staff.password = await bcrypt.hash(password, 10);
      if (staff.email) staff.loginEnabled = true;
    }

    // Salary revision — adds to history
    if (salary !== undefined && salary !== staff.salary) {
      staff.salary = salary;
      staff.salaryHistory.push({
        amount: salary,
        effectiveDate: effectiveDate || new Date().toISOString().split('T')[0]
      });
    }

    await staff.save();
    const result = staff.toObject();
    delete result.password;
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/staff/:id — permanent delete (rarely used, archive is preferred)
router.delete('/:id', protect, async (req, res) => {
  try {
    const staff = await Staff.findOneAndDelete({ _id: req.params.id, company: req.company.id });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });
    res.json({ message: 'Staff deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
