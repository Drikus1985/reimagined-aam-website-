import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js requires inline styles/scripts for hydration; PayFast form posts out.
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https://allamericanmuscle.co.za https://www.allamericanmuscle.co.za",
      "font-src 'self'",
      "connect-src 'self'",
      "form-action 'self' https://sandbox.payfast.co.za https://www.payfast.co.za",
      "frame-ancestors 'none'",
      "base-uri 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // Product photography is served from the existing WooCommerce media
    // library until assets are migrated to this deployment/CDN.
    remotePatterns: [
      { protocol: "https", hostname: "allamericanmuscle.co.za", pathname: "/wp-content/**" },
      { protocol: "https", hostname: "www.allamericanmuscle.co.za", pathname: "/wp-content/**" },
    ],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
