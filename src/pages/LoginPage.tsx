import type { MessageDescriptor } from '@lingui/core'
import { msg } from '@lingui/core/macro'
import { Trans, useLingui } from '@lingui/react/macro'
import { Link, useNavigate } from '@tanstack/react-router'
import { useConvexAuth } from 'convex/react'
import { ArrowLeft, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import { authClient } from '../lib/auth-client'

const RESEND_DELAY_S = 30

const ERRORS: Record<string, MessageDescriptor> = {
  INVALID_OTP: msg`Wrong code. Check the latest email you received.`,
  OTP_EXPIRED: msg`This code has expired. Request a new one.`,
  TOO_MANY_ATTEMPTS: msg`Too many attempts. Request a new code.`,
  INVALID_EMAIL: msg`Invalid email address.`,
  OTP_RATE_LIMITED: msg`Too many code requests. Try again in a few minutes.`,
}
const UNKNOWN_ERROR = msg`Something went wrong, please try again.`

function errorMessage(error: { code?: string } | null) {
  if (!error) return null
  return (error.code && ERRORS[error.code]) || UNKNOWN_ERROR
}

export function LoginPage() {
  const { t, i18n } = useLingui()
  const navigate = useNavigate()
  const { isAuthenticated } = useConvexAuth()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<MessageDescriptor | null>(null)
  const [pending, setPending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (isAuthenticated) navigate({ to: '/groups', replace: true })
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function sendCode() {
    setPending(true)
    setError(null)
    const { error } = await authClient.emailOtp.sendVerificationOtp({ email: email.trim(), type: 'sign-in' })
    setPending(false)
    if (error) return setError(errorMessage(error))
    setStep('code')
    setCode('')
    setCooldown(RESEND_DELAY_S)
  }

  async function verify(otp: string) {
    setPending(true)
    setError(null)
    const { error } = await authClient.signIn.emailOtp({ email: email.trim(), otp })
    setPending(false)
    if (error) {
      setCode('')
      setError(errorMessage(error))
    }
    // On success, useConvexAuth flips to authenticated and the effect above redirects.
  }

  return (
    <>
      <header className="mb-10">
        <Link to="/groups" className="btn-ghost -ml-3">
          <ArrowLeft className="size-4" /> <Trans>Back</Trans>
        </Link>
      </header>

      {step === 'email' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (email.trim()) void sendCode()
          }}
        >
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            <Trans>Log in</Trans>
          </h1>
          <p className="mt-2 text-muted">
            <Trans>Get your groups on all your devices. No password: we email you a code.</Trans>
          </p>
          <label className="mt-8 block space-y-2">
            <span className="label">
              <Trans>Email</Trans>
            </span>
            <input
              autoFocus
              type="email"
              autoComplete="email"
              className="field"
              placeholder={t`you@example.com`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {error && <p className="mt-3 text-sm text-owe">{i18n._(error)}</p>}
          <button className="btn-primary mt-6 w-full" disabled={!email.trim() || pending}>
            {pending ? <Trans>Sending…</Trans> : <Trans>Get a code</Trans>}
          </button>
          <p className="mt-4 text-center text-xs text-muted">
            <Trans>No account yet? It will be created automatically, with your current groups.</Trans>
          </p>
        </form>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (code.length === 6) void verify(code)
          }}
        >
          <span className="flex size-12 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Mail className="size-6" />
          </span>
          <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight">
            <Trans>Check your email</Trans>
          </h1>
          <p className="mt-2 text-muted">
            <Trans>
              Code sent to <span className="font-medium text-ink">{email.trim()}</span>. It expires in 10 minutes.
            </Trans>
          </p>
          <input
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label={t`6-digit code`}
            placeholder="••••••"
            maxLength={6}
            className="field mt-8 text-center font-display text-3xl tracking-[0.5em] tabular-nums"
            value={code}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 6)
              setCode(digits)
              if (digits.length === 6 && !pending) void verify(digits)
            }}
          />
          {error && <p className="mt-3 text-sm text-owe">{i18n._(error)}</p>}
          <button className="btn-primary mt-6 w-full" disabled={code.length !== 6 || pending}>
            {pending ? <Trans>Checking…</Trans> : <Trans>Log in</Trans>}
          </button>
          <div className="mt-4 flex justify-between text-sm">
            <button type="button" className="btn-ghost -ml-3" onClick={() => setStep('email')}>
              <Trans>Change email</Trans>
            </button>
            <button type="button" className="btn-ghost -mr-3" disabled={cooldown > 0 || pending} onClick={sendCode}>
              {cooldown > 0 ? <Trans>Resend ({cooldown}s)</Trans> : <Trans>Resend code</Trans>}
            </button>
          </div>
        </form>
      )}
    </>
  )
}
