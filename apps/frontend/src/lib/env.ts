const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export const env = {
  API_URL: apiUrl,
} as const;
