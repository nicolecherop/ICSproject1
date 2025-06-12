import React, { useState } from 'react';
import './Loginform.css';
import { Link, useNavigate } from 'react-router-dom';

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
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Trim all inputs
    const trimmedData = {
      firstname: formData.firstname.trim(),
      lastname: formData.lastname.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password.trim(),
      confirmPassword: formData.confirmPassword.trim()
    };

    // Clear previous messages
    setError('');
    setSuccess('');

    // Validate form
    if (!trimmedData.firstname || !trimmedData.lastname || 
        !trimmedData.email || !trimmedData.password || 
        !trimmedData.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (trimmedData.password !== trimmedData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (trimmedData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(trimmedData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess('Registration successful! Redirecting...');
      
      // Store token and user data
      localStorage.setItem('staffToken', data.token);
      localStorage.setItem('userData', JSON.stringify(data.user));
      
      // Redirect based on role
      setTimeout(() => {
        navigate(data.user.role === 'admin' ? '/Admindashboard' : '/Userprofile');
      }, 1500);

    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
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
          
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <button 
            type="submit" 
            className="btn" 
            disabled={isLoading}
          >
            {isLoading ? 'Registering...' : 'Submit'}
          </button>
          <div className="btn-link">
            <Link to="/">Go back</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Registerform;