import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { notifAPI } from '../../api/axios'
import toast from 'react-hot-toast'
import {
  Layers, LayoutDashboard, Bell,
  LogOut, User, ChevronDown, X
} from 'lucide-react'

const Navbar = () => {
  const { user, logout }           = useAuth()
  const navigate                   = useNavigate()
  const location                   = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)
  const [showNotifs,  setShowNotifs]  = useState(false)
  const [showUser,    setShowUser]    = useState(false)
  const [notifs,      setNotifs]      = useState([])

  // ── Fetch unread count every 30 seconds ──────────
  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const res = await notifAPI.unreadCount()
      setUnreadCount(res.data.unread_count)
    } catch (err) {
      // silently fail
    }
  }

  const fetchNotifications = async () => {
    try {
      const res = await notifAPI.getAll()
      setNotifs(res.data.notifications)
    } catch (err) {
      // silently fail
    }
  }

  const handleNotifClick = () => {
    setShowNotifs(!showNotifs)
    setShowUser(false)
    if (!showNotifs) fetchNotifications()
  }

  const handleMarkRead = async (id) => {
    try {
      await notifAPI.markRead(id)
      setNotifs(prev => prev.map(n =>
        n.id === id ? { ...n, is_read: true } : n
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      toast.error('Failed to mark as read')
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <>
      <nav style={styles.nav}>
        <div style={styles.navInner}>

          {/* Logo */}
          <div
            style={styles.logo}
            onClick={() => navigate('/dashboard')}
          >
            <Layers size={24} color="#6366f1" />
            <span style={styles.logoText}>TaskFlow</span>
          </div>

          {/* Nav links */}
          <div style={styles.navLinks}>
            <button
              style={{
                ...styles.navLink,
                ...(isActive('/dashboard') ? styles.navLinkActive : {})
              }}
              onClick={() => navigate('/dashboard')}
            >
              <LayoutDashboard size={16} />
              Dashboard
            </button>
          </div>

          {/* Right side */}
          <div style={styles.rightSide}>

            {/* Notifications bell */}
            <div style={styles.iconWrapper}>
              <button
                style={styles.iconBtn}
                onClick={handleNotifClick}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span style={styles.badge}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications dropdown */}
              {showNotifs && (
                <div style={styles.dropdown}>
                  <div style={styles.dropdownHeader}>
                    <span style={styles.dropdownTitle}>Notifications</span>
                    <button
                      style={styles.closeBtn}
                      onClick={() => setShowNotifs(false)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div style={styles.notifList}>
                    {notifs.length === 0 ? (
                      <div style={styles.emptyNotif}>
                        No notifications yet
                      </div>
                    ) : (
                      notifs.slice(0, 8).map(n => (
                        <div
                          key={n.id}
                          style={{
                            ...styles.notifItem,
                            background: n.is_read
                              ? 'transparent'
                              : 'rgba(99,102,241,0.08)'
                          }}
                          onClick={() => !n.is_read && handleMarkRead(n.id)}
                        >
                          <div style={styles.notifDot(n.is_read)} />
                          <div>
                            <p style={styles.notifMsg}>{n.message}</p>
                            <p style={styles.notifTime}>{n.created_at}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div style={styles.iconWrapper}>
              <button
                style={styles.userBtn}
                onClick={() => {
                  setShowUser(!showUser)
                  setShowNotifs(false)
                }}
              >
                <div style={styles.avatar}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span style={styles.userName}>
                  {user?.name?.split(' ')[0]}
                </span>
                <ChevronDown size={14} color="#64748b" />
              </button>

              {/* User dropdown */}
              {showUser && (
                <div style={{...styles.dropdown, right: 0, width: '200px'}}>
                  <div style={styles.userInfo}>
                    <div style={styles.avatarLg}>
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p style={styles.userFullName}>{user?.name}</p>
                      <p style={styles.userEmail}>{user?.email}</p>
                    </div>
                  </div>
                  <hr style={styles.divider} />
                  <button
                    style={styles.menuItem}
                    onClick={handleLogout}
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* Click outside to close dropdowns */}
      {(showNotifs || showUser) && (
        <div
          style={styles.overlay}
          onClick={() => {
            setShowNotifs(false)
            setShowUser(false)
          }}
        />
      )}
    </>
  )
}

const styles = {
  nav: {
    background:   '#0d0d1a',
    borderBottom: '1px solid #2a2a3e',
    position:     'sticky',
    top:          0,
    zIndex:       100,
  },
  navInner: {
    maxWidth:      '1400px',
    margin:        '0 auto',
    padding:       '0 24px',
    height:        '60px',
    display:       'flex',
    alignItems:    'center',
    justifyContent:'space-between',
  },
  logo: {
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
    cursor:     'pointer',
  },
  logoText: {
    fontSize:   '18px',
    fontWeight: '700',
    color:      '#f1f5f9',
  },
  navLinks: {
    display: 'flex',
    gap:     '4px',
  },
  navLink: {
    display:       'flex',
    alignItems:    'center',
    gap:           '6px',
    padding:       '6px 14px',
    borderRadius:  '8px',
    fontSize:      '14px',
    color:         '#94a3b8',
    background:    'transparent',
    border:        'none',
    cursor:        'pointer',
    transition:    'all 0.2s',
    fontFamily:    'Inter, sans-serif',
  },
  navLinkActive: {
    background: 'rgba(99,102,241,0.15)',
    color:      '#818cf8',
  },
  rightSide: {
    display:    'flex',
    alignItems: 'center',
    gap:        '8px',
  },
  iconWrapper: {
    position: 'relative',
  },
  iconBtn: {
    position:       'relative',
    width:          '38px',
    height:         '38px',
    borderRadius:   '10px',
    background:     'transparent',
    border:         '1px solid #2a2a3e',
    color:          '#94a3b8',
    cursor:         'pointer',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    transition:     'all 0.2s',
  },
  badge: {
    position:       'absolute',
    top:            '-4px',
    right:          '-4px',
    background:     '#6366f1',
    color:          'white',
    fontSize:       '10px',
    fontWeight:     '600',
    width:          '18px',
    height:         '18px',
    borderRadius:   '50%',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
  },
  dropdown: {
    position:     'absolute',
    top:          '44px',
    right:        '-8px',
    background:   '#1a1a2e',
    border:       '1px solid #2a2a3e',
    borderRadius: '12px',
    boxShadow:    '0 8px 32px rgba(0,0,0,0.4)',
    zIndex:       200,
    minWidth:     '300px',
    overflow:     'hidden',
  },
  dropdownHeader: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '14px 16px',
    borderBottom:   '1px solid #2a2a3e',
  },
  dropdownTitle: {
    fontSize:   '14px',
    fontWeight: '600',
    color:      '#f1f5f9',
  },
  closeBtn: {
    background: 'transparent',
    border:     'none',
    color:      '#64748b',
    cursor:     'pointer',
    padding:    '2px',
  },
  notifList: {
    maxHeight: '320px',
    overflowY: 'auto',
  },
  emptyNotif: {
    padding:   '32px',
    textAlign: 'center',
    color:     '#64748b',
    fontSize:  '14px',
  },
  notifItem: {
    display:   'flex',
    gap:       '12px',
    padding:   '12px 16px',
    cursor:    'pointer',
    transition:'background 0.2s',
    alignItems:'flex-start',
  },
  notifDot: (isRead) => ({
    width:        '8px',
    height:       '8px',
    borderRadius: '50%',
    background:   isRead ? '#2a2a3e' : '#6366f1',
    flexShrink:   0,
    marginTop:    '4px',
  }),
  notifMsg: {
    fontSize:  '13px',
    color:     '#cbd5e1',
    margin:    0,
  },
  notifTime: {
    fontSize:  '11px',
    color:     '#64748b',
    margin:    '2px 0 0 0',
  },
  userBtn: {
    display:      'flex',
    alignItems:   'center',
    gap:          '8px',
    padding:      '6px 10px',
    borderRadius: '10px',
    background:   'transparent',
    border:       '1px solid #2a2a3e',
    cursor:       'pointer',
    transition:   'all 0.2s',
  },
  avatar: {
    width:          '28px',
    height:         '28px',
    borderRadius:   '8px',
    background:     'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color:          'white',
    fontSize:       '13px',
    fontWeight:     '700',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize:  '14px',
    color:     '#f1f5f9',
    fontWeight:'500',
  },
  userInfo: {
    display:    'flex',
    alignItems: 'center',
    gap:        '12px',
    padding:    '14px 16px',
  },
  avatarLg: {
    width:          '40px',
    height:         '40px',
    borderRadius:   '10px',
    background:     'linear-gradient(135deg, #6366f1, #8b5cf6)',
    color:          'white',
    fontSize:       '16px',
    fontWeight:     '700',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  userFullName: {
    fontSize:   '14px',
    fontWeight: '600',
    color:      '#f1f5f9',
    margin:     0,
  },
  userEmail: {
    fontSize: '12px',
    color:    '#64748b',
    margin:   '2px 0 0 0',
  },
  divider: {
    border:     'none',
    borderTop:  '1px solid #2a2a3e',
    margin:     0,
  },
  menuItem: {
    display:    'flex',
    alignItems: 'center',
    gap:        '10px',
    width:      '100%',
    padding:    '12px 16px',
    background: 'transparent',
    border:     'none',
    color:      '#f87171',
    fontSize:   '14px',
    cursor:     'pointer',
    fontFamily: 'Inter, sans-serif',
    transition: 'background 0.2s',
  },
  overlay: {
    position: 'fixed',
    inset:    0,
    zIndex:   99,
  },
}

export default Navbar