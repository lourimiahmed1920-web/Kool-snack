import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { haptic } from '../lib/native'

export function StaffLoginForm() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error: signInError } = await signIn(email, password)
    if (signInError) {
      haptic('error')
      setError(signInError)
    }
    setSubmitting(false)
  }

  return (
    <form className="staff-auth__form" onSubmit={handleSubmit}>
      <label className="field">
        E-Mail
        <input
          type="email"
          required
          autoComplete="username"
          inputMode="email"
          autoCapitalize="none"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className="field">
        Passwort
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      {error && <p className="screen-state screen-state--error">{error}</p>}

      <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
        {submitting ? 'Anmelden…' : 'Anmelden'}
      </button>
    </form>
  )
}
