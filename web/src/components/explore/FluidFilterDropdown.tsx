"use client"

import * as React from "react"
import { AnimatePresence, MotionConfig, motion } from "framer-motion"
import { ChevronDown } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useClickAway } from "@/hooks/use-click-away"

export interface FluidDropdownOption {
  value: string
  label: string
  description?: string
  icon?: LucideIcon
  accent?: string
  disabled?: boolean
  renderContent?: (helpers: { close: () => void }) => React.ReactNode
}

interface FluidFilterDropdownProps {
  label: string
  value: string
  onValueChange: (value: string) => void
  options: FluidDropdownOption[]
  placeholder?: string
  className?: string
  buttonClassName?: string
  listClassName?: string
  optionClassName?: string
  renderTopSlot?: React.ReactNode | ((helpers: { close: () => void }) => React.ReactNode)
}

export function FluidFilterDropdown({
  label,
  value,
  onValueChange,
  options,
  placeholder = "Selecciona",
  className,
  buttonClassName,
  listClassName,
  optionClassName,
  renderTopSlot,
}: FluidFilterDropdownProps) {
  const [open, setOpen] = React.useState(false)
  const [hovered, setHovered] = React.useState<string | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  useClickAway(containerRef, () => setOpen(false))

  const closeDropdown = React.useCallback(() => setOpen(false), [])

  React.useEffect(() => {
    if (!open) {
      setHovered(null)
    }
  }, [open])

  const activeOption = React.useMemo(() => options.find((option) => option.value === value) ?? null, [options, value])
  const highlightTarget = hovered ?? activeOption?.value ?? null

  const renderTop = React.useMemo(() => {
    if (!renderTopSlot) return null
    return typeof renderTopSlot === "function" ? renderTopSlot({ close: closeDropdown }) : renderTopSlot
  }, [renderTopSlot, closeDropdown])

  const handleSelect = React.useCallback(
    (option: FluidDropdownOption) => {
      if (option.disabled) return
      onValueChange(option.value)
      setHovered(null)
      closeDropdown()
    },
    [onValueChange, closeDropdown],
  )

  return (
    <MotionConfig reducedMotion="user">
      <div ref={containerRef} className={cn("relative", className)}>
        <Button
          type="button"
          variant="outline"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            "group h-12 w-full justify-between rounded-xl border border-transparent bg-white px-4 text-left shadow-sm",
            "transition-all duration-200 ease-in-out",
            "hover:border-gray-200 hover:bg-white",
            open ? "ring-2 ring-offset-2 ring-offset-white ring-gray-900/10" : "ring-0",
            buttonClassName,
          )}
        >
          <div className="flex flex-col text-left">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-400">{label}</span>
            <span className="text-sm font-semibold text-gray-900">
              {activeOption ? activeOption.label : placeholder}
            </span>
          </div>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-gray-400">
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </Button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="dropdown"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-0 right-0 top-full z-40 mt-2"
            >
              <motion.div
                layout
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
                initial={{ scale: 0.97, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.98, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                {renderTop ? (
                  <div className="border-b border-gray-100 bg-gray-50/60 p-3">{renderTop}</div>
                ) : null}
                <motion.ul
                  className={cn(
                    "relative max-h-[280px] overflow-y-auto p-1.5 space-y-1",
                    listClassName,
                  )}
                  role="listbox"
                  aria-label={label}
                >
                  {options.map((option) => {
                    const Icon = option.icon
                    const isSelected = option.value === value
                    const isHighlighted = highlightTarget === option.value

                    return (
                      <motion.li key={option.value} layout className="relative">
                        <motion.button
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          disabled={option.disabled}
                          className={cn(
                            "relative flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-left text-sm",
                            "transition-colors duration-150",
                            option.disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                            isSelected ? "text-gray-900" : "text-gray-500",
                            optionClassName,
                          )}
                          onClick={() => handleSelect(option)}
                          onMouseEnter={() => setHovered(option.value)}
                          onFocus={() => setHovered(option.value)}
                          onMouseLeave={() => setHovered(null)}
                          onBlur={() => setHovered(null)}
                          whileTap={{ scale: 0.98 }}
                          transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        >
                          {isHighlighted ? (
                            <motion.span
                              layoutId={`${label}-highlight`}
                              className="absolute inset-0 -z-[1] rounded-xl bg-gray-100 shadow-[inset_0_1px_0_rgba(148,163,184,0.35)]"
                              transition={{ type: "spring", stiffness: 300, damping: 26, mass: 1 }}
                            />
                          ) : null}
                          {Icon ? (
                            <span
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-xl bg-gray-100 text-gray-600",
                                option.accent,
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                          ) : null}
                          <div className="flex min-w-0 flex-col overflow-hidden">
                            <span className="truncate font-semibold tracking-tight">
                              {option.label}
                            </span>
                            {option.description ? (
                              <span className="truncate text-xs text-gray-500">{option.description}</span>
                            ) : null}
                          </div>
                        </motion.button>
                        {option.renderContent && value === option.value ? (
                          <div className="px-4 pb-3" onMouseDown={(event) => event.stopPropagation()}>
                            {option.renderContent({ close: closeDropdown })}
                          </div>
                        ) : null}
                      </motion.li>
                    )
                  })}
                </motion.ul>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}
