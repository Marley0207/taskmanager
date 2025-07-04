import React from 'react';
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { IComment, ITaskMember } from '../task.model';

// Modal de confirmación para archivar tarea
interface ArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  archiving: boolean;
}

export const ArchiveModal: React.FC<ArchiveModalProps> = ({ isOpen, onClose, onConfirm, archiving }) => (
  <Modal
    isOpen={isOpen}
    onRequestClose={onClose}
    contentLabel="Confirmar archivado"
    ariaHideApp={false}
    style={{
      content: {
        width: 320,
        maxWidth: 320,
        minWidth: 200,
        height: 180,
        minHeight: 140,
        maxHeight: 220,
        margin: 'auto',
        padding: 10,
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <FontAwesomeIcon icon={faExclamationTriangle} size="sm" color="#dc3545" />
      <h4 style={{ color: '#dc3545', margin: 0, fontWeight: 700, fontSize: 18 }}>¿Archivar tarea?</h4>
    </div>
    <p style={{ fontSize: 13, color: '#333', marginBottom: 14, marginTop: 0, lineHeight: 1.2 }}>
      ¿Estás seguro de que deseas archivar esta tarea? Esta acción no se puede deshacer.
    </p>
    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 0, width: '100%' }}>
      <button
        className="btn btn-secondary btn-sm"
        onClick={onClose}
        disabled={archiving}
        style={{ minWidth: 70, fontWeight: 500, fontSize: 13 }}
      >
        Cancelar
      </button>
      <button
        className="btn btn-danger btn-sm"
        onClick={onConfirm}
        disabled={archiving}
        style={{ minWidth: 80, fontWeight: 500, fontSize: 13 }}
      >
        {archiving ? 'Archivando...' : 'Archivar'}
      </button>
    </div>
  </Modal>
);

// Modal de confirmación para eliminar comentario
interface DeleteCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deletingLoading: boolean;
  commentToDelete: IComment | null;
}

export const DeleteCommentModal: React.FC<DeleteCommentModalProps> = ({ isOpen, onClose, onConfirm, deletingLoading, commentToDelete }) => (
  <Modal
    isOpen={isOpen}
    onRequestClose={onClose}
    contentLabel="Confirmar eliminación de comentario"
    ariaHideApp={false}
    style={{
      content: {
        width: 320,
        height: 130,
        maxWidth: 320,
        minWidth: 200,
        margin: 'auto',
        padding: 10,
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <FontAwesomeIcon icon={faExclamationTriangle} size="sm" color="#dc3545" />
      <h4 style={{ color: '#dc3545', margin: 0, fontWeight: 700, fontSize: 18 }}>¿Eliminar comentario?</h4>
    </div>
    <p style={{ fontSize: 13, color: '#333', marginBottom: 14, marginTop: 0, lineHeight: 1.2 }}>
      ¿Estás seguro de que deseas eliminar este comentario?
    </p>
    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 0, width: '100%' }}>
      <button
        className="btn btn-secondary btn-sm"
        onClick={onClose}
        disabled={deletingLoading}
        style={{ minWidth: 70, fontWeight: 500, fontSize: 13 }}
      >
        Cancelar
      </button>
      <button
        className="btn btn-danger btn-sm"
        onClick={onConfirm}
        disabled={deletingLoading}
        style={{ minWidth: 80, fontWeight: 500, fontSize: 13 }}
      >
        {deletingLoading ? 'Eliminando...' : 'Eliminar'}
      </button>
    </div>
  </Modal>
);

// Modal de confirmación para eliminar tarea
interface DeleteTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deletingTask: boolean;
}

export const DeleteTaskModal: React.FC<DeleteTaskModalProps> = ({ isOpen, onClose, onConfirm, deletingTask }) => (
  <Modal
    isOpen={isOpen}
    onRequestClose={onClose}
    contentLabel="Confirmar eliminación de tarea"
    ariaHideApp={false}
    style={{
      content: {
        width: 320,
        height: 130,
        maxWidth: 320,
        minWidth: 200,
        margin: 'auto',
        padding: 10,
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <FontAwesomeIcon icon={faExclamationTriangle} size="sm" color="#dc3545" />
      <h4 style={{ color: '#dc3545', margin: 0, fontWeight: 700, fontSize: 18 }}>¿Eliminar tarea?</h4>
    </div>
    <p style={{ fontSize: 13, color: '#333', marginBottom: 14, marginTop: 0, lineHeight: 1.2 }}>
      ¿Estás seguro de que deseas eliminar esta tarea?
    </p>
    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 0, width: '100%' }}>
      <button
        className="btn btn-secondary btn-sm"
        onClick={onClose}
        disabled={deletingTask}
        style={{ minWidth: 70, fontWeight: 500, fontSize: 13 }}
      >
        Cancelar
      </button>
      <button
        className="btn btn-danger btn-sm"
        onClick={onConfirm}
        disabled={deletingTask}
        style={{ minWidth: 80, fontWeight: 500, fontSize: 13 }}
      >
        {deletingTask ? 'Eliminando...' : 'Eliminar'}
      </button>
    </div>
  </Modal>
);

// Modal de confirmación para eliminar miembro
interface DeleteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deletingMember: boolean;
  memberToDelete: ITaskMember | null;
}

export const DeleteMemberModal: React.FC<DeleteMemberModalProps> = ({ isOpen, onClose, onConfirm, deletingMember, memberToDelete }) =>
  isOpen &&
  memberToDelete && (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Confirmar eliminación de miembro de la tarea"
      ariaHideApp={false}
      style={{
        content: {
          width: 320,
          height: 130,
          maxWidth: 320,
          minWidth: 200,
          margin: 'auto',
          padding: 10,
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <FontAwesomeIcon icon={faExclamationTriangle} size="sm" color="#dc3545" />
        <h4 style={{ color: '#dc3545', margin: 0, fontWeight: 700, fontSize: 18 }}>¿Eliminar miembro?</h4>
      </div>
      <p style={{ fontSize: 13, color: '#333', marginBottom: 14, marginTop: 0, lineHeight: 1.2 }}>
        ¿Estás seguro de que deseas eliminar a{' '}
        <b>
          {memberToDelete.firstName} {memberToDelete.lastName} ({memberToDelete.login})
        </b>{' '}
        de esta tarea?
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 0, width: '100%' }}>
        <button
          className="btn btn-secondary btn-sm"
          onClick={onClose}
          disabled={deletingMember}
          style={{ minWidth: 70, fontWeight: 500, fontSize: 13 }}
        >
          Cancelar
        </button>
        <button
          className="btn btn-danger btn-sm"
          onClick={onConfirm}
          disabled={deletingMember}
          style={{ minWidth: 80, fontWeight: 500, fontSize: 13 }}
        >
          {deletingMember ? 'Eliminando...' : 'Eliminar'}
        </button>
      </div>
    </Modal>
  );
