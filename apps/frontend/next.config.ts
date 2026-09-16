import type { NextConfig } from "next";

// DEV_TUNNEL_ORIGIN - опциональный, только для локальной разработки через туннель
// (ngrok/cloudflared), например при тестировании Telegram Login Widget, которому
// нужен настоящий домен - см. docs/dev/telegram-auth-manual-testing.md. Без него
// Next.js в dev-режиме блокирует HMR-запросы с чужого origin, из-за чего клиентские
// эффекты становятся нестабильными на самой странице (не только рвётся live-reload).
const nextConfig: NextConfig = {
  allowedDevOrigins: process.env.DEV_TUNNEL_ORIGIN ? [process.env.DEV_TUNNEL_ORIGIN] : undefined,
};

export default nextConfig;
