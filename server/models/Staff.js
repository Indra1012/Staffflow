const mongoose = require('mongoose');

const salaryHistorySchema = new mongoose.Schema({
  amount:        { type: Number, required: true },
  effectiveDate: { type: String, required: true },
});

const staffSchema = new mongoose.Schema({
  company:        { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name:           { type: String, required: true, trim: true },
  role:           { type: String, default: '' },
  salary:         { type: Number, default: 0 },
  fixedAllowance: { type: Number, default: 0 },
  fixedDeduction: { type: Number, default: 0 },
  weeklyOff:      { type: mongoose.Schema.Types.Mixed, default: 0 },
  balance:        { type: Number, default: 0 },
  department:     { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
  isActive:       { type: Boolean, default: true },
  avatar:         { type: String, default: '' },
  salaryHistory:  [salaryHistorySchema],
  // Staff portal login
  email:          { type: String, unique: true, sparse: true, trim: true, lowercase: true },
  password:       { type: String, default: '' },
  loginEnabled:   { type: Boolean, default: false },
  joinDate:       { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);
