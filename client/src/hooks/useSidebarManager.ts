import { useState, useCallback } from 'react';

export type SidebarType = 'chat' | 'trip' | 'details' | 'favorites';

interface SidebarState {
  type: SidebarType | null;
  isOpen: boolean;
  props?: any;
}

export function useSidebarManager() {
  const [sidebarState, setSidebarState] = useState<SidebarState>({
    type: null,
    isOpen: false,
    props: {}
  });

  const openSidebar = useCallback((type: SidebarType, props?: any) => {
    setSidebarState({
      type,
      isOpen: true,
      props: props || {}
    });
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarState({
      type: null,
      isOpen: false,
      props: {}
    });
  }, []);

  const toggleSidebar = useCallback((type: SidebarType, props?: any) => {
    setSidebarState(current => {
      if (current.type === type && current.isOpen) {
        return {
          type: null,
          isOpen: false,
          props: {}
        };
      } else {
        return {
          type,
          isOpen: true,
          props: props || {}
        };
      }
    });
  }, []);

  const isSidebarOpen = useCallback((type: SidebarType) => {
    return sidebarState.type === type && sidebarState.isOpen;
  }, [sidebarState]);

  return {
    sidebarState,
    openSidebar,
    closeSidebar,
    toggleSidebar,
    isSidebarOpen
  };
}