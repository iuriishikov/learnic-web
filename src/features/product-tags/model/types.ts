export type Tag = {
  id: string;
  name: string;
  /** CSS color string in canonical hex (`#rgb` / `#rgba` / `#rrggbb` / `#rrggbbaa`). */
  color: string;
};

/** Per-product cap; mirrors backend `PRODUCT_TAGS_MAX`. */
export const PRODUCT_TAGS_MAX = 5;

/** Mirrors backend `TAG_NAME_MAX_LEN`. */
export const TAG_NAME_MAX_LEN = 30;

export type UpdateProductTagsItem =
  | { kind: 'existing'; tagId: string }
  | { kind: 'new'; name: string; color: string };
