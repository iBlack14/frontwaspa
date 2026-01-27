const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'pages');

// Páginas que necesitan SSR (todas excepto API routes y archivos especiales)
const pagesToUpdate = [
  'index.tsx',
  'login.tsx',
  'register.tsx',
  'forgot-password.tsx',
  'reset-password.tsx',
  'email-confirmation.tsx',
  'debug-stats.tsx',
  'auth/callback.tsx',
  'home/index.tsx',
  'instances/index.tsx',
  'messages/index.tsx',
  'profile/index.tsx',
  'apps/index.tsx',
  'chat/[chatId].tsx',
  'subscription/index.tsx',
  'settings/api-key.tsx',
  'settings/api-usage.tsx',
  'system/cache-monitor.tsx',
  'suite/index.tsx',
  'templates/index.tsx',
  'templates/chatbot.tsx',
  'templates/calentamiento.tsx',
  'templates/manage.tsx',
  'templates/spam-whatsapp.tsx',
];

const ssrCode = `

// Force SSR to avoid static generation errors
export async function getServerSideProps() {
  return { props: {} };
}
`;

pagesToUpdate.forEach((pagePath) => {
  const fullPath = path.join(pagesDir, pagePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Remove 'use client' if exists
    content = content.replace(/^'use client';?\r?\n/gm, '');
    
    // Check if getServerSideProps already exists
    if (!content.includes('getServerSideProps')) {
      // Add getServerSideProps at the end
      content += ssrCode;
      
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Updated: ${pagePath}`);
    } else {
      console.log(`⏭️  Skipped (already has SSR): ${pagePath}`);
    }
  } else {
    console.log(`❌ Not found: ${pagePath}`);
  }
});

console.log('\n✨ Done! All pages now use SSR.');
