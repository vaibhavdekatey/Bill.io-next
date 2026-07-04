"use client";

import Link from "next/link";
;
import Card from "@/components/Card";
import InvoiceLogo from "@/assets/icons/invoice.svg";
import PersonLogo from "@/assets/icons/person.svg";
import FolderLogo from "@/assets/icons/folder.svg";

const quickAccess = [
  {
    icon: InvoiceLogo,
    heading: "New Invoice",
    description: "Create a draft or send one immediately.",
    href: "/invoices/new",
  },
  {
    icon: InvoiceLogo,
    heading: "New Quotation",
    description: "Prepare a client estimate in couple of steps.",
    href: "/quotations/new",
  },
  {
    icon: PersonLogo,
    heading: "Clients",
    description: "Save a new contact or a company profile.",
    href: "/clients",
  },
  {
    icon: FolderLogo,
    heading: "New Project",
    description: "Set up a workspace for active work",
    href: "/projects",
  },
];

const Dashboard = () => {
  // const BellIco: typeof DashboardLogo = BellLogo;
  return (
    <div className="bg-black text-white font-lexend font-light min-h-screen relative overflow-x-clip ">
      {/* <Sidebar /> */}
      <main className=" w-full overflow-x-clip  py-8 px-4 md:px-12 ">
        <div className="flex flex-col w-full h-full">
          <div className="flex flex-row items-start w-full justify-between ">
            <div className="flex flex-col">
              <h1 className="text-4xl font-light -tracking-[4%] ">Dashboard</h1>
              <p className="text-neutral-400 text-base ">
                Your studio at glance
              </p>
            </div>
            {/* <button className="border-white/30 border hover:border-white/50 bg-neutral-800/10 hover:bg-neutral-600 rounded-full p-3 duration-300 ease-in-out transition-all">
              <BellIco className="w-5 h-5" />
            </button> */}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 w-full h-fit gap-6 mt-8">
            {quickAccess.map((quick) => {
              const Icon = quick.icon;
              return (
                <Link href={quick.href}
                  className="flex flex-col justify-between w-full lg:w-[18em] xl:w-auto h-[14em] p-6 border border-white/5 hover:border-white/50 bg-neutral-800/10 hover:bg-neutral-50 hover:text-black group rounded-xl transition-all duration-500 ease-in-out cursor-pointer"
                  key={quick.heading}
                >
                  <Icon className="w-18 h-18" />
                  <div>
                    <span className="font-light text-2xl -tracking-[4%]">
                      {quick.heading}
                    </span>
                    <p className="  text-neutral-400 group-hover:text-black duration-500 leading-tight mt-2">
                      {quick.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="flex flex-row w-full h-fit gap-6 mt-8">
            <Card className="bg-linear-to-r from-[#0060BF] to-[#003060] " />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
