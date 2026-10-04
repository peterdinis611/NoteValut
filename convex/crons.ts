import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/** Fire recurring templates for all owners (hourly — idempotent per day). */
crons.interval("recurring templates", { hours: 1 }, internal.recurringTemplates.runDueAll, {});

/** Schedule daily vault reminders around the hour. */
crons.interval("daily note reminders", { minutes: 15 }, internal.reminders.fireDailyReminders, {});

export default crons;
