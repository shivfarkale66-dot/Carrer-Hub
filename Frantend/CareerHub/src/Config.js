export const API_BASE = String(import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

export const TURN = {
  url: import.meta.env.VITE_TURN_URL || "",
  username: import.meta.env.VITE_TURN_USERNAME || "",
  credential: import.meta.env.VITE_TURN_CREDENTIAL || "",
};
