import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

// ============================================================
// Dashboard Layout — Sidebar + TopBar shell
// Frontend team: This is the scaffold. Customize the UI as needed.
// ============================================================

const navItems = [
  { name: "Command Center", href: "/", icon: "📊" },
  { name: "Vehicles", href: "/vehicles", icon: "🚛" },
  { name: "Trips", href: "/trips", icon: "🗺️" },
  { name: "Drivers", href: "/drivers", icon: "👤" },
  { name: "Maintenance", href: "/maintenance", icon: "🔧" },
  { name: "Expenses", href: "/expenses", icon: "💰" },
  { name: "Analytics", href: "/analytics", icon: "📈" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Brand */}
        <div className="p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white">
            🚀 FleetFlow
          </h1>
          <p className="text-xs text-gray-400 mt-1">Fleet Management System</p>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
            <span className="text-sm text-gray-400">Account</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
