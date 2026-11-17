/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ESM-only shader runtime used for the Figma "Grain drift" fill.
  transpilePackages: ['@figma/expressive-components'],
}

module.exports = nextConfig
