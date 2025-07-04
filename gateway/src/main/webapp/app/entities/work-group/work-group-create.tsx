import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createWorkGroup } from './work-group.api';
import { IWorkGroup } from './work-group.model';
import './work-group-create.scss';

const WorkGroupCreate = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async event => {
    event.preventDefault();
    setIsSubmitting(true);
    const newWorkGroup: IWorkGroup = {
      name,
      description,
      deleted: false,
    };

    try {
      await createWorkGroup(newWorkGroup);
      navigate('/work-groups'); // Redirige a la lista después de crear
    } catch (error) {
      console.error('Error al crear el WorkGroup:', error);
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    navigate('/work-groups');
  };

  return (
    <div className="work-group-create">
      <div className="create-container">
        <div className="create-header">
          <button className="back-btn" onClick={handleBack}>
            <span className="back-icon">←</span>
            <span className="back-text">Volver a la lista</span>
          </button>
          <div className="header-content">
            <div className="header-icon">👥</div>
            <h1>Crear Nuevo Grupo de Trabajo</h1>
            <p className="header-description">Completa la información para crear un nuevo grupo de trabajo en tu organización</p>
          </div>
        </div>

        <div className="form-container">
          <form onSubmit={handleSubmit} className="create-form">
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Nombre del Grupo *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="form-input"
                placeholder="Ej: Equipo de Desarrollo Frontend"
              />
              <div className="input-hint">El nombre debe ser descriptivo y fácil de identificar</div>
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">
                Descripción
              </label>
              <textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="form-textarea"
                placeholder="Describe el propósito y responsabilidades del grupo de trabajo..."
                rows={4}
              />
              <div className="input-hint">Proporciona detalles sobre las funciones y objetivos del grupo</div>
            </div>

            <div className="form-actions">
              <button type="button" onClick={handleBack} className="btn btn-secondary" disabled={isSubmitting}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting || !name.trim()}>
                {isSubmitting ? (
                  <>
                    <span className="loading-spinner"></span>
                    Creando...
                  </>
                ) : (
                  <>
                    <span className="btn-icon">✓</span>
                    Crear Grupo de Trabajo
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WorkGroupCreate;
