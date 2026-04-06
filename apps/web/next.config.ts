import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  transpilePackages: ["@shirt/jobs", "@shirt/infrastructure"],
  async redirects() {
    return [
      { source: "/login", destination: "/auth/signin", permanent: true },
      { source: "/en/login", destination: "/en/auth/signin", permanent: true },
      { source: "/register", destination: "/auth/signup", permanent: true },
      { source: "/en/register", destination: "/en/auth/signup", permanent: true },
      { source: "/products", destination: "/shop", permanent: true },
      { source: "/en/products", destination: "/en/shop", permanent: true },
      { source: "/products/:id", destination: "/product/:id", permanent: true },
      { source: "/en/products/:id", destination: "/en/product/:id", permanent: true },
      { source: "/search", destination: "/shop", permanent: true },
      { source: "/en/search", destination: "/en/shop", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
};

export default withNextIntl(nextConfig);
