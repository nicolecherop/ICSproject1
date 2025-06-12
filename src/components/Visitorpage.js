import React, { useState } from 'react';
import './Visitorpage.css';

const Visitorpage = () => {
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    numberplate: '',
    visitDate: today,
    carDescription: '',
    visitReason: '',
    otherReason: ''
  });

  const [showOtherReason, setShowOtherReason] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'visitReason') {
      setShowOtherReason(value === 'Other');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setConfirmation(null);

    try {
      const response = await fetch('http://localhost:5000/api/visitor/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setConfirmation({
        name: `${formData.firstName} ${formData.lastName}`,
        date: `${formData.visitDate}`,
        parkingPassId: data.parkingPassId
      });

      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        numberplate: '',
        visitDate: today,
        carDescription: '',
        visitReason: '',
        otherReason: ''
      });
      setShowOtherReason(false);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="container">
      <h1>Visitor Registration</h1>
      <form id="visitorForm" onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="firstName" className="required-field">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="lastName" className="required-field">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="email" className="required-field">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="numberplate" className="required-field">Car Number Plate</label>
            <input
              type="text"
              id="numberplate"
              name="numberplate"
              value={formData.numberplate}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="visitDate" className="required-field">Date of Visit</label>
            <input
              type="date"
              id="visitDate"
              name="visitDate"
              value={formData.visitDate}
              onChange={handleChange}
              required
              min={today}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="carDescription">Car Description (Make/Model/Color)</label>
          <input
            type="text"
            id="carDescription"
            name="carDescription"
            value={formData.carDescription}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label htmlFor="visitReason" className="required-field">Reason for Visit</label>
          <select
            id="visitReason"
            name="visitReason"
            value={formData.visitReason}
            onChange={handleChange}
            required
          >
            <option value="" disabled>Select a reason</option>
            <option value="Meeting">Meeting</option>
            <option value="Service">Inquiry</option>
            <option value="Interview">Interview</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {showOtherReason && (
          <div className="form-group">
            <label htmlFor="otherReason">Please specify</label>
            <input
              type="text"
              id="otherReason"
              name="otherReason"
              value={formData.otherReason}
              onChange={handleChange}
            />
          </div>
        )}

        {error && <p className="error-message">{error}</p>}

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit Visitor Information'}
        </button>
      </form>

      <button className="go-back-btn" onClick={handleGoBack}>Go Back</button>

      {confirmation && (
        <div className="confirmation-card">
          <h2>Successfully Registered!</h2>
          <p>Visitor: <strong>{confirmation.name}</strong></p>
          <p>Your Parking Pass ID:</p>
          <p>Date of visit:{confirmation.date}</p>
          <h3>{confirmation.parkingPassId}</h3>
        </div>
      )}
    </div>
  );
};

export default Visitorpage;
