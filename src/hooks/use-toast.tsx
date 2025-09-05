import * as React from "react"
import { toast as sonnerToast } from "sonner"

type ToastProps = {
  title?: string
  description?: string
  variant?: "default" | "destructive"
}

export const useToast = () => {
  const toast = React.useCallback(({ title, description, variant = "default" }: ToastProps) => {
    if (variant === "destructive") {
      sonnerToast.error(title, {
        description,
        style: {
          background: "hsl(var(--destructive))",
          color: "hsl(var(--destructive-foreground))",
          border: "1px solid hsl(var(--destructive))",
        }
      })
    } else {
      sonnerToast.success(title, {
        description,
        style: {
          background: "hsl(var(--glass))",
          color: "hsl(var(--foreground))",
          border: "1px solid hsl(var(--glass-border))",
          backdropFilter: "blur(12px)",
        }
      })
    }
  }, [])

  return { toast }
}
