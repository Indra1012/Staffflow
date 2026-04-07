const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  color: { type: String, default: '#000000' },
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);