const jwt = require('jsonwebtoken');

const protectStaff = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, access denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'staff') {
      return res.status(403).json({ message: 'Staff access only' });
    }
    req.staffUser = decoded; // { id, companyId, role: 'staff', email }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalid or expired' });
  }
};

module.exports = protectStaff;
