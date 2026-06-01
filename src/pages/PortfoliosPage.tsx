import { useTranslation } from 'react-i18next';

export default function PortfoliosPage() {
  const { t } = useTranslation();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{t('pages.portfolios.title')}</h1>
      <p className="text-muted-foreground mt-2">{t('pages.underConstruction')}</p>
    </div>
  );
}
