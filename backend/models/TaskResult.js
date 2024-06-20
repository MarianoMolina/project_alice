const mongoose = require('mongoose');
const { Schema } = mongoose;

const taskResultSchema = new Schema({
  task_name: { type: String, required: true },
  task_description: { type: String, required: true },
  status: { type: String, enum: ["pending", "complete", "failed"], required: true },
  result_code: { type: Number, required: true },
  task_outputs: { type: Schema.Types.Mixed, default: null },
  result_diagnostic: { type: String, default: null, allowNull: true },
  task_content: { type: Schema.Types.Mixed, default: null },
  usage_metrics: { type: Map, of: Schema.Types.Mixed, default: null },
  execution_history: [{ type: Map, of: Schema.Types.Mixed, default: null }],
});

const TaskResult = mongoose.model('TaskResult', taskResultSchema);
module.exports = TaskResult;