import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { LogIn, Mail, Lock, Layers } from 'lucide-react'

const Login = () => {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)

  const { login }    = useAuth()
  const navigate     = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Basic validation
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back! 👋')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed'
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
            Manage your projects and tasks with a beautiful Kanban board
          </p>
          <div style={styles.features}>
            {['Kanban Board', 'Team Collaboration', 'Real-time Updates', 'Microservices Architecture'].map(f => (
              <div key={f} style={styles.featureItem}>
                <span style={styles.featureDot}>✦</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div style={styles.rightPanel}>
        <div style={styles.formCard}>

          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>Welcome back</h2>
            <p style={styles.formSubtitle}>Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>

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
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
              style={styles.submitBtn}
            >
              {loading ? (
                <>
                  <div style={styles.btnSpinner} />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  Sign in
                </>
              )}
            </button>

          </form>

          <p style={styles.switchText}>
            Don't have an account?{' '}
            <Link to="/register" style={styles.link}>
              Create one
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
    flex:            1,
    background:      'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         '60px',
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
  features: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '16px',
  },
  featureItem: {
    display:    'flex',
    alignItems: 'center',
    gap:        '12px',
    color:      '#cbd5e1',
    fontSize:   '15px',
  },
  featureDot: {
    color:    '#6366f1',
    fontSize: '12px',
  },
  rightPanel: {
    flex:            1,
    display:         'flex',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         '60px',
    background:      '#0f0f17',
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
    marginTop:       '8px',
    padding:         '13px',
    fontSize:        '15px',
    justifyContent:  'center',
  },
  btnSpinner: {
    width:       '16px',
    height:      '16px',
    border:      '2px solid rgba(255,255,255,0.3)',
    borderTop:   '2px solid white',
    borderRadius:'50%',
    animation:   'spin 0.8s linear infinite',
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

export default Login