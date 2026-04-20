import { runAutoReorderJob } from "./autoReorder.job.js";
import { runExpiryAlertJob } from "./expiryAlert.job.js";

export const initPantryJobs = (app) => {
  runExpiryAlertJob(app);
  runAutoReorderJob(app);
};
