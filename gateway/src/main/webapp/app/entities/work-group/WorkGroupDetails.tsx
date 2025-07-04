import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAppSelector } from 'app/config/store';
import AddMemberModal from './AddMemberModal';
import RemoveMemberModal from './RemoveMemberModal';
import ManageRolesModal from './ManageRolesModal';
import TransferOwnershipModal from './TransferOwnershipModal';
import LeaveGroupModal from './LeaveGroupModal';
import './work-group-details.scss';
import { IWorkGroup, IWorkGroupMember } from './work-group.model';
import { softDeleteWorkGroup } from './work-group.api';

const WorkGroupDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [members, setMembers] = useState<IWorkGroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupName, setGroupName] = useState('');
  const [groupOwner, setGroupOwner] = useState<IWorkGroup['owner']>();
  const [currentUser, setCurrentUser] = useState<IWorkGroupMember | null>(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isRemoveMemberModalOpen, setIsRemoveMemberModalOpen] = useState(false);
  const [isManageRolesModalOpen, setIsManageRolesModalOpen] = useState(false);
  const [isTransferOwnershipModalOpen, setIsTransferOwnershipModalOpen] = useState(false);
  const [isLeaveGroupModalOpen, setIsLeaveGroupModalOpen] = useState(false);
  const [isDeleteGroupModalOpen, setIsDeleteGroupModalOpen] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Obtener información del usuario actual desde Redux
  const account = useAppSelector(state => state.authentication.account);
  const isAuthenticated = useAppSelector(state => state.authentication.isAuthenticated);

  const loadGroupData = async () => {
    try {
      setLoading(true);
      const [groupResponse, membersResponse] = await Promise.all([
        axios.get(`/services/taskmanager/api/work-groups/${id}`),
        axios.get(`/services/taskmanager/api/work-groups/${id}/members`),
      ]);
      setGroupName(groupResponse.data.name);
      setGroupOwner(groupResponse.data.owner);

      // Adaptar la respuesta del backend: [{ user: {...}, role: 'OWNER' }]
      const mappedMembers = membersResponse.data.map((item: any) => ({
        ...item.user,
        role: item.role,
      }));
      setMembers(mappedMembers);

      if (isAuthenticated && account?.login) {
        const currentMember = mappedMembers.find((member: IWorkGroupMember) => member.login === account.login);
        setCurrentUser(currentMember || null);
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Error al obtener los datos del grupo:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para determinar si el usuario actual puede realizar acciones
  const canManageMembers = () => {
    if (!currentUser || !currentUser.role) return false;
    return currentUser.role === 'OWNER' || currentUser.role === 'MODERADOR';
  };

  const canManageModerators = () => {
    if (!currentUser || !currentUser.role) return false;
    return currentUser.role === 'OWNER';
  };

  const canTransferOwnership = () => {
    if (!currentUser || !currentUser.role) return false;
    return currentUser.role === 'OWNER';
  };

  const canLeaveGroup = () => {
    if (!currentUser || !currentUser.role) return false;
    return currentUser.role !== 'OWNER';
  };

  useEffect(() => {
    loadGroupData();
  }, [id]);

  const handleMemberAdded = () => {
    loadGroupData();
  };

  const handleMemberRemoved = () => {
    loadGroupData();
  };

  const handleRoleUpdated = () => {
    loadGroupData();
  };

  const handleOwnershipTransferred = () => {
    // Recargar los datos del grupo para reflejar los cambios de rol
    loadGroupData();
  };

  const handleGroupLeft = () => {
    // Redirigir a la lista de grupos ya que el usuario salió del grupo
    navigate('/work-groups');
  };

  const openDeleteGroupModal = () => {
    setIsDeleteGroupModalOpen(true);
  };

  const closeDeleteGroupModal = () => {
    setIsDeleteGroupModalOpen(false);
  };

  const handleDeleteGroup = async () => {
    if (!id) return;
    setDeletingGroup(true);
    setMessage(null);
    try {
      await softDeleteWorkGroup(Number(id));
      setMessage({ type: 'success', text: 'Grupo eliminado exitosamente' });
      setTimeout(() => navigate('/work-groups'), 1000);
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al eliminar el grupo' });
    } finally {
      setDeletingGroup(false);
      closeDeleteGroupModal();
    }
  };

  if (loading) {
    return (
      <div className="work-group-details">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Cargando detalles del grupo...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="work-group-details">
      <div className="details-header">
        <div className="header-content" style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto' }}>
          <div className="back-button" onClick={() => navigate('/work-groups')}>
            <span className="back-icon">←</span>
            <span className="back-text">Volver a Grupos</span>
          </div>
          <div style={{ position: 'absolute', top: '0', right: '0' }}>
            <div className="back-button" onClick={() => navigate(`/work-groups/${id}/projects`)}>
              <span className="back-icon">📁</span>
              <span className="back-text">Ver Proyectos del Grupo</span>
            </div>
          </div>
          <div className="group-info">
            <div className="group-icon">👥</div>
            <div className="group-title">
              <h1>{groupName}</h1>
              <div className="member-count">
                {members.length} {members.length === 1 ? 'miembro' : 'miembros'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="details-content">
        <div className="members-section">
          <div className="section-header">
            <h2>Miembros del Grupo</h2>
            <div className="section-subtitle">Personas que forman parte de este grupo de trabajo</div>
          </div>

          {members.length === 0 ? (
            <div className="empty-members">
              <div className="empty-icon">👤</div>
              <div className="empty-title">No hay miembros asignados</div>
              <div className="empty-description">Este grupo de trabajo no tiene miembros asignados en este momento.</div>
            </div>
          ) : (
            <div className="members-grid">
              {members.map(user => {
                const isOwner = user.role === 'OWNER';
                const isModerator = user.role === 'MODERADOR';
                return (
                  <div key={user.id} className={`member-card ${isOwner ? 'owner' : ''} ${isModerator ? 'moderator' : ''}`}>
                    <div className="member-avatar">
                      <span className="avatar-text">
                        {user.firstName
                          ? user.firstName.charAt(0).toUpperCase()
                          : user.lastName
                            ? user.lastName.charAt(0).toUpperCase()
                            : user.login.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="member-info">
                      <div className="member-name">
                        {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.login}
                        {isOwner && <span className="owner-badge">👑 Propietario</span>}
                        {isModerator && <span className="moderator-badge">🛡️ Moderador</span>}
                      </div>
                      <div className="member-login">@{user.login}</div>
                      {user.email && <div className="member-email">{user.email}</div>}
                    </div>
                    <div className="member-actions">
                      <button className="action-btn">
                        <span>📧</span>
                      </button>
                      <button className="action-btn">
                        <span>👁️</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="actions-section">
          <div className="user-info-section">
            {isAuthenticated ? (
              <div className="current-user-info">
                <span className="user-label">Usuario autenticado (Keycloak):</span>
                <span className="user-name">{account?.login}</span>
                {currentUser ? (
                  <span className={`user-role ${currentUser.role?.toLowerCase() || 'unknown'}`}>
                    {currentUser.role === 'OWNER' && '👑 Propietario'}
                    {currentUser.role === 'MODERADOR' && '🛡️ Moderador'}
                    {currentUser.role === 'MIEMBRO' && '👤 Miembro'}
                    {!currentUser.role && '❓ Rol desconocido'}
                  </span>
                ) : (
                  <span className="user-role not-member">❌ No es miembro del grupo</span>
                )}
              </div>
            ) : (
              <div className="not-authenticated">
                <span>🔐 No has iniciado sesión en Keycloak</span>
                <div className="auth-hint">Inicia sesión para gestionar este grupo de trabajo</div>
              </div>
            )}
          </div>

          <div className="action-buttons">
            {canManageMembers() && (
              <button className="primary-btn" onClick={() => setIsAddMemberModalOpen(true)}>
                <span className="btn-icon">➕</span>
                <span className="btn-text">Añadir Miembro</span>
              </button>
            )}
            {canManageMembers() && (
              <button className="secondary-btn" onClick={() => setIsRemoveMemberModalOpen(true)}>
                <span className="btn-icon">🗑️</span>
                <span className="btn-text">Eliminar Miembros</span>
              </button>
            )}
            {canManageModerators() && (
              <button className="secondary-btn" onClick={() => setIsManageRolesModalOpen(true)}>
                <span className="btn-icon">👑</span>
                <span className="btn-text">Gestionar Roles</span>
              </button>
            )}
            {canTransferOwnership() && (
              <button className="warning-btn" onClick={() => setIsTransferOwnershipModalOpen(true)}>
                <span className="btn-icon">🔄</span>
                <span className="btn-text">Transferir Propiedad</span>
              </button>
            )}
            {canLeaveGroup() && (
              <button className="danger-btn" onClick={() => setIsLeaveGroupModalOpen(true)}>
                <span className="btn-icon">🚪</span>
                <span className="btn-text">Salir del Grupo</span>
              </button>
            )}
            {canTransferOwnership() && (
              <button className="danger-btn" onClick={openDeleteGroupModal}>
                <span className="btn-icon">🗑️</span>
                <span className="btn-text">Eliminar Grupo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <AddMemberModal
        isOpen={isAddMemberModalOpen}
        onClose={() => setIsAddMemberModalOpen(false)}
        workGroupId={Number(id)}
        onMemberAdded={handleMemberAdded}
        existingMembers={members}
        currentUserRole={currentUser?.role}
      />

      <RemoveMemberModal
        isOpen={isRemoveMemberModalOpen}
        onClose={() => setIsRemoveMemberModalOpen(false)}
        workGroupId={Number(id)}
        onMemberRemoved={handleMemberRemoved}
        members={members}
        groupOwner={groupOwner}
        currentUserRole={currentUser?.role}
      />

      <ManageRolesModal
        isOpen={isManageRolesModalOpen}
        onClose={() => setIsManageRolesModalOpen(false)}
        workGroupId={Number(id)}
        members={members}
        currentUserRole={currentUser?.role}
        onRoleUpdated={handleRoleUpdated}
      />

      <TransferOwnershipModal
        isOpen={isTransferOwnershipModalOpen}
        onClose={() => setIsTransferOwnershipModalOpen(false)}
        workGroupId={Number(id)}
        members={members}
        currentUser={currentUser}
        onOwnershipTransferred={handleOwnershipTransferred}
      />

      <LeaveGroupModal
        isOpen={isLeaveGroupModalOpen}
        onClose={() => setIsLeaveGroupModalOpen(false)}
        workGroupId={Number(id)}
        groupName={groupName}
        currentUserRole={currentUser?.role}
        onGroupLeft={handleGroupLeft}
      />

      {/* Modal de confirmación para eliminar grupo */}
      {isDeleteGroupModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Eliminar Grupo</h3>
            </div>
            <div className="modal-body">
              <p>
                ¿Estás seguro de que quieres eliminar el grupo <strong>&ldquo;{groupName}&rdquo;</strong>?
              </p>
              <p>Esta acción no se puede deshacer y eliminará permanentemente el grupo y todos sus datos asociados.</p>
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={closeDeleteGroupModal} disabled={deletingGroup}>
                Cancelar
              </button>
              <button className="danger-btn" onClick={handleDeleteGroup} disabled={deletingGroup}>
                {deletingGroup ? 'Eliminando...' : 'Eliminar Grupo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje de éxito/error */}
      {message && <div className={`message ${message.type}`}>{message.text}</div>}
    </div>
  );
};

export default WorkGroupDetails;
