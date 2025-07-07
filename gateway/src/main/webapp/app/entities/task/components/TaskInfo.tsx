import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ITask, TaskStatus } from '../task.model';
import { getPriorityIcon, getStatusIcon, getPriorityText, getStatusText } from '../utils/taskUtils';

interface TaskInfoProps {
  task: ITask;
}

const TaskInfo: React.FC<TaskInfoProps> = ({ task }) => (
  <>
    <div style={{ marginBottom: 16 }}>
      <strong>Descripción:</strong>
      <div style={{ marginTop: 4 }}>{task.description || 'Sin descripción'}</div>
    </div>
    <div style={{ display: 'flex', gap: 32, marginBottom: 16 }}>
      <div>
        <strong>Prioridad:</strong> {getPriorityIcon(task.priority)} {getPriorityText(task.priority)}
      </div>
      <div>
        <strong>Estado:</strong> {getStatusIcon(task.status)} {getStatusText(task.status)}
      </div>
    </div>
  </>
);

export default TaskInfo;
