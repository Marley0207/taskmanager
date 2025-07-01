import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import { createTask } from './task.api';
import { ITask, TaskPriority, TaskStatus, defaultValue } from './task.model';

const TaskCreate = () => {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const projectId = searchParams.get('projectId');

  const [task, setTask] = useState<ITask>({
    ...defaultValue,
    project: { id: projectId ? Number(projectId) : 0, title: '' },
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTask(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task.title || !task.priority || !task.status) {
      setMessage('Completa todos los campos obligatorios');
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      await createTask(task);
      setMessage('Tarea creada exitosamente');
      setTimeout(() => navigate(-1), 1200);
    } catch (err: any) {
      setMessage('Error al crear la tarea');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
        <Link to={-1 as any} className="btn btn-secondary btn-sm" style={{ marginRight: 16 }}>
          <FontAwesomeIcon icon={faArrowLeft} /> Volver
        </Link>
        <h1 style={{ margin: 0 }}>Crear Nueva Tarea</h1>
      </div>
      {message && (
        <div className={`message ${message.includes('exitosamente') ? 'success' : 'error'}`} style={{ marginBottom: 16 }}>
          <FontAwesomeIcon icon={message.includes('exitosamente') ? faSave : faTimes} />
          <span>{message}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: 8, padding: 24, boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label>Título</label>
          <input type="text" name="title" className="form-control" value={task.title} onChange={handleChange} required maxLength={100} />
        </div>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label>Descripción</label>
          <textarea name="description" className="form-control" value={task.description} onChange={handleChange} rows={3} maxLength={500} />
        </div>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label>Prioridad</label>
          <select name="priority" className="form-control" value={task.priority} onChange={handleChange} required>
            {Object.values(TaskPriority).map(priority => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label>Estado</label>
          <select name="status" className="form-control" value={task.status} onChange={handleChange} required>
            {Object.values(TaskStatus).map(status => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <FontAwesomeIcon icon={faSave} /> Guardar
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)} disabled={saving}>
            <FontAwesomeIcon icon={faTimes} /> Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskCreate;
