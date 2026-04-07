const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  companyName: { type: String, required: true, trim: true },
  ownerName:   { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true },
  password:    { type: String, required: true },
  googleAuth: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Company', companySchema);