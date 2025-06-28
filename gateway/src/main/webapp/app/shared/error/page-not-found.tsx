import React from 'react';

import { Alert } from 'reactstrap';

const PageNotFound = () => {
  return (
    <div>
      <Alert color="danger" timeout={5000}>
        The page does not exist.
      </Alert>
    </div>
  );
};

export default PageNotFound;
