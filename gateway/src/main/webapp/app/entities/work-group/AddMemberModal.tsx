import React, { useState, useEffect } from 'react';
import { getAvailableUsers, addMemberToWorkGroup } from './work-group.api';
import { IWorkGroupMember } from './work-group.model';
import './add-member-modal.scss';

interface IUser {
  id: number;
  login: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  workGroupId: number;
  onMemberAdded: () => void;
  existingMembers: IWorkGroupMember[];
  currentUserRole?: 'OWNER' | 'MODERADOR' | 'MIEMBRO';
  isAdmin?: boolean;
}

const AddMemberModal = ({
  isOpen,
  onClose,
  workGroupId,
  onMemberAdded,
  existingMembers,
  currentUserRole,
  isAdmin,
}: AddMemberModalProps) => {
  const [availableUsers, setAvailableUsers] = useState<IUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadAvailableUsers();
    }
  }, [isOpen]);

  const loadAvailableUsers = async () => {
    try {
      setLoading(true);
      const response = await getAvailableUsers();
      const existingMemberIds = existingMembers.map(member => member.id);
      const filteredUsers = response.data.filter((user: IUser) => !existingMemberIds.includes(user.id));
      setAvailableUsers(filteredUsers);
    } catch (error) {
      console.error('Error al cargar usuarios disponibles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggle = (userId: number) => {
    setSelectedUsers(prev => (prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]));
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return;

    try {
      setLoading(true);
      for (const userId of selectedUsers) {
        try {
          const user = availableUsers.find(u => u.id === userId);
          if (user) {
            // El backend asignará automáticamente el rol de MIEMBRO
            await addMemberToWorkGroup(workGroupId, user.login);
          }
        } catch (error: any) {
          console.error(`Error al añadir usuario ${userId}:`, error.response?.data || error.message);
          throw error;
        }
      }
      setSelectedUsers([]);
      onMemberAdded();
      onClose();
    } catch (error: any) {
      console.error('Error al añadir miembros:', error);
      console.error('Detalles del error:', error.response?.data);
      console.error('Status:', error.response?.status);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = availableUsers.filter(
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
          <h2>Añadir Miembros al Grupo</h2>
          <button className="close-button" onClick={onClose}>
            <span>×</span>
          </button>
        </div>

        <div className="modal-body">
          <div className="search-section">
            <div className="search-input">
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="Buscar usuarios..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <div className="loading-section">
              <div className="loading-spinner"></div>
              <div className="loading-text">Cargando usuarios...</div>
            </div>
          ) : (
            <>
              <div className="users-section">
                <div className="section-title">Usuarios Disponibles ({filteredUsers.length})</div>

                {filteredUsers.length === 0 ? (
                  <div className="empty-users">
                    <div className="empty-icon">👤</div>
                    <div className="empty-text">
                      {searchTerm ? 'No se encontraron usuarios con ese criterio' : 'No hay usuarios disponibles para añadir'}
                    </div>
                  </div>
                ) : (
                  <div className="users-list">
                    {filteredUsers.map(user => (
                      <div
                        key={user.id}
                        className={`user-item ${selectedUsers.includes(user.id) ? 'selected' : ''}`}
                        onClick={() => handleUserToggle(user.id)}
                      >
                        <div className="user-avatar">
                          <span className="avatar-text">
                            {user.firstName
                              ? user.firstName.charAt(0).toUpperCase()
                              : user.lastName
                                ? user.lastName.charAt(0).toUpperCase()
                                : user.login.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="user-info">
                          <div className="user-name">
                            {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.login}
                          </div>
                          <div className="user-login">@{user.login}</div>
                          {user.email && <div className="user-email">{user.email}</div>}
                        </div>
                        <div className="user-actions">
                          <div className="selection-indicator">
                            {selectedUsers.includes(user.id) && <span className="check-icon">✓</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="selected-summary">
                {selectedUsers.length > 0 && (
                  <div className="summary-text">
                    {selectedUsers.length} {selectedUsers.length === 1 ? 'usuario seleccionado' : 'usuarios seleccionados'}
                    <div className="role-info">Se añadirán como miembros del grupo</div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="add-btn" onClick={handleAddMembers} disabled={selectedUsers.length === 0 || loading}>
            {loading ? 'Añadiendo...' : `Añadir ${selectedUsers.length} ${selectedUsers.length === 1 ? 'miembro' : 'miembros'}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;
