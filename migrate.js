const fs = require('fs');
const path = require('path');

const ROUTES_DIR = path.join(__dirname, 'Routes');
const APP_DIR = path.join(__dirname, 'app');

const mapRouteToNextPath = (filePath) => {
  let relativePath = path.relative(ROUTES_DIR, filePath);
  relativePath = relativePath.replace(/\\/g, '/');

  const mappings = {
    'Dashboard/Dashboard.tsx': '(protected)/dashboard/page.tsx',
    'Auth/Login.tsx': 'login/page.tsx',
    'Auth/Register.tsx': 'register/page.tsx',
    'Invoices/Invoices.tsx': '(protected)/invoices/page.tsx',
    'Invoices/New/NewInvoice.tsx': '(protected)/invoices/new/page.tsx',
    'Invoices/[id]/Invoice.tsx': '(protected)/invoices/[id]/page.tsx',
    'Quotations/Quotations.tsx': '(protected)/quotations/page.tsx',
    'Quotations/New/NewQuotation.tsx': '(protected)/quotations/new/page.tsx',
    'Quotations/[id]/Quotation.tsx': '(protected)/quotations/[id]/page.tsx',
    'Projects/Projects.tsx': '(protected)/projects/page.tsx',
    'Projects/[id]/ProjectDetail.tsx': '(protected)/projects/[id]/page.tsx',
    'Clients/Clients.tsx': '(protected)/clients/page.tsx',
    'Clients/[id]/ClientDetail.tsx': '(protected)/clients/[id]/page.tsx',
    'Profile/Profile.tsx': '(protected)/profile/page.tsx',
    'Onboarding/Onboarding.tsx': 'onboarding/page.tsx'
  };

  if (mappings[relativePath]) {
    return path.join(APP_DIR, mappings[relativePath]);
  }
  return null;
};

const processFile = (src, dest) => {
  let content = fs.readFileSync(src, 'utf8');

  // Next.js client component
  content = '"use client";\n\n' + content;

  // React Router -> Next.js replacements
  content = content.replace(/import\s+\{([^}]*)\}\s+from\s+['"]react-router-dom['"]/g, (match, imports) => {
    let nextImports = [];
    let nextNavImports = [];

    if (imports.includes('Link')) nextImports.push('Link from "next/link"');
    if (imports.includes('useNavigate')) nextNavImports.push('useRouter');
    if (imports.includes('useParams')) nextNavImports.push('useParams');
    if (imports.includes('useLocation')) nextNavImports.push('usePathname');

    let result = '';
    if (nextImports.length) {
      result += `import Link from "next/link";\n`;
    }
    if (nextNavImports.length) {
      result += `import { ${nextNavImports.join(', ')} } from "next/navigation";\n`;
    }
    
    // Quick fix for useNavigation instead of useNavigate
    return result || match;
  });

  content = content.replace(/import\s+\{([^}]*)\}\s+from\s+['"]react-router['"]/g, (match, imports) => {
    let nextImports = [];
    let nextNavImports = [];

    if (imports.includes('Link')) nextImports.push('Link from "next/link"');
    if (imports.includes('useNavigate')) nextNavImports.push('useRouter');
    if (imports.includes('useParams')) nextNavImports.push('useParams');
    if (imports.includes('useLocation')) nextNavImports.push('usePathname');

    let result = '';
    if (nextImports.length) {
      result += `import Link from "next/link";\n`;
    }
    if (nextNavImports.length) {
      result += `import { ${nextNavImports.join(', ')} } from "next/navigation";\n`;
    }
    
    return result || match;
  });

  content = content.replace(/useNavigate\(\)/g, 'useRouter()');

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content, 'utf8');
  console.log(`Migrated ${src} -> ${dest}`);
};

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else if (dirFile.endsWith('.tsx')) {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

if (fs.existsSync(ROUTES_DIR)) {
  const files = walkSync(ROUTES_DIR);
  files.forEach(file => {
    const dest = mapRouteToNextPath(file);
    if (dest) {
      processFile(file, dest);
    }
  });
} else {
  console.log('Routes directory not found.');
}
