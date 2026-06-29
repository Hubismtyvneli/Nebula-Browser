"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Laptop, Smartphone, Monitor, Clock, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { useBrowserStore } from "@/lib/browser-store";
import { useAuthStore } from "@/lib/auth-store";
import { createClient } from "@/lib/supabase/client";
import { Favicon } from "./Favicon";

interface RemoteTab {
  id: string;
  device_id: string;
  device_name: string;
  tab_url: string;
  tab_title: string;
  tab_favicon?: string;
  last_active: string;
}

export function DeviceTabsPanel() {
  const isOpen = useBrowserStore((s) => s.isDeviceTabsOpen);
  const toggle = useBrowserStore((s) => s.toggleDeviceTabs);
  const user = useAuthStore((s) => s.user);
  const isSignedIn = useAuthStore((s) => s.isSignedIn);

  const [remoteTabs, setRemoteTabs] = useState<RemoteTab[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRemoteTabs = async () => {
    if (!isSignedIn || !user) return;
    setIsLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("device_tabs")
      .select("*")
      .eq("user_id", user.id)
      .order("last_active", { ascending: false });
    setRemoteTabs((data ?? []) as RemoteTab[]);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isSignedIn || !user) return;
    let mounted = true;
    const supabase = createClient();

    // Initial fetch
    supabase
      .from("device_tabs")
      .select("*")
      .eq("user_id", user.id)
      .order("last_active", { ascending: false })
      .then(({ data }) => {
        if (mounted && data) {
          setRemoteTabs(data as RemoteTab[]);
          setIsLoading(false);
        }
      });

    // Realtime subscription
    const channel = supabase
      .channel("device_tabs_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "device_tabs", filter: `user_id=eq.${user.id}` },
        () => {
          // Re-fetch on any change
          supabase
            .from("device_tabs")
            .select("*")
            .eq("user_id", user.id)
            .order("last_active", { ascending: false })
            .then(({ data }) => {
              if (mounted && data) setRemoteTabs(data as RemoteTab[]);
            });
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [isSignedIn, user]);

  // Group by device
  const byDevice = remoteTabs.reduce((acc, tab) => {
    const key = tab.device_id;
    if (!acc[key]) acc[key] = { name: tab.device_name, tabs: [] };
    acc[key].tabs.push(tab);
    return acc;
  }, {} as Record<string, { name: string; tabs: RemoteTab[] }>);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => toggle(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: 420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 420, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 34, mass: 0.9 }}
            className="glass-strong fixed right-0 top-0 z-50 flex h-full w-[400px] flex-col"
          >
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] px-5 py-4">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-[var(--text-secondary)]" />
                <div>
                  <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">Tabs from other devices</h2>
                  <p className="text-[11px] text-[var(--text-tertiary)]">
                    {isSignedIn ? `${Object.keys(byDevice).length} device(s) · ${remoteTabs.length} tabs` : "Sign in to sync"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={fetchRemoteTabs}
                  disabled={isLoading}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
                  title="Refresh"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={() => toggle(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--text-tertiary)] hover:bg-white/5 hover:text-[var(--text-primary)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scroll-nebula">
              {!isSignedIn ? (
                <div className="px-5 py-12 text-center">
                  <Monitor className="mx-auto mb-3 h-8 w-8 text-[var(--text-tertiary)]" />
                  <p className="text-[12px] text-[var(--text-tertiary)]">
                    Sign in to see tabs from your other devices.
                  </p>
                </div>
              ) : remoteTabs.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-[12px] text-[var(--text-tertiary)]">
                    No tabs from other devices yet.
                  </p>
                </div>
              ) : (
                Object.entries(byDevice).map(([deviceId, { name, tabs }]) => (
                  <div key={deviceId} className="px-3 py-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                      <DeviceIcon deviceName={name} />
                      {name}
                      <span className="ml-auto rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] normal-case">
                        {tabs.length} tabs
                      </span>
                    </div>
                    {tabs.map((tab) => (
                      <RemoteTabRow key={tab.id} tab={tab} />
                    ))}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function RemoteTabRow({ tab }: { tab: RemoteTab }) {
  const activeTabId = useBrowserStore((s) => s.activeTabId);
  const navigateTab = useBrowserStore((s) => s.navigateTab);
  const toggle = useBrowserStore((s) => s.toggleDeviceTabs);

  return (
    <motion.button
      type="button"
      whileHover={{ x: 2 }}
      onClick={() => {
        if (activeTabId) {
          navigateTab(activeTabId, tab.tab_url, tab.tab_title);
          toggle(false);
        }
      }}
      className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-white/5"
    >
      <Favicon url={tab.tab_url} size={24} className="bg-white/5" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] font-medium text-[var(--text-primary)]">
          {tab.tab_title}
        </div>
        <div className="truncate text-[10px] text-[var(--text-tertiary)]">
          {new Date(tab.last_active).toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </motion.button>
  );
}

function DeviceIcon({ deviceName }: { deviceName: string }) {
  const name = deviceName.toLowerCase();
  if (name.includes("phone") || name.includes("iphone") || name.includes("mobile")) {
    return <Smartphone className="h-3 w-3" />;
  }
  if (name.includes("desktop") || name.includes("pc") || name.includes("mac")) {
    return <Monitor className="h-3 w-3" />;
  }
  return <Laptop className="h-3 w-3" />;
}
