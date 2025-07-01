import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEdit,
  faTrash,
  faArrowLeft,
  faUsers,
  faCalendar,
  faUser,
  faEnvelope,
  faUserPlus,
  faCheck,
  faExclamationTriangle,
  faList,
} from '@fortawesome/free-solid-svg-icons';
import { getProject, deleteProject, addMemberToProject, removeMemberFromProject, getProjectMembers } from './project.api';
import { getAvailableWorkGroupMembers } from './project.api';
import { IProject, IProjectMember } from './project.model';
import { getWorkGroupMembers } from '../work-group/work-group.api';
import './project-details.scss';

const ProjectDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Estados simples
  const [project, setProject] = useState<IProject | null>(null);
  const [projectMembers, setProjectMembers] = useState<IProjectMember[]>([]);
  const [availableMembers, setAvailableMembers] = useState<IProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [groupMembers, setGroupMembers] = useState<IProjectMember[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    console.warn('ProjectDetails mounted, id:', id);
    if (!id) return;

    const loadData = async () => {
      setLoading(true);
      try {
        // Cargar proyecto
        const projectData = await getProject(parseInt(id, 10));
        console.warn('Project loaded:', projectData.data);
        setProject(projectData.data);

        // Cargar miembros del proyecto
        const membersData = await getProjectMembers(parseInt(id, 10));
        setProjectMembers(membersData.data);

        // Cargar miembros del grupo de trabajo (disponibles para añadir)
        if (projectData.data.workGroup?.id) {
          const groupMembersData = await getWorkGroupMembers(projectData.data.workGroup.id);
          // Solo usuarios (extrae el campo user si la respuesta es {user, role})
          setAvailableMembers(groupMembersData.data.map((item: any) => item.user || item));
        }
      } catch (err) {
        console.warn('Error loading data:', err);
        setError('Error al cargar los datos del proyecto');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  // Función para recargar datos
  const reloadData = async () => {
    if (!id) return;

    try {
      const [projectData, membersData] = await Promise.all([getProject(parseInt(id, 10)), getProjectMembers(parseInt(id, 10))]);

      setProject(projectData.data);
      setProjectMembers(membersData.data);
    } catch (err) {
      console.error('Error reloading data:', err);
    }
  };

  // Eliminar proyecto
  const handleDelete = async () => {
    if (!id || !window.confirm('¿Estás seguro de que quieres eliminar este proyecto?')) return;

    try {
      await deleteProject(parseInt(id, 10));
      navigate('/projects');
    } catch (err) {
      console.error('Error deleting project:', err);
      setMessage({ type: 'error', text: 'Error al eliminar el proyecto' });
    }
  };

  // Agregar miembro
  const handleAddMember = async () => {
    if (!selectedMember || !id) return;

    setProcessing(true);
    setMessage(null);

    try {
      await addMemberToProject(parseInt(id, 10), selectedMember);

      // Recargar datos
      await reloadData();

      // Limpiar modal
      setSelectedMember('');
      setShowModal(false);

      setMessage({ type: 'success', text: 'Usuario asignado exitosamente al proyecto' });

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error adding member:', err);
      setMessage({
        type: 'error',
        text: 'Error al asignar el usuario al proyecto. Verifique que el usuario pertenezca al grupo de trabajo.',
      });
    } finally {
      setProcessing(false);
    }
  };

  // Remover miembro
  const handleRemoveMember = async (userId: number) => {
    if (!id || !window.confirm('¿Estás seguro de que quieres remover este miembro del proyecto?')) return;

    try {
      await removeMemberFromProject(parseInt(id, 10), userId);

      // Recargar datos
      await reloadData();

      setMessage({ type: 'success', text: 'Miembro removido exitosamente del proyecto' });

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error removing member:', err);
      setMessage({ type: 'error', text: 'Error al remover el miembro del proyecto' });
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Obtener miembros disponibles para selección
  const getAvailableMembersForSelection = () => {
    if (!projectMembers.length) return availableMembers;
    return availableMembers.filter(member => !projectMembers.some(pm => pm.id === member.id));
  };

  // Renderizar loading
  if (loading) return <div>Cargando...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!project) return <div>No se encontró el proyecto</div>;

  return (
    <div className="project-details-container">
      {/* Mensaje de feedback */}
      {message && (
        <div className={`message ${message.type}`}>
          <FontAwesomeIcon icon={message.type === 'success' ? faCheck : faExclamationTriangle} />
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="close-message">
            ×
          </button>
        </div>
      )}

      {/* Header */}
      <div className="project-details-header">
        <div className="project-details-title">
          <Link to="/projects" className="btn btn-secondary btn-sm">
            <FontAwesomeIcon icon={faArrowLeft} /> Volver
          </Link>
          <h1>{project.title}</h1>
        </div>
        <div className="project-details-actions">
          <button onClick={() => navigate(`/tasks?projectId=${project.id}`)} className="btn btn-primary">
            <FontAwesomeIcon icon={faList} /> Ver Tareas
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div className="project-details-content">
        {/* Información del proyecto */}
        <div className="project-info-section">
          <h3>Información del Proyecto</h3>
          <div className="project-info-grid">
            <div className="info-item">
              <label>Título:</label>
              <span>{project.title}</span>
            </div>
            <div className="info-item">
              <label>Descripción:</label>
              <span>{project.description || 'Sin descripción'}</span>
            </div>
            <div className="info-item">
              <label>Grupo de Trabajo:</label>
              <span>{project.workGroup?.name}</span>
            </div>
            {project.createdBy && (
              <div className="info-item">
                <label>Creado por:</label>
                <span>
                  <FontAwesomeIcon icon={faUser} />
                  {project.createdBy.firstName} {project.createdBy.lastName} ({project.createdBy.login})
                </span>
              </div>
            )}
            {project.createdAt && (
              <div className="info-item">
                <label>Fecha de creación:</label>
                <span>
                  <FontAwesomeIcon icon={faCalendar} />
                  {formatDate(project.createdAt)}
                </span>
              </div>
            )}
            {project.updatedAt && (
              <div className="info-item">
                <label>Última actualización:</label>
                <span>
                  <FontAwesomeIcon icon={faCalendar} />
                  {formatDate(project.updatedAt)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Sección de miembros */}
        <div className="project-members-section">
          <div className="members-header">
            <h3>
              <FontAwesomeIcon icon={faUsers} /> Miembros del Proyecto ({projectMembers.length})
            </h3>
            {getAvailableMembersForSelection().length > 0 && (
              <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm">
                <FontAwesomeIcon icon={faUserPlus} /> Agregar Miembro
              </button>
            )}
          </div>

          {/* Lista de miembros */}
          {projectMembers.length > 0 ? (
            <div className="members-list">
              {projectMembers.map(member => (
                <div key={`member-${member.id}`} className="member-item">
                  <div className="member-info">
                    <div className="member-avatar">
                      <FontAwesomeIcon icon={faUser} />
                    </div>
                    <div className="member-details">
                      <div className="member-name">
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="member-login">{member.login}</div>
                      {member.email && (
                        <div className="member-email">
                          <FontAwesomeIcon icon={faEnvelope} />
                          {member.email}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="member-actions">
                    <button onClick={() => handleRemoveMember(member.id)} className="btn btn-danger btn-sm" title="Remover del proyecto">
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-members">
              <p>No hay miembros asignados a este proyecto.</p>
              {getAvailableMembersForSelection().length > 0 && (
                <button onClick={() => setShowModal(true)} className="btn btn-primary">
                  <FontAwesomeIcon icon={faUserPlus} /> Agregar primer miembro
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal para agregar miembros */}
      {showModal && (
        <div className="modal-overlay" onClick={() => !processing && setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Agregar Miembro al Proyecto</h4>
              <button onClick={() => !processing && setShowModal(false)} className="btn btn-sm btn-secondary" disabled={processing}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="memberSelect">Seleccionar miembro del grupo:</label>
                <select
                  id="memberSelect"
                  value={selectedMember}
                  onChange={e => setSelectedMember(e.target.value)}
                  className="form-control"
                  disabled={processing}
                >
                  <option value="">Seleccione un miembro</option>
                  {getAvailableMembersForSelection()
                    .filter(member => member.id !== undefined && member.login !== undefined)
                    .map(member => (
                      <option key={`option-${member.id}`} value={member.login}>
                        {member.login}
                      </option>
                    ))}
                </select>
                <small className="form-text text-muted">
                  Solo se muestran miembros del grupo de trabajo que no están asignados al proyecto
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={handleAddMember} className="btn btn-primary" disabled={!selectedMember || processing}>
                {processing ? (
                  <>
                    <FontAwesomeIcon icon={faCheck} spin /> Asignando...
                  </>
                ) : (
                  'Agregar'
                )}
              </button>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary" disabled={processing}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
