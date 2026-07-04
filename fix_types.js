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

  // Fix useRouter() being called as a function (navigate('/path'))
  if (content.match(/const\s+navigate\s*=\s*useRouter\(\)/)) {
    content = content.replace(/const\s+navigate\s*=\s*useRouter\(\)/g, 'const router = useRouter()');
    content = content.replace(/navigate\(/g, 'router.push(');
    changed = true;
  }

  // Fix react-router imports in components
  if (content.includes('react-router')) {
    content = content.replace(/import\s+\{([^}]*)\}\s+from\s+['"]react-router-dom['"]/g, (match, imports) => {
      let nextImports = [];
      let nextNavImports = [];

      if (imports.includes('Link')) nextImports.push('Link from "next/link"');
      if (imports.includes('useNavigate')) nextNavImports.push('useRouter');
      if (imports.includes('useParams')) nextNavImports.push('useParams');
      if (imports.includes('useLocation')) nextNavImports.push('usePathname');

      let result = '';
      if (nextImports.length) result += `import Link from "next/link";\n`;
      if (nextNavImports.length) result += `import { ${nextNavImports.join(', ')} } from "next/navigation";\n`;
      
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
      if (nextImports.length) result += `import Link from "next/link";\n`;
      if (nextNavImports.length) result += `import { ${nextNavImports.join(', ')} } from "next/navigation";\n`;
      
      return result || match;
    });

    content = content.replace(/useNavigate\(\)/g, 'useRouter()');
    if (content.match(/const\s+navigate\s*=\s*useRouter\(\)/)) {
      content = content.replace(/const\s+navigate\s*=\s*useRouter\(\)/g, 'const router = useRouter()');
      content = content.replace(/navigate\(/g, 'router.push(');
    }
    changed = true;
  }

  // Fix relative imports in [id] routes
  if (file.includes('[id]') && content.includes('../../../components/')) {
    content = content.replace(/\.\.\/\.\.\/\.\.\/components\//g, '@/components/');
    changed = true;
  }
  if (file.includes('[id]') && content.includes('../../../lib/')) {
    content = content.replace(/\.\.\/\.\.\/\.\.\/lib\//g, '@/lib/');
    changed = true;
  }
  if (file.includes('new') && content.includes('../../../lib/')) {
    content = content.replace(/\.\.\/\.\.\/\.\.\/lib\//g, '@/lib/');
    changed = true;
  }
  if (file.includes('new') && content.includes('../../../components/')) {
    content = content.replace(/\.\.\/\.\.\/\.\.\/components\//g, '@/components/');
    changed = true;
  }
  if (file.includes('new') && content.includes('../../../context/')) {
    content = content.replace(/\.\.\/\.\.\/\.\.\/context\//g, '@/context/');
    changed = true;
  }
  
  if (content.includes('../../components/')) {
    content = content.replace(/\.\.\/\.\.\/components\//g, '@/components/');
    changed = true;
  }
  if (content.includes('../../lib/')) {
    content = content.replace(/\.\.\/\.\.\/lib\//g, '@/lib/');
    changed = true;
  }

  // Fix helperFunctions prisma import
  if (file.endsWith('helperFunctions.ts')) {
    if (content.includes('../src/prisma/client.js')) {
      content = content.replace(/\.\.\/src\/prisma\/client\.js/g, '@/lib/prisma');
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
};

const files = walkSync(path.join(__dirname, 'app')).concat(walkSync(path.join(__dirname, 'components'))).concat(walkSync(path.join(__dirname, 'lib')));
files.forEach(replaceInFile);
