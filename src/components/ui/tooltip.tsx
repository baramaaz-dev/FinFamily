import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn }                 from '@/lib/utils';

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip         = TooltipPrimitive.Root;
export const TooltipTrigger  = TooltipPrimitive.Trigger;

type TooltipContentProps = React.ComponentProps<typeof TooltipPrimitive.Content>;

export function TooltipContent({ className, sideOffset = 4, ...props }: TooltipContentProps) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          'z-50 rounded-md bg-slate-900 px-2.5 py-1 text-xs text-white shadow-sm',
          'animate-in fade-in-0 zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
          className
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}
