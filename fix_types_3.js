const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  if (!fs.existsSync(dir)) return filelist;
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        filelist = walkSync(dirFile, filelist);
      }
    } else if (dirFile.endsWith('.tsx') || dirFile.endsWith('.ts')) {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const replaceInFile = (file) => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Fix client.Invoice / client.Project / client.Quotation possibly undefined
  if (file.includes('clients\\[id]') || file.includes('clients/[id]')) {
    content = content.replace(/client\.Invoice\./g, 'client.Invoice?.');
    content = content.replace(/client\.Project\./g, 'client.Project?.');
    content = content.replace(/client\.Quotation\./g, 'client.Quotation?.');
    changed = true;
  }

  // Fix dashboard SVG imports
  if (file.endsWith('dashboard\\page.tsx') || file.endsWith('dashboard/page.tsx')) {
    content = content.replace(/\.svg\?react/g, '.svg');
    changed = true;
  }

  // Fix QuotationDetail Project
  if (file.includes('invoices\\[id]') || file.includes('invoices/[id]')) {
    content = content.replace(/invoice\.Project/g, '(invoice as any).Project');
    changed = true;
  }
  
  if (file.includes('quotations\\[id]') || file.includes('quotations/[id]')) {
    content = content.replace(/quotation\.Project/g, '(quotation as any).Project');
    changed = true;
  }

  // Fix Duplicate Quotation in ProjectDetail
  if (file.includes('projects\\[id]') || file.includes('projects/[id]')) {
    if (content.match(/Quotation:\s*\{\s*id:\s*string;\s*number:\s*string;\s*\}\s*\|\s*null;/g)) {
      content = content.replace(/Quotation\?:\s*\{\s*id:\s*string;\s*number:\s*string;\s*\};\s*Quotation:\s*\{\s*id:\s*string;\s*number:\s*string;\s*\}\s*\|\s*null;/g, 'Quotation?: { id: string; number: string; } | null;');
      changed = true;
    }
  }

  // Fix Route Components (Navigate)
  if (file.endsWith('ProtectedRoute.tsx') || file.endsWith('PublicRoute.tsx') || file.endsWith('OnboardingRoute.tsx')) {
    content = content.replace(/import\s*\{\s*Navigate\s*\}\s*from\s*["']next\/navigation["'];?/g, 'import { useRouter } from "next/navigation"; import { useEffect } from "react";');
    content = content.replace(/<\s*Navigate\s+to=(["'])(.*?)\1\s*replace\s*\/?\s*>/g, '(()=>{ const r=useRouter(); useEffect(()=>{r.replace("$2")},[]); return null; })()');
    content = content.replace(/<\s*Navigate\s+to=(["'])(.*?)\1\s*\/?\s*>/g, '(()=>{ const r=useRouter(); useEffect(()=>{r.replace("$2")},[]); return null; })()');
    changed = true;
  }

  // Fix Prisma Client imports
  if (file.endsWith('lib\\prisma.ts') || file.endsWith('lib/prisma.ts')) {
    content = content.replace(/from\s*["']@prisma\/client["']/g, 'from "@/src/generated/prisma"');
    content = content.replace(/from\s*["']\.\.\/\.\.\/node_modules\/\.prisma\/client["']/g, 'from "@/src/generated/prisma"');
    changed = true;
  }
  
  if (content.includes('Cannot find namespace \'Prisma\'')) {
     // this doesn't actually exist in the file, we can just replace Prisma.InputJsonValue
  }
  content = content.replace(/Prisma\.InputJsonValue/g, 'any');
  content = content.replace(/import\s*\{\s*Prisma\s*\}\s*from\s*["']@prisma\/client["'];?/g, '');
  
  // Fix AuthContext imports
  if (content.includes('../../../context/AuthContext')) {
    content = content.replace(/\.\.\/\.\.\/\.\.\/context\/AuthContext/g, '@/context/AuthContext');
    changed = true;
  }
  if (content.includes('../../context/AuthContext')) {
    content = content.replace(/\.\.\/\.\.\/context\/AuthContext/g, '@/context/AuthContext');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
};

const files = walkSync(path.join(__dirname, 'app')).concat(walkSync(path.join(__dirname, 'components'))).concat(walkSync(path.join(__dirname, 'lib')));
files.forEach(replaceInFile);
