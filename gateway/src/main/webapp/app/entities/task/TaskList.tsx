import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPlus, faCheck, faExclamationTriangle, faArchive } from '@fortawesome/free-solid-svg-icons';
import { getTasksByProject, deleteTask, getArchivedTasksByProject, deleteArchivedTask } from './task.api';
import { ITask } from './task.model';
import { useAppSelector } from 'app/config/store';
import TaskCard from './TaskCard';
import './task-list.scss';
import Modal from 'react-modal';

const TaskList = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const searchParams = new URLSearchParams(window.location.search);
  const projectIdFromQuery = searchParams.get('projectId');
  const finalProjectId = projectId || projectIdFromQuery;
  const navigate = useNavigate();

  // Obtener información del usuario actual desde Redux
  const account = useAppSelector(state => state.authentication.account);
  const isAuthenticated = useAppSelector(state => state.authentication.isAuthenticated);

  const [tasks, setTasks] = useState<ITask[]>([]);
  const [archivedTasks, setArchivedTasks] = useState<ITask[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{ id: number; projectId: number } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteArchivedModal, setShowDeleteArchivedModal] = useState(false);
  const [archivedTaskToDelete, setArchivedTaskToDelete] = useState<{ id: number; title: string } | null>(null);
  const [deletingArchived, setDeletingArchived] = useState(false);

  useEffect(() => {
    if (finalProjectId) {
      loadTasks();
      loadArchivedTasks();
    } else {
      setLoading(false);
    }
  }, [finalProjectId]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await getTasksByProject(parseInt(finalProjectId, 10));
      // Filtrar solo las tareas no archivadas y que no sean subtareas
      const activeTasks = response.data.filter(task => !task.archived && (task.parentTaskId === null || task.parentTaskId === undefined));
      setTasks(activeTasks);
    } catch (err) {
      setError('Error al cargar las tareas');
    } finally {
      setLoading(false);
    }
  };

  const loadArchivedTasks = async () => {
    try {
      const response = await getArchivedTasksByProject(parseInt(finalProjectId, 10));
      // Filtrar solo tareas archivadas que no sean subtareas
      const archivedTasksList = response.data.filter(task => task.parentTaskId === null || task.parentTaskId === undefined);
      setArchivedTasks(archivedTasksList);
    } catch (err) {
      console.warn('Error al cargar las tareas archivadas:', err);
    }
  };

  // Función para verificar si el usuario puede eliminar tareas archivadas
  const canDeleteArchivedTask = (workGroupId: number) => {
    if (!isAuthenticated || !account) return false;
    // Verificar si el usuario tiene rol de administrador global
    const isAdmin = account.authorities?.some((authority: any) => authority === 'ROLE_ADMIN');
    if (isAdmin) return true;
    // Buscar el grupo y ver si es OWNER o MODERADOR
    const group = account.workGroups?.find((g: any) => g.id === workGroupId);
    return group && (group.role === 'OWNER' || group.role === 'MODERADOR');
  };

  const openDeleteArchivedModal = (id: number, title: string, workGroupId?: number) => {
    if (!workGroupId || !canDeleteArchivedTask(workGroupId)) {
      setMessage({ type: 'error', text: 'No tienes permisos para eliminar tareas archivadas' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    setArchivedTaskToDelete({ id, title });
    setShowDeleteArchivedModal(true);
  };

  const closeDeleteArchivedModal = () => {
    setShowDeleteArchivedModal(false);
    setArchivedTaskToDelete(null);
  };

  const confirmDeleteArchived = async () => {
    if (!archivedTaskToDelete) return;
    setDeletingArchived(true);
    try {
      await deleteArchivedTask(archivedTaskToDelete.id);
      setMessage({ type: 'success', text: 'Tarea archivada eliminada exitosamente' });
      await loadArchivedTasks();
      await loadTasks(); // También recargar tareas activas por si acaso
      setTimeout(() => setMessage(null), 3000);
      closeDeleteArchivedModal();
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al eliminar la tarea archivada' });
    } finally {
      setDeletingArchived(false);
    }
  };

  const openDeleteModal = (id: number, projId: number) => {
    setTaskToDelete({ id, projectId: projId });
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setTaskToDelete(null);
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    setDeleting(true);
    try {
      await deleteTask(taskToDelete.projectId, taskToDelete.id);
      setMessage({ type: 'success', text: 'Tarea eliminada exitosamente' });
      await loadTasks();
      await loadArchivedTasks(); // También recargar tareas archivadas por si acaso
      setTimeout(() => setMessage(null), 3000);
      closeDeleteModal();
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al eliminar la tarea' });
    } finally {
      setDeleting(false);
    }
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
          <Link to={`/projects/${finalProjectId}/details`} className="btn btn-secondary btn-sm">
            <FontAwesomeIcon icon={faArrowLeft} /> Volver a Proyecto
          </Link>
          <h1>Tareas del Proyecto</h1>
        </div>
        <div className="task-list-actions">
          <Link to={`/tasks/create?projectId=${finalProjectId}`} className="btn btn-primary">
            <FontAwesomeIcon icon={faPlus} /> Nueva Tarea
          </Link>
        </div>
      </div>

      {/* Pestañas */}
      <div className="task-tabs">
        <button className={`tab-button ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
          Tareas Activas ({tasks.length})
        </button>
        <button className={`tab-button ${activeTab === 'archived' ? 'active' : ''}`} onClick={() => setActiveTab('archived')}>
          <FontAwesomeIcon icon={faArchive} /> Tareas Archivadas ({archivedTasks.length})
        </button>
      </div>

      <div className="task-list-content">
        {activeTab === 'active' && (
          <>
            {tasks.length > 0 ? (
              <div className="tasks-grid">
                {tasks.map(task => (
                  <TaskCard key={task.id} task={task} onDelete={openDeleteModal} />
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
          </>
        )}

        {activeTab === 'archived' && (
          <>
            {archivedTasks.length > 0 ? (
              <div className="tasks-grid">
                {archivedTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isArchived={true}
                    onDeleteArchived={(id, title) => openDeleteArchivedModal(id, title, task.workGroup?.id)}
                    canDeleteArchived={task.workGroup ? canDeleteArchivedTask(task.workGroup.id) : false}
                  />
                ))}
              </div>
            ) : (
              <div className="no-tasks">
                <div className="no-tasks-content">
                  <h3>No hay tareas archivadas</h3>
                  <p>Las tareas completadas que se archiven aparecerán aquí.</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onRequestClose={closeDeleteModal}
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
              onClick={closeDeleteModal}
              disabled={deleting}
              style={{ minWidth: 70, fontWeight: 500, fontSize: 13 }}
            >
              Cancelar
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={confirmDelete}
              disabled={deleting}
              style={{ minWidth: 80, fontWeight: 500, fontSize: 13 }}
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </Modal>
      )}

      {/* Modal para eliminar tarea archivada */}
      {showDeleteArchivedModal && (
        <Modal
          isOpen={showDeleteArchivedModal}
          onRequestClose={closeDeleteArchivedModal}
          contentLabel="Confirmar eliminación de tarea archivada"
          ariaHideApp={false}
          style={{
            content: {
              width: 400,
              height: 180,
              maxWidth: 400,
              minWidth: 300,
              margin: 'auto',
              padding: 20,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <FontAwesomeIcon icon={faExclamationTriangle} size="sm" color="#dc3545" />
            <h4 style={{ color: '#dc3545', margin: 0, fontWeight: 700, fontSize: 18 }}>¿Eliminar tarea archivada?</h4>
          </div>
          <p style={{ fontSize: 14, color: '#333', marginBottom: 16, marginTop: 0, lineHeight: 1.4 }}>
            ¿Estás seguro de que deseas eliminar permanentemente la tarea &quot;{archivedTaskToDelete?.title}&quot;?
            <br />
            <strong>Esta acción no se puede deshacer.</strong>
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 0, width: '100%' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={closeDeleteArchivedModal}
              disabled={deletingArchived}
              style={{ minWidth: 80, fontWeight: 500, fontSize: 13 }}
            >
              Cancelar
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={confirmDeleteArchived}
              disabled={deletingArchived}
              style={{ minWidth: 100, fontWeight: 500, fontSize: 13 }}
            >
              {deletingArchived ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TaskList;
