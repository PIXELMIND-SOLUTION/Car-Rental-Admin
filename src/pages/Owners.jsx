import React, { useEffect, useState } from 'react';
import {
  Modal,
  Button,
  Form,
  Table,
  Spinner,
  Alert,
  Pagination,
  Row,
  Col,
  Badge,
  ButtonGroup,
  Card,
  Image,
} from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import 'react-toastify/dist/ReactToastify.css';

const Owners = () => {
  const [ownerList, setOwnerList] = useState([]);
  const [filteredOwners, setFilteredOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [editStatus, setEditStatus] = useState('pending');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ownersPerPage = 10;
  const indexOfLastOwner = currentPage * ownersPerPage;
  const indexOfFirstOwner = indexOfLastOwner - ownersPerPage;
  const currentOwners = filteredOwners.slice(indexOfFirstOwner, indexOfLastOwner);
  const totalPages = Math.ceil(filteredOwners.length / ownersPerPage);

  // Filter & Search
  const [filterField, setFilterField] = useState('fullName');
  const [searchQuery, setSearchQuery] = useState('');

  // API Base URL
  const API_BASE_URL = 'https://varahibackend.varahiselfdrivecars.com/api/admin';

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  };

  const fetchOwners = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/allowners`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        const reversed = [...result.data].reverse();
        setOwnerList(reversed);
        setFilteredOwners(reversed);
      } else {
        throw new Error(result.message || 'Failed to fetch owners');
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateOwnerStatus = async (ownerId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/updateownerstatus/${ownerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        toast.success(`Owner status updated to ${newStatus}`);
        await fetchOwners();
        return true;
      } else {
        throw new Error(result.message || 'Failed to update status');
      }
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  const deleteOwner = async (ownerId) => {
    if (!window.confirm('Are you sure you want to delete this owner? This action cannot be undone.')) {
      return false;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/deleteowner/${ownerId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        toast.success('Owner deleted successfully');
        await fetchOwners();
        return true;
      } else {
        throw new Error(result.message || 'Failed to delete owner');
      }
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredOwners(ownerList);
      setCurrentPage(1);
      return;
    }
    const filtered = ownerList.filter((owner) => {
      const fieldValue = owner[filterField];
      if (fieldValue && typeof fieldValue === 'string') {
        return fieldValue.toLowerCase().includes(query.toLowerCase());
      }
      return false;
    });
    setFilteredOwners(filtered);
    setCurrentPage(1);
  };

  const openEditModal = (owner) => {
    setSelectedOwner(owner);
    setEditStatus(owner.status);
    setShowEditModal(true);
  };

  const openViewModal = (owner) => {
    setSelectedOwner(owner);
    setShowViewModal(true);
  };

  const handleStatusUpdate = async () => {
    if (selectedOwner && editStatus !== selectedOwner.status) {
      await updateOwnerStatus(selectedOwner._id, editStatus);
      setShowEditModal(false);
      setSelectedOwner(null);
    } else {
      toast.info('Status unchanged');
      setShowEditModal(false);
    }
  };

  const renderPagination = () => {
    if (!totalPages || totalPages < 1) return null;
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
        <Pagination.Item key={page} active={page === currentPage} onClick={() => setCurrentPage(page)}>
          {page}
        </Pagination.Item>
      );
      lastPage = page;
    });
    return (
      <Pagination className="mt-3 justify-content-center">
        <Pagination.Item disabled={currentPage === 1} onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}>
          Prev
        </Pagination.Item>
        {pages}
        <Pagination.Item disabled={currentPage === totalPages} onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}>
          Next
        </Pagination.Item>
      </Pagination>
    );
  };

  const exportToExcel = () => {
    try {
      toast.info('Preparing Excel file with owners data...', { autoClose: 2000 });
      const exportData = ownerList.map((owner) => ({
        ID: owner._id,
        'Full Name': owner.fullName,
        Email: owner.email,
        'Mobile Number': owner.mobileNumber,
        'Aadhar Number': owner.aadharNumber || '-',
        Status: owner.status,
        Verified: owner.isVerified ? 'Yes' : 'No',
        'Cars Count': owner.cars?.length || 0,
        'Created At': new Date(owner.createdAt).toLocaleString(),
      }));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'OwnersList');
      worksheet['!cols'] = [
        { wch: 25 }, { wch: 25 }, { wch: 30 }, { wch: 15 },
        { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 20 },
      ];
      XLSX.writeFile(workbook, `Owners_${new Date().toISOString().slice(0, 19)}.xlsx`);
      toast.success('Excel file downloaded successfully!', { autoClose: 2000 });
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate Excel file');
    }
  };

  useEffect(() => {
    fetchOwners();
  }, []);

  return (
    <div className="container-fluid p-3">
      <ToastContainer position="top-right" autoClose={2000} />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Owners Management</h2>
        <Button variant="success" onClick={exportToExcel}>
          <i className="fas fa-file-excel me-2"></i>Export to Excel
        </Button>
      </div>

      <Row className="mb-3">
        <Col md={3}>
          <Form.Select value={filterField} onChange={(e) => setFilterField(e.target.value)}>
            <option value="fullName">Search by Full Name</option>
            <option value="email">Search by Email</option>
            <option value="mobileNumber">Search by Mobile Number</option>
            <option value="status">Search by Status</option>
          </Form.Select>
        </Col>
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder={`Search by ${filterField === 'fullName' ? 'Full Name' : filterField === 'mobileNumber' ? 'Mobile Number' : filterField}`}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </Col>
        <Col md={3} className="text-end">
          <Button variant="primary" onClick={() => fetchOwners()}>
            <i className="fas fa-sync-alt me-2"></i>Refresh
          </Button>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : (
        <>
          <div className="table-responsive">
            <Table bordered hover responsive striped>
              <thead className="table-dark">
                <tr>
                  <th>S.NO</th>
                  <th>Full Name</th>
                  <th>Contact Details</th>
                  <th>Aadhar Number</th>
                  <th>Status</th>
                  <th>Cars Count</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentOwners.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-4">No owners found</td>
                  </tr>
                ) : (
                  currentOwners.map((owner, index) => (
                    <tr key={owner._id}>
                      <td className="text-center align-middle">{(currentPage - 1) * ownersPerPage + index + 1}</td>
                      <td className="align-middle"><strong>{owner.fullName}</strong></td>
                      <td className="align-middle">
                        <div>{owner.email}</div>
                        <div className="small text-muted">{owner.mobileNumber}</div>
                      </td>
                      <td className="align-middle">{owner.aadharNumber || '—'}</td>
                      <td className="align-middle">
                        <Badge bg={getStatusBadgeVariant(owner.status)} className="text-capitalize">
                          {owner.status}
                        </Badge>
                      </td>
                      <td className="align-middle text-center">
                        <Badge bg="info" pill>
                          {owner.cars?.length || 0}
                        </Badge>
                      </td>
                      <td className="text-center align-middle">
                        <ButtonGroup size="sm">
                          <Button variant="outline-info" onClick={() => openViewModal(owner)}>
                            <i className="fas fa-eye" />
                          </Button>
                          <Button variant="outline-warning" onClick={() => openEditModal(owner)}>
                            <i className="fas fa-edit" />
                          </Button>
                          <Button variant="outline-danger" onClick={() => deleteOwner(owner._id)}>
                            <i className="fas fa-trash" />
                          </Button>
                        </ButtonGroup>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
          {renderPagination()}
        </>
      )}

      {/* Edit Modal - Status Update */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Update Owner Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOwner && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label><strong>Owner</strong></Form.Label>
                <Form.Control type="text" readOnly value={`${selectedOwner.fullName} (${selectedOwner.email})`} />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label><strong>Current Status</strong></Form.Label>
                <div>
                  <Badge bg={getStatusBadgeVariant(selectedOwner.status)} className="me-2">
                    {selectedOwner.status}
                  </Badge>
                </div>
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label><strong>Change Status To</strong></Form.Label>
                <Form.Select value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </Form.Select>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleStatusUpdate}>Update Status</Button>
        </Modal.Footer>
      </Modal>

      {/* View Modal - Full Owner Details including Cars with Images & Documents */}
      <Modal show={showViewModal} onHide={() => setShowViewModal(false)} size="lg" centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title>Owner Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOwner && (
            <>
              {/* Personal Information */}
              <Card className="mb-3">
                <Card.Header as="h5">Personal Information</Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <p><strong>Full Name:</strong> {selectedOwner.fullName}</p>
                      <p><strong>Email:</strong> {selectedOwner.email}</p>
                      <p><strong>Mobile Number:</strong> {selectedOwner.mobileNumber}</p>
                      <p><strong>Aadhar Number:</strong> {selectedOwner.aadharNumber || 'Not provided'}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong>Status:</strong> <Badge bg={getStatusBadgeVariant(selectedOwner.status)}>{selectedOwner.status}</Badge></p>
                      <p><strong>Verified:</strong> <Badge bg={selectedOwner.isVerified ? 'success' : 'danger'}>{selectedOwner.isVerified ? 'Yes' : 'No'}</Badge></p>
                      <p><strong>Created At:</strong> {new Date(selectedOwner.createdAt).toLocaleString()}</p>
                      <p><strong>Last Updated:</strong> {new Date(selectedOwner.updatedAt).toLocaleString()}</p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Cars List with Images and Documents */}
              <Card>
                <Card.Header as="h5">Registered Cars ({selectedOwner.cars?.length || 0})</Card.Header>
                <Card.Body>
                  {selectedOwner.cars && selectedOwner.cars.length > 0 ? (
                    selectedOwner.cars.map((car, idx) => (
                      <Card key={car._id} className="mb-3">
                        <Card.Header as="h6">Car #{idx + 1}: {car.carName}</Card.Header>
                        <Card.Body>
                          <Row>
                            <Col md={6}>
                              <p><strong>Model:</strong> {car.model}</p>
                              <p><strong>Year:</strong> {car.year}</p>
                              <p><strong>Vehicle Number:</strong> {car.vehicleNumber}</p>
                              <p><strong>Fuel:</strong> {car.fuel || 'N/A'}</p>
                              <p><strong>Seats:</strong> {car.seats || 'N/A'}</p>
                              <p><strong>Type:</strong> {car.type || 'N/A'}</p>
                              <p><strong>Car Type:</strong> {car.carType || 'N/A'}</p>
                              <p><strong>Location:</strong> {car.location || 'N/A'}</p>
                              <p><strong>Running Status:</strong> {car.runningStatus || 'N/A'}</p>
                            </Col>
                            <Col md={6}>
                              <p><strong>Price per Hour:</strong> ₹{car.pricePerHour}</p>
                              <p><strong>Price per Day:</strong> ₹{car.pricePerDay}</p>
                              <p><strong>Delay per Hour:</strong> ₹{car.delayPerHour}</p>
                              <p><strong>Delay per Day:</strong> ₹{car.delayPerDay}</p>
                              <p><strong>Description:</strong> {car.description || 'N/A'}</p>
                              <p><strong>Deposit Options:</strong> {car.depositOptions?.join(', ') || 'None'}</p>
                              <p><strong>Availability Status:</strong> {car.availabilityStatus ? 'Available' : 'Not Available'}</p>
                              <p><strong>Car Status:</strong> <Badge bg={car.status === 'active' ? 'success' : 'secondary'}>{car.status || 'unknown'}</Badge></p>
                            </Col>
                          </Row>

                          {/* Car Images */}
                          {car.carImage && car.carImage.length > 0 && (
                            <div className="mt-3">
                              <strong>Car Images:</strong>
                              <div className="d-flex flex-wrap gap-2 mt-2">
                                {car.carImage.map((img, imgIdx) => (
                                  <a key={imgIdx} href={img} target="_blank" rel="noopener noreferrer">
                                    <Image
                                      src={img}
                                      thumbnail
                                      style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                    />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Car Documents */}
                          {car.carDocs && car.carDocs.length > 0 && (
                            <div className="mt-3">
                              <strong>Car Documents:</strong>
                              <div className="mt-2">
                                {car.carDocs.map((doc, docIdx) => (
                                  <div key={docIdx}>
                                    <a href={doc} target="_blank" rel="noopener noreferrer" className="me-3">
                                      📄 Document {docIdx + 1}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    ))
                  ) : (
                    <Alert variant="info" className="mb-0">No cars registered by this owner.</Alert>
                  )}
                </Card.Body>
              </Card>

              {/* Additional Info */}
              {selectedOwner._id && (
                <div className="mt-3 text-muted small">
                  <hr />
                  <p><strong>Owner ID:</strong> {selectedOwner._id}</p>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Owners;