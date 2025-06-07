import React, { useState } from 'react';
import './Loginform.css';
import { Link } from 'react-router-dom';

const Registerform = () => {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { firstname, lastname, email, password, confirmPassword } = formData;

    // Frontend validation
    if (!firstname || !lastname || !email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstname,
          lastname,
          email,
          password 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess(data.message || 'Registration successful!');
      setFormData({
        firstname: '',
        lastname: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="wrapper">
      <div className="card2">
        <p className="title2">Registration Form</p>
        <form onSubmit={handleSubmit}>
          <div className="field2">
            <input
              type="text"
              name="firstname"
              placeholder="Firstname"
              className="input-field"
              value={formData.firstname}
              onChange={handleChange}
              required
            />
          </div>
          <div className="field2">
            <input
              type="text"
              name="lastname"
              placeholder="Lastname"
              className="input-field"
              value={formData.lastname}
              onChange={handleChange}
              required
            />
          </div>
          <div className="field2">
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="input-field"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="field2">
            <input
              type="password"
              name="password"
              placeholder="Password (min 8 characters)"
              className="input-field"
              value={formData.password}
              onChange={handleChange}
              minLength="8"
              required
            />
          </div>
          <div className="field2">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              className="input-field"
              value={formData.confirmPassword}
              onChange={handleChange}
              minLength="8"
              required
            />
          </div>
          
          {error && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
          
          <button 
            type="submit" 
            className="btn" 
            disabled={isLoading}
          >
            {isLoading ? 'Registering...' : 'Submit'}
          </button>
          <div className="btn-link"><Link to="/">Go Back</Link></div>
        </form>
      </div>
    </div>
  );
};

export default Registerform;