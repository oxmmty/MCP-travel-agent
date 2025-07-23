import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, X, Chrome, Apple } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';

// Create multilingual validation schemas
const createLoginSchema = (t: any) => z.object({
  email: z.string().email(t('auth.validationErrors.emailInvalid')),
  password: z.string().min(1, t('auth.validationErrors.passwordRequired')),
});

const createRegisterSchema = (t: any) => z.object({
  firstName: z.string().min(2, t('auth.validationErrors.firstNameMinLength')),
  lastName: z.string().min(2, t('auth.validationErrors.lastNameMinLength')),
  email: z.string().email(t('auth.validationErrors.emailInvalid')),
  password: z.string()
    .min(8, t('auth.validationErrors.passwordMinLength'))
    .regex(/[A-Z]/, t('auth.validationErrors.passwordUppercase'))
    .regex(/[a-z]/, t('auth.validationErrors.passwordLowercase'))
    .regex(/[0-9]/, t('auth.validationErrors.passwordNumber')),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: t('auth.validationErrors.passwordsNoMatch'),
  path: ['confirmPassword'],
});

type LoginForm = {
  email: string;
  password: string;
};

type RegisterForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type ForgotPasswordForm = {
  email: string;
};

interface AuthOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthOverlay({ isOpen, onClose }: AuthOverlayProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login, register, requestPasswordReset } = useAuth();
  const { t } = useTranslation();

  // Create schemas with current translation function
  const loginSchema = createLoginSchema(t);
  const registerSchema = createRegisterSchema(t);
  const forgotPasswordSchema = z.object({
    email: z.string().email(t('auth.validationErrors.emailInvalid')),
  });

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleLogin = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);
    try {
      await login(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.errors.loginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    setIsLoading(true);
    setError(null);
    try {
      await register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.errors.registerFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(t('auth.errors.googleNotImplemented'));
  };

  const handleAppleLogin = async () => {
    setError(t('auth.errors.appleNotImplemented'));
  };

  const handleForgotPassword = async (data: ForgotPasswordForm) => {
    setIsLoading(true);
    setError(null);
    try {
      await requestPasswordReset(data.email);
      // Show success state instead of closing
      setMode('login');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.errors.genericError'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto bg-white shadow-2xl border-0 relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
        
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">
              {mode === 'forgot-password' ? '🔑' : '👋'}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {mode === 'login' 
                ? t('auth.welcomeBack') 
                : mode === 'register' 
                ? t('auth.welcomeToTakeMeTo')
                : t('auth.forgotPasswordTitle')
              }
            </h2>
            <p className="text-gray-600">
              {mode === 'login' 
                ? t('auth.signInToContinue') 
                : mode === 'register'
                ? t('auth.createAccount')
                : t('auth.forgotPasswordDescription')
              }
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {mode === 'forgot-password' ? (
            <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder={t('auth.enterEmail')}
                  className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  {...forgotPasswordForm.register('email')}
                />
                {forgotPasswordForm.formState.errors.email && (
                  <p className="text-sm text-red-500">{forgotPasswordForm.formState.errors.email.message}</p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('auth.sendingResetLink')}
                  </>
                ) : (
                  t('auth.sendResetLink')
                )}
              </Button>
              
              <div className="text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setMode('login')}
                  className="text-gray-600 hover:text-gray-800"
                >
                  {t('auth.backToLogin')}
                </Button>
              </div>
            </form>
          ) : mode === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder={t('auth.enterEmail')}
                  className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  {...loginForm.register('email')}
                />
                {loginForm.formState.errors.email && (
                  <p className="text-sm text-red-500">{loginForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.enterPassword')}
                    className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-12"
                    {...loginForm.register('password')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-sm text-red-500">{loginForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="text-right mb-4">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-sm text-blue-600 hover:text-blue-800 px-0"
                  onClick={() => setMode('forgot-password')}
                >
                  {t('auth.forgotPassword')}
                </Button>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-black text-white rounded-xl hover:bg-gray-800 font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('auth.signIn')}...
                  </>
                ) : (
                  t('auth.signIn')
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Input
                    placeholder={t('auth.enterFirstName')}
                    className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    {...registerForm.register('firstName')}
                  />
                  {registerForm.formState.errors.firstName && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Input
                    placeholder={t('auth.enterLastName')}
                    className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    {...registerForm.register('lastName')}
                  />
                  {registerForm.formState.errors.lastName && (
                    <p className="text-sm text-red-500">{registerForm.formState.errors.lastName.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Input
                  type="email"
                  placeholder={t('auth.enterEmail')}
                  className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  {...registerForm.register('email')}
                />
                {registerForm.formState.errors.email && (
                  <p className="text-sm text-red-500">{registerForm.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={t('auth.enterPassword')}
                    className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-12"
                    {...registerForm.register('password')}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {registerForm.formState.errors.password && (
                  <p className="text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  placeholder={t('auth.confirmYourPassword')}
                  className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  {...registerForm.register('confirmPassword')}
                />
                {registerForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500">{registerForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>
              <Button 
                type="submit" 
                className="w-full h-12 bg-black text-white rounded-xl hover:bg-gray-800 font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('auth.register')}...
                  </>
                ) : (
                  t('auth.register')
                )}
              </Button>
            </form>
          )}

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-500">{t('auth.or')}</span>
              </div>
            </div>
            
            <div className="mt-6 space-y-3">
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl border-gray-200 hover:bg-gray-50 font-medium"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <Chrome className="mr-3 h-5 w-5" />
                {t('auth.continueWithGoogle')}
              </Button>
              
              <Button
                variant="outline"
                className="w-full h-12 rounded-xl border-gray-200 hover:bg-gray-50 font-medium"
                onClick={handleAppleLogin}
                disabled={isLoading}
              >
                <Apple className="mr-3 h-5 w-5" />
                {t('auth.continueWithApple')}
              </Button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              {mode === 'login' ? t('auth.dontHaveAccount') + ' ' : t('auth.alreadyHaveAccount') + ' '}
              <button
                type="button"
                className="text-blue-600 hover:text-blue-800 font-medium"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError(null);
                }}
              >
                {mode === 'login' ? t('auth.register') : t('auth.signIn')}
              </button>
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              {t('auth.byContinuing')}{' '}
              <a href="#" className="text-blue-600 hover:text-blue-800">
                {t('auth.termsOfService')}
              </a>{' '}
              {t('auth.andConfirm')}{' '}
              <a href="#" className="text-blue-600 hover:text-blue-800">
                {t('auth.privacyPolicy')}
              </a>{' '}
              {t('auth.haveRead')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}