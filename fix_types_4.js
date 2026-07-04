const fs = require('fs');
const path = require('path');

const replaceInFile = (file, replacements) => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const [from, to] of replacements) {
    if ((from instanceof RegExp && content.match(from)) || (!(from instanceof RegExp) && content.includes(from))) {
      content = content.replace(from, to);
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed', file);
  }
};

replaceInFile('app/(protected)/clients/[id]/page.tsx', [
  ['client.Invoice.reduce', 'client.Invoice?.reduce']
]);

replaceInFile('app/(protected)/projects/[id]/page.tsx', [
  [/Quotation\?:\s*\{\s*id:\s*string;\s*number:\s*string;\s*\}\s*\|\s*null;/g, ''] // Remove duplicate
]);

replaceInFile('app/api/invoices/[id]/route.ts', [
  ['async (tx) => {', 'async (tx: any) => {']
]);

replaceInFile('app/api/onboarding/route.ts', [
  ['async (tx) => {', 'async (tx: any) => {']
]);

replaceInFile('app/api/quotations/[id]/route.ts', [
  ['async (tx) => {', 'async (tx: any) => {']
]);

replaceInFile('app/api/invoices/route.ts', [
  [/Prisma\.InputJsonValue/g, 'any']
]);

replaceInFile('app/api/quotations/route.ts', [
  [/Prisma\.InputJsonValue/g, 'any']
]);

replaceInFile('components/PublicRoute.tsx', [
  [/<\s*Navigate\s+to=(["'])(.*?)\1\s*\/?\s*>/g, '(()=>{ const r=require("next/navigation").useRouter(); require("react").useEffect(()=>{r.replace("$2")},[]); return null; })()']
]);

replaceInFile('lib/prisma.ts', [
  ['@/src/generated/prisma', '../src/generated/prisma']
]);
