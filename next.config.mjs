/** @type {import('next').NextConfig} */
const nextConfig = {
  generateBuildId: () => 'build-' + Date.now(),
  images: { unoptimized: true },
  reactStrictMode: true,
};
export default nextConfig;
