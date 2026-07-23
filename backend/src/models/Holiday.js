const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  date: { type: Date, required: true },
  type: { type: String, enum: ['public', 'optional', 'restricted'], default: 'public' },
  description: String,
  isRecurring: { type: Boolean, default: false },
  departments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }],
  locations: [String],
  year: { type: Number },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

holidaySchema.pre('save', function(next) {
  if (this.date) this.year = new Date(this.date).getFullYear();
  next();
});

holidaySchema.index({ date: 1 });
holidaySchema.index({ year: 1 });

module.exports = mongoose.model('Holiday', holidaySchema);
