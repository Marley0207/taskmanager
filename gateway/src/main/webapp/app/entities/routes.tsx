import React from 'react';
import { Route } from 'react-router-dom';
import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
// import { ReducersMapObject, combineReducers } from '@reduxjs/toolkit';
// import getStore from 'app/config/store';
// import entitiesReducers from './reducers';
import WorkGroupRoutes from './work-group/work-group.routes';
import ProjectRoutes from './project/project.routes';

/* jhipster-needle-add-route-import - JHipster will add routes here */

export default () => {
  // const store = getStore();
  // store.injectReducer('gateway', combineReducers(entitiesReducers as ReducersMapObject));
  return (
    <ErrorBoundaryRoutes>
      {/* prettier-ignore */}
      {/* jhipster-needle-add-route-path - JHipster will add routes here */}
      <Route path="work-groups/*" element={<WorkGroupRoutes />} />
      <Route path="projects/*" element={<ProjectRoutes />} />
    </ErrorBoundaryRoutes>
  );
};
