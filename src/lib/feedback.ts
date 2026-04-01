type FeedbackKind = "success" | "error";

export type AppFeedbackContext =
  | "generic"
  | "auth_sign_in"
  | "auth_sign_up"
  | "auth_forgot_password"
  | "auth_reset_password"
  | "automation_create"
  | "automation_delete"
  | "integration_disconnect"
  | "payment_start"
  | "activation_toggle"
  | "response_save";

type FeedbackConfig = {
  successTitle: string;
  successDescription?: string;
  errorTitle: string;
  errorDescription: string;
};

const FEEDBACK_CONFIG: Record<AppFeedbackContext, FeedbackConfig> = {
  generic: {
    successTitle: "Done",
    errorTitle: "Error",
    errorDescription: "Something went wrong. Please try again.",
  },
  auth_sign_in: {
    successTitle: "Signed in",
    errorTitle: "Could not sign in",
    errorDescription: "Unable to sign in right now. Please try again.",
  },
  auth_sign_up: {
    successTitle: "Account created",
    successDescription: "You can continue to your dashboard now.",
    errorTitle: "Could not create account",
    errorDescription: "Unable to create your account right now. Please try again.",
  },
  auth_forgot_password: {
    successTitle: "Reset link sent",
    successDescription: "If the account exists, the reset email is on its way.",
    errorTitle: "Could not send reset link",
    errorDescription: "Unable to send a reset link right now. Please try again.",
  },
  auth_reset_password: {
    successTitle: "Password updated",
    successDescription: "You can sign in with your new password now.",
    errorTitle: "Could not reset password",
    errorDescription: "Unable to reset your password right now. Please try again.",
  },
  automation_create: {
    successTitle: "Automation created",
    successDescription: "Your new workflow is ready to set up.",
    errorTitle: "Could not create automation",
    errorDescription: "Unable to create this automation right now.",
  },
  automation_delete: {
    successTitle: "Automation deleted",
    successDescription: "This workflow was removed permanently.",
    errorTitle: "Could not delete automation",
    errorDescription: "Unable to delete this automation right now.",
  },
  integration_disconnect: {
    successTitle: "Integration disconnected",
    successDescription: "The connection was removed successfully.",
    errorTitle: "Could not disconnect integration",
    errorDescription: "Unable to disconnect this integration right now.",
  },
  payment_start: {
    successTitle: "Payment ready",
    errorTitle: "Could not start payment",
    errorDescription: "Unable to start payment right now. Please try again.",
  },
  activation_toggle: {
    successTitle: "Automation updated",
    errorTitle: "Could not update automation",
    errorDescription: "Unable to update this automation right now.",
  },
  response_save: {
    successTitle: "Response saved",
    successDescription: "Your reply settings have been updated.",
    errorTitle: "Could not save response",
    errorDescription: "Unable to save your response right now.",
  },
};

const sanitizeMessage = (message?: string | null) => {
  if (!message) return "";

  const normalized = message.replace(/\s+/g, " ").trim();
  const lowered = normalized.toLowerCase();

  if (
    lowered.includes("failed query") ||
    lowered.includes("select ") ||
    lowered.includes("insert ") ||
    lowered.includes("update ") ||
    lowered.includes("delete ") ||
    lowered.includes("drizzle") ||
    lowered.includes("postgres") ||
    lowered.includes("sqlstate") ||
    lowered.includes("syntax error") ||
    lowered.includes("connection") ||
    lowered.includes("callbackrouteerror")
  ) {
    return "";
  }

  return normalized;
};

export const normalizeAppError = (
  error: unknown,
  context: AppFeedbackContext = "generic"
) => {
  const fallback = FEEDBACK_CONFIG[context].errorDescription;

  if (typeof error === "string") {
    const sanitized = sanitizeMessage(error);
    return sanitized || fallback;
  }

  if (error instanceof Error) {
    const message = sanitizeMessage(error.message);
    return message || fallback;
  }

  return fallback;
};

export const normalizeAuthError = (error?: string, status?: number) => {
  if (status === 409) return "This email is already registered. Please sign in.";
  if (!error) return FEEDBACK_CONFIG.auth_sign_in.errorDescription;

  const lowered = error.toLowerCase();

  if (lowered.includes("auth_rate_limited") || lowered.includes("too many")) {
    return "Too many attempts. Please try again later.";
  }

  if (
    lowered.includes("auth_unavailable") ||
    lowered.includes("callbackrouteerror") ||
    lowered.includes("failed query") ||
    lowered.includes("select ")
  ) {
    return "Unable to sign in right now. Please try again.";
  }

  if (lowered.includes("credentials")) return "Invalid email or password";
  if (lowered.includes("already exists")) {
    return "This email is already registered. Please sign in.";
  }
  if (lowered.includes("network")) {
    return "Network issue. Please check your connection and try again.";
  }
  if (lowered.includes("password")) return error;

  const sanitized = sanitizeMessage(error);
  return sanitized || FEEDBACK_CONFIG.auth_sign_in.errorDescription;
};

export const getToastConfig = (
  context: AppFeedbackContext,
  kind: FeedbackKind,
  overrides?: {
    title?: string;
    description?: string;
  }
) => {
  const config = FEEDBACK_CONFIG[context];

  if (kind === "success") {
    return {
      title: overrides?.title ?? config.successTitle,
      description: overrides?.description ?? config.successDescription,
    };
  }

  return {
    title: overrides?.title ?? config.errorTitle,
    description: overrides?.description ?? config.errorDescription,
  };
};
