import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",

        /* 新增：渐变按钮变体 - Indigo → Violet */
        gradient:
          "text-white font-semibold shadow-glow-primary hover:shadow-glow-primary-hover transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",

        /* 新增：状态渐变按钮变体 */
        "gradient-success":
          "text-white font-semibold shadow-glow-success hover:shadow-glow-success-hover transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
        "gradient-warning":
          "text-white font-semibold shadow-glow-warning hover:shadow-glow-warning-hover transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
        "gradient-error":
          "text-white font-semibold shadow-glow-error hover:shadow-glow-error-hover transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
      },
      size: {
        default:
          "h-11 min-w-[44px] gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-11 min-w-[44px] gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 min-w-[44px] gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-11 min-w-[44px]",
        "icon-xs":
          "size-11 min-w-[44px] rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-9 min-w-[44px] rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  // 为渐变按钮添加内联样式
  const gradientStyle = (variant === 'gradient' || variant === 'gradient-success' || variant === 'gradient-warning' || variant === 'gradient-error')
    ? {
        background: variant === 'gradient'
          ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
          : variant === 'gradient-success'
          ? 'linear-gradient(135deg, #22c55e 0%, #4ade80 100%)'
          : variant === 'gradient-warning'
          ? 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
          : 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
        backgroundSize: '100% 100%',
      }
    : {}

  return (
    <ButtonPrimitive
      data-slot="button"
      style={gradientStyle}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
