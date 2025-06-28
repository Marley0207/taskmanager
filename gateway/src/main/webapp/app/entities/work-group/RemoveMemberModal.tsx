import React, { useState } from 'react';
import { removeMemberFromWorkGroup } from './work-group.api';
import { IWorkGroupMember } from './work-group.model';
import './remove-member-modal.scss';

interface RemoveMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  workGroupId: number;
  onMemberRemoved: () => void;
  members: IWorkGroupMember[];
  groupOwner?: {
    id: number;
    login: string;
    firstName?: string;
    lastName?: string;
  };
  currentUserRole?: 'OWNER' | 'MODERADOR' | 'MIEMBRO';
}

const RemoveMemberModal = ({
  isOpen,
  onClose,
  workGroupId,
  onMemberRemoved,
  members,
  groupOwner,
  currentUserRole,
}: RemoveMemberModalProps) => {
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string>('');

  const handleUserToggle = (userId: number) => {
    const member = members.find(m => m.id === userId);
    if (!member) return;

    // Prevenir que el propietario se seleccione para eliminar
    if (member.role === 'OWNER') {
      setError('No puedes eliminar al propietario del grupo');
      return;
    }

    // Si el usuario actual es MODERADOR, no puede eliminar otros moderadores
    if (currentUserRole === 'MODERADOR' && member.role === 'MODERADOR') {
      setError('Los moderadores no pueden eliminar a otros moderadores');
      return;
    }

    setError(''); // Limpiar error anterior
    setSelectedUsers(prev => (prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]));
  };

  const handleRemoveMembers = async () => {
    if (selectedUsers.length === 0) return;

    try {
      setLoading(true);
      setError('');

      for (const userId of selectedUsers) {
        try {
          await removeMemberFromWorkGroup(workGroupId, userId);
        } catch (removeError: any) {
          console.error(`Error al eliminar usuario ${userId}:`, removeError.response?.data || removeError.message);

          // Manejar el error específico del propietario
          if (removeError.response?.data?.message === 'error.owner-self-delete') {
            setError('No puedes eliminar al propietario del grupo. El propietario debe transferir la propiedad antes de salir.');
            return;
          }

          throw removeError;
        }
      }
      setSelectedUsers([]);
      onMemberRemoved();
      onClose();
    } catch (removeError: any) {
      console.error('Error al eliminar miembros:', removeError);
      console.error('Detalles del error:', removeError.response?.data);
      console.error('Status:', removeError.response?.status);

      if (!removeError.response?.data?.message) {
        setError('Error al eliminar miembros. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(
    user =>
      user.login.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.firstName && user.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.lastName && user.lastName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Eliminar Miembros del Grupo</h2>
          <button className="close-button" onClick={onClose}>
            <span>×</span>
          </button>
        </div>

        <div className="modal-body">
          <div className="warning-section">
            <div className="warning-icon">⚠️</div>
            <div className="warning-text">
              <strong>Advertencia:</strong> Al eliminar miembros del grupo, estos perderán acceso a todas las tareas y recursos asociados a
              este grupo de trabajo.
            </div>
          </div>

          {error && (
            <div className="error-section">
              <div className="error-icon">❌</div>
              <div className="error-text">{error}</div>
            </div>
          )}

          <div className="search-section">
            <div className="search-input">
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="Buscar miembros..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>

          <div className="members-section">
            <div className="section-title">Miembros del Grupo ({filteredMembers.length})</div>

            {filteredMembers.length === 0 ? (
              <div className="empty-members">
                <div className="empty-icon">👤</div>
                <div className="empty-text">
                  {searchTerm ? 'No se encontraron miembros con ese criterio' : 'No hay miembros en el grupo'}
                </div>
              </div>
            ) : (
              <div className="members-list">
                {filteredMembers.map(user => {
                  const isOwner = user.role === 'OWNER';
                  const isModerator = user.role === 'MODERADOR';
                  const canSelect = !isOwner && (currentUserRole === 'OWNER' || (currentUserRole === 'MODERADOR' && !isModerator));

                  return (
                    <div
                      key={user.id}
                      className={`member-item ${selectedUsers.includes(user.id) ? 'selected' : ''} ${isOwner ? 'owner' : ''} ${isModerator ? 'moderator' : ''} ${!canSelect ? 'disabled' : ''}`}
                      onClick={() => canSelect && handleUserToggle(user.id)}
                    >
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
                      <div className="selection-indicator">
                        {selectedUsers.includes(user.id) && <span className="check-icon">✓</span>}
                        {isOwner && <span className="owner-icon">👑</span>}
                        {isModerator && <span className="moderator-icon">🛡️</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="selected-summary">
            {selectedUsers.length > 0 && (
              <div className="summary-text">
                {selectedUsers.length} {selectedUsers.length === 1 ? 'miembro seleccionado' : 'miembros seleccionados'} para eliminar
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="remove-btn" onClick={handleRemoveMembers} disabled={selectedUsers.length === 0 || loading}>
            {loading ? 'Eliminando...' : `Eliminar ${selectedUsers.length} ${selectedUsers.length === 1 ? 'miembro' : 'miembros'}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RemoveMemberModal;
