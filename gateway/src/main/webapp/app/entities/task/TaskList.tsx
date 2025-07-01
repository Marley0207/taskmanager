import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faPlus,
  faEdit,
  faTrash,
  faEye,
  faUser,
  faUsers,
  faCalendar,
  faFlag,
  faCheckCircle,
  faClock,
  faExclamationTriangle,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { getTasksByProject, deleteTask, getAssignedUsers } from './task.api';
import { ITask, TaskPriority, TaskStatus } from './task.model';
import './task-list.scss';

const TaskList = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const searchParams = new URLSearchParams(window.location.search);
  const projectIdFromQuery = searchParams.get('projectId');
  const finalProjectId = projectId || projectIdFromQuery;
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [assignedCount, setAssignedCount] = useState<{ [taskId: number]: number }>({});

  useEffect(() => {
    if (finalProjectId) {
      loadTasks();
    } else {
      setLoading(false);
    }
  }, [finalProjectId]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await getTasksByProject(parseInt(finalProjectId, 10));
      setTasks(response.data);

      // Cargar el conteo real de miembros asignados para cada tarea
      const counts: { [taskId: number]: number } = {};
      for (const task of response.data) {
        try {
          const assignedRes = await getAssignedUsers(task.id);
          counts[task.id] = assignedRes.data.length;
        } catch (err) {
          // Si falla, usar los datos que vienen en la tarea o 0
          counts[task.id] = task.assignedMembers?.length || 0;
        }
      }
      setAssignedCount(counts);
    } catch (err) {
      setError('Error al cargar las tareas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (taskId: number) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta tarea?')) return;

    try {
      await deleteTask(taskId);
      setMessage({ type: 'success', text: 'Tarea eliminada exitosamente' });
      loadTasks(); // Recargar la lista
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al eliminar la tarea' });
    }
  };

  const getPriorityIcon = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH:
        return <FontAwesomeIcon icon={faExclamationTriangle} className="priority-high" />;
      case TaskPriority.NORMAL:
        return <FontAwesomeIcon icon={faFlag} className="priority-normal" />;
      case TaskPriority.LOW:
        return <FontAwesomeIcon icon={faFlag} className="priority-low" />;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.DONE:
        return <FontAwesomeIcon icon={faCheckCircle} className="status-done" />;
      case TaskStatus.WORKING_ON_IT:
        return <FontAwesomeIcon icon={faClock} className="status-working" />;
      case TaskStatus.NOT_STARTED:
        return <FontAwesomeIcon icon={faClock} className="status-not-started" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.DONE:
        return 'Completada';
      case TaskStatus.WORKING_ON_IT:
        return 'En Progreso';
      case TaskStatus.NOT_STARTED:
        return 'No Iniciada';
      default:
        return status;
    }
  };

  const getPriorityText = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH:
        return 'Alta';
      case TaskPriority.NORMAL:
        return 'Normal';
      case TaskPriority.LOW:
        return 'Baja';
      default:
        return priority;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) return <div className="loading">Cargando tareas...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!finalProjectId) return <div className="error">No se proporcionó ID de proyecto</div>;

  return (
    <div className="task-list-container">
      {message && (
        <div className={`message ${message.type}`}>
          <FontAwesomeIcon icon={message.type === 'success' ? faCheck : faExclamationTriangle} />
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="close-message">
            ×
          </button>
        </div>
      )}

      <div className="task-list-header">
        <div className="task-list-title">
          <Link to="/projects" className="btn btn-secondary btn-sm">
            <FontAwesomeIcon icon={faArrowLeft} /> Volver a Proyectos
          </Link>
          <h1>Tareas del Proyecto</h1>
        </div>
        <div className="task-list-actions">
          <Link to={`/tasks/create?projectId=${finalProjectId}`} className="btn btn-primary">
            <FontAwesomeIcon icon={faPlus} /> Nueva Tarea
          </Link>
        </div>
      </div>

      <div className="task-list-content">
        {tasks.length > 0 ? (
          <div className="tasks-grid">
            {tasks.map(task => (
              <div key={task.id} className="task-card">
                <div className="task-header">
                  <div className="task-title">
                    <h3>{task.title}</h3>
                  </div>
                  <div className="task-actions">
                    <Link to={`/tasks/${task.id}/details`} className="btn btn-sm btn-info" title="Ver detalles">
                      <FontAwesomeIcon icon={faEye} />
                    </Link>
                    <Link to={`/tasks/${task.id}/edit`} className="btn btn-sm btn-warning" title="Editar">
                      <FontAwesomeIcon icon={faEdit} />
                    </Link>
                    <button onClick={() => handleDelete(task.id)} className="btn btn-sm btn-danger" title="Eliminar">
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>

                <div className="task-content">
                  <p className="task-description">{task.description || 'Sin descripción'}</p>
                </div>

                <div className="task-meta">
                  <div className="task-priority">
                    {getPriorityIcon(task.priority)}
                    <span>{getPriorityText(task.priority)}</span>
                  </div>
                  <div className="task-status">
                    {getStatusIcon(task.status)}
                    <span>{getStatusText(task.status)}</span>
                  </div>
                </div>

                <div className="task-footer">
                  <div className="task-assignees">
                    <FontAwesomeIcon icon={faUsers} />
                    <span>
                      {assignedCount[task.id] ?? 0} miembro{(assignedCount[task.id] ?? 0) !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {task.createdAt && (
                    <div className="task-date">
                      <FontAwesomeIcon icon={faCalendar} />
                      <span>{formatDate(task.createdAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-tasks">
            <div className="no-tasks-content">
              <h3>No hay tareas creadas</h3>
              <p>Comienza creando la primera tarea para este proyecto.</p>
              <Link to={`/tasks/create?projectId=${finalProjectId}`} className="btn btn-primary">
                <FontAwesomeIcon icon={faPlus} /> Crear Primera Tarea
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskList;
