import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Home,
  Wine,
  BookOpen,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
  end?: boolean;
  addTo?: string;       // route for the "+" action button
  addLabel?: string;    // tooltip label for the add button
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home",        icon: Home,      to: "/",           end: true },
  { label: "My Bar",      icon: Wine,      to: "/my-bar",     addTo: "/my-bar/add",    addLabel: "Add item to bar" },
  { label: "Recipes",     icon: BookOpen,  to: "/recipes",    addTo: "/recipes/add",   addLabel: "Add recipe" },
  { label: "Suggestions", icon: Sparkles,  to: "/suggestions" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  function handleLogout() {
    navigate("/");
  }

  return (
    <TooltipProvider delayDuration={200}>
      <aside
        className={cn(
          "relative flex shrink-0 flex-col border-r border-border bg-sidebar transition-all duration-200",
          collapsed ? "w-14" : "w-52"
        )}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-sidebar text-muted-foreground shadow-sm hover:text-white"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>

        {/* Logo */}
        <NavLink
          to="/"
          className={cn(
            "flex items-center gap-2.5 no-underline transition-all duration-200",
            collapsed ? "justify-center px-0 py-5" : "px-5 py-5"
          )}
        >
          <img src="/jigger-logo.svg" alt="Jigger AI logo" className="h-8 w-auto shrink-0" />
          {!collapsed && (
            <span className="text-lg font-bold tracking-tight text-white">Jigger.ai</span>
          )}
        </NavLink>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-0.5 px-1.5 pt-2">
          {NAV_ITEMS.map(({ label, icon: Icon, to, end, addTo, addLabel }) => (
            <div key={to} className="flex items-center gap-1">
              {/* Main nav link */}
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        cn(
                          "flex flex-1 items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium no-underline transition-colors",
                          isActive
                            ? "bg-sidebar-accent text-white"
                            : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-white"
                        )
                      }
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                    </NavLink>
                  </TooltipTrigger>
                  <TooltipContent side="right">{label}</TooltipContent>
                </Tooltip>
              ) : (
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      "flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium no-underline transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-white"
                        : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-white"
                    )
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </NavLink>
              )}

              {/* "+" action button */}
              {addTo && (
                collapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => navigate(addTo)}
                        className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent/50 hover:text-white transition-colors"
                        aria-label={addLabel}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{addLabel}</TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => navigate(addTo)}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent/50 hover:text-teal-300 transition-colors"
                        aria-label={addLabel}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right">{addLabel}</TooltipContent>
                  </Tooltip>
                )
              )}
            </div>
          ))}
        </nav>

        {/* Bottom: Profile + Logout */}
        <div className="flex flex-col gap-1 border-t border-border px-1.5 py-3">
          {collapsed ? (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <NavLink
                    to="/profile"
                    className={({ isActive }) =>
                      cn(
                        "flex items-center justify-center rounded-lg px-3 py-2.5 text-sm font-medium no-underline transition-colors",
                        isActive
                          ? "bg-sidebar-accent text-white"
                          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-white"
                      )
                    }
                  >
                    <User className="h-4 w-4 shrink-0" />
                  </NavLink>
                </TooltipTrigger>
                <TooltipContent side="right">Profile</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="h-9 w-full justify-center text-muted-foreground hover:bg-sidebar-accent/50 hover:text-white"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Log out</TooltipContent>
              </Tooltip>
            </>
          ) : (
            <>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium no-underline transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-white"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-white"
                  )
                }
              >
                <User className="h-4 w-4 shrink-0" />
                Profile
              </NavLink>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="flex items-center justify-start gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent/50 hover:text-white"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Log out
              </Button>
            </>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}