import { getDocumentBySlug } from './services/documentationService';

if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Extract slug from URL: /documentation/{category}/{page} or /documentation/{page}
    const pathname = window.location.pathname;
    const docsMatch = pathname.match(/^\/documentation\/(.+)$/);

    if (!docsMatch) return; // Not a docs page

    const slug = docsMatch[1];

    console.log('[Backend Content] Loading content for slug:', slug);

    // Fetch document from backend API
    getDocumentBySlug(slug)
      .then((doc) => {
        console.log('[Backend Content] Document found:', doc);

        // Find the content container in Docusaurus
        const contentElement = document.querySelector('.markdown');
        if (contentElement) {
          // Replace content with backend version
          contentElement.innerHTML = doc.content;
          console.log('[Backend Content] Content injected');
        }
      })
      .catch((error) => {
        console.log('[Backend Content] Document not found in backend:', error.message);

        // Show "Add Content" button when document doesn't exist
        const contentElement = document.querySelector('.markdown');
        if (contentElement) {
          const button = document.createElement('button');
          button.innerHTML = '+ Add Content';
          button.style.cssText = `
            display: inline-block;
            padding: 10px 20px;
            background-color: #0ea5e9;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: 500;
            margin-top: 20px;
          `;

          button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#0284c7';
          });
          button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#0ea5e9';
          });

          button.onclick = () => {
            window.location.href = `/documentation/edit?slug=${slug}`;
          };

          // Clear content and show button
          contentElement.innerHTML = '<p style="color: #666; font-size: 16px;">This page has no content yet.</p>';
          contentElement.appendChild(button);

          console.log('[Backend Content] Add Content button injected');
        }
      });
  });
}

export {};
