import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const WorkspaceContext = createContext(null);
const WORKSPACE_STORAGE_KEY = 'claw_active_workspace_id';
const LEGACY_WORKSPACE_NAME_STORAGE_KEY = 'claw_active_workspace_name';

export function WorkspaceProvider({ children }) {
  const [authorizedWorkspaces, setAuthorizedWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const selectedWorkspaceRef = useRef(selectedWorkspace);
  selectedWorkspaceRef.current = selectedWorkspace;
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [workspaceDiscoveryError, setWorkspaceDiscoveryError] = useState(false);

  const selectWorkspace = useCallback((workspaceId) => {
    const workspace = authorizedWorkspaces.find(({ id }) => id === workspaceId) || null;

    selectedWorkspaceRef.current = workspace;
    setSelectedWorkspace(workspace);

    if (workspace) {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, workspace.id);
    } else {
      localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    }
  }, [authorizedWorkspaces]);

  const refreshWorkspaces = useCallback(async (preferredWorkspaceId = null) => {
    const previousSelectedWorkspace = selectedWorkspaceRef.current;
    setIsLoadingWorkspaces(true);
    setWorkspaceDiscoveryError(false);
    if (!preferredWorkspaceId) {
      selectedWorkspaceRef.current = null;
      setSelectedWorkspace(null);
    }
    localStorage.removeItem(LEGACY_WORKSPACE_NAME_STORAGE_KEY);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAuthorizedWorkspaces([]);
        selectedWorkspaceRef.current = null;
        setSelectedWorkspace(null);
        localStorage.removeItem(WORKSPACE_STORAGE_KEY);
        return { success: false, category: 'AUTH_REQUIRED' };
      }

      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, organization_id')
        .order('name', { ascending: true })
        .order('id', { ascending: true });

      if (error) throw error;

      const workspaces = data || [];
      setAuthorizedWorkspaces(workspaces);

      if (preferredWorkspaceId) {
        const preferredWorkspace = workspaces.find(({ id }) => id === preferredWorkspaceId) || null;

        if (!preferredWorkspace) {
          const previousStillAuthorized = previousSelectedWorkspace
            && workspaces.find(({ id }) => id === previousSelectedWorkspace.id);

          if (previousStillAuthorized) {
            selectedWorkspaceRef.current = previousStillAuthorized;
            setSelectedWorkspace(previousStillAuthorized);
            localStorage.setItem(WORKSPACE_STORAGE_KEY, previousStillAuthorized.id);
          } else {
            const persistedWorkspaceId = localStorage.getItem(WORKSPACE_STORAGE_KEY);
            const persistedWorkspace = workspaces.find(({ id }) => id === persistedWorkspaceId) || null;
            const fallbackWorkspace = workspaces.length === 1
              ? workspaces[0]
              : persistedWorkspace;

            selectedWorkspaceRef.current = fallbackWorkspace || null;
            setSelectedWorkspace(fallbackWorkspace || null);

            if (fallbackWorkspace) {
              localStorage.setItem(WORKSPACE_STORAGE_KEY, fallbackWorkspace.id);
            } else {
              localStorage.removeItem(WORKSPACE_STORAGE_KEY);
            }
          }

          return { success: false, category: 'WORKSPACE_NOT_AUTHORIZED' };
        }

        selectedWorkspaceRef.current = preferredWorkspace;
        setSelectedWorkspace(preferredWorkspace);
        localStorage.setItem(WORKSPACE_STORAGE_KEY, preferredWorkspace.id);
        return { success: true, workspace: preferredWorkspace };
      }

      const persistedWorkspaceId = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      const persistedWorkspace = workspaces.find(({ id }) => id === persistedWorkspaceId) || null;

      if (workspaces.length === 1) {
        selectedWorkspaceRef.current = workspaces[0];
        setSelectedWorkspace(workspaces[0]);
        localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaces[0].id);
      } else if (workspaces.length > 1 && persistedWorkspace) {
        selectedWorkspaceRef.current = persistedWorkspace;
        setSelectedWorkspace(persistedWorkspace);
      } else {
        selectedWorkspaceRef.current = null;
        setSelectedWorkspace(null);
        localStorage.removeItem(WORKSPACE_STORAGE_KEY);
      }

      return { success: true };
    } catch {
      if (!preferredWorkspaceId) {
        setAuthorizedWorkspaces([]);
        selectedWorkspaceRef.current = null;
        setSelectedWorkspace(null);
        localStorage.removeItem(WORKSPACE_STORAGE_KEY);
      }
      setWorkspaceDiscoveryError(true);
      return { success: false, category: 'REFRESH_FAILED' };
    } finally {
      setIsLoadingWorkspaces(false);
    }
  }, []);

  useEffect(() => {
    refreshWorkspaces();
  }, [refreshWorkspaces]);

  const value = useMemo(() => ({
    authorizedWorkspaces,
    selectedWorkspace,
    selectedWorkspaceId: selectedWorkspace?.id || null,
    selectedWorkspaceName: selectedWorkspace?.name || null,
    isLoadingWorkspaces,
    workspaceDiscoveryError,
    selectWorkspace,
    refreshWorkspaces,
  }), [
    authorizedWorkspaces,
    selectedWorkspace,
    isLoadingWorkspaces,
    workspaceDiscoveryError,
    selectWorkspace,
    refreshWorkspaces,
  ]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const workspace = useContext(WorkspaceContext);
  if (!workspace) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return workspace;
}
