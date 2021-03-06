const mongoose = require('mongoose');

const { Schema } = mongoose;

// Define PatientSchema
const PatientSchema = new Schema({
  name: { type: String, required: true, max: 100 },
  age: { type: Number, required: true },
  room: { type: String, required: true },
  profile_picture: { type: String, required: true },
  observation_periods: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Observation' }], default: [] },
  in_observation: { type: Boolean, required: true },
  display_ID: { type: String, required: true, max: 100 },
});

module.exports = mongoose.model('Patient', PatientSchema);
