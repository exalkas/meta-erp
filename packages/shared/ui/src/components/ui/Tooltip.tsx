"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "../../contexts/TranslationContext";

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  trigger?: "hover" | "click" | "focus" | "manual";
  delay?: number;
  offset?: number;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  arrow?: boolean;
  maxWidth?: number;
  visible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  trigger = "hover",
  delay = 200,
  offset = 8,
  disabled = false,
  className = "",
  contentClassName = "",
  arrow = true,
  maxWidth = 300,
  visible,
  onVisibilityChange,
}) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(visible || false);
  const [actualPosition, setActualPosition] = useState(position);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isControlled = visible !== undefined;

  useEffect(() => {
    if (isControlled) {
      setIsVisible(visible);
    }
  }, [visible, isControlled]);

  const updateVisibility = (newVisible: boolean) => {
    if (disabled) return;

    if (!isControlled) {
      setIsVisible(newVisible);
    }
    onVisibilityChange?.(newVisible);
  };

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        updateVisibility(true);
      }, delay);
    } else {
      updateVisibility(true);
    }
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    updateVisibility(false);
  };

  const toggleTooltip = () => {
    if (isVisible) {
      hideTooltip();
    } else {
      showTooltip();
    }
  };

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let newPosition = position;

    // Check if tooltip would overflow viewport and adjust position
    const positions = {
      top: triggerRect.top - tooltipRect.height - offset,
      bottom: triggerRect.bottom + offset,
      left: triggerRect.left - tooltipRect.width - offset,
      right: triggerRect.right + offset,
    };

    // Check for overflow and switch position if needed
    if (position === "top" && positions.top < 0) {
      newPosition = "bottom";
    } else if (
      position === "bottom" &&
      positions.bottom + tooltipRect.height > viewportHeight
    ) {
      newPosition = "top";
    } else if (position === "left" && positions.left < 0) {
      newPosition = "right";
    } else if (
      position === "right" &&
      positions.right + tooltipRect.width > viewportWidth
    ) {
      newPosition = "left";
    }

    setActualPosition(newPosition);
  };

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
    }
  }, [isVisible, position]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getTooltipStyle = () => {
    if (!triggerRef.current) return {};

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const style: React.CSSProperties = {
      position: "fixed",
      zIndex: 9999,
      maxWidth: `${maxWidth}px`,
    };

    switch (actualPosition) {
      case "top":
        style.left = triggerRect.left + triggerRect.width / 2;
        style.bottom = window.innerHeight - triggerRect.top + offset;
        style.transform = "translateX(-50%)";
        break;
      case "bottom":
        style.left = triggerRect.left + triggerRect.width / 2;
        style.top = triggerRect.bottom + offset;
        style.transform = "translateX(-50%)";
        break;
      case "left":
        style.right = window.innerWidth - triggerRect.left + offset;
        style.top = triggerRect.top + triggerRect.height / 2;
        style.transform = "translateY(-50%)";
        break;
      case "right":
        style.left = triggerRect.right + offset;
        style.top = triggerRect.top + triggerRect.height / 2;
        style.transform = "translateY(-50%)";
        break;
    }

    return style;
  };

  const getArrowStyle = () => {
    const arrowSize = 6;
    const style: React.CSSProperties = {
      position: "absolute",
      width: 0,
      height: 0,
    };

    switch (actualPosition) {
      case "top":
        style.top = "100%";
        style.left = "50%";
        style.transform = "translateX(-50%)";
        style.borderLeft = `${arrowSize}px solid transparent`;
        style.borderRight = `${arrowSize}px solid transparent`;
        style.borderTop = `${arrowSize}px solid rgb(31, 41, 55)`;
        break;
      case "bottom":
        style.bottom = "100%";
        style.left = "50%";
        style.transform = "translateX(-50%)";
        style.borderLeft = `${arrowSize}px solid transparent`;
        style.borderRight = `${arrowSize}px solid transparent`;
        style.borderBottom = `${arrowSize}px solid rgb(31, 41, 55)`;
        break;
      case "left":
        style.left = "100%";
        style.top = "50%";
        style.transform = "translateY(-50%)";
        style.borderTop = `${arrowSize}px solid transparent`;
        style.borderBottom = `${arrowSize}px solid transparent`;
        style.borderLeft = `${arrowSize}px solid rgb(31, 41, 55)`;
        break;
      case "right":
        style.right = "100%";
        style.top = "50%";
        style.transform = "translateY(-50%)";
        style.borderTop = `${arrowSize}px solid transparent`;
        style.borderBottom = `${arrowSize}px solid transparent`;
        style.borderRight = `${arrowSize}px solid rgb(31, 41, 55)`;
        break;
    }

    return style;
  };

  const getTriggerProps = () => {
    const props: React.HTMLProps<HTMLDivElement> = {};

    if (trigger === "hover") {
      props.onMouseEnter = showTooltip;
      props.onMouseLeave = hideTooltip;
    } else if (trigger === "click") {
      props.onClick = toggleTooltip;
    } else if (trigger === "focus") {
      props.onFocus = showTooltip;
      props.onBlur = hideTooltip;
      props.tabIndex = 0;
    }

    return props;
  };

  // Handle click outside for click trigger
  useEffect(() => {
    if (trigger === "click" && isVisible) {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          triggerRef.current &&
          tooltipRef.current &&
          !triggerRef.current.contains(event.target as Node) &&
          !tooltipRef.current.contains(event.target as Node)
        ) {
          hideTooltip();
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [trigger, isVisible]);

  if (!content || disabled) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        ref={triggerRef}
        className={`inline-block ${className}`}
        {...getTriggerProps()}
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          aria-hidden={!isVisible}
          style={getTooltipStyle()}
          className={`
            bg-gray-800 text-white text-sm px-3 py-2 rounded-lg shadow-lg
            transition-opacity duration-200 ease-in-out
            ${isVisible ? "opacity-100" : "opacity-0"}
            ${contentClassName}
          `}
        >
          {content}
          {arrow && <div style={getArrowStyle()} />}
        </div>
      )}
    </>
  );
};

export default Tooltip;
