const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const protect = require('../middleware/auth');
const Company = require('../models/Company');

// GET /api/company — get current company profile
router.get('/', protect, async (req, res) => {
  try {
    const company = await Company.findById(req.company.id).select('-password');
    if (!company) return res.status(404).json({ message: 'Company not found' });
    res.json(company);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/company — update company profile
router.put('/', protect, async (req, res) => {
  const { companyName, ownerName, currentPassword, newPassword } = req.body;

  try {
    const company = await Company.findById(req.company.id);
    if (!company) return res.status(404).json({ message: 'Company not found' });

    if (companyName) company.companyName = companyName;
    if (ownerName) company.ownerName = ownerName;

    // Password change — only if both fields provided
    if (currentPassword && newPassword) {
      const isMatch = await bcrypt.compare(currentPassword, company.password);
      if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
      company.password = await bcrypt.hash(newPassword, 10);
    }

    await company.save();
    res.json({
      id: company._id,
      companyName: company.companyName,
      ownerName: company.ownerName,
      email: company.email,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;