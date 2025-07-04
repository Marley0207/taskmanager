import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { ITask, TaskPriority, TaskStatus } from './task.model';
import { getSubtasks, softDeleteTask } from './task.api';
import { getWorkGroupMembers } from '../work-group/work-group.api';
import { IWorkGroupMember } from '../work-group/work-group.model';
import { useAppSelector } from 'app/config/store';
import TaskCard from './TaskCard';
import './subtask-list.scss';

interface SubtaskListProps {
  parentTaskId: number;
  projectId: number;
  onSubtaskDeleted?: () => void;
  currentUserRole?: string | null;
}

const SubtaskList: React.FC<SubtaskListProps> = ({ parentTaskId, projectId, onSubtaskDeleted, currentUserRole: propCurrentUserRole }) => {
  const [subtasks, setSubtasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{ id: number; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(propCurrentUserRole || null);

  // Obtener información del usuario actual desde Redux
  const account = useAppSelector(state => state.authentication.account);
  const isAuthenticated = useAppSelector(state => state.authentication.isAuthenticated);

  useEffect(() => {
    loadSubtasks();
  }, [parentTaskId]);

  // Cargar el rol del usuario actual si no se proporciona como prop
  useEffect(() => {
    if (!propCurrentUserRole && subtasks.length > 0 && subtasks[0]?.workGroup?.id && isAuthenticated && account?.login) {
      loadCurrentUserRole();
    }
  }, [subtasks, propCurrentUserRole, isAuthenticated, account?.login]);

  const loadCurrentUserRole = async () => {
    try {
      const workGroupId = subtasks[0]?.workGroup?.id;
      if (!workGroupId) return;

      const response = await getWorkGroupMembers(workGroupId);
      const members = response.data.map((item: any) => ({
        ...item.user,
        role: item.role,
      }));

      const currentMember = members.find((member: IWorkGroupMember) => member.login === account.login);
      setCurrentUserRole(currentMember?.role || null);
    } catch (err) {
      console.error('Error loading current user role:', err);
      setCurrentUserRole(null);
    }
  };

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
      await softDeleteTask(projectId, taskToDelete.id);
      await loadSubtasks();
      onSubtaskDeleted?.();
      closeDeleteModal();
    } catch (err) {
      console.error('Error deleting subtask:', err);
    } finally {
      setDeleting(false);
    }
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
            <TaskCard key={subtask.id} task={subtask} onDelete={openDeleteModal} />
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
