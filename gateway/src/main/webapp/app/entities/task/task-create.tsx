import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import { createTask, createSubTask } from './task.api';
import { ITask, TaskPriority, TaskStatus, defaultValue } from './task.model';
import { getProject } from '../project/project.api';
import { getAllPriorities } from '../priority/priority.api';
import { IPriority } from '../priority/priority.model';

// Definir un tipo para la creación de tarea
interface ITaskCreatePayload {
  title: string;
  description: string;
  priority: TaskPriority | string;
  status: TaskStatus;
  project: { id: number };
  workGroup: { id: number };
  workGroupId: number;
}

const TaskCreate = () => {
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const projectId = searchParams.get('projectId');
  const workGroupIdFromUrl = searchParams.get('workGroupId');
  const parentTaskId = searchParams.get('parentTaskId');

  // Estado local solo para los campos del formulario
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: undefined,
    status: TaskStatus.NOT_STARTED,
  });
  const [workGroupId, setWorkGroupId] = useState<string | null>(workGroupIdFromUrl);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [workGroupName, setWorkGroupName] = useState('');
  const [priorities, setPriorities] = useState<IPriority[]>([]);

  React.useEffect(() => {
    // Si no tenemos workGroupId pero sí projectId, obtenerlo del backend
    if (projectId) {
      setLoading(true);
      getProject(Number(projectId))
        .then(res => {
          if (res.data) {
            if (res.data.workGroup && res.data.workGroup.id) {
              setWorkGroupId(res.data.workGroup.id.toString());
              setWorkGroupName(res.data.workGroup.name || '');
            }
            setProjectTitle(res.data.title || '');
          }
        })
        .catch(() => setMessage('No se pudo obtener el grupo de trabajo del proyecto'))
        .finally(() => setLoading(false));
    }
    // Cargar prioridades visibles
    getAllPriorities()
      .then(res => {
        const visibles = res.data.filter(p => !p.hidden);
        setPriorities(visibles);
        if (visibles.length > 0) {
          setForm(prev => ({ ...prev, priority: visibles[0] }));
        }
      })
      .catch(() => setPriorities([]));
  }, [projectId, workGroupIdFromUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'priority') {
      // Buscar la prioridad seleccionada por id
      const selectedPriority = priorities.find(p => String(p.id) === value);
      if (selectedPriority) {
        setForm(prev => ({ ...prev, priority: selectedPriority }));
      }
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.priority || !form.status) {
      setMessage('Completa todos los campos obligatorios');
      return;
    }
    if (!projectId || !workGroupId) {
      setMessage('Faltan datos de proyecto o grupo de trabajo');
      return;
    }
    setSaving(true);
    setMessage(null);
    const payload: ITask = {
      ...form,
      project: { id: Number(projectId), title: projectTitle },
      workGroup: { id: Number(workGroupId), name: workGroupName },
      workGroupId: Number(workGroupId),
      deleted: false,
    };
    try {
      if (parentTaskId) {
        await createSubTask(Number(parentTaskId), payload);
        setMessage('Subtarea creada exitosamente');
        setTimeout(() => navigate(`/tasks/${parentTaskId}/details`), 1200);
      } else {
        await createTask(payload);
        setMessage('Tarea creada exitosamente');
        setTimeout(() => navigate(projectId ? `/tasks/${projectId}` : '/tasks'), 1200);
      }
    } catch (err: any) {
      setMessage(parentTaskId ? 'Error al crear la subtarea' : 'Error al crear la tarea');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading">Cargando datos del proyecto...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: 700, margin: '0 auto' }}>
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
        <Link
          to={parentTaskId ? `/tasks/${parentTaskId}/details` : projectId ? `/tasks/${projectId}` : '/tasks'}
          className="btn btn-secondary btn-sm"
          style={{ marginRight: 16 }}
        >
          <FontAwesomeIcon icon={faArrowLeft} /> Volver
        </Link>
        <h1 style={{ margin: 0 }}>{parentTaskId ? 'Crear Nueva Subtarea' : 'Crear Nueva Tarea'}</h1>
      </div>
      {/* Mensaje de éxito/error solo tras crear una tarea nueva o error */}
      {message && (
        <div
          className={`message ${message.includes('exitosamente') ? 'success' : 'error'}`}
          style={{
            margin: '20px auto 16px auto',
            fontSize: 15,
            padding: '10px 18px',
            borderRadius: 6,
            background: message.includes('exitosamente') ? '#d4edda' : '#f8d7da',
            color: message.includes('exitosamente') ? '#155724' : '#721c24',
            border: `1.5px solid ${message.includes('exitosamente') ? '#28a745' : '#dc3545'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            maxWidth: 500,
            fontWeight: 500,
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            justifyContent: 'center',
          }}
        >
          <FontAwesomeIcon icon={message.includes('exitosamente') ? faSave : faTimes} />
          <span>{message}</span>
        </div>
      )}
      <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: 8, padding: 24, boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label>Título</label>
          <input type="text" name="title" className="form-control" value={form.title} onChange={handleChange} required maxLength={100} />
        </div>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label>Descripción</label>
          <textarea name="description" className="form-control" value={form.description} onChange={handleChange} rows={3} maxLength={500} />
        </div>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label>Prioridad</label>
          <select name="priority" className="form-control" value={form.priority?.id ?? ''} onChange={handleChange} required>
            {priorities.map(priority => (
              <option key={priority.id} value={priority.id}>
                {priority.name.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label>Estado</label>
          <select name="status" className="form-control" value={form.status} onChange={handleChange} required>
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
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => navigate(parentTaskId ? `/tasks/${parentTaskId}/details` : projectId ? `/tasks/${projectId}` : '/tasks')}
            disabled={saving}
          >
            <FontAwesomeIcon icon={faTimes} /> Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default TaskCreate;
