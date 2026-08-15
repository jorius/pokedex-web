// External
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent, JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router'
import type { Location } from 'react-router'

// Store
import { useLoginMutation } from '../store/Api'
import type { ApiErrorShape } from '../store/Api'

// Components
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'

// Lib
import { resolveApiErrorMessage } from '../lib/ApiErrorMessage'
import { MIN_PASSWORD_LENGTH, isValidEmail, isValidPassword } from '../lib/Validation'

interface RedirectState {
  from?: Location
}

export function LoginPage(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [login, { isLoading }] = useLoginMutation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  function validate(): boolean {
    const nextEmailError = isValidEmail(email) ? null : t('auth.localValidation.emailInvalid')
    const nextPasswordError = isValidPassword(password) ? null : t('auth.localValidation.passwordMin', { count: MIN_PASSWORD_LENGTH })
    setEmailError(nextEmailError)
    setPasswordError(nextPasswordError)
    return nextEmailError === null && nextPasswordError === null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setServerError(null)
    if (!validate()) return

    try {
      await login({ email, password }).unwrap()
      const redirectState = location.state as RedirectState | null
      navigate(redirectState?.from?.pathname ?? '/', { replace: true })
    } catch (error) {
      setServerError(resolveApiErrorMessage(error as ApiErrorShape, t))
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>{t('auth.loginTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" noValidate onSubmit={(event): void => { void handleSubmit(event) }}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="login-email">{t('auth.email')}</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                aria-invalid={emailError !== null}
                aria-describedby={emailError !== null ? 'login-email-error' : undefined}
                onChange={(event): void => setEmail(event.target.value)}
              />
              {emailError !== null && (
                <p id="login-email-error" role="alert" className="text-sm text-destructive">
                  {emailError}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="login-password">{t('auth.password')}</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                aria-invalid={passwordError !== null}
                aria-describedby={passwordError !== null ? 'login-password-error' : undefined}
                onChange={(event): void => setPassword(event.target.value)}
              />
              {passwordError !== null && (
                <p id="login-password-error" role="alert" className="text-sm text-destructive">
                  {passwordError}
                </p>
              )}
            </div>
            {serverError !== null && (
              <p id="login-server-error" role="alert" className="text-sm text-destructive">
                {serverError}
              </p>
            )}
            <Button type="submit" disabled={isLoading} className="mt-2">
              {isLoading && <Loader2 className="animate-spin" aria-hidden />}
              {t('auth.loginCta')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="font-bold text-primary hover:underline">
              {t('auth.registerCta')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
