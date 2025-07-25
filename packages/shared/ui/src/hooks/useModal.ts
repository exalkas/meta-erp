import { useState, useCallback, useEffect, useRef } from "react";

export interface ModalConfig {
  id?: string;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closable?: boolean;
  keyboard?: boolean; // Close on escape
  backdrop?: boolean | "static"; // Close on backdrop click
  centered?: boolean;
  scrollable?: boolean;

  // Greek ERP specific
  auditLog?: boolean;
  companyId?: string;
  userId?: string;
  personalDataWarning?: boolean;

  // Callbacks
  onOpen?: () => void;
  onClose?: () => void;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export interface ModalState {
  isOpen: boolean;
  isAnimating: boolean;
  isClosing: boolean;
  config: ModalConfig;
  zIndex: number;
  openTime?: Date;

  // Greek ERP specific
  auditTrail?: Array<{
    timestamp: Date;
    action: "open" | "close" | "confirm" | "cancel";
    userId?: string;
    duration?: number;
  }>;
}

export interface ModalActions {
  open: (config?: Partial<ModalConfig>) => void;
  close: () => void;
  confirm: () => void;
  cancel: () => void;
  toggle: () => void;
  updateConfig: (config: Partial<ModalConfig>) => void;
}

// Global modal stack for managing multiple modals
let modalStack: Array<{ id: string; zIndex: number }> = [];
let baseZIndex = 1000;

const generateModalId = () =>
  `modal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useModal = (
  initialConfig: ModalConfig = {}
): ModalState & ModalActions => {
  const modalId = useRef(initialConfig.id || generateModalId());
  const [state, setState] = useState<ModalState>({
    isOpen: false,
    isAnimating: false,
    isClosing: false,
    config: {
      size: "md",
      closable: true,
      keyboard: true,
      backdrop: true,
      centered: true,
      scrollable: false,
      auditLog: false,
      personalDataWarning: false,
      ...initialConfig,
    },
    zIndex: baseZIndex,
    auditTrail: [],
  });

  // Audit logging helper
  const addAuditEntry = useCallback(
    (action: "open" | "close" | "confirm" | "cancel", duration?: number) => {
      if (state.config.auditLog) {
        setState((prev) => ({
          ...prev,
          auditTrail: [
            ...(prev.auditTrail || []),
            {
              timestamp: new Date(),
              action,
              userId: state.config.userId,
              duration,
            },
          ],
        }));
      }
    },
    [state.config.auditLog, state.config.userId]
  );

  // Calculate z-index for modal stacking
  const calculateZIndex = useCallback(() => {
    const existingModal = modalStack.find((m) => m.id === modalId.current);
    if (existingModal) {
      return existingModal.zIndex;
    }

    const newZIndex = baseZIndex + modalStack.length;
    modalStack.push({ id: modalId.current, zIndex: newZIndex });
    return newZIndex;
  }, []);

  // Remove modal from stack
  const removeFromStack = useCallback(() => {
    modalStack = modalStack.filter((m) => m.id !== modalId.current);
  }, []);

  // Focus management
  const focusableElements = useRef<HTMLElement[]>([]);
  const lastFocusedElement = useRef<HTMLElement | null>(null);

  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Tab") return;

    const focusableElementsArray = Array.from(
      document.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => {
      const modalElement = document.querySelector(
        `[data-modal-id="${modalId.current}"]`
      );
      return modalElement?.contains(el);
    });

    const firstElement = focusableElementsArray[0];
    const lastElement =
      focusableElementsArray[focusableElementsArray.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement?.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement?.focus();
        e.preventDefault();
      }
    }
  }, []);

  // Keyboard event handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && state.config.keyboard && state.isOpen) {
        cancel();
      }
    },
    [state.config.keyboard, state.isOpen]
  );

  // Actions
  const open = useCallback(
    (config: Partial<ModalConfig> = {}) => {
      const newConfig = { ...state.config, ...config };
      const newZIndex = calculateZIndex();

      // Store currently focused element
      lastFocusedElement.current = document.activeElement as HTMLElement;

      setState((prev) => ({
        ...prev,
        isOpen: true,
        isAnimating: true,
        isClosing: false,
        config: newConfig,
        zIndex: newZIndex,
        openTime: new Date(),
      }));

      // Add event listeners
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("keydown", trapFocus);

      // Prevent body scroll
      document.body.style.overflow = "hidden";

      // Animation timeout
      setTimeout(() => {
        setState((prev) => ({ ...prev, isAnimating: false }));
      }, 150);

      addAuditEntry("open");
      newConfig.onOpen?.();
    },
    [state.config, calculateZIndex, handleKeyDown, trapFocus, addAuditEntry]
  );

  const close = useCallback(() => {
    if (!state.isOpen) return;

    const duration = state.openTime
      ? Date.now() - state.openTime.getTime()
      : undefined;

    setState((prev) => ({
      ...prev,
      isClosing: true,
      isAnimating: true,
    }));

    // Remove event listeners
    document.removeEventListener("keydown", handleKeyDown);
    document.removeEventListener("keydown", trapFocus);

    // Animation timeout
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        isOpen: false,
        isAnimating: false,
        isClosing: false,
      }));

      // Remove from stack
      removeFromStack();

      // Restore body scroll if no other modals
      if (modalStack.length === 0) {
        document.body.style.overflow = "";
      }

      // Restore focus
      lastFocusedElement.current?.focus();
    }, 150);

    addAuditEntry("close", duration);
    state.config.onClose?.();
  }, [
    state.isOpen,
    state.openTime,
    state.config,
    handleKeyDown,
    trapFocus,
    removeFromStack,
    addAuditEntry,
  ]);

  const confirm = useCallback(() => {
    const duration = state.openTime
      ? Date.now() - state.openTime.getTime()
      : undefined;

    addAuditEntry("confirm", duration);
    state.config.onConfirm?.();
    close();
  }, [state.openTime, state.config, addAuditEntry, close]);

  const cancel = useCallback(() => {
    const duration = state.openTime
      ? Date.now() - state.openTime.getTime()
      : undefined;

    addAuditEntry("cancel", duration);
    state.config.onCancel?.();
    close();
  }, [state.openTime, state.config, addAuditEntry, close]);

  const toggle = useCallback(() => {
    if (state.isOpen) {
      close();
    } else {
      open();
    }
  }, [state.isOpen, open, close]);

  const updateConfig = useCallback((config: Partial<ModalConfig>) => {
    setState((prev) => ({
      ...prev,
      config: { ...prev.config, ...config },
    }));
  }, []);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget && state.config.backdrop === true) {
        close();
      }
    },
    [state.config.backdrop, close]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.isOpen) {
        removeFromStack();
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("keydown", trapFocus);

        // Restore body scroll if this was the last modal
        if (modalStack.length === 0) {
          document.body.style.overflow = "";
        }
      }
    };
  }, [state.isOpen, removeFromStack, handleKeyDown, trapFocus]);

  // Personal data warning effect
  useEffect(() => {
    if (state.config.personalDataWarning && state.isOpen) {
      const warningTimeout = setTimeout(() => {
        console.warn(
          "Personal data modal has been open for more than 5 minutes"
        );
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearTimeout(warningTimeout);
    }
  }, [state.config.personalDataWarning, state.isOpen]);

  return {
    ...state,
    open,
    close,
    confirm,
    cancel,
    toggle,
    updateConfig,
  };
};

// Helper hook for confirmation modals
export const useConfirmModal = (config: ModalConfig = {}) => {
  const modal = useModal({
    ...config,
    size: config.size || "sm",
    centered: true,
  });

  const openConfirm = useCallback(
    (
      title: string,
      message: string,
      onConfirm: () => void,
      onCancel?: () => void
    ) => {
      modal.open({
        title,
        onConfirm,
        onCancel,
        // You would typically pass the message through context or props
      });
    },
    [modal]
  );

  return {
    ...modal,
    openConfirm,
  };
};

// Helper hook for Greek compliance modals
export const useComplianceModal = (companyId: string, userId: string) => {
  return useModal({
    auditLog: true,
    companyId,
    userId,
    personalDataWarning: true,
    backdrop: "static", // Prevent accidental closure
    keyboard: false, // Prevent escape key closure
  });
};
