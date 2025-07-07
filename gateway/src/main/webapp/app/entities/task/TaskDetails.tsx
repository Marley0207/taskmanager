import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  faEnvelope,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import {
  getTask,
  softDeleteTask,
  getAssignedUsers,
  addMemberToTask,
  archiveTask as apiArchiveTask,
  createComment,
  getTaskComments,
  patchComment,
  deleteComment,
  removeMemberFromTask,
} from './task.api';
import { ITask, TaskPriority, TaskStatus, ITaskMember, IComment } from './task.model';
import './task-list.scss';
import { getAvailableWorkGroupMembers } from './task.api';
import { getProjectMembers } from '../project/project.api';
import { getWorkGroupMembers } from '../work-group/work-group.api';
import { IWorkGroupMember } from '../work-group/work-group.model';
import axios from 'axios';
import Modal from 'react-modal';
import SubtaskList from './SubtaskList';
import { useAppSelector } from 'app/config/store';
import TaskHeader from './components/TaskHeader';
import TaskInfo from './components/TaskInfo';
import TaskMembers from './components/TaskMembers';
import CommentSection from './components/CommentSection';
import { ArchiveModal, DeleteCommentModal, DeleteTaskModal, DeleteMemberModal } from './components/Modals';
import { getPriorityIcon, getStatusIcon, getPriorityText, getStatusText, formatDate } from './utils/taskUtils';

export interface IPriority {
  id?: number;
  name: string;
  hidden?: boolean;
}

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
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [comments, setComments] = useState<IComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [editingLoading, setEditingLoading] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<number | null>(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<IComment | null>(null);
  const [showDeleteTaskModal, setShowDeleteTaskModal] = useState(false);
  const [deletingTask, setDeletingTask] = useState(false);
  const [showDeleteMemberModal, setShowDeleteMemberModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<ITaskMember | null>(null);
  const [deletingMember, setDeletingMember] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  // Obtener información del usuario actual desde Redux
  const account = useAppSelector(state => state.authentication.account);
  const isAuthenticated = useAppSelector(state => state.authentication.isAuthenticated);

  useEffect(() => {
    if (id) {
      loadTask();
      loadAssignedUsers();
    }
  }, [id]);

  useEffect(() => {
    if (task?.project?.id) {
      loadProjectMembers();
    } else if (task?.workGroupId) {
      loadWorkGroupMembers();
    }
  }, [task]);

  // Solo intenta cargar el rol si la tarea ya existe
  useEffect(() => {
    if (task?.id && task?.workGroupId && isAuthenticated && account?.login) {
      loadCurrentUserRole();
    }
  }, [task, isAuthenticated, account?.login]);

  const loadProjectMembers = async () => {
    try {
      const res = await getProjectMembers(task.project.id);
      const members = Array.isArray(res.data) ? res.data : [];
      setAvailableMembers(members);
    } catch (err) {
      console.error('Error loading project members:', err);
      setAvailableMembers([]);
    }
  };

  const loadWorkGroupMembers = async () => {
    try {
      const res = await getAvailableWorkGroupMembers(task.workGroupId);
      const members = Array.isArray(res.data)
        ? res.data.length > 0 && res.data[0].user
          ? res.data.map((item: any) => item.user)
          : res.data
        : [];
      setAvailableMembers(members);
    } catch (err) {
      console.error('Error loading work group members:', err);
      setAvailableMembers([]);
    }
  };

  const loadCurrentUserRole = async () => {
    console.warn('Entrando a loadCurrentUserRole');
    try {
      if (!task?.workGroupId) {
        setCurrentUserRole(null);
        return;
      }

      const response = await getWorkGroupMembers(task.workGroupId);
      // Soporta ambos formatos de respuesta
      const members = response.data.map((item: any) => (item.user ? { ...item.user, role: item.role } : item));
      console.warn('Miembros (array completo):', members);
      console.warn('Login actual:', account.login, '| Tipo:', typeof account.login);
      members.forEach((member, idx) => {
        console.warn(`Miembro[${idx}].login:`, member.login, '| Tipo:', typeof member.login, '| Role:', member.role);
      });
      const currentMember = members.find((member: IWorkGroupMember) => member.login?.toLowerCase() === account.login?.toLowerCase());
      console.warn('Miembro encontrado:', currentMember);
      setCurrentUserRole(currentMember?.role || null);
    } catch (err) {
      console.error('Error loading current user role:', err);
      setCurrentUserRole(null);
    }
  };

  const loadTask = async () => {
    setLoading(true);
    try {
      const response = await getTask(Number(id));
      setTask(response.data);
      console.warn('Tarea cargada:', response.data);
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
      let errorMsg = 'Error al añadir el miembro';
      if (err.response && err.response.data && err.response.data.detail) {
        errorMsg = err.response.data.detail;
      }
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setAdding(false);
    }
  };

  // Filtrar usuarios disponibles que no estén ya asignados
  const unassignedMembers = availableMembers.filter(m => !assignedUsers.some(a => a.id === m.id));

  const openDeleteTaskModal = () => {
    setShowDeleteTaskModal(true);
  };

  const closeDeleteTaskModal = () => {
    setShowDeleteTaskModal(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeletingTask(true);
    setMessage(null);
    try {
      if (task.archived) {
        await axios.delete(`/services/taskmanager/api/tasks/${task.id}/archived`);
      } else {
        await softDeleteTask(task.project.id, Number(id));
      }
      setMessage({ type: 'success', text: 'Tarea eliminada exitosamente' });
      setTimeout(() => navigate(-1), 1000);
    } catch (err: any) {
      let errorMsg = 'Error al eliminar la tarea';
      if (err.response && err.response.data && err.response.data.detail) {
        errorMsg = err.response.data.detail;
      }
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setDeletingTask(false);
      closeDeleteTaskModal();
    }
  };

  // Determinar si la tarea está completada o archivada
  const isTaskDoneOrArchived = task?.status === TaskStatus.DONE || task?.archived;

  const handleArchive = async () => {
    if (!task) return;
    setArchiving(true);
    setMessage(null);
    try {
      const response = await apiArchiveTask(task.id);
      setTask(response.data);
      setMessage({ type: 'success', text: 'Tarea archivada exitosamente' });
      setShowArchiveModal(false);
    } catch (err: any) {
      let errorMsg = 'Error al archivar la tarea';
      if (err.response && err.response.data && err.response.data.detail) {
        errorMsg = err.response.data.detail;
      }
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setArchiving(false);
    }
  };

  const loadComments = async () => {
    setCommentsLoading(true);
    try {
      const response = await getTaskComments(task.id);
      setComments(response.data);
    } catch (err) {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  useEffect(() => {
    if (task?.id) {
      loadComments();
    }
  }, [task?.id]);

  const handleCreateComment = async () => {
    if (!commentText.trim()) return;
    setCommentLoading(true);
    try {
      await createComment({
        content: commentText,
        taskId: task.id,
        authorId: undefined, // El backend lo asigna automáticamente
      });
      setCommentText('');
      setMessage({ type: 'success', text: 'Comentario añadido exitosamente' });
      await loadComments();
    } catch (err: any) {
      let errorMsg = 'Error al añadir el comentario';
      if (err.response && err.response.data && err.response.data.detail) {
        errorMsg = err.response.data.detail;
      }
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setCommentLoading(false);
    }
  };

  const startEditComment = (comment: IComment) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content);
  };

  const handleUpdateComment = async () => {
    if (!editingCommentId || !editingCommentText.trim()) return;
    setEditingLoading(true);
    try {
      await patchComment(editingCommentId, {
        id: editingCommentId,
        content: editingCommentText,
      });
      setEditingCommentId(null);
      setEditingCommentText('');
      await loadComments();
      setMessage({ type: 'success', text: 'Comentario editado exitosamente' });
    } catch (err: any) {
      let errorMsg = 'Error al editar el comentario';
      if (err.response && err.response.data && err.response.data.detail) {
        errorMsg = err.response.data.detail;
      }
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setEditingLoading(false);
    }
  };

  const openDeleteModal = (comment: IComment) => {
    setCommentToDelete(comment);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setCommentToDelete(null);
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;
    setDeletingCommentId(commentToDelete.id);
    setDeletingLoading(true);
    try {
      await deleteComment(commentToDelete.id);
      setMessage({ type: 'success', text: 'Comentario eliminado exitosamente' });
      await loadComments();
      closeDeleteModal();
    } catch (err: any) {
      let errorMsg = 'Error al eliminar el comentario';
      if (err.response && err.response.data && err.response.data.detail) {
        errorMsg = err.response.data.detail;
      }
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setDeletingCommentId(null);
      setDeletingLoading(false);
    }
  };

  // Función para abrir el modal de confirmación
  const openDeleteMemberModal = (member: ITaskMember) => {
    setMemberToDelete(member);
    setShowDeleteMemberModal(true);
  };

  // Función para cerrar el modal
  const closeDeleteMemberModal = () => {
    setShowDeleteMemberModal(false);
    setMemberToDelete(null);
  };

  // Función para eliminar el miembro
  const handleRemoveMember = async () => {
    if (!task || !memberToDelete) return;
    setDeletingMember(true);
    setMessage(null);
    try {
      await removeMemberFromTask(task.project.id, task.id, memberToDelete.login);
      setMessage({ type: 'success', text: 'Miembro eliminado exitosamente de la tarea' });
      await loadAssignedUsers();
      closeDeleteMemberModal();
    } catch (err: any) {
      let errorMsg = 'Error al eliminar el miembro de la tarea';
      if (err.response && err.response.data && err.response.data.detail) {
        errorMsg = err.response.data.detail;
      }
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setDeletingMember(false);
    }
  };

  // Verificar si el usuario puede archivar
  const canArchive =
    task?.status === TaskStatus.DONE &&
    !task?.archived &&
    isAuthenticated &&
    (currentUserRole === 'OWNER' || currentUserRole === 'MODERADOR');

  useEffect(() => {
    if (message) {
      const timeout = setTimeout(() => setMessage(null), message.type === 'success' ? 2000 : 3000);
      return () => clearTimeout(timeout);
    }
  }, [message]);

  if (loading || currentUserRole === undefined) {
    return <div>Cargando permisos...</div>;
  }

  if (loading) return <div className="loading">Cargando tarea...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!task) return <div className="error">No se encontró la tarea</div>;

  console.warn('Rol detectado:', currentUserRole);

  return (
    <div className="task-details-container" style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      {message && (
        <div className={`message ${message.type}`} style={{ marginBottom: 16, marginTop: 60, zIndex: 1000, position: 'relative' }}>
          <FontAwesomeIcon icon={message.type === 'success' ? faCheckCircle : faExclamationTriangle} />
          <span>{message.text}</span>
        </div>
      )}

      <TaskHeader
        task={task}
        onEdit={() => navigate(`/tasks/${task.id}/edit`)}
        onDelete={openDeleteTaskModal}
        onArchive={() => setShowArchiveModal(true)}
        canArchive={canArchive}
      />

      <div
        className="task-details-content"
        style={{ background: 'white', borderRadius: 8, padding: 24, boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}
      >
        <TaskInfo task={task} />

        <TaskMembers
          assignedUsers={assignedUsers}
          unassignedMembers={unassignedMembers}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          handleAddMember={handleAddMember}
          adding={adding}
          isTaskDoneOrArchived={isTaskDoneOrArchived}
          openDeleteMemberModal={openDeleteMemberModal}
          deletingMember={deletingMember}
          memberToDelete={memberToDelete}
          accountLogin={account?.login}
        />

        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
          <strong>Archivada:</strong>
          {task.archived ? (
            <span style={{ color: '#dc3545', fontWeight: 600 }}>Sí</span>
          ) : (
            <span style={{ color: '#28a745', fontWeight: 600 }}>No</span>
          )}
        </div>

        {/* Sección de subtareas */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginTop: 8 }}>
            <SubtaskList parentTaskId={task.id} projectId={task.project.id} currentUserRole={currentUserRole} />
          </div>
        </div>
      </div>

      {/* Modales */}
      <ArchiveModal isOpen={showArchiveModal} onClose={() => setShowArchiveModal(false)} onConfirm={handleArchive} archiving={archiving} />

      <CommentSection
        commentText={commentText}
        setCommentText={setCommentText}
        commentLoading={commentLoading}
        handleCreateComment={handleCreateComment}
        comments={comments}
        commentsLoading={commentsLoading}
        editingCommentId={editingCommentId}
        editingCommentText={editingCommentText}
        setEditingCommentText={setEditingCommentText}
        editingLoading={editingLoading}
        handleUpdateComment={handleUpdateComment}
        startEditComment={startEditComment}
        setEditingCommentId={setEditingCommentId}
        openDeleteModal={openDeleteModal}
        deletingLoading={deletingLoading}
        deletingCommentId={deletingCommentId}
        formatDate={formatDate}
      />

      <DeleteCommentModal
        isOpen={showDeleteModal}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteComment}
        deletingLoading={deletingLoading}
        commentToDelete={commentToDelete}
      />

      <DeleteTaskModal isOpen={showDeleteTaskModal} onClose={closeDeleteTaskModal} onConfirm={handleDelete} deletingTask={deletingTask} />

      <DeleteMemberModal
        isOpen={showDeleteMemberModal}
        onClose={closeDeleteMemberModal}
        onConfirm={handleRemoveMember}
        deletingMember={deletingMember}
        memberToDelete={memberToDelete}
      />
    </div>
  );
};

export default TaskDetails;
