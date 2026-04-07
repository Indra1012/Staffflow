//routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Company = require('../models/Company');
const Staff = require('../models/Staff');
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (company) => {
  return jwt.sign(
    { id: company._id, email: company.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const generateStaffToken = (staffMember) => {
  return jwt.sign(
    { id: staffMember._id, companyId: staffMember.company._id || staffMember.company, role: 'staff', email: staffMember.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { companyName, ownerName, email, password } = req.body;

  if (!companyName || !ownerName || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existing = await Company.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const company = await Company.create({
      companyName, ownerName, email, password: hashed
    });

    res.status(201).json({
      token: generateToken(company),
      role: 'company',
      company: {
        id: company._id,
        companyName: company.companyName,
        ownerName: company.ownerName,
        email: company.email,
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/auth/login — unified: tries company first, then staff
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Try company login first
    const company = await Company.findOne({ email });
    if (company) {
      const isMatch = await bcrypt.compare(password, company.password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

      return res.json({
        token: generateToken(company),
        role: 'company',
        company: {
          id: company._id,
          companyName: company.companyName,
          ownerName: company.ownerName,
          email: company.email,
        }
      });
    }

    // Try staff login
    const staffMember = await Staff.findOne({ email, loginEnabled: true })
      .populate('company', 'companyName');

    if (!staffMember || !staffMember.password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, staffMember.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    return res.json({
      token: generateStaffToken(staffMember),
      role: 'staff',
      staff: {
        id: staffMember._id,
        name: staffMember.name,
        role: staffMember.role,
        email: staffMember.email,
        companyId: staffMember.company._id,
        companyName: staffMember.company.companyName,
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/auth/google
router.post('/google', async (req, res) => {
  const { credential, email: googleEmail, companyName, ownerName } = req.body;
  if (!credential) return res.status(400).json({ message: 'No credential provided' });

  try {
    const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo`, {
      headers: { Authorization: `Bearer ${credential}` }
    });
    if (!response.ok) return res.status(401).json({ message: 'Invalid Google token' });

    const userInfo = await response.json();
    const email = userInfo.email || googleEmail;
    const name = userInfo.name;

    if (!email) return res.status(400).json({ message: 'Could not get email from Google' });

    let company = await Company.findOne({ email });

    if (company) {
      return res.json({
        token: generateToken(company),
        role: 'company',
        company: { id: company._id, email: company.email, companyName: company.companyName, ownerName: company.ownerName },
        isNew: false,
      });
    }

    if (!companyName || !ownerName) {
      return res.status(200).json({ isNew: true, email, name });
    }

    company = await Company.create({
      email,
      companyName,
      ownerName,
      password: await bcrypt.hash(Math.random().toString(36).slice(2), 10),
      googleAuth: true,
    });

    res.status(201).json({
      token: generateToken(company),
      role: 'company',
      company: { id: company._id, email: company.email, companyName: company.companyName, ownerName: company.ownerName },
      isNew: false,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ message: 'Google authentication failed' });
  }
});

module.exports = router;
