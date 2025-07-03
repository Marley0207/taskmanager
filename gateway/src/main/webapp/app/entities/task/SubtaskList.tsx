import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faEye,
  faEdit,
  faTrash,
  faUsers,
  faCalendar,
  faExclamationTriangle,
  faFlag,
  faCheckCircle,
  faClock,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { ITask, TaskPriority, TaskStatus } from './task.model';
import { getSubtasks, deleteTask } from './task.api';
import TaskCard from './TaskCard';
import './subtask-list.scss';

interface SubtaskListProps {
  parentTaskId: number;
  projectId: number;
  onSubtaskDeleted?: () => void;
}

const SubtaskList: React.FC<SubtaskListProps> = ({ parentTaskId, projectId, onSubtaskDeleted }) => {
  const [subtasks, setSubtasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{ id: number; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadSubtasks();
  }, [parentTaskId]);

  const loadSubtasks = async () => {
    try {
      setLoading(true);
      const response = await getSubtasks(parentTaskId);
      setSubtasks(response.data);
    } catch (err) {
      console.error('Error loading subtasks:', err);
      setError('Error al cargar las subtareas');
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (id: number, projId?: number) => {
    // Buscar la subtarea para obtener el título
    const subtask = subtasks.find(task => task.id === id);
    if (subtask) {
      setTaskToDelete({ id, title: subtask.title });
      setShowDeleteModal(true);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setTaskToDelete(null);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    setDeleting(true);
    try {
      await deleteTask(projectId, taskToDelete.id);
      await loadSubtasks();
      onSubtaskDeleted?.();
      closeDeleteModal();
    } catch (err) {
      console.error('Error deleting subtask:', err);
    } finally {
      setDeleting(false);
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

  if (loading) return <div className="loading">Cargando subtareas...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="subtask-list-container">
      {/* Título principal de subtareas */}
      <div className="subtask-list-header">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
          <FontAwesomeIcon icon={faArrowRight} /> Subtareas ({subtasks.length})
        </h3>
        <Link to={`/tasks/create?parentTaskId=${parentTaskId}&projectId=${projectId}`} className="btn btn-primary btn-sm">
          <FontAwesomeIcon icon={faPlus} /> Nueva Subtarea
        </Link>
      </div>

      {subtasks.length > 0 ? (
        <div className="subtasks-grid" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {subtasks.map(subtask => (
            <div
              key={subtask.id}
              className="subtask-card"
              style={{
                background: '#f8f9fa',
                borderRadius: 10,
                padding: '18px 22px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                marginBottom: 0,
                border: '1px solid #e3e6ea',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontWeight: 700, fontSize: 20 }}>{subtask.title}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Link to={`/tasks/${subtask.id}/details`} className="btn btn-info btn-xs" title="Ver Detalle">
                    <FontAwesomeIcon icon={faEye} />
                  </Link>
                  <Link to={`/tasks/${subtask.id}/edit`} className="btn btn-warning btn-xs" title="Editar">
                    <FontAwesomeIcon icon={faEdit} />
                  </Link>
                  <button className="btn btn-danger btn-xs" title="Eliminar" onClick={() => openDeleteModal(subtask.id)}>
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
              {subtask.description && <div style={{ color: '#555', fontSize: 15, marginBottom: 2 }}>{subtask.description}</div>}
              <div style={{ display: 'flex', gap: 18, alignItems: 'center', fontSize: 14, marginTop: 2 }}>
                <span>
                  {getPriorityIcon(subtask.priority)} {getPriorityText(subtask.priority)}
                </span>
                <span>
                  {getStatusIcon(subtask.status)} {getStatusText(subtask.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-subtasks">
          <div className="no-subtasks-content">
            <h4>No hay subtareas creadas</h4>
            <p>Comienza creando la primera subtarea para esta tarea.</p>
            <Link to={`/tasks/create?parentTaskId=${parentTaskId}&projectId=${projectId}`} className="btn btn-primary">
              <FontAwesomeIcon icon={faPlus} /> Crear Primera Subtarea
            </Link>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>¿Eliminar subtarea?</h4>
            </div>
            <div className="modal-body">
              <p>¿Estás seguro de que deseas eliminar la subtarea &quot;{taskToDelete?.title}&quot;?</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeDeleteModal} disabled={deleting}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={confirmDelete} disabled={deleting}>
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubtaskList;
