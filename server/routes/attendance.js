const express = require('express');
const router = express.Router();
const protect = require('../middleware/auth');
const Attendance = require('../models/Attendance');
const Staff = require('../models/Staff');

// GET /api/attendance?month=YYYY-MM
router.get('/', protect, async (req, res) => {
  try {
    const { month } = req.query;
    const query = { company: req.company.id };
    if (month) {
      query.date = { $regex: `^${month}` };
    }
    const records = await Attendance.find(query);

    // Shape into { staffId: { dateStr: status } } — same format as the React app
    const shaped = {};
    records.forEach(r => {
      const sid = r.staff.toString();
      if (!shaped[sid]) shaped[sid] = {};
      shaped[sid][r.date] = r.status;
    });

    res.json(shaped);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/attendance — save one cell
router.post('/', protect, async (req, res) => {
  const { staffId, date, status } = req.body;
  if (!staffId || !date) {
    return res.status(400).json({ message: 'staffId and date are required' });
  }

  try {
    // Verify staff belongs to this company
    const staff = await Staff.findOne({ _id: staffId, company: req.company.id });
    if (!staff) return res.status(404).json({ message: 'Staff not found' });

    if (!status) {
      // Empty status = delete the record
      await Attendance.findOneAndDelete({ staff: staffId, date });
      return res.json({ message: 'Attendance cleared' });
    }

    const record = await Attendance.findOneAndUpdate(
      { staff: staffId, date },
      { company: req.company.id, staff: staffId, date, status },
      { upsert: true, new: true }
    );
    res.json(record);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/attendance/bulk — auto-fill range
router.post('/bulk', protect, async (req, res) => {
  const { staffIds, dates, status } = req.body;
  // staffIds: array of ids, dates: array of "YYYY-MM-DD", status: string

  if (!staffIds || !dates || !status) {
    return res.status(400).json({ message: 'staffIds, dates and status are required' });
  }

  try {
    const ops = [];
    staffIds.forEach(staffId => {
      dates.forEach(date => {
        ops.push({
          updateOne: {
            filter: { staff: staffId, date },
            update: { company: req.company.id, staff: staffId, date, status },
            upsert: true
          }
        });
      });
    });

    await Attendance.bulkWrite(ops);
    res.json({ message: `${ops.length} records updated` });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;