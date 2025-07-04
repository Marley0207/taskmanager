import React from 'react';
import { useAppSelector } from 'app/config/store';

import MenuItem from 'app/shared/layout/menus/menu-item';

const EntitiesMenu = () => {
  const account = useAppSelector(state => state.authentication.account);
  const isAdmin = account?.authorities?.includes('ROLE_ADMIN');
  return (
    <>
      {/* prettier-ignore */}
      {/* jhipster-needle-add-entity-to-menu - JHipster will add entities to the menu here */}
      <MenuItem icon="asterisk" to="/work-groups">
        Work Group
      </MenuItem>
      <MenuItem icon="tasks" to="/projects">
        Proyectos
      </MenuItem>
      <MenuItem icon="list" to="/tasks">
        Tareas
      </MenuItem>
      {isAdmin && (
        <MenuItem icon="flag" to="/priority-admin">
          Prioridades
        </MenuItem>
      )}
    </>
  );
};

export default EntitiesMenu;
