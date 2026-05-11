export type User = {
  oid: string;
  firstName: string;
  lastName: string;
  patronymic: string | null;
  /** Display name in the canonical `Last First Patronymic` order, returned by the backend. */
  fullName: string;
  /** Privacy-masked email in the form `f*****d@domain.com`. */
  email: string;
  description: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  websiteUrl: string | null;
  portfolioUrl: string | null;
  /** Display-only contact email distinct from `email` (login). */
  publicEmail: string | null;
};

export type UserResponse = {
  oid: string;
  full_name: string;
  email: string;
  description: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  website_url: string | null;
  portfolio_url: string | null;
  public_email: string | null;
};

type NameParts = {
  firstName: string;
  lastName: string;
  patronymic: string | null;
};

// Backend ships `full_name` as `Last First Patronymic` (or `Last First` when
// no patronymic). Profile editing still works on the parts via dedicated PUT
// endpoints, so we recover them here for the form's initial values.
export function parseFullName(fullName: string): NameParts {
  const tokens = fullName.trim().split(/\s+/).filter(Boolean);
  if (tokens.length >= 3) {
    return {
      lastName: tokens[0],
      firstName: tokens[1],
      patronymic: tokens.slice(2).join(' '),
    };
  }
  if (tokens.length === 2) {
    return { lastName: tokens[0], firstName: tokens[1], patronymic: null };
  }
  if (tokens.length === 1) {
    return { lastName: tokens[0], firstName: '', patronymic: null };
  }
  return { lastName: '', firstName: '', patronymic: null };
}

export function toUser(raw: UserResponse): User {
  const { firstName, lastName, patronymic } = parseFullName(raw.full_name);
  return {
    oid: raw.oid,
    firstName,
    lastName,
    patronymic,
    fullName: raw.full_name,
    email: raw.email,
    description: raw.description,
    avatarUrl: raw.avatar_url,
    coverUrl: raw.cover_url,
    websiteUrl: raw.website_url,
    portfolioUrl: raw.portfolio_url,
    publicEmail: raw.public_email,
  };
}
