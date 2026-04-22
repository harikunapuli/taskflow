import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { taskAPI, projectAPI } from '../api/axios'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import Navbar from '../components/layout/Navbar'
import toast from 'react-hot-toast'
import {
  ArrowLeft, Plus, X, Flag,
  Calendar, User, MessageSquare,
  Trash2, MoreHorizontal
} from 'lucide-react'

// ── Column config ─────────────────────────────────
const COLUMNS = [
  { id: 'todo',        label: 'To Do',       color: '#94a3b8', bg: 'rgba(148,163,184,0.08)' },
  { id: 'in_progress', label: 'In Progress', color: '#6366f1', bg: 'rgba(99,102,241,0.08)'  },
  { id: 'done',        label: 'Done',        color: '#22c55e', bg: 'rgba(34,197,94,0.08)'   },
]

const PRIORITIES = ['low', 'medium', 'high']

const PRIORITY_COLORS = {
  high:   '#ef4444',
  medium: '#f59e0b',
  low:    '#22c55e',
}

const KanbanBoard = () => {
  const { projectId } = useParams()
  const navigate      = useNavigate()

  const [project,     setProject]     = useState(null)
  const [tasks,       setTasks]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [showModal,   setShowModal]   = useState(false)
  const [showDetail,  setShowDetail]  = useState(null)
  const [creating,    setCreating]    = useState(false)
  const [newTask,     setNewTask]     = useState({
    title:       '',
    description: '',
    priority:    'medium',
    due_date:    '',
  })

  useEffect(() => {
    fetchData()
  }, [projectId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [projRes, taskRes] = await Promise.all([
        projectAPI.getOne(projectId),
        taskAPI.getAll({ project_id: projectId })
      ])
      setProject(projRes.data.project)
      setTasks(taskRes.data.tasks)
    } catch (err) {
      toast.error('Failed to load board')
    } finally {
      setLoading(false)
    }
  }

  // ── Group tasks by status ─────────────────────────
  const getColumnTasks = (status) =>
    tasks.filter(t => t.status === status)

  // ── Drag and drop handler ─────────────────────────
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result

    // Dropped outside a column
    if (!destination) return

    // Dropped in same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index       === source.index
    ) return

    const newStatus  = destination.droppableId
    const taskId     = parseInt(draggableId)

    // Optimistic update — update UI immediately
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, status: newStatus } : t
    ))

    // Then update in backend
    try {
      await taskAPI.update(taskId, { status: newStatus })
      toast.success(`Moved to ${COLUMNS.find(c => c.id === newStatus)?.label}`)
    } catch (err) {
      // Revert on failure
      toast.error('Failed to update task')
      fetchData()
    }
  }

  // ── Create task ───────────────────────────────────
  const handleCreateTask = async (e) => {
    e.preventDefault()
    if (!newTask.title.trim()) {
      toast.error('Task title is required')
      return
    }
    setCreating(true)
    try {
      const res = await taskAPI.create({
        ...newTask,
        project_id: parseInt(projectId),
        status:     'todo'
      })
      setTasks(prev => [...prev, res.data.task])
      setShowModal(false)
      setNewTask({ title: '', description: '', priority: 'medium', due_date: '' })
      toast.success('Task created! ✅')
    } catch (err) {
      toast.error('Failed to create task')
    } finally {
      setCreating(false)
    }
  }

  // ── Delete task ───────────────────────────────────
  const handleDeleteTask = async (e, taskId) => {
    e.stopPropagation()
    if (!window.confirm('Delete this task?')) return
    try {
      await taskAPI.delete(taskId)
      setTasks(prev => prev.filter(t => t.id !== taskId))
      setShowDetail(null)
      toast.success('Task deleted')
    } catch (err) {
      toast.error('Failed to delete task')
    }
  }

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="loading-container">
          <div className="spinner" />
          <p>Loading board...</p>
        </div>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div style={styles.page}>

        {/* ── Board header ── */}
        <div style={styles.header}>
          <div className="flex gap-12" style={{ alignItems: 'center' }}>
            <button
              style={styles.backBtn}
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <h2 style={styles.projectName}>{project?.title}</h2>
              <p style={styles.taskCount}>{tasks.length} tasks</p>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            <Plus size={16} />
            Add Task
          </button>
        </div>

        {/* ── Column stats ── */}
        <div style={styles.columnStats}>
          {COLUMNS.map(col => (
            <div key={col.id} style={styles.colStat}>
              <span style={{ ...styles.colDot, background: col.color }} />
              <span style={styles.colStatLabel}>{col.label}</span>
              <span style={styles.colStatCount}>
                {getColumnTasks(col.id).length}
              </span>
            </div>
          ))}
        </div>

        {/* ── Kanban Board ── */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div style={styles.board}>
            {COLUMNS.map(col => (
              <div key={col.id} style={styles.column}>

                {/* Column header */}
                <div style={styles.colHeader}>
                  <div className="flex gap-8" style={{ alignItems: 'center' }}>
                    <span style={{
                      ...styles.colIndicator,
                      background: col.color
                    }} />
                    <span style={{ ...styles.colTitle, color: col.color }}>
                      {col.label}
                    </span>
                    <span style={styles.colCount}>
                      {getColumnTasks(col.id).length}
                    </span>
                  </div>
                  {col.id === 'todo' && (
                    <button
                      style={styles.addTaskBtn}
                      onClick={() => setShowModal(true)}
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>

                {/* Droppable area */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        ...styles.taskList,
                        background: snapshot.isDraggingOver
                          ? col.bg
                          : 'transparent',
                      }}
                    >
                      {getColumnTasks(col.id).length === 0 && (
                        <div style={styles.emptyCol}>
                          Drop tasks here
                        </div>
                      )}

                      {getColumnTasks(col.id).map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={String(task.id)}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              style={{
                                ...styles.taskCard,
                                ...provided.draggableProps.style,
                                boxShadow: snapshot.isDragging
                                  ? '0 8px 24px rgba(0,0,0,0.5)'
                                  : styles.taskCard.boxShadow,
                                transform: snapshot.isDragging
                                  ? `${provided.draggableProps.style?.transform} rotate(2deg)`
                                  : provided.draggableProps.style?.transform,
                              }}
                              onClick={() => setShowDetail(task)}
                            >
                              {/* Priority bar */}
                              <div style={{
                                ...styles.priorityBar,
                                background: PRIORITY_COLORS[task.priority]
                              }} />

                              {/* Card content */}
                              <div style={styles.cardContent}>
                                <div className="flex-between">
                                  <span className={`badge badge-${task.priority}`}>
                                    {task.priority}
                                  </span>
                                  <button
                                    style={styles.cardMenuBtn}
                                    onClick={e => handleDeleteTask(e, task.id)}
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>

                                <p style={styles.taskTitle}>{task.title}</p>

                                {task.description && (
                                  <p style={styles.taskDesc}>
                                    {task.description.length > 60
                                      ? task.description.slice(0, 60) + '...'
                                      : task.description
                                    }
                                  </p>
                                )}

                                <div style={styles.cardFooter}>
                                  {task.due_date && (
                                    <div style={{
                                      ...styles.dueDateBadge,
                                      color: new Date(task.due_date) < new Date()
                                        ? '#f87171'
                                        : '#64748b'
                                    }}>
                                      <Calendar size={11} />
                                      {task.due_date}
                                    </div>
                                  )}
                                  <div style={styles.cardIcons}>
                                    <MessageSquare size={12} color="#64748b" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* ── Create Task Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="flex-between mb-24">
              <h2>New Task</h2>
              <button
                style={styles.modalClose}
                onClick={() => setShowModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTask}>
              <div className="form-group">
                <label>Task title *</label>
                <input
                  type="text"
                  placeholder="e.g. Build login API"
                  value={newTask.title}
                  onChange={e => setNewTask(p => ({
                    ...p, title: e.target.value
                  }))}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Task details..."
                  value={newTask.description}
                  onChange={e => setNewTask(p => ({
                    ...p, description: e.target.value
                  }))}
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={e => setNewTask(p => ({
                      ...p, priority: e.target.value
                    }))}
                  >
                    {PRIORITIES.map(p => (
                      <option key={p} value={p}>
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Due date</label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={e => setNewTask(p => ({
                      ...p, due_date: e.target.value
                    }))}
                  />
                </div>
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
                  {creating ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Task Detail Modal ── */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div
            className="modal"
            style={{ maxWidth: '560px' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex-between mb-16">
              <span className={`badge badge-${showDetail.priority}`}>
                <Flag size={10} style={{ marginRight: '4px' }} />
                {showDetail.priority} priority
              </span>
              <div className="flex gap-8">
                <button
                  style={styles.modalClose}
                  onClick={e => handleDeleteTask(e, showDetail.id)}
                >
                  <Trash2 size={16} color="#ef4444" />
                </button>
                <button
                  style={styles.modalClose}
                  onClick={() => setShowDetail(null)}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <h2 style={{ marginBottom: '12px' }}>{showDetail.title}</h2>

            {showDetail.description && (
              <p style={{ color: '#94a3b8', marginBottom: '20px', lineHeight: '1.7' }}>
                {showDetail.description}
              </p>
            )}

            <div style={styles.detailMeta}>
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>Status</span>
                <span className={`badge badge-${showDetail.status}`}>
                  {showDetail.status.replace('_', ' ')}
                </span>
              </div>
              {showDetail.due_date && (
                <div style={styles.metaItem}>
                  <span style={styles.metaLabel}>Due date</span>
                  <span style={{
                    color: new Date(showDetail.due_date) < new Date()
                      ? '#f87171' : '#94a3b8',
                    fontSize: '14px'
                  }}>
                    {showDetail.due_date}
                  </span>
                </div>
              )}
              <div style={styles.metaItem}>
                <span style={styles.metaLabel}>Created</span>
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>
                  {showDetail.created_at}
                </span>
              </div>
            </div>

            {/* Move task buttons */}
            <div style={styles.moveSection}>
              <p style={styles.metaLabel}>Move to</p>
              <div className="flex gap-8 mt-8">
                {COLUMNS.filter(c => c.id !== showDetail.status).map(col => (
                  <button
                    key={col.id}
                    className="btn btn-secondary btn-sm"
                    style={{ color: col.color, borderColor: col.color }}
                    onClick={async () => {
                      try {
                        await taskAPI.update(showDetail.id, { status: col.id })
                        setTasks(prev => prev.map(t =>
                          t.id === showDetail.id
                            ? { ...t, status: col.id }
                            : t
                        ))
                        setShowDetail(prev => ({ ...prev, status: col.id }))
                        toast.success(`Moved to ${col.label}`)
                      } catch {
                        toast.error('Failed to move task')
                      }
                    }}
                  >
                    {col.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    padding:   '24px',
  },
  header: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   '20px',
  },
  backBtn: {
    width:          '36px',
    height:         '36px',
    borderRadius:   '10px',
    background:     '#1a1a2e',
    border:         '1px solid #2a2a3e',
    color:          '#94a3b8',
    cursor:         'pointer',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
  },
  projectName: {
    color:  '#f1f5f9',
    margin: 0,
  },
  taskCount: {
    fontSize: '13px',
    color:    '#64748b',
    margin:   '2px 0 0 0',
  },
  columnStats: {
    display:      'flex',
    gap:          '24px',
    marginBottom: '20px',
    padding:      '12px 16px',
    background:   '#1a1a2e',
    borderRadius: '10px',
    border:       '1px solid #2a2a3e',
    width:        'fit-content',
  },
  colStat: {
    display:    'flex',
    alignItems: 'center',
    gap:        '8px',
  },
  colDot: {
    width:        '8px',
    height:       '8px',
    borderRadius: '50%',
  },
  colStatLabel: {
    fontSize: '13px',
    color:    '#94a3b8',
  },
  colStatCount: {
    fontSize:   '13px',
    fontWeight: '600',
    color:      '#f1f5f9',
  },
  board: {
    display:   'flex',
    gap:       '16px',
    overflowX: 'auto',
    paddingBottom: '24px',
    minHeight: 'calc(100vh - 240px)',
  },
  column: {
    flex:         '0 0 320px',
    background:   '#1a1a2e',
    borderRadius: '14px',
    border:       '1px solid #2a2a3e',
    display:      'flex',
    flexDirection:'column',
    maxHeight:    'calc(100vh - 240px)',
  },
  colHeader: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        '16px',
    borderBottom:   '1px solid #2a2a3e',
  },
  colIndicator: {
    width:        '10px',
    height:       '10px',
    borderRadius: '50%',
  },
  colTitle: {
    fontSize:   '14px',
    fontWeight: '600',
  },
  colCount: {
    fontSize:     '12px',
    background:   '#2a2a3e',
    color:        '#94a3b8',
    padding:      '2px 8px',
    borderRadius: '20px',
    marginLeft:   '4px',
  },
  addTaskBtn: {
    width:          '26px',
    height:         '26px',
    borderRadius:   '6px',
    background:     'transparent',
    border:         '1px solid #2a2a3e',
    color:          '#64748b',
    cursor:         'pointer',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
  },
  taskList: {
    flex:      1,
    padding:   '12px',
    overflowY: 'auto',
    display:   'flex',
    flexDirection: 'column',
    gap:       '10px',
    transition:'background 0.2s',
    borderRadius: '0 0 14px 14px',
    minHeight: '100px',
  },
  emptyCol: {
    textAlign:    'center',
    padding:      '32px 16px',
    color:        '#2a2a3e',
    fontSize:     '13px',
    border:       '2px dashed #2a2a3e',
    borderRadius: '10px',
  },
  taskCard: {
    background:    '#16213e',
    border:        '1px solid #2a2a3e',
    borderRadius:  '10px',
    cursor:        'grab',
    overflow:      'hidden',
    transition:    'border-color 0.2s',
    boxShadow:     '0 2px 8px rgba(0,0,0,0.2)',
    userSelect:    'none',
  },
  priorityBar: {
    height: '3px',
    width:  '100%',
  },
  cardContent: {
    padding: '12px',
  },
  cardMenuBtn: {
    background: 'transparent',
    border:     'none',
    color:      '#64748b',
    cursor:     'pointer',
    padding:    '2px',
    opacity:    0.6,
  },
  taskTitle: {
    fontSize:   '14px',
    fontWeight: '500',
    color:      '#f1f5f9',
    margin:     '10px 0 6px',
    lineHeight: '1.4',
  },
  taskDesc: {
    fontSize:     '12px',
    color:        '#64748b',
    marginBottom: '10px',
    lineHeight:   '1.5',
  },
  cardFooter: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginTop:      '8px',
  },
  dueDateBadge: {
    display:    'flex',
    alignItems: 'center',
    gap:        '4px',
    fontSize:   '11px',
  },
  cardIcons: {
    display:    'flex',
    alignItems: 'center',
    gap:        '6px',
  },
  detailMeta: {
    display:      'flex',
    flexDirection:'column',
    gap:          '12px',
    padding:      '16px',
    background:   '#1a1a2e',
    borderRadius: '10px',
    marginBottom: '16px',
  },
  metaItem: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize:   '12px',
    color:      '#64748b',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  moveSection: {
    marginTop: '16px',
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

export default KanbanBoard