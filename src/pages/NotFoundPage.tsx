import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/router/routes';

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <p className="text-xl">{t('pages.notFound')}</p>
      <Link to={ROUTES.DASHBOARD} className="text-primary underline hover:no-underline">
        {t('pages.notFoundBack')}
      </Link>
    </div>
  );
}
