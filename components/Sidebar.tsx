import { useAuth } from "../context/AuthContext";
import DashboardLogo from "../assets/icons/dashboard.svg";
import InvoiceLogo from "../assets/icons/invoice.svg";
import PersonLogo from "../assets/icons/person.svg";
import FolderLogo from "../assets/icons/folder.svg";
import TimeLogo from "../assets/icons/time.svg";
import TeamLogo from "../assets/icons/team.svg";
import CogLogo from "../assets/icons/cog.svg";
import Link from "next/link";
import { usePathname } from "next/navigation";
;

type NavItem = {
  label: string;
  href: string;
  icon: typeof DashboardLogo;
};
type WorkspaceNav = {
  workspace: NavItem[];
  other: NavItem[];
};

const workspaceNav: WorkspaceNav = {
  workspace: [
    { label: "Dashboard", href: "/dashboard", icon: DashboardLogo },
    { label: "Invoices", href: "/invoices", icon: InvoiceLogo },
    { label: "Quotations", href: "/quotations", icon: InvoiceLogo },
    { label: "Clients", href: "/clients", icon: PersonLogo },
  ],
  other: [
    { label: "Projects", href: "/projects", icon: FolderLogo },
    { label: "Timeline", href: "/timeline", icon: TimeLogo },
    { label: "Team", href: "/team", icon: TeamLogo },
    { label: "Settings", href: "/settings", icon: CogLogo },
  ],
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { logout, user, organization } = useAuth();
  const pathname = usePathname();
  const isActive = (href: string) => {
    return (
      pathname === href || pathname.startsWith(href + "/")
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 w-[300px] flex flex-col py-4 px-6 h-screen border-r border-r-neutral-700/40 bg-neutral-950 justify-between ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex flex-col justify-start">
        <div className="w-18 h-fit  pb-6 pt-2">
          <img
            className="w-full h-full"
            src="/bill.io_ico.svg"
            alt="Bill.io Icon"
          />
        </div>
        <div className="border-b-[1px] border-b-neutral-700/40" />
        <div className="w-full h-full flex flex-col mt-8">
          {Object.entries(workspaceNav).map(([heading, items]) => {
            return (
              <div className="flex flex-col mt-4" key={heading}>
                <h3 className="uppercase text-sm text-neutral-400 mb-2">
                  {heading}
                </h3>

                {items.map((item) => {
                  // const isNotActive = {item.label === disabled;}
                  const isNotActive = isActive(item.href);
                  const Icon = item.icon;

                  return (
                    <Link href={item.href}
                      key={item.href}
                      onClick={() => onClose()}
                      className={`flex flex-row items-center justify-start font-light gap-3 p-2 rounded-[0.3em] cursor-pointer duration-200 transition-colors ease-in-out ${isNotActive ? "bg-white text-black" : "hover:bg-neutral-800/60 text-white"} `}
                    >
                      {/* <img
                        style={{ fill: "white" }}
                        src={item.icon}
                        alt=""
                        className={`w-6 h-6 ${isNotActive ? "text-white" : "text-black"}`}
                      /> */}{" "}
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex flex-row justify-between gap-x-2">
        <Link href={"/profile"}
          className=" w-full p-3 pr-4 flex flex-row gap-x-3 border border-white/10 hover:border-white/20 bg-neutral-800/10 hover:bg-neutral-600/20 rounded-xl transition-all duration-500 ease-in-out cursor-pointer"
        >
          <div className="rounded-full bg-linear-to-b from-neutral-500 to-neutral-800 aspect-square h-full "></div>
          <div className="flex flex-col">
            <span className="uppercase font-light ">{user?.name}</span>
            <span className="mt-1 px-3 py-0.5 rounded-full text-xs font-medium bg-neutral-800 text-neutral-300 w-fit border border-neutral-700">
              {organization?.title}
            </span>
          </div>
        </Link>
        {/*<div
          onClick={logout}
          className=" w-fit flex justify-center items-center aspect-square text-red-400 border border-white/30 hover:border-white/50 bg-neutral-800/10 hover:bg-neutral-600 rounded-xl transition-all duration-500 ease-in-out cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path
              fill="currentColor"
              d="M5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h6q.425 0 .713.288T12 4t-.288.713T11 5H5v14h6q.425 0 .713.288T12 20t-.288.713T11 21zm12.175-8H10q-.425 0-.712-.288T9 12t.288-.712T10 11h7.175L15.3 9.125q-.275-.275-.275-.675t.275-.7t.7-.313t.725.288L20.3 11.3q.3.3.3.7t-.3.7l-3.575 3.575q-.3.3-.712.288t-.713-.313q-.275-.3-.262-.712t.287-.688z"
            />
          </svg>
        </div>*/}
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
