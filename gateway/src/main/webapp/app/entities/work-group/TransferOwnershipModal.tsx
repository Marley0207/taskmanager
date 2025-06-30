import React, { useState } from 'react';
import { transferOwnership } from './work-group.api';
import { IWorkGroupMember } from './work-group.model';
import './transfer-ownership-modal.scss';

interface TransferOwnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
  workGroupId: number;
  members: IWorkGroupMember[];
  currentUser: IWorkGroupMember | null;
  onOwnershipTransferred: () => void;
}

const TransferOwnershipModal = ({
  isOpen,
  onClose,
  workGroupId,
  members,
  currentUser,
  onOwnershipTransferred,
}: TransferOwnershipModalProps) => {
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Filtrar miembros que pueden recibir la propiedad (excluyendo al owner actual)
  const eligibleMembers = members.filter(member => member.role !== 'OWNER' && member.login !== currentUser?.login);

  const handleTransferOwnership = async () => {
    if (!selectedMember) {
      setError('Debes seleccionar un miembro para transferir la propiedad.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Transferir la propiedad (el backend se encarga de convertir al owner actual en moderador)
      await transferOwnership(workGroupId, selectedMember);

      // No llamar a leaveWorkGroup - el owner actual permanece en el grupo como moderador
      onOwnershipTransferred();
      onClose();
    } catch (err: any) {
      console.error('Error al transferir la propiedad:', err);
      setError(err.response?.data?.message || 'Error al transferir la propiedad. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleMemberSelect = (memberLogin: string) => {
    setSelectedMember(memberLogin);
    setError('');
  };

  const handleConfirmTransfer = () => {
    if (selectedMember) {
      setShowConfirmation(true);
    }
  };

  const handleCancel = () => {
    setSelectedMember(null);
    setError('');
    setShowConfirmation(false);
    onClose();
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'MODERADOR':
        return '🛡️ Moderador';
      case 'MIEMBRO':
        return '👤 Miembro';
      default:
        return role;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Transferir Propiedad del Grupo</h2>
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
              <strong>¡Atención!</strong> Al transferir la propiedad del grupo:
              <ul>
                <li>El miembro seleccionado se convertirá en el nuevo propietario</li>
                <li>Tu rol cambiará de OWNER a MODERADOR</li>
                <li>Permanecerás en el grupo con privilegios de moderador</li>
                <li>Podrás salir del grupo más tarde si lo deseas</li>
                <li>Esta acción no se puede deshacer</li>
              </ul>
            </div>
          </div>

          {eligibleMembers.length === 0 ? (
            <div className="empty-section">
              <div className="empty-icon">👥</div>
              <div className="empty-title">No hay miembros elegibles</div>
              <div className="empty-description">No hay otros miembros en el grupo a los que puedas transferir la propiedad.</div>
            </div>
          ) : (
            <>
              <div className="selection-section">
                <h3>Selecciona el nuevo propietario:</h3>
                <div className="members-list">
                  {eligibleMembers.map(member => (
                    <div
                      key={member.login}
                      className={`member-item ${selectedMember === member.login ? 'selected' : ''}`}
                      onClick={() => handleMemberSelect(member.login)}
                    >
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
                      <div className="selection-indicator">{selectedMember === member.login && <span className="check-icon">✓</span>}</div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedMember && !showConfirmation && (
                <div className="confirmation-section">
                  <button className="confirm-btn" onClick={handleConfirmTransfer} disabled={loading}>
                    Continuar con la Transferencia
                  </button>
                </div>
              )}

              {showConfirmation && (
                <div className="final-confirmation">
                  <div className="confirmation-icon">🔒</div>
                  <div className="confirmation-text">
                    <strong>Confirmación Final</strong>
                    <p>¿Estás seguro de que quieres transferir la propiedad del grupo?</p>
                    <p>Tu rol cambiará a moderador y permanecerás en el grupo.</p>
                  </div>
                  <div className="confirmation-actions">
                    <button className="cancel-btn" onClick={() => setShowConfirmation(false)} disabled={loading}>
                      Cancelar
                    </button>
                    <button className="transfer-btn" onClick={handleTransferOwnership} disabled={loading}>
                      {loading ? 'Transferiendo...' : 'Sí, Transferir Propiedad'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={handleCancel} disabled={loading}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferOwnershipModal;
