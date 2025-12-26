"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  badge?: number | string;
}

interface ResponsiveTabsProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: "primary" | "secondary";
}

export const ResponsiveTabs: React.FC<ResponsiveTabsProps> = ({
  tabs,
  activeTab,
  onTabChange,
  variant = "primary",
}) => {
  return (
    <>
      {/* Desktop/Tablet Vertical Sidebar (lg+) */}
      <aside className="hidden lg:flex lg:w-64 md:w-48 bg-[#F4F5F7] flex-col overflow-hidden lg:p-6 md:p-4 lg:rounded-3xl md:rounded-2xl">
        <div className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`w-full flex items-center justify-between gap-3 lg:px-4 md:px-3 px-4 lg:py-3 md:py-2 py-3 rounded-xl transition-colors ${
                  isActive
                    ? "bg-[#7c5cff]/10 text-gray-900"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  {Icon && (
                    <Icon className="lg:w-5 lg:h-5 md:w-4 md:h-4 w-5 h-5 shrink-0" />
                  )}
                  <span className="font-medium lg:text-[1.1rem] md:text-sm text-[1.1rem]">
                    {tab.label}
                  </span>
                </div>
                {tab.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isActive
                        ? "bg-[#7c5cff] text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </aside>

      {/* Tablet Horizontal Bar (md only) */}
      <div className="hidden md:flex lg:hidden w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-4">
        <div className="flex w-full gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-[#7c5cff] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {Icon && <Icon className="w-4 h-4 shrink-0" />}
                <span className="font-medium text-sm whitespace-nowrap">
                  {tab.label}
                </span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Horizontal Scrollable Tabs (sm) */}
      <div className="md:hidden w-full overflow-x-auto scrollbar-hide mb-4">
        <div className="flex gap-2 px-3 min-w-min">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-[#7c5cff] text-white"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {Icon && <Icon className="w-4 h-4 shrink-0" />}
                <span className="font-medium text-sm">{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-300 text-gray-700"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};
