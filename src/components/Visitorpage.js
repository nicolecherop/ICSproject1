import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import './Visitorpage.css';

const Visitorpage = () => {
  const today = new Date().toISOString().split('T')[0];
  const navigate = useNavigate();

  const goToLogin = () => {
    navigate('/');
  };

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
    setConfirmation(null);
  };

  const handlePrint = () => {
    const printContent = document.getElementById('printable-pass');
    const WinPrint = window.open('', '', 'width=800,height=600');

    WinPrint.document.write(`
      <html>
        <head>
          <title>Print Parking Pass</title>
          <style>
            @page {
              size: auto;
              
            }
            body {
           
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              max-height: 600px;
              background: white;
            }
            .print-confirmation-card {
              border: 2px solid #2c3e50;
              border-radius: 10px;
              padding: 30px;
              background: white;
              width: 350px;
              text-align: center;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .print-confirmation-card h2 {
              color: #2c3e50;
              margin-bottom: 20px;
              font-size: 24px;
              border-bottom: 2px solid #3498db;
              padding-bottom: 10px;
            }
            .print-confirmation-card p {
              margin: 12px 0;
              font-size: 16px;
              color: #34495e;
              text-align: left;
            }
            .print-confirmation-card strong {
              color: #2c3e50;
            }
            .qr-code-container {
              margin: 20px auto;
              padding: 15px;
              background: white;
              display: inline-block;
            }
            .pass-id {
              font-size: 18px;
              font-weight: bold;
              color: #3498db;
              margin: 15px 0;
              letter-spacing: 1px;
            }
            .print-instructions {
              font-style: italic;
              color: #7f8c8d;
              margin-top: 20px;
              font-size: 14px;
            }
            .no-print {
              display: none;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    WinPrint.document.close();
    WinPrint.focus();
    WinPrint.print();
    WinPrint.close();
  };

  return (
    <div className={confirmation ? 'confirmation-container' : 'form-container'}>
      {!confirmation ? (
        <div className="container">
          <h1>Visitor Registration</h1>
          <form id="visitorForm" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName" className="required-field">First Name</label>
                <input type="text" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="lastName" className="required-field">Last Name</label>
                <input type="text" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="required-field">Email Address</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="numberplate" className="required-field">Car Number Plate</label>
                <input type="text" id="numberplate" name="numberplate" value={formData.numberplate} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label htmlFor="visitDate" className="required-field">Date of Visit</label>
                <input type="date" id="visitDate" name="visitDate" value={formData.visitDate} onChange={handleChange} required min={today} />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="carDescription">Car Description (Make/Model/Color)</label>
              <input type="text" id="carDescription" name="carDescription" value={formData.carDescription} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label htmlFor="visitReason" className="required-field">Reason for Visit</label>
              <select id="visitReason" name="visitReason" value={formData.visitReason} onChange={handleChange} required>
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
                <input type="text" id="otherReason" name="otherReason" value={formData.otherReason} onChange={handleChange} />
              </div>
            )}

            {error && <p className="error-message">{error}</p>}

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Visitor Information'}
            </button>
          </form>

          <button className="go-back-btn" onClick={goToLogin}>Go Back</button>
        </div>
      ) : (
        <div className="confirmation-wrapper">
          <div className="confirmation-card" id="printable-pass">
            <h2>Visitor Parking Pass</h2>
            <div className="pass-details">
              <p><strong>Visitor Name:</strong> {confirmation.name}</p>
              <p><strong>Visit Date:</strong> {new Date(confirmation.date).toLocaleDateString()}</p>
              <p><strong>Pass ID:</strong></p>
              <div className="pass-id">{confirmation.parkingPassId}</div>
            </div>

            <div className="qr-code-container">
              <QRCodeSVG value={confirmation.parkingPassId} size={180} level="H" includeMargin={true} />
            </div>

            <p className="pass-instructions">
              Please display this pass on your dashboard during your visit
            </p>

            <div className="button-group no-print">
              <button className="print-btn" onClick={handlePrint}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                  <path d="M6 14h12v8H6z"/>
                </svg>
                Print Pass
              </button>
              <button className="go-back-btn" onClick={handleGoBack}>Back</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Visitorpage;