'use client';

import { useMyEffectivePermissions } from './use-team';

export type ProductCapabilities = {
  isLoading: boolean;
  has: (perm: string) => boolean;
  canRead: boolean;
  canComment: boolean;
  canEditDescription: boolean;
  canEditCover: boolean;
  canEditModules: boolean;
  canEditLessons: boolean;
  canEditQA: boolean;
  canManageReleases: boolean;
  canManageCollaborators: boolean;
  canManageRoles: boolean;
  canPublish: boolean;
  canArchive: boolean;
};

export function useProductPermissions(
  productId: string,
  options?: { enabled?: boolean },
): ProductCapabilities {
  const query = useMyEffectivePermissions(productId, options);
  const set = new Set<string>(query.data?.permissions ?? []);
  const has = (perm: string) => set.has(perm);
  return {
    isLoading: query.isLoading,
    has,
    canRead: has('read_product'),
    canComment: has('comment'),
    canEditDescription: has('edit_description'),
    canEditCover: has('edit_cover'),
    canEditModules: has('edit_modules'),
    canEditLessons: has('edit_lessons'),
    canEditQA: has('edit_qa'),
    canManageReleases: has('manage_releases'),
    canManageCollaborators: has('manage_collaborators'),
    canManageRoles: has('manage_roles'),
    canPublish: has('publish'),
    canArchive: has('archive'),
  };
}
