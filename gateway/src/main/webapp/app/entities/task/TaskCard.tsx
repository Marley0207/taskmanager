import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEye,
  faEdit,
  faTrash,
  faUsers,
  faCalendar,
  faExclamationTriangle,
  faFlag,
  faCheckCircle,
  faClock,
  faArchive,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import { ITask, TaskPriority, TaskStatus } from './task.model';
import { getAssignedUsers, getMembersOfArchivedTask, archiveTask } from './task.api';
import { getWorkGroupMembers } from '../work-group/work-group.api';
import { IWorkGroupMember } from '../work-group/work-group.model';
import { useAppSelector } from 'app/config/store';
import { getPriorityIcon, getPriorityText, getStatusIcon, getStatusText } from './utils/taskUtils';

interface TaskCardProps {
  task: ITask;
  isArchived?: boolean;
  onDelete?: (id: number, projectId?: number) => void;
  onDeleteArchived?: (id: number, title: string) => void;
  canDeleteArchived?: boolean;
  onArchive?: (id: number) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isArchived = false,
  onDelete,
  onDeleteArchived,
  canDeleteArchived = false,
  onArchive,
}) => {
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  // Obtener información del usuario actual desde Redux
  const account = useAppSelector(state => state.authentication.account);
  const isAuthenticated = useAppSelector(state => state.authentication.isAuthenticated);

  useEffect(() => {
    const loadMemberCount = async () => {
      try {
        setLoadingMembers(true);
        let response;

        if (isArchived) {
          response = await getMembersOfArchivedTask(task.id);
        } else {
          response = await getAssignedUsers(task.id);
        }

        const count = Array.isArray(response.data) ? response.data.length : 0;
        setMemberCount(count);
      } catch (error) {
        console.error('Error loading member count for task', task.id, error);
        setMemberCount(0);
      } finally {
        setLoadingMembers(false);
      }
    };

    loadMemberCount();
  }, [task.id, isArchived]);

  // Cargar el rol del usuario actual en el work group
  useEffect(() => {
    if (task?.workGroup?.id && isAuthenticated && account?.login) {
      loadCurrentUserRole();
    }
  }, [task?.workGroup?.id, isAuthenticated, account?.login]);

  const loadCurrentUserRole = async () => {
    try {
      if (!task?.workGroup?.id) {
        setCurrentUserRole(null);
        return;
      }

      const response = await getWorkGroupMembers(task.workGroup.id);
      const members = response.data.map((item: any) => ({
        ...item.user,
        role: item.role,
      }));

      const currentMember = members.find((member: IWorkGroupMember) => member.login === account.login);
      setCurrentUserRole(currentMember?.role || null);
    } catch (err) {
      console.error('TaskCard: Error loading current user role:', err);
      setCurrentUserRole(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDelete = () => {
    if (isArchived) {
      onDeleteArchived?.(task.id, task.title);
    } else {
      onDelete?.(task.id, task.project.id);
    }
  };

  const handleArchive = async () => {
    if (onArchive) {
      onArchive(task.id);
    } else {
      await archiveTask(task.id);
      // Podrías agregar feedback aquí si lo deseas
    }
  };

  return (
    <div className={`task-card ${isArchived ? 'archived' : ''}`}>
      <div className="task-header">
        <div className="task-title">
          <h3>{task.title}</h3>
          {isArchived && (
            <span className="archived-badge">
              <FontAwesomeIcon icon={faArchive} /> Archivada
            </span>
          )}
        </div>
        <div className="task-actions">
          <Link to={`/tasks/${task.id}/details`} className="btn btn-sm btn-info" title="Ver detalles">
            <FontAwesomeIcon icon={faEye} />
          </Link>
          {!isArchived && (
            <>
              <Link to={`/tasks/${task.id}/edit`} className="btn btn-sm btn-warning" title="Editar">
                <FontAwesomeIcon icon={faEdit} />
              </Link>
            </>
          )}
          {(isArchived ? canDeleteArchived : true) && (
            <button onClick={handleDelete} className="btn btn-sm btn-danger" title={isArchived ? 'Eliminar permanentemente' : 'Eliminar'}>
              <FontAwesomeIcon icon={faTrash} />
            </button>
          )}
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
          <span>{loadingMembers ? 'Cargando...' : `${memberCount ?? 0} miembro${(memberCount ?? 0) !== 1 ? 's' : ''}`}</span>
        </div>
        {task.createdAt && (
          <div className="task-date">
            <FontAwesomeIcon icon={faCalendar} />
            <span>{formatDate(task.createdAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
