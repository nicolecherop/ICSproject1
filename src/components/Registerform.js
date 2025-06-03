import React from 'react';
import './Loginform.css'; 
import { Link } from 'react-router-dom';

const Registerform = () => {
  return (
    <div className="wrapper">
      <div className="card2">
        <p className="title2">Registration Form</p>
        <form>
            <div className="field2">
            <input type="text" placeholder="Firstname" className="input-field" />
          </div><div className="field2">
            <input type="text" placeholder="Lastname" className="input-field" />
          </div>
          <div className="field2">
          <input type="email" placeholder="Email" className="input-field" />
          </div>
          <div className="field2">
            <input type="password" placeholder="Password" className="input-field" />
          </div>
           <div className="field2">
            <input type="password" placeholder="Confirm Password" className="input-field" />
          </div>
          <button type="submit" className="btn">Submit</button>
          <div className="btn-link"><Link to="/">Go Back</Link></div>
        </form>
      </div>
    </div>
  );
};

export default Registerform;
