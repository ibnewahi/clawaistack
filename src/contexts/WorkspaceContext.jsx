import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const WorkspaceContext = createContext(null);
const WORKSPACE_STORAGE_KEY = 'claw_active_workspace_id';
const LEGACY_WORKSPACE_NAME_STORAGE_KEY = 'claw_active_workspace_name';

export function WorkspaceProvider({ children }) {
  const [authorizedWorkspaces, setAuthorizedWorkspaces] = useState([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(true);
  const [workspaceDiscoveryError, setWorkspaceDiscoveryError] = useState(false);

  const selectWorkspace = useCallback((workspaceId) => {
    const workspace = authorizedWorkspaces.find(({ id }) => id === workspaceId) || null;

    setSelectedWorkspace(workspace);

    if (workspace) {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, workspace.id);
    } else {
      localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    }
  }, [authorizedWorkspaces]);

  const refreshWorkspaces = useCallback(async () => {
    setIsLoadingWorkspaces(true);
    setWorkspaceDiscoveryError(false);
    setSelectedWorkspace(null);
    localStorage.removeItem(LEGACY_WORKSPACE_NAME_STORAGE_KEY);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setAuthorizedWorkspaces([]);
        localStorage.removeItem(WORKSPACE_STORAGE_KEY);
        return;
      }

      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name')
        .order('name', { ascending: true })
        .order('id', { ascending: true });

      if (error) throw error;

      const workspaces = data || [];
      const persistedWorkspaceId = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      const persistedWorkspace = workspaces.find(({ id }) => id === persistedWorkspaceId) || null;

      setAuthorizedWorkspaces(workspaces);

      if (workspaces.length === 1) {
        setSelectedWorkspace(workspaces[0]);
        localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaces[0].id);
      } else if (workspaces.length > 1 && persistedWorkspace) {
        setSelectedWorkspace(persistedWorkspace);
      } else {
        setSelectedWorkspace(null);
        localStorage.removeItem(WORKSPACE_STORAGE_KEY);
      }
    } catch {
      setAuthorizedWorkspaces([]);
      setSelectedWorkspace(null);
      setWorkspaceDiscoveryError(true);
      localStorage.removeItem(WORKSPACE_STORAGE_KEY);
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
