import React, { useState } from 'react';
import { updateMemberRole } from './work-group.api';
import { IWorkGroupMember } from './work-group.model';
import './manage-roles-modal.scss';

interface ManageRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  workGroupId: number;
  members: IWorkGroupMember[];
  currentUserRole?: string;
  onRoleUpdated: () => void;
}

const ManageRolesModal = ({ isOpen, onClose, workGroupId, members, currentUserRole, onRoleUpdated }: ManageRolesModalProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string>('');

  // Filtrar miembros que pueden ser gestionados según el rol del usuario actual
  const getManageableMembers = () => {
    if (currentUserRole === 'OWNER') {
      // El owner puede gestionar moderadores y miembros, pero no a sí mismo
      return members.filter(member => member.role !== 'OWNER');
    } else if (currentUserRole === 'MODERADOR') {
      // Los moderadores solo pueden gestionar miembros
      return members.filter(member => member.role === 'MIEMBRO');
    }
    return [];
  };

  const manageableMembers = getManageableMembers();

  const canPromoteToModerator = (member: IWorkGroupMember) => {
    if (currentUserRole === 'OWNER') {
      return member.role === 'MIEMBRO';
    }
    return false;
  };

  const canDemoteToMember = (member: IWorkGroupMember) => {
    if (currentUserRole === 'OWNER') {
      return member.role === 'MODERADOR';
    }
    return false;
  };

  const handleRoleChange = async (memberLogin: string, newRole: string) => {
    try {
      setLoading(memberLogin);
      setError('');

      await updateMemberRole(workGroupId, memberLogin, newRole);
      onRoleUpdated();
    } catch (err: any) {
      console.error('Error al actualizar el rol:', err);
      setError(err.response?.data?.message || 'Error al actualizar el rol. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(null);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'OWNER':
        return '👑 Propietario';
      case 'MODERADOR':
        return '🛡️ Moderador';
      case 'MIEMBRO':
        return '👤 Miembro';
      default:
        return role;
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Gestionar Roles</h2>
          <button className="close-button" onClick={handleClose}>
            <span>×</span>
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-section">
              <div className="error-icon">❌</div>
              <div className="error-text">{error}</div>
            </div>
          )}

          <div className="info-section">
            <div className="info-icon">ℹ️</div>
            <div className="info-text">
              <strong>Permisos:</strong>
              {currentUserRole === 'OWNER' && ' Puedes promover miembros a moderadores y degradar moderadores a miembros.'}
              {currentUserRole === 'MODERADOR' && ' Solo puedes gestionar miembros del grupo.'}
            </div>
          </div>

          {manageableMembers.length === 0 ? (
            <div className="empty-section">
              <div className="empty-icon">👥</div>
              <div className="empty-title">No hay miembros para gestionar</div>
              <div className="empty-description">
                {currentUserRole === 'OWNER'
                  ? 'Todos los miembros son propietarios o no hay moderadores/miembros para gestionar.'
                  : 'No hay miembros que puedas gestionar con tu rol actual.'}
              </div>
            </div>
          ) : (
            <div className="members-list">
              {manageableMembers.map(member => (
                <div key={member.id} className="member-item">
                  <div className="member-info">
                    <div className="member-avatar">
                      <span className="avatar-text">
                        {member.firstName
                          ? member.firstName.charAt(0).toUpperCase()
                          : member.lastName
                            ? member.lastName.charAt(0).toUpperCase()
                            : member.login.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="member-details">
                      <div className="member-name">
                        {member.firstName && member.lastName ? `${member.firstName} ${member.lastName}` : member.login}
                      </div>
                      <div className="member-login">@{member.login}</div>
                      <div className="member-role">{getRoleDisplayName(member.role)}</div>
                    </div>
                  </div>

                  <div className="member-actions">
                    {canPromoteToModerator(member) && (
                      <button
                        className="promote-btn"
                        onClick={() => handleRoleChange(member.login, 'MODERADOR')}
                        disabled={loading === member.login}
                      >
                        {loading === member.login ? 'Promoviendo...' : '🛡️ Promover a Moderador'}
                      </button>
                    )}

                    {canDemoteToMember(member) && (
                      <button
                        className="demote-btn"
                        onClick={() => handleRoleChange(member.login, 'MIEMBRO')}
                        disabled={loading === member.login}
                      >
                        {loading === member.login ? 'Degradando...' : '👤 Degradar a Miembro'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={handleClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageRolesModal;
