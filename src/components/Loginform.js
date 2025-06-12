import React from 'react';
import { Link } from "react-router-dom";
import './Loginform.css'; 

const Loginform = () => {
 
  return (
    <div className="wrapper">
      <div className="card">
        <p className="title">Welcome</p>
        <p className="subtitle">Sign in</p>
        <form>
          <div className="option">
            <Link to="/Stafflogin" ><button type="button" className="btn" >
              Student/Staff
            </button>
            </Link>
          </div>
          
          <Link to="/Visitorpage"><button type="button" className="btn">
            Visitor
          </button></Link>
          <div className="btn-link"><Link to="/Registerform">Don't have an account?</Link></div>
        </form>
      </div>
    </div>
  );
};

export default Loginform;
