import React from 'react';
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Loginform from './components/Loginform'; 
import Stafflogin from './components/Stafflogin';
import Adminlogin from './components/Adminlogin';
import Registerform from './components/Registerform';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Loginform />} />
        <Route path="/Stafflogin" element={<Stafflogin />} />
        <Route path="/Adminlogin" element={<Adminlogin />} />
        <Route path="/Registerform" element={<Registerform />} />

      </Routes>
    </Router>
  );
}
export default App;
