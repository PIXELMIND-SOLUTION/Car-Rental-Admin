import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Container, Pagination, Spinner, Button, Modal, Badge } from 'react-bootstrap';

const PaymentLogs = () => {
  const [paymentLogs, setPaymentLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const paymentsPerPage = 10;

  // Fetch payment logs
  const fetchPaymentLogs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('https://varahibackend.varahiselfdrivecars.com/api/admin/getallpaymnetlogs');
      setPaymentLogs(res.data.paymentLogs || []);
    } catch (err) {
      console.error('Failed to fetch payment logs:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPaymentLogs();
  }, []);

  // View details
  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLog(null);
  };

  // 🔥 FIXED: Format currency - database mein amount rupees mein hai, paise nahi
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '₹0';
    
    // Amount already in rupees (database mein 1 = ₹1)
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Alternative: Agar amount paise mein ho to ye use karo
  // const formatCurrency = (amount) => {
  //   return new Intl.NumberFormat('en-IN', {
  //     style: 'currency',
  //     currency: 'INR',
  //     minimumFractionDigits: 0,
  //     maximumFractionDigits: 0
  //   }).format((amount || 0) / 100);
  // };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN') + ' ' + date.toLocaleTimeString('en-IN');
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch(status?.toLowerCase()) {
      case 'captured':
      case 'success':
        return <Badge bg="success">Success</Badge>;
      case 'failed':
        return <Badge bg="danger">Failed</Badge>;
      case 'pending':
        return <Badge bg="warning">Pending</Badge>;
      default:
        return <Badge bg="secondary">{status || 'Unknown'}</Badge>;
    }
  };

  // Get step status icon
  const getStepStatusIcon = (status) => {
    if (status === 'success') return '✅';
    if (status === 'failed') return '❌';
    if (status === 'pending') return '⏳';
    return '❓';
  };

  // Get UPI VPA if available
  const getUpiVpa = (rawResponse) => {
    if (rawResponse?.method === 'upi') {
      return rawResponse?.upi?.vpa || rawResponse?.vpa || 'N/A';
    }
    return 'N/A';
  };

  // Pagination logic
  const indexOfLast = currentPage * paymentsPerPage;
  const indexOfFirst = indexOfLast - paymentsPerPage;
  const currentPayments = paymentLogs.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(paymentLogs.length / paymentsPerPage);

  const renderPagination = () => {
    if (!totalPages || totalPages <= 1) return null;

    const pages = [];
    const pageSet = new Set();

    pageSet.add(1);
    if (totalPages > 1) pageSet.add(totalPages);
    if (currentPage > 1) pageSet.add(currentPage - 1);
    pageSet.add(currentPage);
    if (currentPage < totalPages) pageSet.add(currentPage + 1);

    const sortedPages = Array.from(pageSet).sort((a, b) => a - b);

    let lastPage = 0;
    sortedPages.forEach((page) => {
      if (page - lastPage > 1) {
        pages.push(<Pagination.Ellipsis key={`ellipsis-${page}`} disabled />);
      }

      pages.push(
        <Pagination.Item
          key={page}
          active={page === currentPage}
          onClick={() => setCurrentPage(page)}
        >
          {page}
        </Pagination.Item>
      );

      lastPage = page;
    });

    return (
      <Pagination className="mt-3 justify-content-center">
        <Pagination.Item
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
        >
          Prev
        </Pagination.Item>
        {pages}
        <Pagination.Item
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
        >
          Next
        </Pagination.Item>
      </Pagination>
    );
  };

  return (
    <Container className="py-4">
      <h3 className="mb-4 text-dark fw-bold">Payment Logs</h3>
      <p className="text-muted mb-4">Total Payments: {paymentLogs.length}</p>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : (
        <>
          <Table striped bordered hover responsive>
            <thead>
              <tr className="table-header">
                <th>S.NO</th>
                <th>Transaction ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Payment Method</th>
                <th>UPI VPA</th>
                <th>Date & Time</th>
                <th>Booking Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentPayments.length > 0 ? (
                currentPayments.map((log, index) => (
                  <tr key={log._id}>
                    <td>{indexOfFirst + index + 1}</td>
                    <td>
                      <small className="text-muted">{log.transactionId || 'N/A'}</small>
                    </td>
                    <td className="fw-bold text-success">{formatCurrency(log.amount)}</td>
                    <td>{getStatusBadge(log.paymentStatus)}</td>
                    <td className="text-capitalize">
                      {log.rawResponse?.method || 'N/A'}
                    </td>
                    <td>
                      <small>{getUpiVpa(log.rawResponse)}</small>
                    </td>
                    <td>{formatDate(log.createdAt)}</td>
                    <td className="text-center">
                      {log.bookingCreated ? (
                        <Badge bg="success">Yes</Badge>
                      ) : (
                        <Badge bg="secondary">No</Badge>
                      )}
                    </td>
                    <td className="text-center">
                      <Button
                        variant="outline-info"
                        size="sm"
                        onClick={() => handleViewDetails(log)}
                      >
                        <i className="fas fa-eye me-1"></i>
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="text-center text-muted">
                    No payment logs found.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          {renderPagination()}
        </>
      )}

      {/* View Details Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            <i className="fas fa-credit-card me-2"></i>
            Payment Details
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedLog && (
            <div className="payment-details">
              {/* Payment Summary */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <h6 className="text-primary">Transaction Information</h6>
                  <table className="table table-sm table-borderless">
                    <tbody>
                      <tr>
                        <td className="fw-bold">Transaction ID:</td>
                        <td><code>{selectedLog.transactionId}</code></td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Amount:</td>
                        <td className="text-success fw-bold fs-5">{formatCurrency(selectedLog.amount)}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Status:</td>
                        <td>{getStatusBadge(selectedLog.paymentStatus)}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Payment Method:</td>
                        <td className="text-capitalize">{selectedLog.rawResponse?.method || 'N/A'}</td>
                      </tr>
                      {selectedLog.rawResponse?.method === 'upi' && (
                        <tr>
                          <td className="fw-bold">UPI VPA:</td>
                          <td><code>{getUpiVpa(selectedLog.rawResponse)}</code></td>
                        </tr>
                      )}
                      <tr>
                        <td className="fw-bold">Booking Created:</td>
                        <td>{selectedLog.bookingCreated ? 'Yes' : 'No'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="col-md-6">
                  <h6 className="text-primary">User & Booking Information</h6>
                  <table className="table table-sm table-borderless">
                    <tbody>
                      <tr>
                        <td className="fw-bold">User ID:</td>
                        <td><code>{selectedLog.userId}</code></td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Booking ID:</td>
                        <td><code>{selectedLog.bookingId || 'N/A'}</code></td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Car ID:</td>
                        <td><code>{selectedLog.carId || 'N/A'}</code></td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Created At:</td>
                        <td>{formatDate(selectedLog.createdAt)}</td>
                      </tr>
                      <tr>
                        <td className="fw-bold">Last Updated:</td>
                        <td>{formatDate(selectedLog.updatedAt)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Steps Timeline */}
              {selectedLog.steps && selectedLog.steps.length > 0 && (
                <div className="mb-4">
                  <h6 className="text-primary mb-3">Payment Steps</h6>
                  <div className="steps-timeline">
                    {selectedLog.steps.map((step, idx) => (
                      <div key={idx} className="step-item mb-2 p-2 border rounded">
                        <div className="d-flex align-items-center">
                          <span className="step-icon me-3 fs-5">
                            {getStepStatusIcon(step.status)}
                          </span>
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="fw-bold text-capitalize">{step.step}</span>
                              <small className="text-muted">{formatDate(step.timestamp)}</small>
                            </div>
                            <div>
                              Status: {getStatusBadge(step.status)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Razorpay Response Details */}
              {selectedLog.rawResponse && (
                <div className="mb-4">
                  <h6 className="text-primary mb-3">Razorpay Response Details</h6>
                  <div className="row">
                    <div className="col-md-6">
                      <table className="table table-sm table-borderless">
                        <tbody>
                          <tr>
                            <td className="fw-bold">Razorpay Payment ID:</td>
                            <td><code>{selectedLog.rawResponse.id}</code></td>
                          </tr>
                          <tr>
                            <td className="fw-bold">Amount (paise):</td>
                            <td>₹{(selectedLog.rawResponse.amount / 100).toLocaleString('en-IN')}</td>
                          </tr>
                          <tr>
                            <td className="fw-bold">Currency:</td>
                            <td>{selectedLog.rawResponse.currency}</td>
                          </tr>
                          <tr>
                            <td className="fw-bold">Fee:</td>
                            <td>₹{(selectedLog.rawResponse.fee / 100).toLocaleString('en-IN')}</td>
                          </tr>
                          <tr>
                            <td className="fw-bold">Tax:</td>
                            <td>₹{(selectedLog.rawResponse.tax / 100).toLocaleString('en-IN')}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="col-md-6">
                      <table className="table table-sm table-borderless">
                        <tbody>
                          <tr>
                            <td className="fw-bold">Email:</td>
                            <td>{selectedLog.rawResponse.email}</td>
                          </tr>
                          <tr>
                            <td className="fw-bold">Contact:</td>
                            <td>{selectedLog.rawResponse.contact}</td>
                          </tr>
                          <tr>
                            <td className="fw-bold">Description:</td>
                            <td>{selectedLog.rawResponse.description}</td>
                          </tr>
                          {selectedLog.rawResponse.acquirer_data?.rrn && (
                            <tr>
                              <td className="fw-bold">RRN:</td>
                              <td><code>{selectedLog.rawResponse.acquirer_data.rrn}</code></td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      <style jsx>{`
        .steps-timeline .step-item {
          background-color: #f8f9fa;
          transition: all 0.3s ease;
        }
        .steps-timeline .step-item:hover {
          background-color: #e9ecef;
          transform: translateX(5px);
        }
        .step-icon {
          width: 30px;
          text-align: center;
        }
        .table td, .table th {
          vertical-align: middle;
        }
        .table-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white !important;
        }
        .table-header th {
          border: none;
          color: white !important;
          font-weight: 600;
        }
        code {
          background-color: #f1f1f1;
          padding: 2px 5px;
          border-radius: 3px;
          font-size: 0.9em;
        }
        pre {
          white-space: pre-wrap;
          word-wrap: break-word;
        }
      `}</style>
    </Container>
  );
};

export default PaymentLogs;