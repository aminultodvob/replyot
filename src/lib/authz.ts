export const resolveOwnershipStatus = <T extends { userId?: string | null }>(
  resource: T | null | undefined,
  userId: string
) => {
  if (!resource) {
    return { ok: false as const, status: 404 as const, message: "Resource not found" };
  }

  if (resource.userId !== userId) {
    return { ok: false as const, status: 403 as const, message: "Forbidden" };
  }

  return { ok: true as const };
};
