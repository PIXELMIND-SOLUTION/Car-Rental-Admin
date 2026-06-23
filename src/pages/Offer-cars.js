import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Spinner, Alert, Badge, Modal, Form, 
  Card, Row, Col, Pagination, InputGroup, ToastContainer, toast 
} from 'react-bootstrap';
import { ToastContainer as ToastContainerLib, toast as toastLib } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const OfferSection = () => {
  // State for offer cars
  const [offerCars, setOfferCars] = useState([]);
  const [filteredOfferCars, setFilteredOfferCars] = useState([]);
  const [allCars, setAllCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Filter states
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive'
  const [filterPremium, setFilterPremium] = useState('all'); // 'all', 'premium', 'standard'
  
  // Offer form data
  const [formData, setFormData] = useState({
    hasOffer: true,
    extraFreeDays: 1,
    offerDescription: '',
    startDate: '',
    endDate: '',
    startTime: '09:00 AM',
    endTime: '06:00 PM'
  });

  // Fetch offer cars and all cars
  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch offer cars
      const offerRes = await fetch('https://varahibackend.varahiselfdrivecars.com/api/car/offer-cars');
      if (!offerRes.ok) throw new Error('Failed to fetch offer cars');
      const offerData = await offerRes.json();
      setOfferCars(offerData.cars || []);
      setFilteredOfferCars(offerData.cars || []);

      // Fetch all cars for selection
      const carsRes = await fetch('https://varahibackend.varahiselfdrivecars.com/api/car/get-cars');
      if (!carsRes.ok) throw new Error('Failed to fetch cars');
      const carsData = await carsRes.json();
      setAllCars(carsData.cars || []);
      
      setError('');
    } catch (err) {
      setError(err.message);
      toastLib.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter and search
  useEffect(() => {
    let filtered = [...offerCars];

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(car => {
        const isActive = car.offerDetails?.isActive === true;
        return filterStatus === 'active' ? isActive : !isActive;
      });
    }

    // Premium filter
    if (filterPremium !== 'all') {
      filtered = filtered.filter(car => {
        return filterPremium === 'premium' ? car.isPremium : !car.isPremium;
      });
    }

    // Search filter
    if (searchText.trim() !== '') {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(car =>
        car.carName?.toLowerCase().includes(searchLower) ||
        car.model?.toLowerCase().includes(searchLower) ||
        car.vehicleNumber?.toLowerCase().includes(searchLower) ||
        car.offerDetails?.offerDescription?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredOfferCars(filtered);
    setCurrentPage(1);
  }, [searchText, filterStatus, filterPremium, offerCars]);

  // Pagination logic
  const totalPages = Math.ceil(filteredOfferCars.length / itemsPerPage);
  const paginatedCars = filteredOfferCars.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

    if (endPage - startPage < maxVisiblePages - 1) {
      if (startPage === 1) {
        endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      } else if (endPage === totalPages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
    }

    if (startPage > 1) {
      pages.push(
        <Pagination.Item key={1} onClick={() => setCurrentPage(1)}>1</Pagination.Item>
      );
      if (startPage > 2) {
        pages.push(<Pagination.Ellipsis key="ellipsis-start" disabled />);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => setCurrentPage(i)}
        >
          {i}
        </Pagination.Item>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push(<Pagination.Ellipsis key="ellipsis-end" disabled />);
      }
      pages.push(
        <Pagination.Item key={totalPages} onClick={() => setCurrentPage(totalPages)}>
          {totalPages}
        </Pagination.Item>
      );
    }

    return (
      <Pagination className="justify-content-center flex-wrap">
        <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
        <Pagination.Prev onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)} disabled={currentPage === 1} />
        {pages}
        <Pagination.Next onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages} />
        <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
      </Pagination>
    );
  };

  // Handle form changes
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Open modal for adding offer
  const openAddOfferModal = () => {
    setIsEditing(false);
    setSelectedCar(null);
    setFormData({
      hasOffer: true,
      extraFreeDays: 1,
      offerDescription: '',
      startDate: '',
      endDate: '',
      startTime: '09:00 AM',
      endTime: '06:00 PM'
    });
    setShowOfferModal(true);
  };

  // Open modal for editing offer
  const openEditOfferModal = (car) => {
    setIsEditing(true);
    setSelectedCar(car);
    setFormData({
      hasOffer: car.hasOffer ?? true,
      extraFreeDays: car.offerDetails?.extraFreeDays || 1,
      offerDescription: car.offerDetails?.offerDescription || '',
      startDate: car.offerDetails?.startDate ? new Date(car.offerDetails.startDate).toISOString().split('T')[0] : '',
      endDate: car.offerDetails?.endDate ? new Date(car.offerDetails.endDate).toISOString().split('T')[0] : '',
      startTime: car.offerDetails?.startTime || '09:00 AM',
      endTime: car.offerDetails?.endTime || '06:00 PM'
    });
    setShowOfferModal(true);
  };

  // Submit offer
  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    
    if (!selectedCar && !isEditing) {
      toastLib.error('Please select a car first');
      return;
    }

    setIsSubmitting(true);
    try {
      const carId = selectedCar?._id || formData.carId;
      if (!carId) {
        toastLib.error('Car ID is required');
        return;
      }

      const payload = {
        hasOffer: formData.hasOffer,
        extraFreeDays: parseInt(formData.extraFreeDays) || 1,
        offerDescription: formData.offerDescription,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startTime: formData.startTime,
        endTime: formData.endTime
      };

      const response = await fetch(`https://varahibackend.varahiselfdrivecars.com/api/car/offer/${carId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update offer');
      }

      const data = await response.json();
      toastLib.success(`Offer ${isEditing ? 'updated' : 'added'} successfully for ${data.car?.carName || 'vehicle'}`);
      
      // Refresh data
      fetchData();
      setShowOfferModal(false);
    } catch (err) {
      toastLib.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove offer
  const handleRemoveOffer = async (car) => {
    if (!window.confirm(`Are you sure you want to remove the offer from "${car.carName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`https://varahibackend.varahiselfdrivecars.com/api/car/offer/${car._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hasOffer: false,
          extraFreeDays: 0,
          offerDescription: '',
          startDate: '',
          endDate: '',
          startTime: '',
          endTime: ''
        })
      });

      if (!response.ok) {
        throw new Error('Failed to remove offer');
      }

      toastLib.success(`Offer removed from "${car.carName}"`);
      fetchData();
    } catch (err) {
      toastLib.error(err.message);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Check if offer is active
  const isOfferActive = (offerDetails) => {
    if (!offerDetails) return false;
    if (offerDetails.isActive === false) return false;
    
    try {
      const startDate = new Date(offerDetails.startDate);
      const endDate = new Date(offerDetails.endDate);
      const now = new Date();
      return now >= startDate && now <= endDate;
    } catch {
      return false;
    }
  };

  // Get status badge
  const getOfferStatusBadge = (car) => {
    if (!car.offerDetails) {
      return <Badge bg="secondary">No Offer</Badge>;
    }
    
    const active = isOfferActive(car.offerDetails);
    if (active) {
      return <Badge bg="success">Active</Badge>;
    }
    return <Badge bg="danger">Expired</Badge>;
  };

  // Mobile card view
  const renderMobileCard = (car) => {
    const offerDetails = car.offerDetails || {};
    const active = isOfferActive(offerDetails);

    return (
      <Card key={car._id} className={`mb-3 ${active ? 'border-success' : 'border-danger'}`}>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h5 className="mb-1">{car.carName}</h5>
              <div className="text-muted small">{car.model} • {car.vehicleNumber}</div>
            </div>
            {getOfferStatusBadge(car)}
          </div>

          <div className="small">
            <div><strong>Extra Free Days:</strong> {offerDetails.extraFreeDays || 0}</div>
            <div><strong>Period:</strong> {formatDate(offerDetails.startDate)} - {formatDate(offerDetails.endDate)}</div>
            <div><strong>Time:</strong> {offerDetails.startTime || '-'} - {offerDetails.endTime || '-'}</div>
            <div><strong>Description:</strong> {offerDetails.offerDescription || '-'}</div>
          </div>

          <div className="mt-2 d-flex gap-2">
            <Button size="sm" variant="warning" onClick={() => openEditOfferModal(car)}>
              <i className="fas fa-edit me-1"></i>Edit
            </Button>
            <Button size="sm" variant="danger" onClick={() => handleRemoveOffer(car)}>
              <i className="fas fa-trash me-1"></i>Remove
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  };

  // Available cars for selection (cars without offers)
  const availableCars = allCars.filter(car => {
    const hasOffer = offerCars.some(oc => oc._id === car._id);
    return !hasOffer && car.status === 'active';
  });

  return (
    <div className="container-fluid p-3">
      <ToastContainerLib position="top-right" autoClose={3000} />

      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <h2>
          <i className="fas fa-tag me-2 text-success"></i>
          Vehicle Offers
        </h2>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={fetchData} disabled={loading}>
            <i className="fas fa-sync-alt me-2"></i>Refresh
          </Button>
          <Button variant="success" onClick={openAddOfferModal}>
            <i className="fas fa-plus me-2"></i>Add Offer
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <Row className="mb-4 g-2 g-md-3">
        <Col xs={6} md={3}>
          <Card className="text-center border-primary h-100">
            <Card.Body className="p-2 p-md-3">
              <h4 className="text-primary mb-1 mb-md-2">{offerCars.length}</h4>
              <Card.Text className="text-muted small mb-0">Total Offers</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="text-center border-success h-100">
            <Card.Body className="p-2 p-md-3">
              <h4 className="text-success mb-1 mb-md-2">
                {offerCars.filter(c => isOfferActive(c.offerDetails)).length}
              </h4>
              <Card.Text className="text-muted small mb-0">Active Offers</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="text-center border-danger h-100">
            <Card.Body className="p-2 p-md-3">
              <h4 className="text-danger mb-1 mb-md-2">
                {offerCars.filter(c => !isOfferActive(c.offerDetails) && c.offerDetails).length}
              </h4>
              <Card.Text className="text-muted small mb-0">Expired Offers</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="text-center border-info h-100">
            <Card.Body className="p-2 p-md-3">
              <h4 className="text-info mb-1 mb-md-2">
                {offerCars.filter(c => c.isPremium).length}
              </h4>
              <Card.Text className="text-muted small mb-0">Premium Offers</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <div className="row mb-3 g-2">
        <div className="col-12 col-md-4 col-lg-3">
          <InputGroup>
            <InputGroup.Text><i className="fas fa-search"></i></InputGroup.Text>
            <Form.Control
              type="text"
              placeholder="Search offers..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {searchText && (
              <Button variant="outline-secondary" onClick={() => setSearchText('')}>
                <i className="fas fa-times"></i>
              </Button>
            )}
          </InputGroup>
        </div>
        <div className="col-6 col-md-4 col-lg-3">
          <Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </Form.Select>
        </div>
        <div className="col-6 col-md-4 col-lg-3">
          <Form.Select value={filterPremium} onChange={(e) => setFilterPremium(e.target.value)}>
            <option value="all">All Vehicles</option>
            <option value="premium">Premium Only</option>
            <option value="standard">Standard Only</option>
          </Form.Select>
        </div>
        <div className="col-12 col-md-12 col-lg-3 d-flex justify-content-end align-items-center">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="text-muted small">Show:</span>
            <Form.Select 
              size="sm" 
              className="w-auto" 
              value={itemsPerPage} 
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </Form.Select>
            <span className="text-muted small">{filteredOfferCars.length} offers</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Loading offers...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : offerCars.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-4">
            <i className="fas fa-tag fa-4x text-muted"></i>
          </div>
          <h4 className="text-muted mb-3">No Offers Available</h4>
          <p className="text-muted mb-4">Create your first offer to attract more customers.</p>
          <Button variant="success" onClick={openAddOfferModal}>
            <i className="fas fa-plus me-2"></i>Create Offer
          </Button>
        </div>
      ) : filteredOfferCars.length === 0 ? (
        <div className="text-center py-4">
          <i className="fas fa-filter fa-3x text-muted mb-3"></i>
          <h5 className="text-muted">No offers match your filters</h5>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={() => {
              setSearchText('');
              setFilterStatus('all');
              setFilterPremium('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="d-none d-lg-block">
            <div className="table-responsive">
              <Table bordered hover striped className="align-middle">
                <thead className="table-header">
                  <tr>
                    <th>#</th>
                    <th>Vehicle</th>
                    <th>Model</th>
                    <th>Vehicle No.</th>
                    <th>Extra Days</th>
                    <th>Status</th>
                    <th>Period</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedCars.map((car, index) => {
                    const offerDetails = car.offerDetails || {};
                    const active = isOfferActive(offerDetails);

                    return (
                      <tr key={car._id} className={active ? 'table-success' : 'table-light'}>
                        <td className="text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td>
                          <strong>{car.carName}</strong>
                          <br />
                          <small className="text-muted">
                            {car.isPremium && <Badge bg="warning" text="dark" className="me-1">Premium</Badge>}
                            ID: {car._id.slice(-6)}
                          </small>
                        </td>
                        <td>{car.model || '-'}</td>
                        <td>{car.vehicleNumber || '-'}</td>
                        <td className="text-center">
                          <Badge bg="primary" className="fs-6">
                            {offerDetails.extraFreeDays || 0}
                          </Badge>
                        </td>
                        <td>{getOfferStatusBadge(car)}</td>
                        <td>
                          <div className="small">
                            <div><strong>From:</strong> {formatDate(offerDetails.startDate)}</div>
                            <div><strong>To:</strong> {formatDate(offerDetails.endDate)}</div>
                            <div className="text-muted">
                              {offerDetails.startTime || '-'} - {offerDetails.endTime || '-'}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="small text-truncate" style={{ maxWidth: '150px' }}>
                            {offerDetails.offerDescription || '-'}
                          </div>
                        </td>
                        <td className="text-center">
                          <Button 
                            variant="warning" 
                            size="sm" 
                            className="me-1 mb-1"
                            onClick={() => openEditOfferModal(car)}
                          >
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button 
                            variant="danger" 
                            size="sm"
                            onClick={() => handleRemoveOffer(car)}
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="d-block d-lg-none">
            {paginatedCars.map(car => renderMobileCard(car))}
          </div>

          {/* Pagination Info */}
          <div className="d-flex justify-content-between align-items-center flex-wrap mt-3">
            <div className="text-muted small">
              Showing {paginatedCars.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{' '}
              {Math.min(currentPage * itemsPerPage, filteredOfferCars.length)} of {filteredOfferCars.length} offers
            </div>
          </div>

          {renderPagination()}
        </>
      )}

      {/* Offer Modal */}
      <Modal show={showOfferModal} onHide={() => setShowOfferModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-tag me-2 text-success"></i>
            {isEditing ? 'Edit Offer' : 'Add New Offer'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmitOffer}>
            {/* Car Selection */}
            {!isEditing && (
              <Form.Group className="mb-3">
                <Form.Label>Select Car <span className="text-danger">*</span></Form.Label>
                <Form.Select 
                  required
                  value={formData.carId || ''}
                  onChange={(e) => {
                    const carId = e.target.value;
                    const car = allCars.find(c => c._id === carId);
                    setSelectedCar(car);
                    setFormData(prev => ({ ...prev, carId }));
                  }}
                >
                  <option value="">Select a car</option>
                  {availableCars.map(car => (
                    <option key={car._id} value={car._id}>
                      {car.carName} - {car.model} {car.isPremium ? '⭐' : ''}
                    </option>
                  ))}
                </Form.Select>
                {availableCars.length === 0 && (
                  <small className="text-muted">All active cars already have offers</small>
                )}
              </Form.Group>
            )}

            {/* Offer Details */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Extra Free Days <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="number"
                    name="extraFreeDays"
                    value={formData.extraFreeDays}
                    onChange={handleFormChange}
                    min={1}
                    max={30}
                    required
                  />
                  <Form.Text className="text-muted">
                    Number of free days for the customer
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Has Offer</Form.Label>
                  <Form.Check
                    type="switch"
                    name="hasOffer"
                    label={formData.hasOffer ? "Active" : "Inactive"}
                    checked={formData.hasOffer}
                    onChange={handleFormChange}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Offer Description <span className="text-danger">*</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="offerDescription"
                value={formData.offerDescription}
                onChange={handleFormChange}
                placeholder="Describe the offer (e.g., Get 1 day free on weekly booking)"
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleFormChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Date <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleFormChange}
                    required
                    min={formData.startDate}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Start Time <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="12:00 AM">12:00 AM</option>
                    <option value="01:00 AM">01:00 AM</option>
                    <option value="02:00 AM">02:00 AM</option>
                    <option value="03:00 AM">03:00 AM</option>
                    <option value="04:00 AM">04:00 AM</option>
                    <option value="05:00 AM">05:00 AM</option>
                    <option value="06:00 AM">06:00 AM</option>
                    <option value="07:00 AM">07:00 AM</option>
                    <option value="08:00 AM">08:00 AM</option>
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="01:00 PM">01:00 PM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="05:00 PM">05:00 PM</option>
                    <option value="06:00 PM">06:00 PM</option>
                    <option value="07:00 PM">07:00 PM</option>
                    <option value="08:00 PM">08:00 PM</option>
                    <option value="09:00 PM">09:00 PM</option>
                    <option value="10:00 PM">10:00 PM</option>
                    <option value="11:00 PM">11:00 PM</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>End Time <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="12:00 AM">12:00 AM</option>
                    <option value="01:00 AM">01:00 AM</option>
                    <option value="02:00 AM">02:00 AM</option>
                    <option value="03:00 AM">03:00 AM</option>
                    <option value="04:00 AM">04:00 AM</option>
                    <option value="05:00 AM">05:00 AM</option>
                    <option value="06:00 AM">06:00 AM</option>
                    <option value="07:00 AM">07:00 AM</option>
                    <option value="08:00 AM">08:00 AM</option>
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="12:00 PM">12:00 PM</option>
                    <option value="01:00 PM">01:00 PM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="04:00 PM">04:00 PM</option>
                    <option value="05:00 PM">05:00 PM</option>
                    <option value="06:00 PM">06:00 PM</option>
                    <option value="07:00 PM">07:00 PM</option>
                    <option value="08:00 PM">08:00 PM</option>
                    <option value="09:00 PM">09:00 PM</option>
                    <option value="10:00 PM">10:00 PM</option>
                    <option value="11:00 PM">11:00 PM</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button variant="secondary" onClick={() => setShowOfferModal(false)}>
                Cancel
              </Button>
              <Button variant="success" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save me-2"></i>
                    {isEditing ? 'Update Offer' : 'Add Offer'}
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default OfferSection;

