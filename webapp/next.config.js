/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    '/api/export-word': ['./templates/**/*'],
  },
};

module.exports = nextConfig;
