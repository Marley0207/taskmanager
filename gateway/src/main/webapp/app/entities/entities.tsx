import React from 'react';
import { RouteObject } from 'react-router-dom';
import WorkGroup from './work-group'; // Esto apunta a work-group/index.tsx
import Project from './project'; // Esto apunta a project/index.tsx

const entityRoutes: RouteObject[] = [
  {
    path: 'work-groups',
    element: <WorkGroup />,
  },
  {
    path: 'projects',
    element: <Project />,
  },
  // Aquí se agregarán otras entidades como Task, etc.
];

export default entityRoutes;
