import type { DemoFolder, DemoProduct, DemoState } from '../model/types';

export const ROOT_ID = '__root__';

export const MAX_DEPTH = 3;

export type FolderNode = {
  folder: DemoFolder;
  depth: number;
  children: FolderNode[];
  productCount: number;
  descendantCount: number;
};

export type FolderPathSegment = {
  id: string;
  name: string;
  emoji?: string;
};

export function buildFolderTree(state: DemoState): FolderNode[] {
  const byParent = new Map<string | null, DemoFolder[]>();
  for (const folder of state.folders) {
    const list = byParent.get(folder.parentId) ?? [];
    list.push(folder);
    byParent.set(folder.parentId, list);
  }

  function build(parentId: string | null, depth: number): FolderNode[] {
    const folders = byParent.get(parentId) ?? [];
    return folders
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
      .map((folder) => {
        const children = build(folder.id, depth + 1);
        const directProducts = state.products.filter(
          (p) => p.folderId === folder.id,
        ).length;
        const descendantCount = children.reduce(
          (sum, child) => sum + child.descendantCount + child.productCount,
          0,
        );
        return {
          folder,
          depth,
          children,
          productCount: directProducts,
          descendantCount,
        };
      });
  }

  return build(null, 0);
}

export function folderDepth(state: DemoState, folderId: string | null): number {
  if (folderId === null) return 0;
  let depth = 1;
  let cursor = state.folders.find((f) => f.id === folderId);
  while (cursor && cursor.parentId !== null) {
    depth += 1;
    cursor = state.folders.find((f) => f.id === cursor!.parentId);
  }
  return depth;
}

export function descendantIds(
  state: DemoState,
  folderId: string,
): Set<string> {
  const out = new Set<string>([folderId]);
  const queue = [folderId];
  while (queue.length) {
    const current = queue.pop()!;
    for (const folder of state.folders) {
      if (folder.parentId === current) {
        out.add(folder.id);
        queue.push(folder.id);
      }
    }
  }
  return out;
}

export function pathToFolder(
  state: DemoState,
  folderId: string | null,
): FolderPathSegment[] {
  if (folderId === null) return [];
  const path: FolderPathSegment[] = [];
  let cursor: DemoFolder | undefined = state.folders.find(
    (f) => f.id === folderId,
  );
  while (cursor) {
    path.unshift({
      id: cursor.id,
      name: cursor.name,
      emoji: cursor.emoji,
    });
    if (cursor.parentId === null) break;
    cursor = state.folders.find((f) => f.id === cursor!.parentId);
  }
  return path;
}

export function productsInFolder(
  state: DemoState,
  folderId: string | null,
): DemoProduct[] {
  return state.products.filter((p) => p.folderId === folderId);
}

export function foldersInFolder(
  state: DemoState,
  folderId: string | null,
): DemoFolder[] {
  return state.folders
    .filter((f) => f.parentId === folderId)
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}

export function findFolder(
  state: DemoState,
  folderId: string,
): DemoFolder | undefined {
  return state.folders.find((f) => f.id === folderId);
}

export function previewProducts(
  state: DemoState,
  folderId: string,
  limit = 3,
): DemoProduct[] {
  const direct = productsInFolder(state, folderId);
  if (direct.length >= limit) return direct.slice(0, limit);

  const remaining = limit - direct.length;
  const childIds = descendantIds(state, folderId);
  childIds.delete(folderId);
  const fromChildren = state.products
    .filter((p) => p.folderId !== null && childIds.has(p.folderId))
    .slice(0, remaining);
  return [...direct, ...fromChildren].slice(0, limit);
}

export function moveProduct(
  state: DemoState,
  productId: string,
  targetFolderId: string | null,
): DemoState {
  return {
    ...state,
    products: state.products.map((p) =>
      p.id === productId ? { ...p, folderId: targetFolderId } : p,
    ),
  };
}

export function moveFolder(
  state: DemoState,
  folderId: string,
  newParentId: string | null,
): DemoState {
  if (folderId === newParentId) return state;
  if (newParentId !== null) {
    const blocked = descendantIds(state, folderId);
    if (blocked.has(newParentId)) return state;
    const targetDepth = folderDepth(state, newParentId);
    const subtreeMaxDepth = subtreeHeight(state, folderId);
    if (targetDepth + subtreeMaxDepth > MAX_DEPTH) return state;
  }
  return {
    ...state,
    folders: state.folders.map((f) =>
      f.id === folderId ? { ...f, parentId: newParentId } : f,
    ),
  };
}

function subtreeHeight(state: DemoState, folderId: string): number {
  const children = state.folders.filter((f) => f.parentId === folderId);
  if (children.length === 0) return 1;
  return 1 + Math.max(...children.map((c) => subtreeHeight(state, c.id)));
}

export function deleteFolder(
  state: DemoState,
  folderId: string,
): DemoState {
  const target = findFolder(state, folderId);
  if (!target) return state;
  const newParent = target.parentId;
  return {
    folders: state.folders
      .filter((f) => f.id !== folderId)
      .map((f) => (f.parentId === folderId ? { ...f, parentId: newParent } : f)),
    products: state.products.map((p) =>
      p.folderId === folderId ? { ...p, folderId: newParent } : p,
    ),
  };
}

export function renameFolder(
  state: DemoState,
  folderId: string,
  name: string,
): DemoState {
  return {
    ...state,
    folders: state.folders.map((f) =>
      f.id === folderId ? { ...f, name } : f,
    ),
  };
}

export function createFolder(
  state: DemoState,
  parentId: string | null,
  name: string,
): { state: DemoState; id: string } {
  if (parentId !== null) {
    const parentDepth = folderDepth(state, parentId);
    if (parentDepth >= MAX_DEPTH) return { state, id: '' };
  }
  const id = `f-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  return {
    state: {
      ...state,
      folders: [
        ...state.folders,
        { id, name, parentId, emoji: '📁' },
      ],
    },
    id,
  };
}

export function flatFolderOptions(
  state: DemoState,
): Array<{ id: string; label: string; depth: number }> {
  const list: Array<{ id: string; label: string; depth: number }> = [];
  function walk(parentId: string | null, depth: number) {
    const items = foldersInFolder(state, parentId);
    for (const folder of items) {
      const path = pathToFolder(state, folder.id)
        .map((s) => s.name)
        .join(' › ');
      list.push({ id: folder.id, label: path, depth });
      walk(folder.id, depth + 1);
    }
  }
  walk(null, 0);
  return list;
}
