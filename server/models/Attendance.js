const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  company:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  staff:    { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  date:     { type: String, required: true }, // "YYYY-MM-DD"
status: { type: String, enum: ['P', 'A', 'HD', 'OT', 'PL', 'SL', 'PH', 'WE'], required: true },
}, { timestamps: true });

// One record per staff per date
attendanceSchema.index({ staff: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);