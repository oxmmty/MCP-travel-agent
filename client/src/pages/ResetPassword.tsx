import { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

// Create schema function that takes t function
const createResetPasswordSchema = (t: (key: string) => string) => z.object({
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

export function ResetPassword() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [, params] = useRoute('/reset-password');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const { resetPassword, verifyResetToken } = useAuth();
  const { toast } = useToast();

  // Create schema with current translation function
  const resetPasswordSchema = createResetPasswordSchema(t);
  type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

  // Get token from URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  const form = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Verify token on component mount
  useEffect(() => {
    if (!token) {
      toast({
        title: t('auth.invalidResetLink'),
        description: t('auth.invalidResetLinkDescription'),
        variant: 'destructive',
      });
      navigate('/');
      return;
    }

    const verifyToken = async () => {
      try {
        console.log('Verifying token:', token);
        const valid = await verifyResetToken(token);
        console.log('Token verification result:', valid);
        setIsValidToken(valid);
        if (!valid) {
          console.log('Token is invalid or expired');
          toast({
            title: t('auth.expiredResetLink'),
            description: t('auth.expiredResetLinkDescription'),
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Token verification error:', error);
        setIsValidToken(false);
        toast({
          title: t('auth.errors.genericError'),
          description: t('auth.expiredResetLinkDescription'),
          variant: 'destructive',
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token, verifyResetToken, navigate, toast, t]);

  const handleSubmit = async (data: ResetPasswordForm) => {
    if (!token) return;

    setIsLoading(true);
    try {
      console.log('Attempting password reset with token:', token);
      await resetPassword(token, data.password);
      toast({
        title: t('auth.passwordResetSuccess'),
        description: t('auth.passwordResetSuccessDescription'),
      });
      
      // Navigate to home after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      console.error('Password reset error:', error);
      toast({
        title: t('auth.errors.genericError'),
        description: error instanceof Error ? error.message : t('auth.errors.genericError'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto bg-white shadow-2xl border-0">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <h2 className="text-xl font-semibold mb-2">{t('auth.sendingResetLink')}</h2>
            <p className="text-gray-600">{t('auth.sendingResetLink')}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md mx-auto bg-white shadow-2xl border-0">
          <CardContent className="p-8 text-center">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h2 className="text-xl font-semibold mb-2">{t('auth.invalidResetLink')}</h2>
            <p className="text-gray-600 mb-6">
              {t('auth.invalidResetLinkDescription')}
            </p>
            <Button 
              onClick={() => navigate('/')} 
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('auth.backToLogin')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto bg-white shadow-2xl border-0">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {t('auth.resetPasswordTitle')}
            </h2>
            <p className="text-gray-600">
              {t('auth.resetPasswordDescription')}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.newPassword')}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? 'text' : 'password'}
                          placeholder={t('auth.enterPassword')}
                          className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-12"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-12 px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.confirmNewPassword')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder={t('auth.confirmYourPassword')}
                        className="h-12 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-12 bg-black text-white rounded-xl hover:bg-gray-800 font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('auth.resettingPassword')}
                  </>
                ) : (
                  t('auth.resetPasswordButton')
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('auth.backToLogin')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}