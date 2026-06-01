import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';

export default function SettingsPage() {
  const { t } = useTranslation();
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">{t('pages.settings')}</h1>
      <Outlet />
    </div>
  );
}
