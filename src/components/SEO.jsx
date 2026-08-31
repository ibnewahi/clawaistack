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

    // 1. Organization JSON-LD Schema Injection
    let orgScript = document.querySelector('#org-schema');
    if (!orgScript) {
      orgScript = document.createElement('script');
      orgScript.id = 'org-schema';
      orgScript.type = 'application/ld+json';
      orgScript.text = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "ClawAI Stack",
        "url": siteUrl,
        "logo": `${siteUrl}/logo.png`,
        "sameAs": [
          "https://www.linkedin.com/company/clawai-stack/"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "Customer Support",
          "email": "support@clawaistack.com"
        },
        "description": "Autonomous AI finance platform specializing in bookkeeping, cash forecasting, AP matching, and AR recovery."
      });
      document.head.appendChild(orgScript);
    }

    // 2. FAQPage JSON-LD Schema Injection (Exact Text from Screenshots)
    let faqScript = document.querySelector('#faq-schema');
    if (!faqScript) {
      faqScript = document.createElement('script');
      faqScript.id = 'faq-schema';
      faqScript.type = 'application/ld+json';
      faqScript.text = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How secure is my financial and bank data with ClawAI Stack?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "We use bank-grade 256-bit encryption for all data in transit and at rest. Read-only bank integrations are securely handled via top-tier providers like Plaid, ensuring our AI claws can reconcile ledgers without ever storing or having access to your credentials or fund transfer permissions."
            }
          },
          {
            "@type": "Question",
            "name": "Which accounting systems and ERPs do the AI claws integrate with?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "ClawAI Stack features native, bi-directional synchronization with popular financial platforms including Odoo ERP, Zoho Books, QuickBooks Online, Xero, and Stripe. Updates made by the AI claws are instantly synced to your ledger with complete audit trails."
            }
          },
          {
            "@type": "Question",
            "name": "Can I review transactions before the AI executes automated actions?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes! You have full control over your automation settings. You can set thresholds so that routine workflows (like categorization and gentle AR follow-ups) run completely autonomously, while major payments or anomaly flags require human-in-the-loop sign-off from your controller or CFO."
            }
          },
          {
            "@type": "Question",
            "name": "How long does it take to set up and connect my first AI claw?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Setup typically takes under 10 minutes. Once you link your preferred accounting software or bank feed, your initial AI claws begin analyzing historical ledger data and flagging immediate cost-saving opportunities almost instantly."
            }
          },
          {
            "@type": "Question",
            "name": "Are the audit logs compliant with standard tax and accounting regulations?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Absolutely. Every action taken by the AI generates a verifiable, immutable double-entry audit log complete with timestamping, line-item references, and confidence scores designed to make tax season and audits seamless."
            }
          }
        ]
      });
      document.head.appendChild(faqScript);
    }
  }, [title, description, path, fullUrl, fullTitle]);

  return null;
};

export default SEO;