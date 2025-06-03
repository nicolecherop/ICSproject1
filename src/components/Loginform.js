import React from 'react';
import { Outlet, Link } from "react-router-dom";
import './Loginform.css'; 

const Loginform = () => {
 
  return (
    <div className="wrapper">
      <div className="card">
        <p className="title">Log In</p>
        <p className="subtitle">Choose your account type</p>
        <form>
          <div className="option">
            <Link to="/Stafflogin" ><button type="button" className="btn" >
              Student/Staff
            </button>
            </Link>
          </div>
          <div className="option">
            <Link to= "/Adminlogin"><button type="button" className="btn">
              Admin
            </button>
            </Link>
          </div>
          <button type="button" className="btn">
            Visitor
          </button>
          <div className="btn-link"><Link to="/Registerform">Don't have an account?</Link></div>
        </form>
      </div>
    </div>
  );
};

export default Loginform;
