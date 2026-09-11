import mongoose from "mongoose";
import Alert from "./models/Alert.js";

await mongoose.connect("mongodb://127.0.0.1/bhoomisetu");
const alerts = await Alert.find({}).lean();
console.log(JSON.stringify(alerts.map(a => ({ id: a._id, project: a.project, projectName: a.projectName, type: a.type })), null, 2));
await mongoose.disconnect();
