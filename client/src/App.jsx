import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import CRoutes from './Components/Routes/Routes';

import { bindAccessTokenRefreshListener, scheduleAccessRefresh } from './WebServer/utils/accessScheduler';

function App() {
  useEffect(() => {
    // מאזין לאירוע רענון (מה-interceptor/סקדולר)
    bindAccessTokenRefreshListener();

    // אם יש טוקן מהתחברות קודמת – תזמן רענון לפי exp
    const savedAccess = localStorage.getItem('accessToken');
    if (savedAccess) scheduleAccessRefresh(savedAccess);
  }, []);

  return (
        <BrowserRouter>
          <CRoutes />
        </BrowserRouter>
  );
}

export default App;
