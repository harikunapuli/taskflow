import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { projectAPI, taskAPI } from '../api/axios'
import Navbar from '../components/layout/Navbar'
import toast from 'react-hot-toast'
import {
  BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import {
  Plus, Folder, LayoutGrid,
  CheckCircle, Clock, AlertCircle,
  Trash2, X
} from 'lucide-react'

const Dashboard = () => {
  const [projects,     setProjects]     = useState([])
  const [tasks,        setTasks]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [showModal,    setShowModal]    = useState(false)
  const [newProject,   setNewProject]   = useState({ title: '', description: '' })
  const [creating,     setCreating]     = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [projRes, taskRes] = await Promise.all([
        projectAPI.getAll(),
        taskAPI.getAll()
      ])
      setProjects(projRes.data.projects)
      setTasks(taskRes.data.tasks)
    } catch (err) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // ── Stats ─────────────────────────────────────────
  const stats = {
    total:       tasks.length,
    todo:        tasks.filter(t => t.status === 'todo').length,
    inProgress:  tasks.filter(t => t.status === 'in_progress').length,
    done:        tasks.filter(t => t.status === 'done').length,
  }

  const completionRate = stats.total > 0
    ? Math.round((stats.done / stats.total) * 100)
    : 0

  // ── Chart data ────────────────────────────────────
  const chartData = [
    { name: 'To Do',       value: stats.todo,       color: '#94a3b8' },
    { name: 'In Progress', value: stats.inProgress, color: '#6366f1' },
    { name: 'Done',        value: stats.done,        color: '#22c55e' },
  ]

  const priorityData = [
    { name: 'High',   value: tasks.filter(t => t.priority === 'high').length,   color: '#ef4444' },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'medium').length, color: '#f59e0b' },
    { name: 'Low',    value: tasks.filter(t => t.priority === 'low').length,    color: '#22c55e' },
  ]

  // ── Create project ────────────────────────────────
  const handleCreateProject = async (e) => {
    e.preventDefault()
    if (!newProject.title.trim()) {
      toast.error('Project title is required')
      return
    }
    setCreating(true)
    try {
      const res = await projectAPI.create(newProject)
      setProjects(prev => [...prev, res.data.project])
      setShowModal(false)
      setNewProject({ title: '', description: '' })
      toast.success('Project created! 🎉')
    } catch (err) {
      toast.error('Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  // ── Delete project ────────────────────────────────
  const handleDeleteProject = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Delete this project and all its tasks?')) return
    try {
      await projectAPI.delete(id)
      setProjects(prev => prev.filter(p => p.id !== id))
      toast.success('Project deleted')
    } catch (err) {
      toast.error('Failed to delete project')
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading your workspace...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className="page-content">

        {/* ── Header ── */}
        <div className="flex-between mb-24">
          <div>
            <h1>Dashboard</h1>
            <p className="text-muted mt-8">
              {projects.length} projects · {tasks.length} tasks
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <Plus size={16} />
            New Project
          </button>
        </div>

        {/* ── Stats row ── */}
        <div className="grid-4 mb-24">
          {[
            {
              label: 'Total Tasks',
              value: stats.total,
              icon:  <LayoutGrid size={20} />,
              color: '#6366f1',
              bg:    'rgba(99,102,241,0.1)'
            },
            {
              label: 'To Do',
              value: stats.todo,
              icon:  <Clock size={20} />,
              color: '#94a3b8',
              bg:    'rgba(148,163,184,0.1)'
            },
            {
              label: 'In Progress',
              value: stats.inProgress,
              icon:  <AlertCircle size={20} />,
              color: '#f59e0b',
              bg:    'rgba(245,158,11,0.1)'
            },
            {
              label: 'Completed',
              value: `${stats.done} (${completionRate}%)`,
              icon:  <CheckCircle size={20} />,
              color: '#22c55e',
              bg:    'rgba(34,197,94,0.1)'
            },
          ].map(s => (
            <div key={s.label} className="card" style={styles.statCard}>
              <div style={{
                ...styles.statIcon,
                background: s.bg,
                color:      s.color
              }}>
                {s.icon}
              </div>
              <div>
                <p style={styles.statLabel}>{s.label}</p>
                <h3 style={{ color: s.color }}>{s.value}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* ── Charts row ── */}
        <div className="grid-2 mb-24">

          {/* Tasks by status */}
          <div className="card">
            <h3 style={styles.chartTitle}>Tasks by Status</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a2e',
                    border:     '1px solid #2a2a3e',
                    borderRadius:'8px',
                    color:      '#f1f5f9'
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tasks by priority */}
          <div className="card">
            <h3 style={styles.chartTitle}>Tasks by Priority</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: '#1a1a2e',
                    border:     '1px solid #2a2a3e',
                    borderRadius:'8px',
                    color:      '#f1f5f9'
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {priorityData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>

        {/* ── Projects grid ── */}
        <div className="flex-between mb-16">
          <h2>Your Projects</h2>
          <span style={styles.projectCount}>
            {projects.length} projects
          </span>
        </div>

        {projects.length === 0 ? (
          <div className="empty-state">
            <Folder size={48} />
            <h3>No projects yet</h3>
            <p>Create your first project to get started</p>
            <button
              className="btn btn-primary mt-16"
              onClick={() => setShowModal(true)}
            >
              <Plus size={16} />
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid-3">
            {projects.map(p => (
              <div
                key={p.id}
                className="card"
                style={styles.projectCard}
                onClick={() => navigate(`/board/${p.id}`)}
              >
                <div className="flex-between mb-16">
                  <div style={styles.projectIcon}>
                    <Folder size={20} color="#6366f1" />
                  </div>
                  <button
                    style={styles.deleteBtn}
                    onClick={e => handleDeleteProject(e, p.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <h3 style={styles.projectTitle}>{p.title}</h3>
                <p style={styles.projectDesc}>
                  {p.description || 'No description'}
                </p>

                <div style={styles.projectFooter}>
                  <span style={styles.taskCount}>
                    {p.task_count} tasks
                  </span>
                  <span style={styles.viewBoard}>
                    Open board →
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ── Create Project Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>

            <div className="flex-between mb-24">
              <h2>New Project</h2>
              <button
                style={styles.modalClose}
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label>Project title *</label>
                <input
                  type="text"
                  placeholder="e.g. TaskFlow Backend"
                  value={newProject.title}
                  onChange={e => setNewProject(p => ({
                    ...p, title: e.target.value
                  }))}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="What is this project about?"
                  value={newProject.description}
                  onChange={e => setNewProject(p => ({
                    ...p, description: e.target.value
                  }))}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div className="flex gap-8 mt-16">
                <button
                  type="button"
                  className="btn btn-secondary w-full"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  )
}

const styles = {
  statCard: {
    display:    'flex',
    alignItems: 'center',
    gap:        '16px',
  },
  statIcon: {
    width:          '48px',
    height:         '48px',
    borderRadius:   '12px',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    flexShrink:     0,
  },
  statLabel: {
    fontSize:     '13px',
    color:        '#64748b',
    marginBottom: '4px',
  },
  chartTitle: {
    marginBottom: '16px',
    color:        '#f1f5f9',
  },
  projectCard: {
    cursor:     'pointer',
    transition: 'transform 0.2s, border-color 0.2s',
  },
  projectIcon: {
    width:          '40px',
    height:         '40px',
    borderRadius:   '10px',
    background:     'rgba(99,102,241,0.1)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    background:   'transparent',
    border:       'none',
    color:        '#64748b',
    cursor:       'pointer',
    padding:      '4px',
    borderRadius: '6px',
    transition:   'color 0.2s',
  },
  projectTitle: {
    marginBottom: '8px',
    color:        '#f1f5f9',
  },
  projectDesc: {
    fontSize:     '13px',
    color:        '#64748b',
    marginBottom: '16px',
    overflow:     'hidden',
    display:      '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  projectFooter: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
    paddingTop:     '12px',
    borderTop:      '1px solid #2a2a3e',
  },
  taskCount: {
    fontSize: '12px',
    color:    '#64748b',
  },
  viewBoard: {
    fontSize:  '12px',
    color:     '#6366f1',
    fontWeight:'500',
  },
  projectCount: {
    fontSize:     '13px',
    color:        '#64748b',
    background:   '#1a1a2e',
    padding:      '4px 12px',
    borderRadius: '20px',
    border:       '1px solid #2a2a3e',
  },
  modalClose: {
    background:   'transparent',
    border:       'none',
    color:        '#64748b',
    cursor:       'pointer',
    padding:      '4px',
    borderRadius: '6px',
  },
}

export default Dashboard