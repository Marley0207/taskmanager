import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from 'app/config/store';
import { getActiveWorkGroups, getMyActiveWorkGroups, softDeleteWorkGroup } from './work-group.api';
import { IWorkGroup } from './work-group.model';
import EditWorkGroupModal from './EditWorkGroupModal';
import './work-group-list.scss';
import Modal from 'react-modal';

const WorkGroupList = () => {
  const [workGroups, setWorkGroups] = useState<IWorkGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkGroup, setSelectedWorkGroup] = useState<IWorkGroup | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [workGroupToDelete, setWorkGroupToDelete] = useState<IWorkGroup | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  // Obtener información del usuario actual desde Redux
  const account = useAppSelector(state => state.authentication.account);
  const isAuthenticated = useAppSelector(state => state.authentication.isAuthenticated);

  // Verificar si el usuario es administrador
  const isAdmin = () => {
    if (!account || !account.authorities) return false;
    return account.authorities.some((authority: any) => authority === 'ROLE_ADMIN');
  };

  const loadWorkGroups = () => {
    setLoading(true);

    // Si es admin, cargar todos los grupos, sino solo los del usuario
    const apiCall = isAdmin() ? getActiveWorkGroups() : getMyActiveWorkGroups();

    apiCall
      .then(response => {
        setWorkGroups(response.data);
      })
      .catch(error => {
        console.error('Error al cargar grupos de trabajo:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadWorkGroups();
    }
  }, [isAuthenticated]);

  const handleEditWorkGroup = (workGroup: IWorkGroup) => {
    setSelectedWorkGroup(workGroup);
    setIsEditModalOpen(true);
  };

  const handleWorkGroupUpdated = () => {
    loadWorkGroups(); // Recargar la lista después de editar
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedWorkGroup(null);
  };

  const handleDeleteClick = (workGroup: IWorkGroup) => {
    setWorkGroupToDelete(workGroup);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!workGroupToDelete) return;
    setDeleting(true);
    try {
      await softDeleteWorkGroup(workGroupToDelete.id);
      setShowDeleteModal(false);
      setWorkGroupToDelete(null);
      loadWorkGroups(); // Recargar la lista
    } catch (error) {
      console.error('Error al eliminar el grupo de trabajo:', error);
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setWorkGroupToDelete(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="work-group-list">
        <div className="empty-state">
          <div className="empty-icon">🔐</div>
          <div className="empty-title">Acceso Requerido</div>
          <div className="empty-description">Debes iniciar sesión para ver los grupos de trabajo.</div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="work-group-list">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <div className="loading-text">Cargando grupos de trabajo...</div>
        </div>
      </div>
    );
  }

  if (!workGroups || workGroups.length === 0) {
    return (
      <div className="work-group-list">
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <div className="empty-title">{isAdmin() ? 'No hay grupos de trabajo' : 'No perteneces a ningún grupo'}</div>
          <div className="empty-description">
            {isAdmin()
              ? 'No se encontraron grupos de trabajo para mostrar en este momento.'
              : 'No perteneces a ningún grupo de trabajo. Contacta a un administrador para ser añadido a un grupo.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="work-group-list">
      <div className="work-group-header">
        <div className="header-content">
          <div className="title-section">
            <h2>Grupos de Trabajo</h2>
            <div className="subtitle">
              {isAdmin() ? 'Gestiona y visualiza todos los grupos de trabajo de la organización' : 'Grupos de trabajo a los que perteneces'}
            </div>
            {isAdmin() && (
              <div className="admin-badge">
                <span className="badge-icon">👑</span>
                <span className="badge-text">Vista de Administrador</span>
              </div>
            )}
          </div>
          <button className="create-workgroup-btn" onClick={() => navigate('/work-groups/create')}>
            <span className="btn-icon">👥</span>
            <span className="btn-text">Crear Nuevo Grupo</span>
          </button>
        </div>
      </div>

      <div className="work-groups-grid">
        {workGroups.map(wg => (
          <div key={wg.id} className="work-group-card">
            <span className="work-group-icon">👥</span>
            <div className="work-group-name">{wg.name}</div>
            <div className="work-group-description">{wg.description}</div>
            <div className="work-group-actions">
              <button
                className="action-btn"
                onClick={() => {
                  console.warn('Botón clickeado para grupo:', wg.name, 'ID:', wg.id);
                  if (wg.id) {
                    console.warn('Navegando a:', `/work-groups/${wg.id}/details`);
                    navigate(`/work-groups/${wg.id}/details`);
                  } else {
                    console.warn('No hay ID para el grupo:', wg);
                  }
                }}
              >
                <span>👁️</span>
                Ver detalles
              </button>
              <button className="action-btn" onClick={() => handleEditWorkGroup(wg)}>
                <span>✏️</span>
                Editar
              </button>
              {isAdmin() && (
                <button className="action-btn danger" onClick={() => handleDeleteClick(wg)}>
                  <span>🗑️</span>
                  Eliminar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedWorkGroup && (
        <EditWorkGroupModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          workGroup={selectedWorkGroup}
          onWorkGroupUpdated={handleWorkGroupUpdated}
        />
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onRequestClose={cancelDelete}
          contentLabel="Confirmar eliminación de grupo de trabajo"
          ariaHideApp={false}
          style={{
            content: {
              width: 400,
              height: 200,
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
            <span style={{ fontSize: 24 }}>⚠️</span>
            <h4 style={{ color: '#dc3545', margin: 0, fontWeight: 700, fontSize: 18 }}>¿Eliminar grupo de trabajo?</h4>
          </div>
          <p style={{ fontSize: 14, color: '#333', marginBottom: 16, marginTop: 0, lineHeight: 1.4 }}>
            ¿Estás seguro de que deseas eliminar el grupo &quot;{workGroupToDelete?.name}&quot;?
            <br />
            Esta acción ocultará el grupo pero no eliminará los datos permanentemente.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 0, width: '100%' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={cancelDelete}
              disabled={deleting}
              style={{ minWidth: 80, fontWeight: 500, fontSize: 13 }}
            >
              Cancelar
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleDelete}
              disabled={deleting}
              style={{ minWidth: 100, fontWeight: 500, fontSize: 13 }}
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default WorkGroupList;
