const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const Department = require('../models/Department');
const Staff = require('../models/Staff');

// GET /api/departments
router.get('/', protect, async (req, res) => {
  try {
    const departments = await Department.find({ company: req.company.id }).sort({ createdAt: 1 });
    // Add staff count to each department
    const withCounts = await Promise.all(departments.map(async (dept) => {
      const count = await Staff.countDocuments({ company: req.company.id, department: dept._id, isActive: true });
      return { ...dept.toObject(), staffCount: count };
    }));
    res.json(withCounts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/departments
router.post('/', protect, async (req, res) => {
  const { name, description, color } = req.body;
  if (!name) return res.status(400).json({ message: 'Name is required' });
  try {
    const dept = await Department.create({ company: req.company.id, name, description, color: color || '#000000' });
    res.status(201).json({ ...dept.toObject(), staffCount: 0 });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/departments/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const dept = await Department.findOneAndUpdate(
      { _id: req.params.id, company: req.company.id },
      { $set: req.body },
      { new: true }
    );
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    const staffCount = await Staff.countDocuments({ company: req.company.id, department: dept._id, isActive: true });
    res.json({ ...dept.toObject(), staffCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// DELETE /api/departments/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const dept = await Department.findOneAndDelete({ _id: req.params.id, company: req.company.id });
    if (!dept) return res.status(404).json({ message: 'Department not found' });
    // Remove department reference from all staff
    await Staff.updateMany({ department: req.params.id }, { $set: { department: null } });
    res.json({ message: 'Department deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;