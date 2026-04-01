type TimerResult<T> = Promise<T>;

const isEnabled = () => process.env.NODE_ENV !== "production";

export const timeServerStep = async <T>(
  label: string,
  operation: () => TimerResult<T>
) => {
  if (!isEnabled()) {
    return operation();
  }

  const started = performance.now();
  try {
    return await operation();
  } finally {
    const duration = Math.round(performance.now() - started);
    console.log(`[timing] ${label}: ${duration}ms`);
  }
};
