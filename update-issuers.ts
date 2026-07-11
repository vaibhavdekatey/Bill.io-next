import 'dotenv/config';
import { prisma } from './lib/prisma';

async function main() {
  const users = await prisma.user.findMany();
  const orgs = await prisma.organization.findMany();

  const invoices = await prisma.invoice.findMany({ include: { Client: true } });
  for (const inv of invoices) {
    const org = orgs.find((o) => o.id === inv.organizationId);
    await prisma.invoice.update({
      where: { id: inv.id },
      data: { 
        issuerEmail: org?.email || "Email not set",
        issuerPhone: org?.phone || "Phone not set",
        issuerWebsite: org?.website || null,
        clientEmail: inv.Client?.email || "Email not set",
        clientPhone: inv.Client?.phoneNumber || "Phone not set",
      },
    });
    console.log(`Updated invoice ${inv.number}`);
  }

  const quotations = await prisma.quotation.findMany({ include: { Client: true } });
  for (const quo of quotations) {
    const org = orgs.find((o) => o.id === quo.organizationId);
    await prisma.quotation.update({
      where: { id: quo.id },
      data: { 
        issuerEmail: org?.email || "Email not set",
        issuerPhone: org?.phone || "Phone not set",
        issuerWebsite: org?.website || null,
        clientEmail: quo.Client?.email || "Email not set",
        clientPhone: quo.Client?.phoneNumber || "Phone not set",
      },
    });
    console.log(`Updated quotation ${quo.number}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
