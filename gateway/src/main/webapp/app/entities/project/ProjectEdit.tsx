import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { patchProject, getProject } from './project.api';
import { IProject } from './project.model';

const ProjectEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<IProject | null>(null);
  const [form, setForm] = useState<Partial<IProject>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getProject(parseInt(id, 10))
      .then(res => {
        setProject(res.data);
        setForm(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Error al cargar el proyecto');
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (!form.title || form.title.trim() === '') {
      setError('El título es obligatorio');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      // Siempre incluye los miembros actuales si no se están editando
      const patch: Partial<IProject> = {
        id: project?.id,
        deleted: project?.deleted || false, // Asegurar que deleted no sea null
      };
      Object.keys(form).forEach(key => {
        if ((form as any)[key] !== (project as any)[key]) {
          (patch as any)[key] = (form as any)[key];
        }
      });
      if (!('members' in patch)) {
        patch.members = project?.members || [];
      }
      await patchProject(parseInt(id, 10), patch);
      if (project && project.workGroup && project.workGroup.id) {
        navigate(`/work-groups/${project.workGroup.id}/projects`);
      } else {
        navigate('/projects');
      }
    } catch (err) {
      setError('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Cargando...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!project) return <div>No se encontró el proyecto</div>;

  return (
    <div className="project-edit-container">
      <h2>Editar Proyecto</h2>
      <form onSubmit={handleSubmit} className="project-form">
        <div className="form-group">
          <label htmlFor="title">Título</label>
          <input
            type="text"
            id="title"
            name="title"
            value={form.title || ''}
            onChange={handleChange}
            className="form-control"
            placeholder="Ingrese el título del proyecto"
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Descripción</label>
          <textarea
            id="description"
            name="description"
            value={form.description || ''}
            onChange={handleChange}
            className="form-control"
            rows={4}
            placeholder="Ingrese la descripción del proyecto"
          />
        </div>
        {/* Puedes agregar más campos editables aquí según tu modelo */}
        <div className="form-actions">
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <button
            type="button"
            onClick={() =>
              project && project.workGroup && project.workGroup.id
                ? navigate(`/work-groups/${project.workGroup.id}/projects`)
                : navigate('/projects')
            }
            className="btn btn-secondary"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectEdit;
