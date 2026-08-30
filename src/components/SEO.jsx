// src/components/SEO.jsx
import React, { useEffect } from 'react';

const SEO = ({ title, description, path = '' }) => {
  const siteUrl = 'https://clawaistack.com';
  const fullUrl = `${siteUrl}${path}`;
  const fullTitle = `${title} | ClawAI Stack`;

  useEffect(() => {
    // Page Title
    document.title = fullTitle;

    // Helper to update meta tag content
    const setMetaTag = (selector, content) => {
      let element = document.querySelector(selector);
      if (element) {
        element.setAttribute('content', content);
      }
    };

    // Helper to update link tag href
    const setLinkTag = (selector, href) => {
      let element = document.querySelector(selector);
      if (element) {
        element.setAttribute('href', href);
      }
    };

    // Standard Meta Tags
    setMetaTag('meta[name="description"]', description);
    setMetaTag('meta[name="title"]', fullTitle);

    // Open Graph Tags
    setMetaTag('meta[property="og:title"]', fullTitle);
    setMetaTag('meta[property="og:description"]', description);
    setMetaTag('meta[property="og:url"]', fullUrl);

    // Twitter Tags
    setMetaTag('meta[property="twitter:title"]', fullTitle);
    setMetaTag('meta[property="twitter:description"]', description);
    setMetaTag('meta[property="twitter:url"]', fullUrl);

    // Canonical Link
    setLinkTag('link[rel="canonical"]', fullUrl);
  }, [title, description, path, fullUrl, fullTitle]);

  return null;
};

export default SEO;