import express from 'express';

const router = express.Router();

const PRODUCTION_URL = 'https://anointed.io';
const STAGING_URL = 'https://staging.anointed.io';

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' && 
         !process.env.VERCEL_URL?.includes('staging');
}

function getBaseUrl(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return isProduction() ? PRODUCTION_URL : STAGING_URL;
}

router.get('/robots.txt', (req, res) => {
  const isProd = isProduction();
  const baseUrl = getBaseUrl();
  
  let robotsTxt = `# Robots.txt for Anointed.io Biblical Research Platform
# Environment: ${isProd ? 'Production' : 'Staging/Development'}

User-agent: *
`;

  if (isProd) {
    robotsTxt += `Allow: /

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay to be respectful
Crawl-delay: 1
`;
  } else {
    robotsTxt += `Disallow: /

# This is a staging/development environment
# Please do not index this site
`;
  }

  res.setHeader('Content-Type', 'text/plain');
  res.send(robotsTxt);
});

router.get('/sitemap.xml', (req, res) => {
  const baseUrl = getBaseUrl();
  const isProd = isProduction();
  
  if (!isProd) {
    res.setHeader('Content-Type', 'text/plain');
    return res.send('Sitemap disabled on staging/development environments');
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main Landing Page -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>2025-11-02</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Main Bible Study Application -->
  <url>
    <loc>${baseUrl}/bible</loc>
    <lastmod>2025-11-02</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  
  <!-- Documentation Hub -->
  <url>
    <loc>${baseUrl}/docs</loc>
    <lastmod>2025-11-02</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  
  <!-- Authentication Help -->
  <url>
    <loc>${baseUrl}/auth-help</loc>
    <lastmod>2025-11-02</lastmod>
    <changefreq>quarterly</changefreq>
    <priority>0.4</priority>
  </url>
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.send(sitemap);
});

export default router;
