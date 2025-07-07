import React, { useEffect, useState } from 'react';
import { getAllPriorities, createPriority, updatePriority, deletePriority, hidePriority, unhidePriority } from './priority.api';
import { IPriority } from './priority.model';
import { useAppSelector } from 'app/config/store';
import Modal from 'react-modal';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const PriorityAdmin: React.FC = () => {
  const [priorities, setPriorities] = useState<IPriority[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<IPriority | null>(null);
  const [name, setName] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newPriorityName, setNewPriorityName] = useState('');
  const [createError, setCreateError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [priorityToDelete, setPriorityToDelete] = useState<IPriority | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPriorityName, setEditPriorityName] = useState('');
  const [editError, setEditError] = useState('');

  const account = useAppSelector(state => state.authentication.account);
  const isAdmin = account?.authorities?.includes('ROLE_ADMIN');

  useEffect(() => {
    if (isAdmin) {
      loadPriorities();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (message && message.toLowerCase().includes('creada')) {
      const timeout = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timeout);
    }
  }, [message]);

  const loadPriorities = async () => {
    setLoading(true);
    try {
      const res = await getAllPriorities();
      setPriorities(res.data);
    } catch {
      setMessage('Error al cargar prioridades');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await updatePriority({ ...editing, name });
        setMessage('Prioridad actualizada');
      } else {
        await createPriority({ name });
        setMessage('Prioridad creada');
      }
      setName('');
      setEditing(null);
      loadPriorities();
    } catch {
      setMessage('Error al guardar prioridad');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deletePriority(id);
      setMessage('Prioridad eliminada');
      loadPriorities();
    } catch (error: any) {
      if (error?.response?.data?.errorKey === 'priorityInUse' || error?.response?.data?.message?.toLowerCase().includes('en uso')) {
        setMessage('No se puede eliminar una prioridad que está en uso por tareas.');
      } else {
        setMessage('Error al eliminar prioridad');
      }
    }
  };

  const handleHide = async (id: number) => {
    try {
      await hidePriority(id);
      setMessage('Prioridad ocultada');
      loadPriorities();
    } catch {
      setMessage('Error al ocultar prioridad');
    }
  };

  const handleUnhide = async (id: number) => {
    try {
      await unhidePriority(id);
      setMessage('Prioridad visible');
      loadPriorities();
    } catch {
      setMessage('Error al mostrar prioridad');
    }
  };

  const handleCreate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPriorityName.trim()) {
      setCreateError('El nombre es obligatorio');
      return;
    }
    try {
      await createPriority({ name: newPriorityName.trim(), hidden: false });
      setMessage('Prioridad creada');
      setNewPriorityName('');
      setIsCreateModalOpen(false);
      setCreateError('');
      loadPriorities();
    } catch {
      setCreateError('Error al crear prioridad');
    }
  };

  const handleDeleteClick = (priority: IPriority) => {
    setPriorityToDelete(priority);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!priorityToDelete) return;
    await handleDelete(priorityToDelete.id);
    setShowDeleteModal(false);
    setPriorityToDelete(null);
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setPriorityToDelete(null);
  };

  const handleEditClick = (priority: IPriority) => {
    setEditing(priority);
    setEditPriorityName(priority.name);
    setIsEditModalOpen(true);
    setEditError('');
  };

  const handleEditSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editing) return;
    if (!editPriorityName.trim()) {
      setEditError('El nombre es obligatorio');
      return;
    }
    try {
      await updatePriority({ ...editing, name: editPriorityName });
      setMessage('Prioridad actualizada');
      setIsEditModalOpen(false);
      setEditing(null);
      setEditPriorityName('');
      setEditError('');
      loadPriorities();
    } catch {
      setEditError('Error al actualizar prioridad');
    }
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
    setEditing(null);
    setEditPriorityName('');
    setEditError('');
  };

  if (!isAdmin) return null;

  return (
    <div>
      <h2>Administrar Prioridades</h2>
      {message && <div style={{ margin: 10, color: 'green' }}>{message}</div>}
      <button
        onClick={() => setIsCreateModalOpen(true)}
        style={{
          margin: '16px 0',
          padding: '8px 20px',
          borderRadius: 6,
          border: '1.2px solid #007bff',
          background: '#fff',
          color: '#007bff',
          fontWeight: 600,
          fontSize: 16,
          cursor: 'pointer',
        }}
      >
        Crear Prioridad
      </button>
      <Modal
        isOpen={isCreateModalOpen}
        onRequestClose={() => setIsCreateModalOpen(false)}
        contentLabel="Crear Prioridad"
        ariaHideApp={false}
        style={{
          content: {
            width: 340,
            maxWidth: '90vw',
            minHeight: 180,
            maxHeight: 260,
            margin: 'auto',
            padding: 24,
            borderRadius: 14,
            textAlign: 'center',
            border: '1.5px solid #007bff',
            boxShadow: '0 4px 24px rgba(0,123,255,0.13)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'visible',
            background: '#fff',
          },
          overlay: { backgroundColor: 'rgba(0,0,0,0.18)' },
        }}
      >
        <h3 style={{ marginBottom: 18, fontWeight: 700, fontSize: 22, color: '#222' }}>Crear prioridad</h3>
        <form onSubmit={handleCreate} style={{ width: '100%' }}>
          <input
            type="text"
            value={newPriorityName}
            onChange={e => setNewPriorityName(e.target.value)}
            placeholder="Nombre de prioridad"
            style={{ width: '100%', padding: 8, borderRadius: 6, border: '1.2px solid #bbb', marginBottom: 14, fontSize: 15 }}
            autoFocus
          />
          {createError && <div style={{ color: '#dc3545', marginBottom: 8, fontSize: 13 }}>{createError}</div>}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 2 }}>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              style={{
                padding: '7px 18px',
                borderRadius: 5,
                border: '1.2px solid #bbb',
                background: '#fff',
                color: '#222',
                fontWeight: 500,
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: '7px 18px',
                borderRadius: 5,
                border: 'none',
                background: '#007bff',
                color: 'white',
                fontWeight: 500,
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              Crear
            </button>
          </div>
        </form>
      </Modal>
      {loading ? (
        <div>Cargando...</div>
      ) : (
        <table className="priority-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: 24 }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Nombre</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Oculta</th>
              <th style={{ borderBottom: '1px solid #ccc', padding: 8 }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {priorities.map(priority => (
              <tr key={priority.id}>
                <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>{priority.name}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>{priority.hidden ? 'Sí' : 'No'}</td>
                <td style={{ borderBottom: '1px solid #eee', padding: 8 }}>
                  <button onClick={() => handleEditClick(priority)} style={{ marginRight: 8 }}>
                    Editar
                  </button>
                  {priority.hidden ? (
                    <button onClick={() => handleUnhide(priority.id)} style={{ marginRight: 8 }}>
                      Mostrar
                    </button>
                  ) : (
                    <button onClick={() => handleHide(priority.id)} style={{ marginRight: 8 }}>
                      Ocultar
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteClick(priority)}
                    style={{
                      color: '#dc3545',
                      fontWeight: 500,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '6px 14px',
                      borderRadius: 5,
                    }}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showDeleteModal && priorityToDelete && (
        <Modal
          isOpen={showDeleteModal}
          onRequestClose={cancelDelete}
          contentLabel="Confirmar eliminación de prioridad"
          ariaHideApp={false}
          style={{
            content: {
              width: 370,
              maxWidth: '90vw',
              minHeight: 170,
              maxHeight: 250,
              margin: 'auto',
              padding: 24,
              borderRadius: 14,
              textAlign: 'center',
              border: '1.5px solid #dc3545',
              boxShadow: '0 4px 24px rgba(220,53,69,0.13)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'visible',
              background: '#fff',
            },
            overlay: { backgroundColor: 'rgba(0,0,0,0.18)' },
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, justifyContent: 'center' }}>
            <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#dc3545', fontSize: 22 }} />
            <h3 style={{ color: '#dc3545', margin: 0, fontWeight: 700, fontSize: 22 }}>¿Eliminar prioridad?</h3>
          </div>
          <p style={{ fontSize: 15, color: '#333', marginBottom: 18, marginTop: 0, lineHeight: 1.3 }}>
            ¿Estás seguro de que deseas eliminar la prioridad <strong>{priorityToDelete.name}</strong>?
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, marginTop: 0, width: '100%' }}>
            <button
              onClick={cancelDelete}
              style={{
                minWidth: 90,
                fontWeight: 500,
                fontSize: 15,
                padding: '8px 0',
                borderRadius: 5,
                border: 'none',
                background: '#adb5bd',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              style={{
                minWidth: 90,
                fontWeight: 500,
                fontSize: 15,
                padding: '8px 0',
                borderRadius: 5,
                border: 'none',
                background: '#dc3545',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Eliminar
            </button>
          </div>
        </Modal>
      )}
      {/* Modal de edición de prioridad */}
      {isEditModalOpen && editing && (
        <Modal
          isOpen={isEditModalOpen}
          onRequestClose={handleEditCancel}
          contentLabel="Editar Prioridad"
          ariaHideApp={false}
          style={{
            content: {
              width: 340,
              maxWidth: '90vw',
              minHeight: 180,
              maxHeight: 260,
              margin: 'auto',
              padding: 24,
              borderRadius: 14,
              textAlign: 'center',
              border: '1.5px solid #007bff',
              boxShadow: '0 4px 24px rgba(0,123,255,0.13)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'visible',
              background: '#fff',
            },
            overlay: { backgroundColor: 'rgba(0,0,0,0.18)' },
          }}
        >
          <h3 style={{ marginBottom: 18, fontWeight: 700, fontSize: 22, color: '#222' }}>Editar prioridad</h3>
          <form onSubmit={handleEditSave} style={{ width: '100%' }}>
            <input
              type="text"
              value={editPriorityName}
              onChange={e => setEditPriorityName(e.target.value)}
              placeholder="Nombre de prioridad"
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1.2px solid #bbb', marginBottom: 14, fontSize: 15 }}
              autoFocus
            />
            {editError && <div style={{ color: '#dc3545', marginBottom: 8, fontSize: 13 }}>{editError}</div>}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 2 }}>
              <button
                type="button"
                onClick={handleEditCancel}
                style={{
                  padding: '7px 18px',
                  borderRadius: 5,
                  border: '1.2px solid #bbb',
                  background: '#fff',
                  color: '#222',
                  fontWeight: 500,
                  fontSize: 15,
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{
                  padding: '7px 18px',
                  borderRadius: 5,
                  border: 'none',
                  background: '#007bff',
                  color: 'white',
                  fontWeight: 500,
                  fontSize: 15,
                  cursor: 'pointer',
                }}
              >
                Guardar
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default PriorityAdmin;
