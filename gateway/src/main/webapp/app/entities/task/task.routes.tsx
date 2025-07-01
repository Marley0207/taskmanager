import React from 'react';
import { Route, Routes } from 'react-router-dom';
import TaskList from './TaskList';
import TaskCreate from './task-create';
import TaskDetails from './TaskDetails';
import TaskEdit from './TaskEdit';

const TaskRoutes = () => {
  return (
    <Routes>
      <Route index element={<TaskList />} />
      <Route path="create" element={<TaskCreate />} />
      <Route path=":projectId" element={<TaskList />} />
      <Route path=":id/edit" element={<TaskEdit />} />
      <Route path=":id/details" element={<TaskDetails />} />
    </Routes>
  );
};

export default TaskRoutes;
