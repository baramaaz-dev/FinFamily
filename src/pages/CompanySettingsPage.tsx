import { useEffect }          from 'react';
import { useForm, Controller } from 'react-hook-form';
import type { Resolver }       from 'react-hook-form';
import { zodResolver }         from '@hookform/resolvers/zod';
import { z }                   from 'zod';
import { useTranslation }      from 'react-i18next';
import { toast }               from 'sonner';
import { Loader2 }             from 'lucide-react';
import { useCompany, useUpdateCompany } from '@/hooks/useCompany';
import { Input }     from '@/components/ui/input';
import { Label }     from '@/components/ui/label';
import { Textarea }  from '@/components/ui/textarea';
import { Button }    from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';

const companySchema = z.object({
  name: z.string().min(2, { error: 'اسم الشركة مطلوب (حرفان على الأقل)' }),
  founded_date: z.string().min(1).optional().or(z.literal('')),
  base_currency: z.enum(['USD', 'SYP'], { error: 'اختر عملة مرجعية' }),
  notes: z.string().optional(),
});

type CompanyFormValues = z.infer<typeof companySchema>;

function Skeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-8 bg-slate-200 rounded" />
          <div className="h-8 bg-slate-200 rounded" />
        </div>
        <div className="h-32 bg-slate-200 rounded" />
        <div className="h-8 bg-slate-200 rounded w-24" />
      </div>
    </div>
  );
}

export default function CompanySettingsPage() {
  const { t } = useTranslation();
  const { data: company, isLoading } = useCompany();
  const { mutate: saveCompany, isPending } = useUpdateCompany();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema) as unknown as Resolver<CompanyFormValues>,
    defaultValues: {
      name: '',
      founded_date: '',
      base_currency: 'USD',
      notes: '',
    },
  });

  useEffect(() => {
    if (company) {
      reset({
        name: company.name,
        founded_date: company.founded_date ?? '',
        base_currency: company.base_currency,
        notes: company.notes ?? '',
      });
    }
  }, [company, reset]);

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <Skeleton />
      </div>
    );
  }

  function onSubmit(values: CompanyFormValues) {
    if (!company) return;
    saveCompany(
      {
        id: company.id,
        payload: {
          name: values.name,
          founded_date: values.founded_date || null,
          base_currency: values.base_currency,
          notes: values.notes || null,
        },
      },
      {
        onSuccess: () => toast.success(t('settings.company.saveSuccess')),
        onError:   () => toast.error(t('settings.company.saveError')),
      }
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-medium text-slate-950 mb-6">
        {t('settings.company.title')}
      </h1>

      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

          {/* Company name — full width */}
          <div className="space-y-1.5">
            <Label className="text-sm text-slate-600">
              {t('settings.company.name')}
            </Label>
            <Input
              placeholder={t('settings.company.namePlaceholder')}
              className="border-[#E2E8F0] focus-visible:ring-[#1E5DC4]"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-[#C0392B]" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Founded date + Base currency side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-slate-600">
                {t('settings.company.foundedDate')}
              </Label>
              <Input
                type="date"
                className="border-[#E2E8F0] focus-visible:ring-[#1E5DC4]"
                {...register('founded_date')}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm text-slate-600">
                {t('settings.company.baseCurrency')}
              </Label>
              <Controller
                name="base_currency"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="border-[#E2E8F0] focus:ring-[#1E5DC4]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">
                        {t('settings.company.baseCurrencyUSD')}
                      </SelectItem>
                      <SelectItem value="SYP">
                        {t('settings.company.baseCurrencySYP')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.base_currency && (
                <p className="text-xs text-[#C0392B]" role="alert">
                  {errors.base_currency.message}
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-sm text-slate-600">
              {t('settings.company.notes')}
            </Label>
            <Textarea
              placeholder={t('settings.company.notesPlaceholder')}
              rows={3}
              className="resize-none border-[#E2E8F0] focus-visible:ring-[#1E5DC4]"
              {...register('notes')}
            />
          </div>

          {/* Save button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 bg-[#1E5DC4] hover:bg-[#164399] text-white rounded-md px-4 py-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('settings.company.saving')}
                </>
              ) : (
                t('settings.company.save')
              )}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
