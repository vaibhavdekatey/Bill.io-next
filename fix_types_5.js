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

replaceInFile('app/api/invoices/route.ts', [
  ['import { NextResponse }', 'import { Prisma } from "@prisma/client";\nimport { NextResponse }']
]);

replaceInFile('app/api/quotations/route.ts', [
  ['import { NextResponse }', 'import { Prisma } from "@prisma/client";\nimport { NextResponse }']
]);

const publicRoute = `import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, onBoardingComplete } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(onBoardingComplete ? "/dashboard" : "/onboarding");
    }
  }, [user, loading, onBoardingComplete, router]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen font-semibold text-lg">
        Loading...
      </div>
    );

  if (user) {
    return null;
  }

  return <>{children}</>;
};

export default PublicRoute;
`;
fs.writeFileSync(path.join(__dirname, 'components/PublicRoute.tsx'), publicRoute, 'utf8');
