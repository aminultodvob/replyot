"use server";

import { onCurrentUser } from "../user";
import {
  AnalyticsRange,
  getAutomationAnalyticsForUser,
  getRecentAutomationEventsForUser,
} from "../webhook/queries";

export const getAutomationAnalytics = async (range: AnalyticsRange = "7d") => {
  const user = await onCurrentUser();

  try {
    const analytics = await getAutomationAnalyticsForUser(user.id, range);
    if (!analytics) {
      return { status: 404 as const, data: null };
    }

    return { status: 200 as const, data: analytics };
  } catch (error) {
    console.log("[analytics] failed", error);
    return { status: 500 as const, data: null };
  }
};

export const getRecentAutomationEvents = async (limit = 8) => {
  const user = await onCurrentUser();

  try {
    const events = await getRecentAutomationEventsForUser(user.id, limit);
    return { status: 200 as const, data: events };
  } catch (error) {
    console.log("[analytics] recent events failed", error);
    return { status: 500 as const, data: [] };
  }
};
