/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "http", hostname: "localhost", port: "9000" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "minio" },
      { protocol: "https", hostname: "**.eporner.com" },
    ],
  },
};

export default nextConfig;
