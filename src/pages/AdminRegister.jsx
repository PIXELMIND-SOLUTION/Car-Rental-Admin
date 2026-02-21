// import React, { useState } from 'react';
// import { Form, Button, Container, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
// import { useNavigate } from 'react-router-dom';

// const AdminRegister = () => {
//   const [formData, setFormData] = useState({ name: '', mobile: '', email: '' });
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const navigate = useNavigate();

//   const handleChange = (e) =>
//     setFormData({ ...formData, [e.target.name]: e.target.value });

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setError('');
//     setSuccess('');
//     setLoading(true);

//     try {
//       const response = await fetch('https://varahibackend.varahiselfdrivecars.com/api/admin/register', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(formData),
//       });

//       if (!response.ok) {
//         const errData = await response.json();
//         throw new Error(errData.message || 'Registration failed');
//       }

//       setSuccess('Registration successful! Redirecting to login...');
//       setTimeout(() => navigate('/'), 2000);
//     } catch (err) {
//       setError(err.message || 'Something went wrong');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div
//       style={{
//         background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//         minHeight: '100vh',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         padding: '20px',
//       }}
//     >
//       <Container>
//         <Row className="justify-content-center">
//           <Col xs={12} sm={10} md={8} lg={6} xl={5}>
//             <Card
//               className="shadow-lg border-0"
//               style={{
//                 borderRadius: '15px',
//                 overflow: 'hidden',
//                 backdropFilter: 'blur(10px)',
//                 backgroundColor: 'rgba(255, 255, 255, 0.9)',
//               }}
//             >
//               <Card.Body className="p-4 p-sm-5">
//                 <div className="text-center mb-4">
//                   <h3
//                     className="fw-bold"
//                     style={{
//                       color: '#6f42c1',
//                       background: 'linear-gradient(to right, #6f42c1, #6610f2)',
//                       WebkitBackgroundClip: 'text',
//                       WebkitTextFillColor: 'transparent',
//                     }}
//                   >
//                     Admin Registration
//                   </h3>
//                   <p className="text-muted">Create your admin account</p>
//                 </div>

//                 {error && (
//                   <Alert variant="danger" className="rounded-pill text-center">
//                     {error}
//                   </Alert>
//                 )}
//                 {success && (
//                   <Alert variant="success" className="rounded-pill text-center">
//                     {success}
//                   </Alert>
//                 )}

//                 <Form onSubmit={handleSubmit}>
//                   <Form.Group controlId="name" className="mb-4">
//                     <Form.Label className="text-muted">Name</Form.Label>
//                     <Form.Control
//                       type="text"
//                       name="name"
//                       placeholder="Enter full name"
//                       value={formData.name}
//                       onChange={handleChange}
//                       required
//                       style={{ height: '50px' }}
//                     />
//                   </Form.Group>

//                   <Form.Group controlId="mobile" className="mb-4">
//                     <Form.Label className="text-muted">Mobile Number</Form.Label>
//                     <div className="input-group">
//                       <span className="input-group-text bg-light border-end-0">+91</span>
//                       <Form.Control
//                         type="tel"
//                         name="mobile"
//                         placeholder="Enter mobile number"
//                         value={formData.mobile}
//                         onChange={handleChange}
//                         required
//                         className="border-start-0"
//                         style={{ height: '50px' }}
//                       />
//                     </div>
//                   </Form.Group>

//                   <Form.Group controlId="email" className="mb-4">
//                     <Form.Label className="text-muted">Email</Form.Label>
//                     <Form.Control
//                       type="email"
//                       name="email"
//                       placeholder="Enter email address"
//                       value={formData.email}
//                       onChange={handleChange}
//                       required
//                       style={{ height: '50px' }}
//                     />
//                   </Form.Group>

//                   <Button
//                     type="submit"
//                     variant="primary"
//                     className="w-100 py-3 mt-3 rounded-pill border-0"
//                     disabled={loading}
//                     style={{
//                       background: 'linear-gradient(to right, #6f42c1, #6610f2)',
//                       fontWeight: '600',
//                       letterSpacing: '0.5px',
//                     }}
//                   >
//                     {loading ? (
//                       <>
//                         <Spinner
//                           as="span"
//                           animation="border"
//                           size="sm"
//                           role="status"
//                           aria-hidden="true"
//                           className="me-2"
//                         />
//                         Registering...
//                       </>
//                     ) : (
//                       'Register'
//                     )}
//                   </Button>
//                 </Form>

//                 <div className="text-center mt-4">
//                   <p className="text-muted mb-0">
//                     Already have an account?{' '}
//                     <span
//                       className="text-primary fw-bold"
//                       style={{
//                         cursor: 'pointer',
//                         background: 'linear-gradient(to right, #6f42c1, #6610f2)',
//                         WebkitBackgroundClip: 'text',
//                         WebkitTextFillColor: 'transparent',
//                       }}
//                       onClick={() => navigate('/')}
//                     >
//                       Login here
//                     </span>
//                   </p>
//                 </div>
//               </Card.Body>
//             </Card>
//           </Col>
//         </Row>
//       </Container>
//     </div>
//   );
// };

// export default AdminRegister;
