import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import { getTask, patchTask, getAssignedUsers, getAvailableWorkGroupMembers, updateTaskMembers } from './task.api';
import { getProjectMembers } from '../project/project.api';
import { ITask, TaskPriority, TaskStatus, ITaskMember } from './task.model';

const TaskEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<ITask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [assignedMembers, setAssignedMembers] = useState<ITaskMember[]>([]);
  const [availableMembers, setAvailableMembers] = useState<ITaskMember[]>([]);

  useEffect(() => {
    if (id) {
      loadTask();
    }
  }, [id]);

  const loadTask = async () => {
    setLoading(true);
    try {
      const response = await getTask(Number(id));
      setTask(response.data);

      // Cargar miembros disponibles del proyecto primero (para subtareas)
      let availableMembersList: ITaskMember[] = [];
      if (response.data.project?.id) {
        try {
          const projectMembersRes = await getProjectMembers(response.data.project.id);
          availableMembersList = projectMembersRes.data;
        } catch (err) {
          console.error('Error loading project members:', err);
        }
      }

      // Fallback: si no hay proyecto, usar workgroup
      if (availableMembersList.length === 0 && response.data.workGroup?.id) {
        try {
          const availableRes = await getAvailableWorkGroupMembers(response.data.workGroup.id);
          availableMembersList = availableRes.data;
        } catch (err) {
          console.error('Error loading workgroup members:', err);
        }
      }

      // Cargar miembros asignados usando el endpoint correcto
      let assignedMembersList: ITaskMember[] = [];
      try {
        const assignedRes = await getAssignedUsers(Number(id));
        assignedMembersList = assignedRes.data;
      } catch (err) {
        // Si falla, usar los datos que vienen en la tarea
        assignedMembersList = response.data.assignedMembers || [];
      }

      // Combinar las listas para asegurar que todos los miembros asignados aparezcan en el select
      const combinedMembers = [...availableMembersList];
      assignedMembersList.forEach(assignedMember => {
        if (!combinedMembers.find(m => m.id === assignedMember.id)) {
          combinedMembers.push(assignedMember);
        }
      });

      setAvailableMembers(combinedMembers);
      setAssignedMembers(assignedMembersList);
    } catch (err) {
      setError('Error al cargar la tarea');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!task) return;
    const { name, value } = e.target;
    setTask({ ...task, [name]: value });
  };

  const handleMembersChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!task) return;
    const selectedOptions = Array.from(e.target.selectedOptions).map(opt => Number(opt.value));
    const selectedMembers = availableMembers.filter(m => selectedOptions.includes(m.id));
    setAssignedMembers(selectedMembers);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;

    // Validación de datos
    if (!task.title || task.title.trim() === '') {
      setMessage('El título es obligatorio');
      return;
    }

    if (!task.priority) {
      setMessage('La prioridad es obligatoria');
      return;
    }

    if (!task.status) {
      setMessage('El estado es obligatorio');
      return;
    }

    if (!task.id) {
      setMessage('ID de tarea no válido');
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      // Enviar la estructura completa que espera el backend
      const taskDTO = {
        id: task.id,
        title: task.title.trim(),
        description: task.description?.trim() || '',
        priority: task.priority,
        status: task.status,
        project: task.project,
        workGroup: task.workGroup,
        deleted: task.deleted || false,
        // Incluir otros campos que puedan ser necesarios
        assignedMembers,
        comments: task.comments || [],
        createdBy: task.createdBy,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      };

      await patchTask(Number(task.id), taskDTO);
      setMessage('Tarea actualizada exitosamente');
      setTimeout(() => navigate(`/tasks/${task.id}/details`), 1000);
    } catch (err: any) {
      if (err?.response?.data?.message?.includes('archived')) {
        setMessage('No se puede editar una tarea archivada.');
      } else {
        setMessage('Error al actualizar la tarea');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading">Cargando tarea...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!task) return <div className="error">No se encontró la tarea</div>;

  return (
    <div className="task-edit-container" style={{ maxWidth: 700, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <Link to={-1 as any} className="btn btn-secondary btn-sm" style={{ marginRight: 16 }}>
          <FontAwesomeIcon icon={faArrowLeft} /> Volver
        </Link>
        <h1 style={{ margin: 0 }}>Editar Tarea</h1>
      </div>
      {/* Alerta personalizada para errores */}
      {message && (
        <div className={`message error`} style={{ marginBottom: 16 }}>
          <FontAwesomeIcon icon={faTimes} />
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
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label>Miembros asignados</label>
          <select
            multiple
            className="form-control"
            value={assignedMembers.map(m => m.id.toString())}
            onChange={handleMembersChange}
            style={{ minHeight: 80 }}
          >
            {availableMembers.map(member => (
              <option key={member.id} value={member.id}>
                {member.firstName && member.lastName ? `${member.firstName} ${member.lastName} (${member.login})` : member.login}
              </option>
            ))}
          </select>
          <small className="form-text text-muted">Miembros asignados actualmente: {assignedMembers.length}</small>
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

export default TaskEdit;
