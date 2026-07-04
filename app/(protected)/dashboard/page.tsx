"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import api from "@/lib/axios";
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
    heading: "View Projects",
    description: "Your workspace for active work",
    href: "/projects",
  },
];

const Dashboard = () => {
  const [stats, setStats] = useState<any>({ clients: 0, invoices: 0, quotations: 0, projects: 0, recentClients: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/dashboard");
        if (response.data.success) {
          setStats(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

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
                <Link
                  href={quick.href}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <Card num={loading ? "-" : stats.invoices} heading="Total Invoices" description="All generated invoices" href="/invoices" hrefTitle="View Invoices" className="bg-gradient-to-r from-[#0060BF] to-[#003060]" />
            <Card num={loading ? "-" : stats.quotations} heading="Quotations" description="All estimates & quotes" href="/quotations" hrefTitle="View Quotations" className="bg-gradient-to-r from-[#5916A4] to-[#2B0A51]" />
            <Card num={loading ? "-" : stats.projects} heading="Active Projects" description="Ongoing workspaces" href="/projects" hrefTitle="View Projects" className="bg-gradient-to-r from-[#006F59] to-[#00382D]" />
          </div>

          <div className="w-full mt-10">
            <h2 className="text-2xl font-light mb-6 tracking-tight">Recent Clients</h2>
            {loading ? (
              <div className="flex items-center gap-3 text-neutral-400 p-6 border border-white/5 rounded-xl bg-neutral-800/10">
                <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading clients...
              </div>
            ) : !stats.recentClients || stats.recentClients.length === 0 ? (
              <div className="p-8 text-center border border-white/5 rounded-xl bg-neutral-800/10 text-neutral-400 font-light">
                No active clients yet. 
                <Link href="/clients" className="ml-2 text-white hover:underline transition-all">Add your first client →</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.recentClients.map((client: any) => (
                  <Link href={`/clients/${client.id}`} key={client.id} className="group p-6 border border-white/5 hover:border-white/30 bg-neutral-800/10 rounded-xl transition-all duration-300 flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#0060BF] to-[#003060] flex items-center justify-center text-lg shrink-0 border border-white/10 group-hover:border-white/30 transition-all">
                      {client.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex flex-col truncate">
                      <span className="text-lg font-light text-white truncate group-hover:text-blue-200 transition-colors">{client.name}</span>
                      <span className="text-sm text-neutral-400 truncate mt-0.5">{client.email || client.companyName || "No contact info"}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
