/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  rewrites: async () => {
    return [
      {
        source: '/api/export_python',
        destination: '/api/export',
      },
    ];
  },
};

module.exports = nextConfig;
