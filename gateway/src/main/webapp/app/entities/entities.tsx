import React from 'react';
import { RouteObject, Routes, Route } from 'react-router-dom';
import WorkGroup from './work-group'; // Esto apunta a work-group/index.tsx
import Project from './project'; // Esto apunta a project/index.tsx
import Task from './task'; // Esto apunta a task/index.tsx
import PriorityAdmin from './priority/PriorityAdmin';
import { useAppSelector } from 'app/config/store';

const entityRoutes: RouteObject[] = [
  {
    path: 'work-groups',
    element: <WorkGroup />,
  },
  {
    path: 'projects',
    element: <Project />,
  },
  {
    path: 'tasks',
    element: <Task />,
  },
  // Aquí se agregarán otras entidades como Task, etc.
];

const EntitiesRoutes = () => {
  const account = useAppSelector(state => state.authentication.account);
  const isAdmin = account?.authorities?.includes('ROLE_ADMIN');
  console.warn('isAdmin:', isAdmin, 'account:', account);
  return (
    <Routes>
      {entityRoutes.map((route, index) => (
        <Route key={index} path={route.path} element={route.element} />
      ))}
      {isAdmin && <Route path="/priority-admin" element={<PriorityAdmin />} />}
    </Routes>
  );
};

export default EntitiesRoutes;
