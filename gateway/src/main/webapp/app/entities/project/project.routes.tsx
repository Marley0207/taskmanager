import React from 'react';
import { Route, Routes } from 'react-router-dom';
import ProjectList from './project-list';
import ProjectCreate from './project-create';
import ProjectDetails from './ProjectDetails';
import ProjectEdit from './ProjectEdit';

const ProjectRoutes = () => {
  return (
    <Routes>
      <Route index element={<ProjectList />} />
      <Route path="create" element={<ProjectCreate />} />
      <Route path=":id/edit" element={<ProjectEdit />} />
      <Route path=":id/details" element={<ProjectDetails />} />
    </Routes>
  );
};

export default ProjectRoutes;
