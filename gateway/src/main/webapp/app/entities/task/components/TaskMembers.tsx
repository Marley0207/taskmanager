import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faUser, faEnvelope, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import { ITaskMember } from '../task.model';

interface TaskMembersProps {
  assignedUsers: ITaskMember[];
  unassignedMembers: ITaskMember[];
  selectedUser: string;
  setSelectedUser: (user: string) => void;
  handleAddMember: () => void;
  adding: boolean;
  isTaskDoneOrArchived: boolean;
  openDeleteMemberModal: (member: ITaskMember) => void;
  deletingMember: boolean;
  memberToDelete: ITaskMember | null;
  accountLogin: string;
}

const TaskMembers: React.FC<TaskMembersProps> = ({
  assignedUsers,
  unassignedMembers,
  selectedUser,
  setSelectedUser,
  handleAddMember,
  adding,
  isTaskDoneOrArchived,
  openDeleteMemberModal,
  deletingMember,
  memberToDelete,
  accountLogin,
}) => (
  <div style={{ marginBottom: 16 }}>
    <strong>
      <FontAwesomeIcon icon={faUsers} /> Miembros asignados ({assignedUsers.length}):
    </strong>
    {assignedUsers.length > 0 ? (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
        {assignedUsers.map(member => (
          <div
            key={member.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#f8f9fa',
              borderRadius: 8,
              padding: '10px 16px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              gap: 14,
              minHeight: 48,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FontAwesomeIcon icon={faUser} style={{ color: '#1976d2', fontSize: 18 }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>
                  {member.firstName} {member.lastName}
                </div>
                <div style={{ color: '#888', fontSize: 13 }}>({member.login})</div>
                {member.email && (
                  <div style={{ color: '#888', fontSize: 12 }}>
                    <FontAwesomeIcon icon={faEnvelope} style={{ marginRight: 4 }} />
                    {member.email}
                  </div>
                )}
              </div>
            </div>
            {!isTaskDoneOrArchived && (
              <button
                className="btn btn-outline-danger btn-xs"
                style={{
                  marginLeft: 'auto',
                  padding: '2px 10px',
                  fontSize: 14,
                  borderRadius: 4,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                title="Eliminar de la tarea"
                onClick={() => openDeleteMemberModal(member)}
                disabled={(deletingMember && memberToDelete?.id === member.id) || member.login === accountLogin}
                onMouseOver={e => (e.currentTarget.style.background = '#ffeaea')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            )}
          </div>
        ))}
      </div>
    ) : (
      <div style={{ color: '#888', fontStyle: 'italic', marginTop: 8 }}>No hay miembros asignados</div>
    )}
    {/* Añadir miembro */}
    {isTaskDoneOrArchived ? (
      <div style={{ marginTop: 12, color: 'gray' }}>No se pueden añadir miembros a una tarea completada o archivada.</div>
    ) : unassignedMembers.length > 0 ? (
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <select
          className="form-control"
          style={{ width: 220 }}
          value={selectedUser}
          onChange={e => setSelectedUser(e.target.value)}
          disabled={adding || isTaskDoneOrArchived}
        >
          <option value="">Selecciona usuario para añadir</option>
          {unassignedMembers.map(member => (
            <option key={member.id} value={member.login}>
              {member.firstName && member.lastName ? `${member.firstName} ${member.lastName} (${member.login})` : member.login}
            </option>
          ))}
        </select>
        <button
          className="btn btn-primary btn-sm"
          onClick={handleAddMember}
          disabled={!selectedUser || adding || isTaskDoneOrArchived}
          type="button"
        >
          <FontAwesomeIcon icon={faPlus} /> Añadir miembro
        </button>
      </div>
    ) : (
      <div style={{ marginTop: 12, color: 'gray' }}>No hay usuarios disponibles para añadir a esta tarea.</div>
    )}
  </div>
);

export default TaskMembers;
