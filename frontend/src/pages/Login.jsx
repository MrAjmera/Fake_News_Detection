import { useState } from 'react'
import { useAuth } from '../lib/auth'

export default function Login() {
  const { signIn } = useAuth()
  const [id, setId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function submit(e) {
    e.preventDefault()
    if (!signIn(id, password)) {
      setError('That id or password is not correct.')
      setPassword('')
    }
  }

  return (
    <div className="login">
      <form className="card login-card" onSubmit={submit} noValidate>
        <h1>Sign in</h1>
        <p className="login-lead">
          Enter the demo id and password to open the Fake News Detector.
        </p>

        <div className="field">
          <label htmlFor="login-id">Id</label>
          <input
            id="login-id"
            type="text"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={id}
            onChange={(e) => {
              setId(e.target.value)
              setError('')
            }}
            autoFocus
          />
        </div>

        <div className="field">
          <label htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setError('')
            }}
          />
        </div>

        {error && (
          <p className="login-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={!id || !password}>
          Sign in
        </button>

        <p className="login-note">
          Demo access for a university project. This is a simple shared sign-in
          checked in your browser, not a secure account system.
        </p>
      </form>
    </div>
  )
}
