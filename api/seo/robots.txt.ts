import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const base = process.env.SITE_URL || "https://anointed.io";
  const isProd = process.env.NODE_ENV === "production";

  const body = isProd
    ? `User-agent: *
Allow: /

Sitemap: ${base}/api/seo/sitemap.xml

Crawl-delay: 1
`
    : `User-agent: *
Disallow: /

# This is a staging/development environment
# Please do not index this site
`;

  res.setHeader("Content-Type", "text/plain");
  res.status(200).send(body);
}
