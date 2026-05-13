// Default Input is now the same component as `TextInput` from
// `input-extended.tsx` (InputShell + ShellInput). Anyone importing `Input`
// from `@/shared/ui/input` gets the new design with brand-purple focus ring,
// `shadow-xs`, `h-10`, `rounded-lg`, and the optional `helpTooltip`/`leadingIcon`
// affordances.
export { TextInput as Input } from "@/shared/ui/input-extended"
