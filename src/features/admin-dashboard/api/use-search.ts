'use client';

import { useQuery } from '@tanstack/react-query';

import type { AdminNoteResult, AdminUserResult } from '../model/search';
import { SEARCH_MIN_QUERY_LEN } from '../model/search';

import { searchAdminNotesAction, searchAdminUsersAction } from './search';

export function useAdminUserSearch(query: string) {
  const trimmed = query.trim();
  return useQuery<AdminUserResult[], Error>({
    queryKey: ['admin-user-search', trimmed.toLowerCase()],
    queryFn: async () => {
      const result = await searchAdminUsersAction({ query: trimmed });
      if (!result.ok) throw new Error(result.reason);
      return result.users;
    },
    enabled: trimmed.length >= SEARCH_MIN_QUERY_LEN,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useAdminNoteSearch(query: string) {
  const trimmed = query.trim();
  return useQuery<AdminNoteResult[], Error>({
    queryKey: ['admin-note-search', trimmed.toLowerCase()],
    queryFn: async () => {
      const result = await searchAdminNotesAction({ query: trimmed });
      if (!result.ok) throw new Error(result.reason);
      return result.notes;
    },
    enabled: trimmed.length >= SEARCH_MIN_QUERY_LEN,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}
