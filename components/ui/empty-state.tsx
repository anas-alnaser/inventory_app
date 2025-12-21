import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="gap-2">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  )
}

