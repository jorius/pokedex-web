// External
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent, JSX } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'

// Store
import { useRegisterMutation } from '../store/Api'
import type { ApiErrorShape } from '../store/Api'

// Components
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Label } from '../components/ui/Label'

// Lib
import { resolveApiErrorMessage } from '../lib/ApiErrorMessage'
import { MIN_PASSWORD_LENGTH, isValidEmail, isValidPassword } from '../lib/Validation'

export function RegisterPage(): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [register, { isLoading }] = useRegisterMutation()

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
      await register({ email, password }).unwrap()
      navigate('/', { replace: true })
    } catch (error) {
      setServerError(resolveApiErrorMessage(error as ApiErrorShape, t))
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>{t('auth.registerTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-4" noValidate onSubmit={(event): void => { void handleSubmit(event) }}>
            <div className="flex flex-col gap-2">
              <Label htmlFor="register-email">{t('auth.email')}</Label>
              <Input
                id="register-email"
                type="email"
                autoComplete="email"
                value={email}
                aria-invalid={emailError !== null}
                aria-describedby={emailError !== null ? 'register-email-error' : undefined}
                onChange={(event): void => setEmail(event.target.value)}
              />
              {emailError !== null && (
                <p id="register-email-error" role="alert" className="text-sm text-destructive">
                  {emailError}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="register-password">{t('auth.password')}</Label>
              <Input
                id="register-password"
                type="password"
                autoComplete="new-password"
                value={password}
                aria-invalid={passwordError !== null}
                aria-describedby={passwordError !== null ? 'register-password-error' : undefined}
                onChange={(event): void => setPassword(event.target.value)}
              />
              {passwordError !== null && (
                <p id="register-password-error" role="alert" className="text-sm text-destructive">
                  {passwordError}
                </p>
              )}
            </div>
            {serverError !== null && (
              <p id="register-server-error" role="alert" className="text-sm text-destructive">
                {serverError}
              </p>
            )}
            <Button type="submit" disabled={isLoading} className="mt-2">
              {isLoading && <Loader2 className="animate-spin" aria-hidden />}
              {t('auth.registerCta')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            {t('auth.haveAccount')}{' '}
            <Link to="/login" className="font-bold text-primary hover:underline">
              {t('auth.loginCta')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
