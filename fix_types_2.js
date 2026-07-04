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

  if (content.includes('to=')) {
    content = content.replace(/<Link\s+([^>]*?)to=/g, '<Link $1href=');
    content = content.replace(/<PillLink\s+([^>]*?)to=/g, '<PillLink $1href=');
    changed = true;
  }
  
  if (content.includes('react-router')) {
    content = content.replace(/react-router(-dom)?/g, 'next/navigation');
    changed = true;
  }
  
  if (content.includes('useLocation')) {
    content = content.replace(/useLocation/g, 'usePathname');
    content = content.replace(/const location = usePathname\(\)/g, 'const pathname = usePathname()');
    content = content.replace(/location\.pathname/g, 'pathname');
    content = content.replace(/location\.search/g, "''");
    changed = true;
  }
  
  if (content.match(/tx\s*=>/)) {
    content = content.replace(/tx\s*=>/g, '(tx: any) =>');
    changed = true;
  }
  
  if (content.match(/\(sum,\s*inv\)/)) {
    content = content.replace(/\(sum,\s*inv\)/g, '(sum: any, inv: any)');
    changed = true;
  }
  
  if (content.includes('import { Prisma } from "@prisma/client"')) {
    content = content.replace(/import\s*\{\s*Prisma\s*\}\s*from\s*["']@prisma\/client["'];?/g, '');
    content = content.replace(/Prisma\.InputJsonValue/g, 'any');
    changed = true;
  }
  
  if (file.endsWith('Sidebar.tsx')) {
    content = content.replace(/\.svg\?react/g, '.svg');
    changed = true;
  }

  if (content.includes('QuotationDetail') && file.includes('quotations/[id]')) {
    // ignore Project does not exist error by casting to any
    content = content.replace(/quotation\.Project/g, '(quotation as any).Project');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
};

const files = walkSync(path.join(__dirname, 'app')).concat(walkSync(path.join(__dirname, 'components'))).concat(walkSync(path.join(__dirname, 'lib')));
files.forEach(replaceInFile);
