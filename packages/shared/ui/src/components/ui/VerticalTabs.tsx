import React from "react";
import { Tabs, TabsProps } from "./Tabs";

export interface VerticalTabsProps
  extends Omit<TabsProps, "orientation" | "scrollable" | "centered"> {
  width?: string;
  sidebarClassName?: string;
  contentClassName?: string;
  showBorder?: boolean;
  compact?: boolean;
}

export const VerticalTabs: React.FC<VerticalTabsProps> = ({
  width = "w-64",
  sidebarClassName = "",
  contentClassName = "",
  showBorder = true,
  compact = false,
  className = "",
  ...props
}) => {
  const verticalTabsClassName = `
    ${className}
    ${showBorder ? "border border-gray-200 rounded-lg overflow-hidden" : ""}
  `;

  const tabListClassName = `
    ${width}
    ${sidebarClassName}
    ${showBorder ? "border-r border-gray-200" : ""}
    ${compact ? "py-2" : "py-4"}
    bg-gray-50
  `;

  const tabPanelClassName = `
    flex-1 
    ${contentClassName}
    ${compact ? "p-4" : "p-6"}
  `;

  return (
    <Tabs
      {...props}
      orientation="vertical"
      className={verticalTabsClassName}
      tabListClassName={tabListClassName}
      tabPanelClassName={tabPanelClassName}
      scrollable={false}
      centered={false}
    />
  );
};

export default VerticalTabs;
