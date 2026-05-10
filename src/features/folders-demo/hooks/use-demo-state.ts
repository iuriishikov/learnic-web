'use client';

import { useCallback, useState } from 'react';

import { INITIAL_DEMO_STATE } from '../model/mock-data';
import type { DemoState } from '../model/types';
import {
  createFolder,
  deleteFolder,
  moveFolder,
  moveProduct,
  renameFolder,
  type CreateFolderInput,
} from '../lib/folder-tree';

export function useDemoState() {
  const [state, setState] = useState<DemoState>(INITIAL_DEMO_STATE);

  const moveProductTo = useCallback(
    (productId: string, targetFolderId: string | null) => {
      setState((prev) => moveProduct(prev, productId, targetFolderId));
    },
    [],
  );

  const moveFolderTo = useCallback(
    (folderId: string, newParentId: string | null) => {
      setState((prev) => moveFolder(prev, folderId, newParentId));
    },
    [],
  );

  const removeFolder = useCallback((folderId: string) => {
    setState((prev) => deleteFolder(prev, folderId));
  }, []);

  const rename = useCallback((folderId: string, name: string) => {
    setState((prev) => renameFolder(prev, folderId, name));
  }, []);

  const create = useCallback(
    (parentId: string | null, input: CreateFolderInput) => {
      let createdId = '';
      setState((prev) => {
        const result = createFolder(prev, parentId, input);
        createdId = result.id;
        return result.state;
      });
      return createdId;
    },
    [],
  );

  const reset = useCallback(() => {
    setState(INITIAL_DEMO_STATE);
  }, []);

  return {
    state,
    moveProductTo,
    moveFolderTo,
    removeFolder,
    rename,
    create,
    reset,
  };
}
