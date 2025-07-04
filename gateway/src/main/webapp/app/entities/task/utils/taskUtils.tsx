import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faFlag, faCheckCircle, faClock } from '@fortawesome/free-solid-svg-icons';
import { TaskPriority, TaskStatus } from '../task.model';

export const getPriorityIcon = (priority: TaskPriority): React.ReactNode => {
  switch (priority) {
    case TaskPriority.HIGH:
      return <FontAwesomeIcon icon={faExclamationTriangle} className="priority-high" />;
    case TaskPriority.NORMAL:
      return <FontAwesomeIcon icon={faFlag} className="priority-normal" />;
    case TaskPriority.LOW:
      return <FontAwesomeIcon icon={faFlag} className="priority-low" />;
    default:
      return null;
  }
};

export const getStatusIcon = (status: TaskStatus): React.ReactNode => {
  switch (status) {
    case TaskStatus.DONE:
      return <FontAwesomeIcon icon={faCheckCircle} className="status-done" />;
    case TaskStatus.WORKING_ON_IT:
      return <FontAwesomeIcon icon={faClock} className="status-working" />;
    case TaskStatus.NOT_STARTED:
      return <FontAwesomeIcon icon={faClock} className="status-not-started" />;
    default:
      return null;
  }
};

export const getStatusText = (status: TaskStatus) => {
  switch (status) {
    case TaskStatus.DONE:
      return 'Completada';
    case TaskStatus.WORKING_ON_IT:
      return 'En Progreso';
    case TaskStatus.NOT_STARTED:
      return 'No Iniciada';
    default:
      return status;
  }
};

export const getPriorityText = (priority: TaskPriority) => {
  switch (priority) {
    case TaskPriority.HIGH:
      return 'Alta';
    case TaskPriority.NORMAL:
      return 'Normal';
    case TaskPriority.LOW:
      return 'Baja';
    default:
      return priority;
  }
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
