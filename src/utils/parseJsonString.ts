export const parseJsonString = <T>(
  value: string | null | undefined
): T | null => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value);

    const transformed = Object.fromEntries(
      Object.entries(parsed).map(([key, val]) => {
        const newKey = key.charAt(0).toLowerCase() + key.slice(1);

        // normalize numbers here
        if (
          ["feeValue", "batchCloseHours", "batchCloseMinutes"].includes(newKey)
        ) {
          return [newKey, val !== null && val !== "" ? Number(val) : undefined];
        }

        return [newKey, val];
      })
    );

    return transformed as T;
  } catch (error) {
    console.error("Invalid JSON string:", error);
    return null;
  }
};