import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { useDirection } from '@/hooks/useDirection';
import { Landmark, Eye, EyeOff, Loader2 } from 'lucide-react';
import { ROUTES } from '@/router/routes';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const { login, loading, error } = useAuthStore();
  const navigate                = useNavigate();
  const { t }                   = useTranslation();
  const { direction }           = useDirection();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate(ROUTES.DASHBOARD);
    } catch {
      // error shown from store
    }
  };

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center p-4"
      dir={direction}
    >
      <div className="bg-card border border-border rounded-lg w-full max-w-md p-8">
        {/* Brand mark */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#1E5DC4] rounded-lg flex items-center justify-center mb-4">
            <Landmark className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-medium text-foreground">FinFamily</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('pages.login')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t('auth.email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-border rounded-md px-4 py-2.5 text-sm
                         bg-background text-foreground placeholder:text-muted-foreground
                         focus:outline-none focus:ring-2 focus:ring-[#1E5DC4] focus:border-transparent
                         transition-all"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t('auth.password')}
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full border border-border rounded-md px-4 py-2.5 text-sm
                           bg-background text-foreground
                           focus:outline-none focus:ring-2 focus:ring-[#1E5DC4] focus:border-transparent
                           transition-all ps-10"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute start-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-[#FEF0EF] border border-[#F5B9B5] text-[#C0392B] text-sm rounded-md px-4 py-3">
              {error === 'Invalid login credentials'
                ? t('auth.invalidCredentials')
                : error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={cn(
              'w-full text-white font-medium py-2.5 rounded-md transition-colors',
              'flex items-center justify-center gap-2',
              loading
                ? 'bg-[#7FAAE8] cursor-not-allowed'
                : 'bg-[#1E5DC4] hover:bg-[#164399]',
            )}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? t('common.loading') : t('pages.login')}
          </button>
        </form>
      </div>
    </div>
  );
}
