import React, { useState, useEffect } from 'react';
import { updateWorkGroup } from './work-group.api';
import { IWorkGroup } from './work-group.model';
import './edit-work-group-modal.scss';

interface EditWorkGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  workGroup: IWorkGroup;
  onWorkGroupUpdated: () => void;
}

const EditWorkGroupModal = ({ isOpen, onClose, workGroup, onWorkGroupUpdated }: EditWorkGroupModalProps) => {
  const [formData, setFormData] = useState<IWorkGroup>({
    id: workGroup.id,
    name: workGroup.name,
    description: workGroup.description || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Actualizar el formulario cuando cambie el grupo
  useEffect(() => {
    if (workGroup) {
      setFormData({
        id: workGroup.id,
        name: workGroup.name,
        description: workGroup.description || '',
      });
    }
  }, [workGroup]);

  const handleInputChange = (field: keyof IWorkGroup, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setError(''); // Limpiar errores al cambiar
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('El nombre del grupo es obligatorio');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await updateWorkGroup(formData);
      onWorkGroupUpdated();
      onClose();
    } catch (err: any) {
      console.error('Error al actualizar el grupo:', err);
      setError(err.response?.data?.message || 'Error al actualizar el grupo. Por favor, inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Restaurar datos originales
    setFormData({
      id: workGroup.id,
      name: workGroup.name,
      description: workGroup.description || '',
    });
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar Grupo de Trabajo</h2>
          <button className="close-button" onClick={handleCancel}>
            <span>×</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="error-section">
              <div className="error-icon">❌</div>
              <div className="error-text">{error}</div>
            </div>
          )}

          <div className="form-section">
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Nombre del Grupo *
              </label>
              <input
                type="text"
                id="name"
                className="form-input"
                value={formData.name}
                onChange={e => handleInputChange('name', e.target.value)}
                placeholder="Ingresa el nombre del grupo"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">
                Descripción
              </label>
              <textarea
                id="description"
                className="form-textarea"
                value={formData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                placeholder="Describe el propósito del grupo de trabajo"
                rows={4}
                disabled={loading}
              />
            </div>
          </div>

          <div className="info-section">
            <div className="info-icon">ℹ️</div>
            <div className="info-text">
              <strong>Nota:</strong> Solo se actualizarán los campos que hayas modificado. Los demás datos permanecerán sin cambios.
            </div>
          </div>
        </form>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={handleCancel} disabled={loading}>
            Cancelar
          </button>
          <button className="save-btn" onClick={handleSubmit} disabled={loading || !formData.name.trim()}>
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditWorkGroupModal;
