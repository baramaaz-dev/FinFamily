import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{t('pages.propertyDetail')}</h1>
      <p className="text-muted-foreground mt-2">{t('pages.id')}: {id}</p>
    </div>
  );
}
