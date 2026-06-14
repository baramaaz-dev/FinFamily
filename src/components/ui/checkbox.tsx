import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check }              from 'lucide-react';
import { cn }                 from '@/lib/utils';

type CheckboxProps = React.ComponentProps<typeof CheckboxPrimitive.Root>;

export function Checkbox({ className, ...props }: CheckboxProps) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        'peer h-4 w-4 shrink-0 rounded-sm border border-slate-300 shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E5DC4] focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-40',
        'data-[state=checked]:bg-[#1E5DC4] data-[state=checked]:border-[#1E5DC4] data-[state=checked]:text-white',
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <Check className="h-3 w-3" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
