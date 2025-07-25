"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "../../contexts/TranslationContext";
import { X } from "lucide-react";

export interface PopoverProps {
  content: React.ReactNode;
  children: React.ReactNode;
  title?: string;
  position?: "top" | "bottom" | "left" | "right";
  trigger?: "hover" | "click" | "focus" | "manual";
  delay?: number;
  offset?: number;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  arrow?: boolean;
  closable?: boolean;
  maxWidth?: number;
  maxHeight?: number;
  visible?: boolean;
  onVisibilityChange?: (visible: boolean) => void;
  onClose?: () => void;
}

export const Popover: React.FC<PopoverProps> = ({
  content,
  children,
  title,
  position = "bottom",
  trigger = "click",
  delay = 0,
  offset = 8,
  disabled = false,
  className = "",
  contentClassName = "",
  arrow = true,
  closable = true,
  maxWidth = 400,
  maxHeight = 300,
  visible,
  onVisibilityChange,
  onClose,
}) => {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(visible || false);
  const [actualPosition, setActualPosition] = useState(position);
  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
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

  const showPopover = () => {
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

  const hidePopover = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    updateVisibility(false);
    onClose?.();
  };

  const togglePopover = () => {
    if (isVisible) {
      hidePopover();
    } else {
      showPopover();
    }
  };

  const calculatePosition = () => {
    if (!triggerRef.current || !popoverRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let newPosition = position;

    // Check if popover would overflow viewport and adjust position
    const positions = {
      top: triggerRect.top - popoverRect.height - offset,
      bottom: triggerRect.bottom + offset,
      left: triggerRect.left - popoverRect.width - offset,
      right: triggerRect.right + offset,
    };

    // Check for overflow and switch position if needed
    if (position === "top" && positions.top < 0) {
      newPosition = "bottom";
    } else if (
      position === "bottom" &&
      positions.bottom + popoverRect.height > viewportHeight
    ) {
      newPosition = "top";
    } else if (position === "left" && positions.left < 0) {
      newPosition = "right";
    } else if (
      position === "right" &&
      positions.right + popoverRect.width > viewportWidth
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

  const getPopoverStyle = () => {
    if (!triggerRef.current) return {};

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const style: React.CSSProperties = {
      position: "fixed",
      zIndex: 9999,
      maxWidth: `${maxWidth}px`,
      maxHeight: `${maxHeight}px`,
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
    const arrowSize = 8;
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
        style.borderTop = `${arrowSize}px solid white`;
        break;
      case "bottom":
        style.bottom = "100%";
        style.left = "50%";
        style.transform = "translateX(-50%)";
        style.borderLeft = `${arrowSize}px solid transparent`;
        style.borderRight = `${arrowSize}px solid transparent`;
        style.borderBottom = `${arrowSize}px solid white`;
        break;
      case "left":
        style.left = "100%";
        style.top = "50%";
        style.transform = "translateY(-50%)";
        style.borderTop = `${arrowSize}px solid transparent`;
        style.borderBottom = `${arrowSize}px solid transparent`;
        style.borderLeft = `${arrowSize}px solid white`;
        break;
      case "right":
        style.right = "100%";
        style.top = "50%";
        style.transform = "translateY(-50%)";
        style.borderTop = `${arrowSize}px solid transparent`;
        style.borderBottom = `${arrowSize}px solid transparent`;
        style.borderRight = `${arrowSize}px solid white`;
        break;
    }

    return style;
  };

  const getTriggerProps = () => {
    const props: React.HTMLProps<HTMLDivElement> = {};

    if (trigger === "hover") {
      props.onMouseEnter = showPopover;
      props.onMouseLeave = hidePopover;
    } else if (trigger === "click") {
      props.onClick = togglePopover;
    } else if (trigger === "focus") {
      props.onFocus = showPopover;
      props.onBlur = hidePopover;
      props.tabIndex = 0;
    }

    return props;
  };

  // Handle click outside
  useEffect(() => {
    if (isVisible && (trigger === "click" || trigger === "focus")) {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          triggerRef.current &&
          popoverRef.current &&
          !triggerRef.current.contains(event.target as Node) &&
          !popoverRef.current.contains(event.target as Node)
        ) {
          hidePopover();
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [trigger, isVisible]);

  // Handle escape key
  useEffect(() => {
    if (isVisible) {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          hidePopover();
        }
      };

      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isVisible]);

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
          ref={popoverRef}
          role="dialog"
          aria-hidden={!isVisible}
          style={getPopoverStyle()}
          className={`
            bg-white border border-gray-200 rounded-lg shadow-lg
            transition-all duration-200 ease-in-out
            ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}
            ${contentClassName}
          `}
        >
          {arrow && <div style={getArrowStyle()} />}

          {/* Header */}
          {(title || closable) && (
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              {title && (
                <h3 className="text-sm font-medium text-gray-900">{title}</h3>
              )}
              {closable && (
                <button
                  onClick={hidePopover}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
                  aria-label={t("common.close")}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div
            className="p-3 overflow-auto"
            style={{ maxHeight: `${maxHeight - 60}px` }}
          >
            {content}
          </div>
        </div>
      )}
    </>
  );
};

export default Popover;
