/** @type {import('next').NextConfig} */
const nextConfig = {
  //reactStrictMode: true, // Removed for Farcaster template compatibility
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
