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
  faEnvelope,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons';
import {
  getTask,
  deleteTask,
  getAssignedUsers,
  addMemberToTask,
  archiveTask as apiArchiveTask,
  createComment,
  getTaskComments,
  updateComment,
  patchComment,
  deleteComment,
  removeMemberFromTask,
} from './task.api';
import { ITask, TaskPriority, TaskStatus, ITaskMember, IComment } from './task.model';
import './task-list.scss';
import { getAvailableWorkGroupMembers } from './task.api';
import axios from 'axios';
import Modal from 'react-modal';
import SubtaskList from './SubtaskList';

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

  useEffect(() => {
    if (id) {
      loadTask();
      loadAssignedUsers();
    }
  }, [id]);

  useEffect(() => {
    const groupId = task?.workGroup?.id || task?.workGroupId;
    if (groupId) {
      getAvailableWorkGroupMembers(groupId).then(res => {
        const members = Array.isArray(res.data)
          ? res.data.length > 0 && res.data[0].user
            ? res.data.map((item: any) => item.user)
            : res.data
          : [];
        setAvailableMembers(members);
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
      await deleteTask(task.workGroupId || task.workGroup.id, Number(id));
      setMessage({ type: 'success', text: 'Tarea eliminada exitosamente' });
      setTimeout(() => navigate(-1), 1000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al eliminar la tarea' });
    } finally {
      setDeletingTask(false);
      closeDeleteTaskModal();
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
      setMessage({ type: 'error', text: 'Error al archivar la tarea' });
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
      await loadComments(); // Recargar comentarios
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al añadir el comentario' });
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
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al editar el comentario' });
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
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al eliminar el comentario' });
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
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al eliminar el miembro de la tarea' });
    } finally {
      setDeletingMember(false);
    }
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
        <Link
          to={task && task.project && task.project.id ? `/tasks?projectId=${task.project.id}` : '/tasks'}
          className="btn btn-secondary btn-sm"
          style={{ marginRight: 16 }}
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Volver
        </Link>
        <h1 style={{ margin: 0 }}>{task.title}</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Link to={`/tasks/${task.id}/edit`} className="btn btn-warning btn-sm">
            <FontAwesomeIcon icon={faEdit} /> Editar
          </Link>
          <button onClick={openDeleteTaskModal} className="btn btn-danger btn-sm">
            <FontAwesomeIcon icon={faTrash} /> Eliminar
          </button>
          {task.status === TaskStatus.DONE && !task.archived && (
            <button onClick={() => setShowArchiveModal(true)} className="btn btn-secondary btn-sm">
              <FontAwesomeIcon icon={faFlag} /> Archivar
            </button>
          )}
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
          {assignedUsers.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              {assignedUsers.map(member => (
                <div
                  key={member.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: '#f8f9fa',
                    borderRadius: 8,
                    padding: '10px 16px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    gap: 14,
                    minHeight: 48,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FontAwesomeIcon icon={faUser} style={{ color: '#1976d2', fontSize: 18 }} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>
                        {member.firstName} {member.lastName}
                      </div>
                      <div style={{ color: '#888', fontSize: 13 }}>({member.login})</div>
                      {member.email && (
                        <div style={{ color: '#888', fontSize: 12 }}>
                          <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: 4 }} />
                          {member.email}
                        </div>
                      )}
                    </div>
                  </div>
                  {!isTaskDoneOrArchived && (
                    <button
                      className="btn btn-outline-danger btn-xs"
                      style={{
                        marginLeft: 'auto',
                        padding: '2px 10px',
                        fontSize: 14,
                        borderRadius: 4,
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.2s',
                      }}
                      title="Eliminar de la tarea"
                      onClick={() => openDeleteMemberModal(member)}
                      disabled={deletingMember && memberToDelete?.id === member.id}
                      onMouseOver={e => (e.currentTarget.style.background = '#ffeaea')}
                      onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#888', fontStyle: 'italic', marginTop: 8 }}>No hay miembros asignados</div>
          )}
          {/* Añadir miembro */}
          {isTaskDoneOrArchived ? (
            <div style={{ marginTop: 12, color: 'gray' }}>No se pueden añadir miembros a una tarea completada o archivada.</div>
          ) : unassignedMembers.length > 0 ? (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <select
                className="form-control"
                style={{ width: 220 }}
                value={selectedUser}
                onChange={e => setSelectedUser(e.target.value)}
                disabled={adding || isTaskDoneOrArchived}
              >
                <option value="">Selecciona usuario para añadir</option>
                {unassignedMembers.map(member => (
                  <option key={member.id} value={member.login}>
                    {member.firstName && member.lastName ? `${member.firstName} ${member.lastName} (${member.login})` : member.login}
                  </option>
                ))}
              </select>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleAddMember}
                disabled={!selectedUser || adding || isTaskDoneOrArchived}
                type="button"
              >
                <FontAwesomeIcon icon={faPlus} /> Añadir miembro
              </button>
            </div>
          ) : (
            <div style={{ marginTop: 12, color: 'gray' }}>No hay usuarios disponibles para añadir a esta tarea.</div>
          )}
        </div>
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
            <SubtaskList parentTaskId={task.id} projectId={task.project.id} />
          </div>
        </div>
      </div>
      {/* Modal de confirmación para archivar */}
      <Modal
        isOpen={showArchiveModal}
        onRequestClose={() => setShowArchiveModal(false)}
        contentLabel="Confirmar archivado"
        ariaHideApp={false}
        style={{
          content: {
            width: 320,
            maxWidth: 320,
            minWidth: 200,
            height: 180,
            minHeight: 140,
            maxHeight: 220,
            margin: 'auto',
            padding: 10,
            borderRadius: 10,
            textAlign: 'center',
            border: '1.5px solid #dc3545',
            boxShadow: '0 2px 12px rgba(220,53,69,0.10)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'visible',
          },
          overlay: { backgroundColor: 'rgba(0,0,0,0.14)' },
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <FontAwesomeIcon icon={faExclamationTriangle} size="sm" color="#dc3545" />
          <h4 style={{ color: '#dc3545', margin: 0, fontWeight: 700, fontSize: 18 }}>¿Archivar tarea?</h4>
        </div>
        <p style={{ fontSize: 13, color: '#333', marginBottom: 14, marginTop: 0, lineHeight: 1.2 }}>
          ¿Estás seguro de que deseas archivar esta tarea? Esta acción no se puede deshacer.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 0, width: '100%' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowArchiveModal(false)}
            disabled={archiving}
            style={{ minWidth: 70, fontWeight: 500, fontSize: 13 }}
          >
            Cancelar
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={handleArchive}
            disabled={archiving}
            style={{ minWidth: 80, fontWeight: 500, fontSize: 13 }}
          >
            {archiving ? 'Archivando...' : 'Archivar'}
          </button>
        </div>
      </Modal>
      {/* Formulario para agregar comentario */}
      <div style={{ marginTop: 32 }}>
        <h3>Agregar comentario</h3>
        <textarea
          className="form-control"
          rows={3}
          value={commentText}
          onChange={e => setCommentText(e.target.value)}
          placeholder="Escribe tu comentario aquí..."
          disabled={commentLoading}
          style={{ marginBottom: 8, maxWidth: 500 }}
        />
        <br />
        <button className="btn btn-primary btn-sm" onClick={handleCreateComment} disabled={commentLoading || !commentText.trim()}>
          {commentLoading ? 'Enviando...' : 'Comentar'}
        </button>
      </div>
      {/* Mostrar comentarios de la tarea */}
      <div style={{ marginTop: 32 }}>
        <h3>Comentarios</h3>
        {commentsLoading ? (
          <div>Cargando comentarios...</div>
        ) : comments.length === 0 ? (
          <div style={{ color: 'gray' }}>No hay comentarios para esta tarea.</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {comments.map(comment => (
              <li key={comment.id} style={{ marginBottom: 16, background: '#f8f9fa', borderRadius: 8, padding: 12 }}>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>
                  {comment.author?.firstName} {comment.author?.lastName} ({comment.author?.login})
                </div>
                {editingCommentId === comment.id ? (
                  <>
                    <textarea
                      className="form-control"
                      rows={2}
                      value={editingCommentText}
                      onChange={e => setEditingCommentText(e.target.value)}
                      disabled={editingLoading}
                      style={{ marginBottom: 8 }}
                    />
                    <button
                      className="btn btn-success btn-sm"
                      onClick={handleUpdateComment}
                      disabled={editingLoading || !editingCommentText.trim()}
                    >
                      Guardar
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setEditingCommentId(null)}
                      disabled={editingLoading}
                      style={{ marginLeft: 8 }}
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ marginBottom: 4 }}>{comment.content}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>
                      {comment.createdAt && new Date(comment.createdAt).toLocaleString('es-ES')}
                    </div>
                    <button
                      className="btn btn-outline-primary btn-xs"
                      style={{ marginTop: 4, marginRight: 8 }}
                      onClick={() => startEditComment(comment)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn btn-outline-danger btn-xs"
                      style={{ marginTop: 4 }}
                      onClick={() => openDeleteModal(comment)}
                      disabled={deletingLoading && deletingCommentId === comment.id}
                    >
                      Eliminar
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Modal de confirmación para eliminar comentario */}
      <Modal
        isOpen={showDeleteModal}
        onRequestClose={closeDeleteModal}
        contentLabel="Confirmar eliminación de comentario"
        ariaHideApp={false}
        style={{
          content: {
            width: 320,
            height: 130,
            maxWidth: 320,
            minWidth: 200,
            margin: 'auto',
            padding: 10,
            borderRadius: 10,
            textAlign: 'center',
            border: '1.5px solid #dc3545',
            boxShadow: '0 2px 12px rgba(220,53,69,0.10)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'visible',
          },
          overlay: { backgroundColor: 'rgba(0,0,0,0.14)' },
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <FontAwesomeIcon icon={faExclamationTriangle} size="sm" color="#dc3545" />
          <h4 style={{ color: '#dc3545', margin: 0, fontWeight: 700, fontSize: 18 }}>¿Eliminar comentario?</h4>
        </div>
        <p style={{ fontSize: 13, color: '#333', marginBottom: 14, marginTop: 0, lineHeight: 1.2 }}>
          ¿Estás seguro de que deseas eliminar este comentario?
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 0, width: '100%' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={closeDeleteModal}
            disabled={deletingLoading}
            style={{ minWidth: 70, fontWeight: 500, fontSize: 13 }}
          >
            Cancelar
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={handleDeleteComment}
            disabled={deletingLoading}
            style={{ minWidth: 80, fontWeight: 500, fontSize: 13 }}
          >
            {deletingLoading ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </Modal>
      {/* Modal de confirmación para eliminar tarea */}
      <Modal
        isOpen={showDeleteTaskModal}
        onRequestClose={closeDeleteTaskModal}
        contentLabel="Confirmar eliminación de tarea"
        ariaHideApp={false}
        style={{
          content: {
            width: 320,
            height: 130,
            maxWidth: 320,
            minWidth: 200,
            margin: 'auto',
            padding: 10,
            borderRadius: 10,
            textAlign: 'center',
            border: '1.5px solid #dc3545',
            boxShadow: '0 2px 12px rgba(220,53,69,0.10)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'visible',
          },
          overlay: { backgroundColor: 'rgba(0,0,0,0.14)' },
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <FontAwesomeIcon icon={faExclamationTriangle} size="sm" color="#dc3545" />
          <h4 style={{ color: '#dc3545', margin: 0, fontWeight: 700, fontSize: 18 }}>¿Eliminar tarea?</h4>
        </div>
        <p style={{ fontSize: 13, color: '#333', marginBottom: 14, marginTop: 0, lineHeight: 1.2 }}>
          ¿Estás seguro de que deseas eliminar esta tarea?
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 0, width: '100%' }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={closeDeleteTaskModal}
            disabled={deletingTask}
            style={{ minWidth: 70, fontWeight: 500, fontSize: 13 }}
          >
            Cancelar
          </button>
          <button
            className="btn btn-danger btn-sm"
            onClick={handleDelete}
            disabled={deletingTask}
            style={{ minWidth: 80, fontWeight: 500, fontSize: 13 }}
          >
            {deletingTask ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </Modal>
      {/* Modal de confirmación para eliminar miembro de la tarea */}
      {showDeleteMemberModal && memberToDelete && (
        <Modal
          isOpen={showDeleteMemberModal}
          onRequestClose={closeDeleteMemberModal}
          contentLabel="Confirmar eliminación de miembro de la tarea"
          ariaHideApp={false}
          style={{
            content: {
              width: 320,
              height: 130,
              maxWidth: 320,
              minWidth: 200,
              margin: 'auto',
              padding: 10,
              borderRadius: 10,
              textAlign: 'center',
              border: '1.5px solid #dc3545',
              boxShadow: '0 2px 12px rgba(220,53,69,0.10)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'visible',
            },
            overlay: { backgroundColor: 'rgba(0,0,0,0.14)' },
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <FontAwesomeIcon icon={faExclamationTriangle} size="sm" color="#dc3545" />
            <h4 style={{ color: '#dc3545', margin: 0, fontWeight: 700, fontSize: 18 }}>¿Eliminar miembro?</h4>
          </div>
          <p style={{ fontSize: 13, color: '#333', marginBottom: 14, marginTop: 0, lineHeight: 1.2 }}>
            ¿Estás seguro de que deseas eliminar a{' '}
            <b>
              {memberToDelete.firstName} {memberToDelete.lastName} ({memberToDelete.login})
            </b>{' '}
            de esta tarea?
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 0, width: '100%' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={closeDeleteMemberModal}
              disabled={deletingMember}
              style={{ minWidth: 70, fontWeight: 500, fontSize: 13 }}
            >
              Cancelar
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleRemoveMember}
              disabled={deletingMember}
              style={{ minWidth: 80, fontWeight: 500, fontSize: 13 }}
            >
              {deletingMember ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TaskDetails;
