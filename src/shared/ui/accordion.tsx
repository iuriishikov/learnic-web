import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"

import { cn } from "@/shared/lib/utils"
import { MinusCircleIcon, PlusCircleIcon } from "lucide-react"

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn("flex w-full flex-col", className)}
      {...props}
    />
  )
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("not-last:border-b", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/accordion-trigger flex flex-1 items-start justify-between gap-6 rounded-lg border border-transparent py-6 text-left text-base font-semibold text-foreground transition-all outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-disabled:pointer-events-none aria-disabled:opacity-50 md:text-lg",
          className
        )}
        {...props}
      >
        {children}
        <span
          data-slot="accordion-trigger-icon"
          aria-hidden
          className="relative mt-0.5 size-6 shrink-0 text-muted-foreground transition-colors group-hover/accordion-trigger:text-foreground"
        >
          <PlusCircleIcon className="pointer-events-none absolute inset-0 size-full transition-[opacity,transform] duration-200 group-aria-expanded/accordion-trigger:rotate-90 group-aria-expanded/accordion-trigger:opacity-0" />
          <MinusCircleIcon className="pointer-events-none absolute inset-0 size-full -rotate-90 opacity-0 transition-[opacity,transform] duration-200 group-aria-expanded/accordion-trigger:rotate-0 group-aria-expanded/accordion-trigger:opacity-100" />
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      data-slot="accordion-content"
      // base-ui exposes the measured height as `--accordion-panel-height`, so
      // we animate that with a real CSS transition (height 0 → auto can't be
      // keyframed). Opacity rides along for a soft reveal.
      className="h-(--accordion-panel-height) overflow-hidden transition-[height,opacity] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] data-starting-style:h-0 data-starting-style:opacity-0 data-ending-style:h-0 data-ending-style:opacity-0"
      {...props}
    >
      <div
        className={cn(
          "pt-0 pr-10 pb-6 text-base leading-relaxed text-muted-foreground [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
          className
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Panel>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
