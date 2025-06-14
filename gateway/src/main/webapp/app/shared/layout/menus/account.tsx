import React from 'react';
import MenuItem from 'app/shared/layout/menus/menu-item';
import { DropdownItem } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { getLoginUrl } from 'app/shared/util/url-utils';
import { useLocation, useNavigate } from 'react-router';
import { NavDropdown } from './menu-components';

const accountMenuItemsAuthenticated = () => (
  <>
    <MenuItem icon="sign-out-alt" to="/logout" data-cy="logout">
      Sign out
    </MenuItem>
  </>
);

const accountMenuItems = () => {
  const navigate = useNavigate();
  const pageLocation = useLocation();

  return (
    <>
      <DropdownItem
        id="login-item"
        tag="a"
        data-cy="login"
        onClick={() =>
          navigate(getLoginUrl(), {
            state: { from: pageLocation },
          })
        }
      >
        <FontAwesomeIcon icon="sign-in-alt" /> Sign in
      </DropdownItem>
    </>
  );
};

export const AccountMenu = ({ isAuthenticated = false }) => (
  <NavDropdown icon="user" name="Account" id="account-menu" data-cy="accountMenu">
    {isAuthenticated && accountMenuItemsAuthenticated()}
    {!isAuthenticated && accountMenuItems()}
  </NavDropdown>
);

export default AccountMenu;
