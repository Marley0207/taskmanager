import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faEdit,
  faTrash,
  faUser,
  faUsers,
  faCalendar,
  faFlag,
  faCheckCircle,
  faClock,
  faExclamationTriangle,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { getTask, deleteTask, getAssignedUsers, addMemberToTask } from './task.api';
import { ITask, TaskPriority, TaskStatus, ITaskMember } from './task.model';
import './task-list.scss';
import { getAvailableWorkGroupMembers } from './task.api';

const TaskDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<ITask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [assignedUsers, setAssignedUsers] = useState<ITaskMember[]>([]);
  const [availableMembers, setAvailableMembers] = useState<ITaskMember[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (id) {
      loadTask();
      loadAssignedUsers();
    }
  }, [id]);

  useEffect(() => {
    if (task?.workGroup?.id) {
      getAvailableWorkGroupMembers(task.workGroup.id).then(res => {
        setAvailableMembers(res.data);
      });
    }
  }, [task]);

  const loadTask = async () => {
    setLoading(true);
    try {
      const response = await getTask(Number(id));
      setTask(response.data);
    } catch (err) {
      setError('Error al cargar la tarea');
    } finally {
      setLoading(false);
    }
  };

  const loadAssignedUsers = async () => {
    try {
      const response = await getAssignedUsers(Number(id));
      setAssignedUsers(response.data);
    } catch (err) {
      if (task?.assignedMembers) {
        setAssignedUsers(task.assignedMembers);
      } else {
        setAssignedUsers([]);
      }
    }
  };

  const handleAddMember = async () => {
    if (!selectedUser) return;
    setAdding(true);
    setMessage(null);
    try {
      await addMemberToTask(Number(id), selectedUser);
      setMessage({ type: 'success', text: 'Miembro añadido exitosamente' });
      setSelectedUser('');
      await loadAssignedUsers();
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Error al añadir el miembro' });
    } finally {
      setAdding(false);
    }
  };

  // Filtrar usuarios disponibles que no estén ya asignados
  const unassignedMembers = availableMembers.filter(m => !assignedUsers.some(a => a.id === m.id));

  const handleDelete = async () => {
    if (!id || !window.confirm('¿Estás seguro de que quieres eliminar esta tarea?')) return;
    try {
      await deleteTask(Number(id));
      setMessage({ type: 'success', text: 'Tarea eliminada exitosamente' });
      setTimeout(() => navigate(-1), 1000);
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) return <div className="loading">Cargando tarea...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!task) return <div className="error">No se encontró la tarea</div>;

  return (
    <div className="task-details-container" style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      {message && (
        <div className={`message ${message.type}`} style={{ marginBottom: 16 }}>
          <FontAwesomeIcon icon={message.type === 'success' ? faCheckCircle : faExclamationTriangle} />
          <span>{message.text}</span>
        </div>
      )}
      <div className="task-details-header" style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <Link to={-1 as any} className="btn btn-secondary btn-sm" style={{ marginRight: 16 }}>
          <FontAwesomeIcon icon={faArrowLeft} /> Volver
        </Link>
        <h1 style={{ margin: 0 }}>{task.title}</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Link to={`/tasks/${task.id}/edit`} className="btn btn-warning btn-sm">
            <FontAwesomeIcon icon={faEdit} /> Editar
          </Link>
          <button onClick={handleDelete} className="btn btn-danger btn-sm">
            <FontAwesomeIcon icon={faTrash} /> Eliminar
          </button>
        </div>
      </div>
      <div
        className="task-details-content"
        style={{ background: 'white', borderRadius: 8, padding: 24, boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}
      >
        <div style={{ marginBottom: 16 }}>
          <strong>Descripción:</strong>
          <div style={{ marginTop: 4 }}>{task.description || 'Sin descripción'}</div>
        </div>
        <div style={{ display: 'flex', gap: 32, marginBottom: 16 }}>
          <div>
            <strong>Prioridad:</strong> {getPriorityIcon(task.priority)} {getPriorityText(task.priority)}
          </div>
          <div>
            <strong>Estado:</strong> {getStatusIcon(task.status)} {getStatusText(task.status)}
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <strong>
            <FontAwesomeIcon icon={faUsers} /> Miembros asignados ({assignedUsers.length}):
          </strong>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {assignedUsers.length > 0 ? (
              assignedUsers.map(member => (
                <li key={member.id}>
                  <FontAwesomeIcon icon={faUser} /> {member.firstName} {member.lastName} ({member.login})
                </li>
              ))
            ) : (
              <li>No hay miembros asignados</li>
            )}
          </ul>
          {/* Añadir miembro */}
          {unassignedMembers.length > 0 ? (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <select
                className="form-control"
                style={{ width: 220 }}
                value={selectedUser}
                onChange={e => setSelectedUser(e.target.value)}
                disabled={adding}
              >
                <option value="">Selecciona usuario a añadir</option>
                {unassignedMembers.map(member => (
                  <option key={member.id} value={member.login}>
                    {member.firstName && member.lastName ? `${member.firstName} ${member.lastName} (${member.login})` : member.login}
                  </option>
                ))}
              </select>
              <button className="btn btn-primary btn-sm" onClick={handleAddMember} disabled={!selectedUser || adding} type="button">
                <FontAwesomeIcon icon={faPlus} /> Añadir miembro
              </button>
            </div>
          ) : (
            <div style={{ marginTop: 12, color: '#888', fontStyle: 'italic' }}>No hay miembros disponibles para asignar a esta tarea.</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <div>
            <strong>Archivada:</strong>{' '}
            {task.archived ? (
              <span style={{ color: '#dc3545', fontWeight: 600 }}>Sí</span>
            ) : (
              <span style={{ color: '#28a745', fontWeight: 600 }}>No</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetails;
