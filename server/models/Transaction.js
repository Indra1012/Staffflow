const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  company:        { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  staff:          { type: mongoose.Schema.Types.ObjectId, ref: 'Staff', required: true },
  type:           { type: String, enum: ['salary', 'advance', 'adjustment'], required: true },
  amount:         { type: Number, required: true },
  monthKey:       { type: String },  // "YYYY-MM" for salary records
  date:           { type: String, required: true },
  paymentMode:    { type: String, default: 'Cash' },
  note:           { type: String, default: '' },
  status:         { type: String, default: 'paid' },
  // Salary slip fields
  earnedSalary:   { type: Number, default: 0 },
  overtime:       { type: Number, default: 0 },
  otDays:         { type: Number, default: 0 },
  bonus:          { type: Number, default: 0 },
  deductions:     { type: Number, default: 0 },
  presentDays:    { type: Number, default: 0 },
  halfDays:       { type: Number, default: 0 },
  absentDays:     { type: Number, default: 0 },
  paidHolidayCount: { type: Number, default: 0 },
  plCount:        { type: Number, default: 0 },
  slCount:        { type: Number, default: 0 },
  openingBalance: { type: Number, default: 0 },
  closingBalance: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);