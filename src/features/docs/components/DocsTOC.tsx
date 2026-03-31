/**
 * DocsTOC
 * Table of Contents extracted from markdown headings
 */

import React, { useEffect, useState } from 'react';
import styles from './DocsTOC.module.css';

interface Heading {
  id: string;
  level: number;
  text: string;
}

interface DocsTOCProps {
  content: string;
}

export function DocsTOC({ content }: DocsTOCProps) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    // Extract headings from markdown
    const headingRegex = /^(#{2,3})\s+(.+)$/gm;
    const extracted: Heading[] = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const text = match[2];
      const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');

      extracted.push({ id, level, text });
    }

    setHeadings(extracted);
  }, [content]);

  useEffect(() => {
    // Highlight heading on scroll
    const handleScroll = () => {
      const headingElements = headings.map(h => ({
        ...h,
        element: document.getElementById(h.id),
      }));

      for (const heading of headingElements) {
        if (heading.element) {
          const rect = heading.element.getBoundingClientRect();
          if (rect.top < 100) {
            setActiveId(heading.id);
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [headings]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <nav className={styles.toc}>
      <div className={styles.tocTitle}>On this page</div>
      <ul className={styles.tocList}>
        {headings.map(heading => (
          <li key={heading.id} className={`level-${heading.level}`}>
            <a
              href={`#${heading.id}`}
              className={`${styles.tocLink} ${activeId === heading.id ? styles.active : ''}`}
              style={{ paddingLeft: `${(heading.level - 2) * 1}rem` }}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
