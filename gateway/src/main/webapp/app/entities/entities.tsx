import React from 'react';
import { RouteObject } from 'react-router-dom';
import WorkGroup from './work-group'; // Esto apunta a work-group/index.tsx

const entityRoutes: RouteObject[] = [
  {
    path: 'work-group',
    element: <WorkGroup />,
  },
  // Aquí se agregarán otras entidades como Project, Task, etc.
];

export default entityRoutes;
