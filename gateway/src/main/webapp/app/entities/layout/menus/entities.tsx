import React from 'react';
import { useAppSelector } from 'app/config/store';
import { NavLink } from 'react-router-dom';

const EntitiesMenu = () => {
  const account = useAppSelector(state => state.authentication.account);
  const isAdmin = account?.authorities?.includes('ROLE_ADMIN');

  return (
    <>
      {isAdmin && (
        <li>
          <NavLink to="/priority-admin" className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="fa fa-flag" /> Prioridades
          </NavLink>
        </li>
      )}
    </>
  );
};

export default EntitiesMenu;
