import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ITask, TaskPriority, TaskStatus } from '../task.model';

interface TaskInfoProps {
  task: ITask;
  getPriorityIcon: (priority: TaskPriority) => React.ReactNode;
  getStatusIcon: (status: TaskStatus) => React.ReactNode;
  getPriorityText: (priority: TaskPriority) => string;
  getStatusText: (status: TaskStatus) => string;
}

const TaskInfo: React.FC<TaskInfoProps> = ({ task, getPriorityIcon, getStatusIcon, getPriorityText, getStatusText }) => (
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
