import React from 'react';

import MenuItem from 'app/shared/layout/menus/menu-item';

const EntitiesMenu = () => {
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
    </>
  );
};

export default EntitiesMenu;
