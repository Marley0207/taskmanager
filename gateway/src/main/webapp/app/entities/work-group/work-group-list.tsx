import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWorkGroups } from './work-group.api';
import { IWorkGroup } from './work-group.model';
import EditWorkGroupModal from './EditWorkGroupModal';
import './work-group-list.scss';

const WorkGroupList = () => {
  const [workGroups, setWorkGroups] = useState<IWorkGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkGroup, setSelectedWorkGroup] = useState<IWorkGroup | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const navigate = useNavigate();

  const loadWorkGroups = () => {
    setLoading(true);
    getWorkGroups()
      .then(response => {
        setWorkGroups(response.data);
      })
      .catch(error => {
        console.error('Error en getWorkGroups:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadWorkGroups();
  }, []);

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
          <div className="empty-title">No hay grupos de trabajo</div>
          <div className="empty-description">No se encontraron grupos de trabajo para mostrar en este momento.</div>
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
            <div className="subtitle">Gestiona y visualiza todos los grupos de trabajo de tu organización</div>
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
    </div>
  );
};

export default WorkGroupList;
