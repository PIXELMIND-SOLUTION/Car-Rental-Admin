import React, { useState } from 'react';
import {
  Form,
  Button,
  Container,
  Row,
  Col,
  Card,
  Alert,
  Spinner
} from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('https://varahibackend.varahiselfdrivecars.com/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, password }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Login failed');
      }

      const data = await response.json();
      sessionStorage.setItem('adminUser', JSON.stringify({
        mobile: data.admin.mobile,
        email: data.admin.email,
        name: data.admin.name,
        id: data.admin._id,
        token: data.token,
      }));

      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundImage: 'url("/carback.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <Container>
        <Row className="justify-content-center">
          <Col xs={12} sm={10} md={8} lg={6} xl={5}>
            <Card
              className="shadow-lg border-0"
              style={{
                borderRadius: '15px',
                backgroundColor: 'rgba(255, 255, 255, 0.75)',
                overflow: 'hidden'
              }}
            >
              <Card.Body className="p-4 p-sm-5">
                <div className="text-center mb-4">
                  <h3
                    className="fw-bold"
                    style={{
                      background: 'linear-gradient(to right, #6f42c1, #6610f2)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    Admin Portal
                  </h3>
                  <p className="text-muted">Sign in to your admin account</p>
                </div>

                {error && (
                  <Alert variant="danger" className="rounded-pill text-center">
                    {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group controlId="mobile" className="mb-3">
                    <Form.Label className="text-muted">Mobile Number</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0">+91</span>
                      <Form.Control
                        type="tel"
                        placeholder="Enter mobile number"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        required
                        className="border-start-0"
                        style={{ height: '50px' }}
                      />
                    </div>
                  </Form.Group>

                  <Form.Group controlId="password" className="mb-4">
                    <Form.Label className="text-muted">Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      style={{ height: '50px' }}
                    />
                  </Form.Group>

                  <Button
                    type="submit"
                    variant="primary"
                    className="w-100 py-3 mt-2 rounded-pill border-0"
                    disabled={loading}
                    style={{
                      background: 'linear-gradient(to right, #6f42c1, #6610f2)',
                      fontWeight: '600',
                      letterSpacing: '0.5px'
                    }}
                  >
                    {loading ? (
                      <>
                        <Spinner
                          as="span"
                          animation="border"
                          size="sm"
                          role="status"
                          aria-hidden="true"
                          className="me-2"
                        />
                        Authenticating...
                      </>
                    ) : (
                      'Login'
                    )}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default AdminLogin;
