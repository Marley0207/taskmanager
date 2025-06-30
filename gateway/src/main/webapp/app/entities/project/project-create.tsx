import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faBan } from '@fortawesome/free-solid-svg-icons';
import { createProject, updateProject, getProject } from './project.api';
import { getWorkGroups, getMyWorkGroups, getWorkGroupMembers } from '../work-group/work-group.api';
import { IProject, defaultValue } from './project.model';
import { IWorkGroup, IWorkGroupMember } from '../work-group/work-group.model';
import './project-create.scss';
import { useAppSelector } from 'app/config/store';

const ProjectCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isNew = !id;

  const [project, setProject] = useState<IProject>(defaultValue);
  const [workGroups, setWorkGroups] = useState<IWorkGroup[]>([]);
  const [availableMembers, setAvailableMembers] = useState<IWorkGroupMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const account = useAppSelector(state => state.authentication.account);

  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      try {
        const workGroupsResponse = await getMyWorkGroups();
        if (isMounted) {
          setWorkGroups(workGroupsResponse.data);
        }

        if (!isNew && id) {
          setLoading(true);
          try {
            const projectResponse = await getProject(parseInt(id, 10));
            if (isMounted) {
              setProject(projectResponse.data);
              setSelectedMembers(projectResponse.data.members?.map(m => m.login) || []);
            }
          } catch (error) {
            console.error('Error loading project:', error);
          } finally {
            setLoading(false);
          }
        }
      } catch (error) {
        console.error('Error loading work groups:', error);
      }
    };

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [isNew, id]);

  useEffect(() => {
    let isMounted = true;

    const loadMembers = async () => {
      if (project.workGroup?.id) {
        try {
          const response = await getWorkGroupMembers(project.workGroup.id);
          if (isMounted) {
            setAvailableMembers(response.data.map((item: any) => item.user));
          }
        } catch (error) {
          console.error('Error loading work group members:', error);
        }
      }
    };

    loadMembers();
    return () => {
      isMounted = false;
    };
  }, [project.workGroup?.id]);

  useEffect(() => {
    setSelectedMembers([]);
  }, [project.workGroup?.id]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;

    if (name === 'workGroupId') {
      const selectedId = parseInt(value, 10);
      const selectedWorkGroup = workGroups.find(wg => wg.id === selectedId);
      if (selectedWorkGroup) {
        setProject(prev => ({
          ...prev,
          workGroup: { id: selectedWorkGroup.id, name: selectedWorkGroup.name, description: selectedWorkGroup.description },
        }));
      }
    } else {
      setProject(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleMemberToggle = (memberLogin: string) => {
    setSelectedMembers(prev => (prev.includes(memberLogin) ? prev.filter(login => login !== memberLogin) : [...prev, memberLogin]));
  };

  const saveEntity = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!project.title.trim()) {
      alert('El título es obligatorio');
      return;
    }
    if (!project.workGroup?.id) {
      alert('Debe seleccionar un grupo de trabajo');
      return;
    }

    setSaving(true);
    try {
      const entityToSave: IProject = {
        ...project,
        members: selectedMembers.map(login => {
          const member = availableMembers.find(m => m.login === login);
          return {
            id: member.id,
            login: member.login,
            firstName: member.firstName,
            lastName: member.lastName,
            email: member.email,
          };
        }),
      };

      if (isNew) {
        await createProject(entityToSave);
        setAlertMessage('Proyecto creado exitosamente');
        setTimeout(() => navigate('/projects'), 1500);
      } else {
        await updateProject(entityToSave);
        setAlertMessage('Proyecto actualizado exitosamente');
        setTimeout(() => navigate('/projects'), 1500);
      }
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/projects');
  };

  if (loading) {
    return <div className="loading">Cargando proyecto...</div>;
  }

  return (
    <div className="project-create-container">
      {alertMessage && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          {alertMessage}
        </div>
      )}
      <div className="project-create-header">
        <h2>{isNew ? 'Crear Nuevo Proyecto' : 'Editar Proyecto'}</h2>
      </div>

      <form onSubmit={saveEntity} className="project-form">
        <div className="form-group">
          <label htmlFor="title">Título *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={project.title}
            onChange={handleInputChange}
            required
            className="form-control"
            placeholder="Ingrese el título del proyecto"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Descripción</label>
          <textarea
            id="description"
            name="description"
            value={project.description || ''}
            onChange={handleInputChange}
            className="form-control"
            rows={4}
            placeholder="Ingrese la descripción del proyecto"
          />
        </div>

        <div className="form-group">
          <label htmlFor="workGroupId">Grupo de Trabajo *</label>
          <select
            id="workGroupId"
            name="workGroupId"
            value={project.workGroup?.id ?? ''}
            onChange={handleInputChange}
            required
            className="form-control"
          >
            <option value="">Seleccione un grupo de trabajo</option>
            {workGroups.map(wg => (
              <option key={`wg-${wg.id}`} value={wg.id}>
                {wg.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Miembros Asignados</label>
          <div className="members-selection">
            {project.workGroup?.id ? (
              availableMembers && availableMembers.length > 0 ? (
                <>
                  {availableMembers
                    .filter(member => member.login !== account.login)
                    .map(member => {
                      if (!member || !member.id || !member.login) return null;
                      return (
                        <div key={member.login} className="member-checkbox">
                          <input
                            type="checkbox"
                            id={`member-${member.id}`}
                            checked={selectedMembers.includes(member.login)}
                            onChange={() => handleMemberToggle(member.login)}
                          />
                          <label htmlFor={`member-${member.id}`}>
                            {member.firstName} {member.lastName} ({member.login})
                          </label>
                        </div>
                      );
                    })}
                </>
              ) : (
                <div className="no-members">No hay miembros disponibles en este grupo.</div>
              )
            ) : (
              <div className="no-members">Seleccione primero un grupo de trabajo para asignar miembros.</div>
            )}
          </div>
          <small className="form-text text-muted">Seleccione los miembros del grupo que desea asignar al proyecto</small>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={saving} className="btn btn-primary">
            <FontAwesomeIcon icon={faSave} />
            {saving ? ' Guardando...' : ' Guardar'}
          </button>
          <button type="button" onClick={handleCancel} className="btn btn-secondary">
            <FontAwesomeIcon icon={faBan} /> Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectCreate;
