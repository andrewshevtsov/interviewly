import type { NextConfig } from "next";

// Без allowedDevOrigins Next.js в `next dev` режет /_next/* с чужого Host
// (туннель, дев-домен). DEV_TUNNEL_ORIGIN — один хост или список через запятую
// (ngrok, interviewly.top). См. docs/dev/telegram-auth-manual-testing.md.
const allowedDevOrigins = (process.env.DEV_TUNNEL_ORIGIN ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  allowedDevOrigins: allowedDevOrigins.length > 0 ? allowedDevOrigins : undefined,
};

export default nextConfig;
