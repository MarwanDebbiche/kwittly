import { Link, useNavigate } from '@tanstack/react-router'
import { useConvexAuth } from 'convex/react'
import { ArrowLeft, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import { authClient } from '../lib/auth-client'

const RESEND_DELAY_S = 30

const ERRORS: Record<string, string> = {
  INVALID_OTP: 'Code incorrect. Vérifie le dernier email reçu.',
  OTP_EXPIRED: 'Ce code a expiré. Demande un nouveau code.',
  TOO_MANY_ATTEMPTS: 'Trop de tentatives. Demande un nouveau code.',
  INVALID_EMAIL: 'Adresse email invalide.',
  OTP_RATE_LIMITED: 'Trop de demandes de code. Réessaie dans quelques minutes.',
}

function errorMessage(error: { code?: string; message?: string } | null) {
  if (!error) return null
  return (error.code && ERRORS[error.code]) || error.message || 'Une erreur est survenue, réessaie.'
}

export function LoginPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useConvexAuth()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
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
          <ArrowLeft className="size-4" /> Retour
        </Link>
      </header>

      {step === 'email' ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (email.trim()) void sendCode()
          }}
        >
          <h1 className="font-display text-3xl font-semibold tracking-tight">Connexion</h1>
          <p className="mt-2 text-muted">
            Retrouve tes groupes sur tous tes appareils. Pas de mot de passe : on t'envoie un code par email.
          </p>
          <label className="mt-8 block space-y-2">
            <span className="label">Email</span>
            <input
              autoFocus
              type="email"
              autoComplete="email"
              className="field"
              placeholder="toi@exemple.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {error && <p className="mt-3 text-sm text-owe">{error}</p>}
          <button className="btn-primary mt-6 w-full" disabled={!email.trim() || pending}>
            {pending ? 'Envoi…' : 'Recevoir un code'}
          </button>
          <p className="mt-4 text-center text-xs text-muted">
            Pas encore de compte ? Il sera créé automatiquement. Tes groupes actuels y seront rattachés.
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
          <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight">Vérifie tes emails</h1>
          <p className="mt-2 text-muted">
            Code envoyé à <span className="font-medium text-ink">{email.trim()}</span>. Il expire dans 10 minutes.
          </p>
          <input
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label="Code à 6 chiffres"
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
          {error && <p className="mt-3 text-sm text-owe">{error}</p>}
          <button className="btn-primary mt-6 w-full" disabled={code.length !== 6 || pending}>
            {pending ? 'Vérification…' : 'Se connecter'}
          </button>
          <div className="mt-4 flex justify-between text-sm">
            <button type="button" className="btn-ghost -ml-3" onClick={() => setStep('email')}>
              Changer d'email
            </button>
            <button type="button" className="btn-ghost -mr-3" disabled={cooldown > 0 || pending} onClick={sendCode}>
              {cooldown > 0 ? `Renvoyer (${cooldown}s)` : 'Renvoyer le code'}
            </button>
          </div>
        </form>
      )}
    </>
  )
}
