import React, { useState } from 'react';
import { leaveWorkGroup } from './work-group.api';
import './leave-group-modal.scss';

interface LeaveGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  workGroupId: number;
  groupName: string;
  currentUserRole?: string;
  onGroupLeft: () => void;
}

const LeaveGroupModal = ({ isOpen, onClose, workGroupId, groupName, currentUserRole, onGroupLeft }: LeaveGroupModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleLeaveGroup = async () => {
    try {
      setLoading(true);
      setError('');

      await leaveWorkGroup(workGroupId);
      onGroupLeft();
      onClose();
    } catch (err: any) {
      console.error('Error al salir del grupo:', err);
      setError(err.response?.data?.message || 'Error al salir del grupo. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setError('');
    onClose();
  };

  const getRoleDisplayName = (role?: string) => {
    switch (role) {
      case 'MODERADOR':
        return '🛡️ Moderador';
      case 'MIEMBRO':
        return '👤 Miembro';
      default:
        return role || 'Desconocido';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Salir del Grupo</h2>
          <button className="close-button" onClick={handleCancel}>
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

          <div className="warning-section">
            <div className="warning-icon">⚠️</div>
            <div className="warning-text">
              <strong>¿Estás seguro de que quieres salir del grupo?</strong>
              <ul>
                <li>Perderás acceso a todas las funcionalidades del grupo</li>
                <li>Tu rol actual: {getRoleDisplayName(currentUserRole)}</li>
                <li>No podrás volver a entrar sin ser invitado nuevamente</li>
                <li>Esta acción no se puede deshacer</li>
              </ul>
            </div>
          </div>

          <div className="group-info">
            <div className="group-icon">👥</div>
            <div className="group-details">
              <div className="group-name">{groupName}</div>
              <div className="group-id">ID: {workGroupId}</div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={handleCancel} disabled={loading}>
            Cancelar
          </button>
          <button className="leave-btn" onClick={handleLeaveGroup} disabled={loading}>
            {loading ? 'Saliendo...' : 'Sí, Salir del Grupo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveGroupModal;
