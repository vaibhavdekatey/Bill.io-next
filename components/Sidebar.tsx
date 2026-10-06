import { useAuth } from "../context/AuthContext";
import DashboardLogo from "../assets/icons/dashboard.svg";
import InvoiceLogo from "../assets/icons/invoice.svg";
import PersonLogo from "../assets/icons/person.svg";
import FolderLogo from "../assets/icons/folder.svg";
import TimeLogo from "../assets/icons/time.svg";
import TeamLogo from "../assets/icons/team.svg";
import CogLogo from "../assets/icons/cog.svg";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

const getInitials = (name?: string | null, email?: string | null) => {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email[0].toUpperCase();
  }
  return "U";
};

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
  const router = useRouter();

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
    await logout();
    router.push("/login");
  };

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
      <aside className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:sticky lg:top-0 lg:left-0 lg:translate-x-0 w-[300px] shrink-0 flex flex-col py-4 px-6 h-screen border-r border-r-neutral-700/40 bg-neutral-950 justify-between overflow-y-auto ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
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
      <div className="pt-4 border-t border-neutral-800/80 mt-6">
        <div className="flex items-stretch gap-2">
          <Link
            href="/profile"
            onClick={() => onClose()}
            className="group flex-1 min-w-0 flex items-center gap-3 p-2.5 rounded-xl border border-neutral-800/80 bg-neutral-900/40 hover:bg-neutral-800/60 hover:border-neutral-700/80 transition-all duration-200 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-neutral-700 via-neutral-800 to-neutral-900 border border-neutral-600/50 flex items-center justify-center text-xs font-semibold text-neutral-200 shrink-0 shadow-inner group-hover:border-neutral-500 transition-colors">
              {getInitials(user?.name, user?.email)}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-sm font-medium text-neutral-200 group-hover:text-white transition-colors truncate">
                {user?.name || "Account"}
              </span>
              <span className="text-xs text-neutral-400 group-hover:text-neutral-300 transition-colors truncate">
                {organization?.title || organization?.Organization?.name || user?.email || "View profile"}
              </span>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
            className="w-11 flex items-center justify-center text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl border border-neutral-800/80 hover:border-red-500/30 transition-all duration-200 shrink-0 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
