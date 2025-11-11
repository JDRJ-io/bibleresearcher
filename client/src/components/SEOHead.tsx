import { useEffect } from 'react';

export interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: 'website' | 'article' | 'profile';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  noindex?: boolean;
}

const DEFAULT_TITLE = 'Anointed.io - Biblical Research Platform';
const DEFAULT_DESCRIPTION = 'Explore the Bible with powerful research tools including multi-translation comparison, cross-references, Strong\'s concordance, prophecy tracking, and community insights.';
const DEFAULT_IMAGE = 'https://anointed.io/og-image.png';
const SITE_NAME = 'Anointed.io';
const TWITTER_HANDLE = '@AnointedIO';

export function SEOHead({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  image = DEFAULT_IMAGE,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  noindex = false,
}: SEOProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  const canonicalUrl = canonical || (typeof window !== 'undefined' ? window.location.href : '');

  useEffect(() => {
    document.title = fullTitle;

    const updateMeta = (property: string, content: string) => {
      let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
      if (!meta) {
        meta = document.querySelector(`meta[name="${property}"]`) as HTMLMetaElement;
      }
      if (!meta) {
        meta = document.createElement('meta');
        if (property.startsWith('og:') || property.startsWith('article:')) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', property);
        }
        document.head.appendChild(meta);
      }
      meta.content = content;
    };

    updateMeta('description', description);
    
    updateMeta('og:title', fullTitle);
    updateMeta('og:description', description);
    updateMeta('og:image', image);
    updateMeta('og:url', canonicalUrl);
    updateMeta('og:type', type);
    updateMeta('og:site_name', SITE_NAME);
    
    updateMeta('twitter:card', 'summary_large_image');
    updateMeta('twitter:site', TWITTER_HANDLE);
    updateMeta('twitter:title', fullTitle);
    updateMeta('twitter:description', description);
    updateMeta('twitter:image', image);
    
    if (author) {
      updateMeta('article:author', author);
    }
    if (publishedTime) {
      updateMeta('article:published_time', publishedTime);
    }
    if (modifiedTime) {
      updateMeta('article:modified_time', modifiedTime);
    }

    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = canonicalUrl;

    let robotsMeta = document.querySelector('meta[name="robots"]') as HTMLMetaElement;
    if (noindex) {
      if (!robotsMeta) {
        robotsMeta = document.createElement('meta');
        robotsMeta.name = 'robots';
        document.head.appendChild(robotsMeta);
      }
      robotsMeta.content = 'noindex, nofollow';
    } else if (robotsMeta) {
      robotsMeta.remove();
    }
  }, [fullTitle, description, canonical, canonicalUrl, image, type, author, publishedTime, modifiedTime, noindex]);

  return null;
}

export function addStructuredData(data: object) {
  let script = document.querySelector('script[type="application/ld+json"]');
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Anointed.io',
  url: 'https://anointed.io',
  logo: 'https://anointed.io/logo.png',
  description: 'Biblical Research Platform for in-depth Bible study',
  sameAs: [
    'https://twitter.com/AnointedIO',
    'https://facebook.com/AnointedIO',
  ],
};

export function createBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
