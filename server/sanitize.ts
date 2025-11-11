import DOMPurify from 'isomorphic-dompurify';

export interface SanitizeOptions {
  allowMarkdown?: boolean;
  maxLength?: number;
}

export const sanitizeHtml = (dirty: string, options: SanitizeOptions = {}): string => {
  const { maxLength = 50000 } = options;

  if (!dirty || typeof dirty !== 'string') {
    return '';
  }

  if (dirty.length > maxLength) {
    throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
  }

  const clean = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'a', 'ul', 'ol', 'li',
      'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });

  return clean.trim();
};

export const sanitizePlainText = (text: string, maxLength: number = 10000): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  if (text.length > maxLength) {
    throw new Error(`Text exceeds maximum length of ${maxLength} characters`);
  }

  const stripped = DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  return stripped.trim();
};
