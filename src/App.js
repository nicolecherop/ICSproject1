import React from 'react';

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Loginform from './components/Loginform'; 
import Stafflogin from './components/Stafflogin';
import Adminlogin from './components/Adminlogin';
import Registerform from './components/Registerform';
import Userprofile from './components/Userprofile';
import Visitorpage from './components/Visitorpage';
import Admindashboard from './components/Admindashboard';



function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Loginform />} />
        <Route path="/Stafflogin" element={<Stafflogin />} />
        <Route path="/Adminlogin" element={<Adminlogin />} />
        <Route path="/Registerform" element={<Registerform />} />
        <Route path="/Userprofile" element={<Userprofile />} />
        <Route path="/Visitorpage" element={<Visitorpage />} />
        <Route path="/Admindashboard" element={<Admindashboard />} />
        

      </Routes>
    </Router>
  );
}
export default App;
