export type User = {
  oid: string;
  firstName: string;
  lastName: string;
  patronymic: string | null;
  description: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
};

export type UserResponse = {
  oid: string;
  first_name: string;
  last_name: string;
  patronymic: string | null;
  description: string | null;
  avatar_url: string | null;
  cover_url: string | null;
};

export function toUser(raw: UserResponse): User {
  return {
    oid: raw.oid,
    firstName: raw.first_name,
    lastName: raw.last_name,
    patronymic: raw.patronymic,
    description: raw.description,
    avatarUrl: raw.avatar_url,
    coverUrl: raw.cover_url,
  };
}
