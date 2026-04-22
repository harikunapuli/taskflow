import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { UserPlus, Mail, Lock, User, Layers } from 'lucide-react'

const Register = () => {
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)

  const { register } = useAuth()
  const navigate     = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!name || !email || !password || !confirm) {
      toast.error('Please fill in all fields')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await register(name, email, password)
      toast.success('Account created! Please sign in 🎉')
      navigate('/login')
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>

      {/* Left panel — branding */}
      <div style={styles.leftPanel}>
        <div style={styles.brandContent}>
          <div style={styles.logo}>
            <Layers size={40} color="#6366f1" />
          </div>
          <h1 style={styles.brandTitle}>TaskFlow</h1>
          <p style={styles.brandSubtitle}>
            Join thousands of teams managing their work smarter with TaskFlow.
          </p>
          <div style={styles.statsRow}>
            {[
              { value: '10K+', label: 'Projects' },
              { value: '50K+', label: 'Tasks' },
              { value: '99.9%', label: 'Uptime' },
            ].map(s => (
              <div key={s.label} style={styles.statItem}>
                <span style={styles.statValue}>{s.value}</span>
                <span style={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — register form */}
      <div style={styles.rightPanel}>
        <div style={styles.formCard}>

          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Create account</h2>
            <p style={styles.formSubtitle}>Start managing your projects today</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>

            <div className="form-group">
              <label>Full name</label>
              <div style={styles.inputWrapper}>
                <User size={16} style={styles.inputIcon} />
                <input
                  type="text"
                  placeholder="Hari Sharma"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email address</label>
              <div style={styles.inputWrapper}>
                <Mail size={16} style={styles.inputIcon} />
                <input
                  type="email"
                  placeholder="hari@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div style={styles.inputWrapper}>
                <Lock size={16} style={styles.inputIcon} />
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Confirm password</label>
              <div style={styles.inputWrapper}>
                <Lock size={16} style={styles.inputIcon} />
                <input
                  type="password"
                  placeholder="Repeat your password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            {/* Password match indicator */}
            {confirm && (
              <p style={{
                fontSize: '12px',
                color: password === confirm ? '#4ade80' : '#f87171',
                marginTop: '-8px',
                marginBottom: '8px'
              }}>
                {password === confirm ? '✓ Passwords match' : '✗ Passwords do not match'}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
              style={styles.submitBtn}
            >
              {loading ? (
                <>
                  <div style={styles.btnSpinner} />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  Create account
                </>
              )}
            </button>

          </form>

          <p style={styles.switchText}>
            Already have an account?{' '}
            <Link to="/login" style={styles.link}>
              Sign in
            </Link>
          </p>

        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display:   'flex',
    minHeight: '100vh',
  },
  leftPanel: {
    flex:           1,
    background:     'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        '60px',
  },
  brandContent: {
    maxWidth: '400px',
  },
  logo: {
    width:          '72px',
    height:         '72px',
    background:     'rgba(99,102,241,0.15)',
    borderRadius:   '20px',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   '24px',
    border:         '1px solid rgba(99,102,241,0.3)',
  },
  brandTitle: {
    fontSize:     '2.5rem',
    fontWeight:   '700',
    color:        '#f1f5f9',
    marginBottom: '16px',
  },
  brandSubtitle: {
    fontSize:     '16px',
    color:        '#94a3b8',
    lineHeight:   '1.7',
    marginBottom: '40px',
  },
  statsRow: {
    display: 'flex',
    gap:     '32px',
  },
  statItem: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '4px',
  },
  statValue: {
    fontSize:   '1.75rem',
    fontWeight: '700',
    color:      '#6366f1',
  },
  statLabel: {
    fontSize: '13px',
    color:    '#94a3b8',
  },
  rightPanel: {
    flex:           1,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    padding:        '60px',
    background:     '#0f0f17',
  },
  formCard: {
    width:    '100%',
    maxWidth: '420px',
  },
  formHeader: {
    marginBottom: '32px',
  },
  formTitle: {
    fontSize:     '1.75rem',
    fontWeight:   '700',
    color:        '#f1f5f9',
    marginBottom: '8px',
  },
  formSubtitle: {
    color:    '#94a3b8',
    fontSize: '15px',
  },
  form: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '4px',
  },
  inputWrapper: {
    position: 'relative',
  },
  inputIcon: {
    position:  'absolute',
    left:      '14px',
    top:       '50%',
    transform: 'translateY(-50%)',
    color:     '#64748b',
    zIndex:    1,
  },
  input: {
    paddingLeft: '42px',
  },
  submitBtn: {
    marginTop:      '8px',
    padding:        '13px',
    fontSize:       '15px',
    justifyContent: 'center',
  },
  btnSpinner: {
    width:        '16px',
    height:       '16px',
    border:       '2px solid rgba(255,255,255,0.3)',
    borderTop:    '2px solid white',
    borderRadius: '50%',
    animation:    'spin 0.8s linear infinite',
  },
  switchText: {
    textAlign:  'center',
    marginTop:  '24px',
    fontSize:   '14px',
    color:      '#64748b',
  },
  link: {
    color:          '#6366f1',
    textDecoration: 'none',
    fontWeight:     '500',
  }
}

export default Register