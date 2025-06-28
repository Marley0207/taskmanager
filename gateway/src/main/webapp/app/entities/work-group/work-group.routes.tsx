import React from 'react';
import { Route, Routes } from 'react-router-dom';
import WorkGroupList from './work-group-list'; // el listado que ya tienes
import WorkGroupCreate from './work-group-create';
import WorkGroupDetails from './WorkGroupDetails';

const WorkGroupRoutes = () => {
  return (
    <Routes>
      <Route index element={<WorkGroupList />} />
      <Route path="create" element={<WorkGroupCreate />} />
      <Route path=":id/details" element={<WorkGroupDetails />} />
    </Routes>
  );
};

export default WorkGroupRoutes;
