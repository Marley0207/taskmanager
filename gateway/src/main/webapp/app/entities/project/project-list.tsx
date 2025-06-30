import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faEye, faUsers, faFilter, faTimes } from '@fortawesome/free-solid-svg-icons';
import { getProjects, getProjectsByWorkGroup, deleteProject } from './project.api';
import { IProject } from './project.model';
import { getWorkGroups, getMyWorkGroups } from '../work-group/work-group.api';
import { IWorkGroup } from '../work-group/work-group.model';
import './project-list.scss';
import { useAppSelector } from 'app/config/store';

const ProjectList = () => {
  const [projectList, setProjectList] = useState<IProject[]>([]);
  const [workGroups, setWorkGroups] = useState<IWorkGroup[]>([]);
  const [selectedWorkGroup, setSelectedWorkGroup] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const account = useAppSelector(state => state.authentication.account);

  useEffect(() => {
    let isMounted = true;

    const isAdmin = account && account.authorities && account.authorities.includes('ROLE_ADMIN');

    const loadInitialData = async () => {
      try {
        const [projectsResponse, workGroupsResponse] = await Promise.all([getProjects(), isAdmin ? getWorkGroups() : getMyWorkGroups()]);

        if (isMounted) {
          setProjectList(projectsResponse.data);
          setWorkGroups(workGroupsResponse.data);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [account]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const response = await getProjects();
      setProjectList(response.data);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectsByWorkGroup = async (groupId: number) => {
    setLoading(true);
    try {
      const response = await getProjectsByWorkGroup(groupId);
      setProjectList(response.data);
    } catch (error) {
      console.error('Error loading projects by work group:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkGroupChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const groupId = parseInt(event.target.value, 10);
    setSelectedWorkGroup(groupId);
    if (groupId) {
      loadProjectsByWorkGroup(groupId);
    } else {
      loadProjects();
    }
  };

  const clearFilter = () => {
    setSelectedWorkGroup(null);
    loadProjects();
  };

  const handleDeleteClick = (id: number) => {
    setProjectToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteProject(id);
      if (selectedWorkGroup) {
        await loadProjectsByWorkGroup(selectedWorkGroup);
      } else {
        await loadProjects();
      }
      return true;
    } catch (error) {
      console.error('Error deleting project:', error);
      return false;
    }
  };

  const confirmDelete = async () => {
    if (projectToDelete !== null) {
      const deleted = await handleDelete(projectToDelete);
      setShowDeleteModal(false);
      setProjectToDelete(null);
      if (deleted) {
        setAlertMessage('Proyecto eliminado exitosamente');
        setTimeout(() => setAlertMessage(null), 1500);
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProjectToDelete(null);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES');
  };

  const getSelectedWorkGroupName = () => {
    if (!selectedWorkGroup) return null;
    return workGroups.find(wg => wg.id === selectedWorkGroup)?.name;
  };

  // Filtrado de proyectos según el rol del usuario
  const isUserOnly =
    account && account.authorities && account.authorities.includes('ROLE_USER') && !account.authorities.includes('ROLE_ADMIN');
  const filteredProjectList = isUserOnly
    ? projectList.filter(project => project.members && project.members.some(member => member.login === account.login))
    : projectList;

  return (
    <div className="project-list-container">
      <div className="project-list-header">
        <h2>Proyectos</h2>
        <div className="project-list-actions">
          <div className="filter-section">
            <FontAwesomeIcon icon={faFilter} className="filter-icon" />
            <select value={selectedWorkGroup || ''} onChange={handleWorkGroupChange} className="work-group-filter">
              <option value="">Todos los grupos de trabajo</option>
              {workGroups.map(workGroup => (
                <option key={`workgroup-${workGroup.id}`} value={workGroup.id}>
                  {workGroup.name}
                </option>
              ))}
            </select>
            {selectedWorkGroup && (
              <button onClick={clearFilter} className="btn btn-sm btn-outline-secondary clear-filter">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}
          </div>
          <Link to="create" className="btn btn-primary">
            <FontAwesomeIcon icon={faPlus} /> Nuevo Proyecto
          </Link>
        </div>
      </div>

      {selectedWorkGroup && (
        <div className="active-filter">
          <FontAwesomeIcon icon={faFilter} />
          <span>
            Filtrando por: <strong>{getSelectedWorkGroupName()}</strong>
          </span>
          <span className="project-count">({filteredProjectList.length} proyectos)</span>
        </div>
      )}

      {alertMessage && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          {alertMessage}
        </div>
      )}

      {loading ? (
        <div className="loading">Cargando proyectos...</div>
      ) : (
        <div className="project-grid">
          {filteredProjectList.length === 0 ? (
            <div className="no-projects">
              <p>{selectedWorkGroup ? `No hay proyectos en el grupo "${getSelectedWorkGroupName()}"` : 'No hay proyectos disponibles.'}</p>
              <Link to="create" className="btn btn-primary">
                {selectedWorkGroup ? 'Crear proyecto en este grupo' : 'Crear primer proyecto'}
              </Link>
            </div>
          ) : (
            filteredProjectList.map(project => (
              <div key={`project-${project.id}`} className="project-card">
                <div className="project-card-header">
                  <h3>{project.title}</h3>
                  <div className="project-card-actions">
                    <Link to={`${project.id}/details`} className="btn btn-sm btn-info">
                      <FontAwesomeIcon icon={faEye} />
                    </Link>
                    <Link to={`${project.id}/edit`} className="btn btn-sm btn-warning">
                      <FontAwesomeIcon icon={faEdit} />
                    </Link>
                    <button onClick={() => handleDeleteClick(project.id)} className="btn btn-sm btn-danger">
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                  </div>
                </div>
                <div className="project-card-body">
                  <p className="project-description">{project.description || 'Sin descripción'}</p>
                  <div className="project-meta">
                    <div className="work-group-info">
                      <strong>Grupo:</strong> {project.workGroup.name}
                    </div>
                    <div className="members-info">
                      <FontAwesomeIcon icon={faUsers} />
                      <span>{project.members?.length || 0} miembros</span>
                    </div>
                    {project.createdAt && (
                      <div className="created-date">
                        <strong>Creado:</strong> {formatDate(project.createdAt)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <div className="custom-modal-overlay">
          <div className="custom-modal-content">
            <div className="custom-modal-header">
              <span className="custom-modal-icon">⚠️</span>
              <h4>¿Estás seguro de que deseas eliminar este proyecto?</h4>
            </div>
            <div className="custom-modal-actions">
              <button onClick={confirmDelete} className="btn btn-danger">
                Eliminar
              </button>
              <button onClick={cancelDelete} className="btn btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
