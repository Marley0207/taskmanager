import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faEdit, faTrash, faFlag } from '@fortawesome/free-solid-svg-icons';
import { ITask } from '../task.model';

interface TaskHeaderProps {
  task: ITask;
  onEdit: () => void;
  onDelete: () => void;
  onArchive: () => void;
  canArchive: boolean;
}

const TaskHeader: React.FC<TaskHeaderProps> = ({ task, onEdit, onDelete, onArchive, canArchive }) => (
  <div className="task-details-header" style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
    <Link
      to={
        task.parentTaskId
          ? `/tasks/${task.parentTaskId}/details`
          : task && task.project && task.project.id
            ? `/tasks?projectId=${task.project.id}`
            : '/tasks'
      }
      className="btn btn-secondary btn-sm"
      style={{ marginRight: 16 }}
    >
      <FontAwesomeIcon icon={faArrowLeft} /> Volver
    </Link>
    <h1 style={{ margin: 0 }}>{task.title}</h1>
    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
      <Link to={`/tasks/${task.id}/edit`} className="btn btn-warning btn-sm">
        <FontAwesomeIcon icon={faEdit} /> Editar
      </Link>
      <button onClick={onDelete} className="btn btn-danger btn-sm">
        <FontAwesomeIcon icon={faTrash} /> Eliminar
      </button>
      {canArchive && (
        <button onClick={onArchive} className="btn btn-secondary btn-sm">
          <FontAwesomeIcon icon={faFlag} /> Archivar
        </button>
      )}
    </div>
  </div>
);

export default TaskHeader;
