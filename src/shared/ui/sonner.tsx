"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      richColors
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",

          "--error-bg": "var(--destructive)",
          "--error-text": "oklch(0.99 0 0)",
          "--error-border": "color-mix(in oklch, var(--destructive) 80%, black)",

          "--success-bg": "color-mix(in oklch, var(--online) 12%, var(--popover))",
          "--success-text": "var(--online)",
          "--success-border": "color-mix(in oklch, var(--online) 35%, var(--border))",

          "--info-bg": "color-mix(in oklch, var(--brand) 10%, var(--popover))",
          "--info-text": "var(--brand)",
          "--info-border": "color-mix(in oklch, var(--brand) 30%, var(--border))",

          "--warning-bg": "color-mix(in oklch, oklch(0.78 0.15 75) 14%, var(--popover))",
          "--warning-text": "oklch(0.55 0.13 75)",
          "--warning-border": "color-mix(in oklch, oklch(0.78 0.15 75) 35%, var(--border))",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
