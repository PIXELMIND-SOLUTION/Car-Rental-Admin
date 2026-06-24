import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Spinner, Alert, Badge, Modal, Form, 
  Card, Row, Col, Pagination 
} from 'react-bootstrap';
import { toast } from 'react-toastify';

const OfferSection = () => {
  // State for vehicles
  const [offerVehicles, setOfferVehicles] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [error, setError] = useState('');
  
  // Modal states
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchCarText, setSearchCarText] = useState('');
  const [filteredCars, setFilteredCars] = useState([]);
  
  // Form data for offer
  const [formData, setFormData] = useState({
    extraFreeDays: '',
    offerDescription: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: ''
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Search state for offer vehicles
  const [searchText, setSearchText] = useState('');

  // Fetch all cars (to get cars without offers for selection)
  const fetchAllVehicles = async () => {
    try {
      const response = await fetch('https://varahibackend.varahiselfdrivecars.com/api/car/get-cars');
      if (!response.ok) {
        throw new Error('Failed to fetch vehicles');
      }
      const data = await response.json();
      const cars = data.cars || [];
      
      // Filter cars without offers (hasOffer !== true)
      const carsWithoutOffer = cars.filter(car => !car.hasOffer);
      setAllVehicles(carsWithoutOffer);
      setFilteredCars(carsWithoutOffer);
      setError('');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    }
  };

  // Fetch offer cars
  const fetchOfferVehicles = async () => {
    setLoadingOffers(true);
    try {
      const response = await fetch('https://varahibackend.varahiselfdrivecars.com/api/car/offer-cars');
      if (!response.ok) {
        throw new Error('Failed to fetch offer vehicles');
      }
      const data = await response.json();
      setOfferVehicles(data.cars || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoadingOffers(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchAllVehicles(), fetchOfferVehicles()]);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Filter offer vehicles based on search
  const filteredOfferVehicles = offerVehicles.filter(vehicle => {
    if (searchText.trim() === '') return true;
    const searchLower = searchText.toLowerCase();
    return (
      vehicle.carName?.toLowerCase().includes(searchLower) ||
      vehicle.model?.toLowerCase().includes(searchLower) ||
      vehicle.vehicleNumber?.toLowerCase().includes(searchLower) ||
      vehicle.location?.toLowerCase().includes(searchLower)
    );
  });

  // Filter cars for selection modal
  useEffect(() => {
    if (searchCarText.trim() === '') {
      setFilteredCars(allVehicles);
    } else {
      const searchLower = searchCarText.toLowerCase();
      const filtered = allVehicles.filter(vehicle =>
        vehicle.carName?.toLowerCase().includes(searchLower) ||
        vehicle.model?.toLowerCase().includes(searchLower) ||
        vehicle.vehicleNumber?.toLowerCase().includes(searchLower) ||
        vehicle.location?.toLowerCase().includes(searchLower)
      );
      setFilteredCars(filtered);
    }
  }, [searchCarText, allVehicles]);

  // Handle form change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Open offer modal
  const openOfferModal = () => {
    setSelectedVehicle(null);
    setFormData({
      extraFreeDays: '',
      offerDescription: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: ''
    });
    setSearchCarText('');
    setShowOfferModal(true);
  };

  // Close offer modal
  const closeOfferModal = () => {
    setShowOfferModal(false);
    setSelectedVehicle(null);
    setFormData({
      extraFreeDays: '',
      offerDescription: '',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: ''
    });
    setSearchCarText('');
  };

  // Select vehicle from modal
  const selectVehicle = (vehicle) => {
    setSelectedVehicle(vehicle);
    setSearchCarText('');
  };

  // Submit offer
  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    
    if (!selectedVehicle) {
      toast.error('Please select a vehicle first');
      return;
    }

    // Validation
    if (!formData.extraFreeDays || formData.extraFreeDays <= 0) {
      toast.error('Please enter valid extra free days');
      return;
    }
    if (!formData.offerDescription) {
      toast.error('Please enter offer description');
      return;
    }
    if (!formData.startDate) {
      toast.error('Please select start date');
      return;
    }
    if (!formData.endDate) {
      toast.error('Please select end date');
      return;
    }
    if (!formData.startTime) {
      toast.error('Please select start time');
      return;
    }
    if (!formData.endTime) {
      toast.error('Please select end time');
      return;
    }

    // Validate end date is after start date
    if (new Date(formData.endDate) < new Date(formData.startDate)) {
      toast.error('End date must be after start date');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        hasOffer: true,
        extraFreeDays: parseInt(formData.extraFreeDays),
        offerDescription: formData.offerDescription,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startTime: formData.startTime,
        endTime: formData.endTime
      };

      const response = await fetch(`https://varahibackend.varahiselfdrivecars.com/api/car/offer/${selectedVehicle._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to add offer');
      }

      toast.success(`Offer added to "${selectedVehicle.carName}" successfully!`);
      
      // Refresh data
      await Promise.all([fetchAllVehicles(), fetchOfferVehicles()]);
      closeOfferModal();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Remove offer
  const handleRemoveOffer = async (vehicleId, vehicleName) => {
    if (!window.confirm(`Are you sure you want to remove the offer from "${vehicleName}"?`)) {
      return;
    }

    try {
      const payload = {
        hasOffer: false,
        extraFreeDays: 0,
        offerDescription: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: ''
      };

      const response = await fetch(`https://varahibackend.varahiselfdrivecars.com/api/car/offer/${vehicleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to remove offer');
      }

      toast.success(`Offer removed from "${vehicleName}" successfully!`);
      await Promise.all([fetchAllVehicles(), fetchOfferVehicles()]);
    } catch (err) {
      toast.error(err.message);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredOfferVehicles.length / itemsPerPage);
  const paginatedVehicles = filteredOfferVehicles.slice(
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
        <Pagination.Item key={1} onClick={() => setCurrentPage(1)}>
          1
        </Pagination.Item>
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
        <Pagination.First 
          onClick={() => setCurrentPage(1)} 
          disabled={currentPage === 1}
        />
        <Pagination.Prev 
          onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
          disabled={currentPage === 1}
        />
        {pages}
        <Pagination.Next 
          onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        />
        <Pagination.Last 
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
        />
      </Pagination>
    );
  };

  // Mobile card view for offer vehicles
  const renderMobileCard = (vehicle) => {
    return (
      <Card key={vehicle._id} className="mb-3 border-warning">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h5 className="mb-1">{vehicle.carName}</h5>
              <div className="text-muted small">{vehicle.model || '-'}</div>
            </div>
            <Badge bg={vehicle.offerDetails?.isActive ? 'success' : 'warning'}>
              {vehicle.offerDetails?.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          <div className="row small mb-2">
            <div className="col-6">
              <strong>Vehicle No:</strong> {vehicle.vehicleNumber || '-'}
            </div>
            <div className="col-6">
              <strong>Free Days:</strong> +{vehicle.offerDetails?.extraFreeDays || 0}
            </div>
          </div>

          <div className="small mb-2">
            <strong>Offer:</strong> {vehicle.offerDetails?.offerDescription || '-'}
          </div>

          <div className="small mb-2">
            <div>
              <strong>Period:</strong> {vehicle.offerDetails?.startDate ? 
                new Date(vehicle.offerDetails.startDate).toLocaleDateString() : '-'} - {' '}
              {vehicle.offerDetails?.endDate ? 
                new Date(vehicle.offerDetails.endDate).toLocaleDateString() : '-'}
            </div>
            <div className="text-muted">
              {vehicle.offerDetails?.startTime} - {vehicle.offerDetails?.endTime}
            </div>
          </div>

          <Button
            variant="outline-danger"
            size="sm"
            className="w-100 mt-2"
            onClick={() => handleRemoveOffer(vehicle._id, vehicle.carName)}
          >
            <i className="fas fa-times me-2"></i>
            Remove Offer
          </Button>
        </Card.Body>
      </Card>
    );
  };

  return (
    <div className="container-fluid p-3">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <h2 className="mb-2 mb-md-0">
          <i className="fas fa-tags me-2 text-primary"></i>
          Offer Management
        </h2>
        <Button 
          variant="primary" 
          onClick={openOfferModal}
        >
          <i className="fas fa-plus me-2"></i>
          Add New Offer
        </Button>
      </div>

      {/* Summary Cards */}
      <Row className="mb-4 g-2 g-md-3">
        <Col xs={6} md={4}>
          <Card className="text-center border-primary h-100">
            <Card.Body className="p-2 p-md-3">
              <h4 className="text-primary mb-1 mb-md-2">{offerVehicles.length}</h4>
              <Card.Text className="text-muted small mb-0">Total Offers</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={4}>
          <Card className="text-center border-success h-100">
            <Card.Body className="p-2 p-md-3">
              <h4 className="text-success mb-1 mb-md-2">
                {offerVehicles.filter(v => v.offerDetails?.isActive).length}
              </h4>
              <Card.Text className="text-muted small mb-0">Active Offers</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={4}>
          <Card className="text-center border-info h-100">
            <Card.Body className="p-2 p-md-3">
              <h4 className="text-info mb-1 mb-md-2">{allVehicles.length}</h4>
              <Card.Text className="text-muted small mb-0">Available for Offer</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search and Filters */}
      <div className="row mb-3 g-2">
        <div className="col-12 col-md-6">
          <div className="input-group">
            <span className="input-group-text">
              <i className="fas fa-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search offers by name, model, number..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            {searchText && (
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => setSearchText('')}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>
        <div className="col-12 col-md-6 d-flex justify-content-end align-items-center">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <span className="text-muted small">Show:</span>
            <select
              className="form-select form-select-sm w-auto"
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
            </select>
            <span className="text-muted small">
              {filteredOfferVehicles.length} vehicle{filteredOfferVehicles.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loadingOffers ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Loading offers...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : offerVehicles.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-4">
            <i className="fas fa-gift fa-4x text-muted"></i>
          </div>
          <h4 className="text-muted mb-3">No Offers Available</h4>
          <p className="text-muted mb-4">Click the "Add New Offer" button to create your first offer.</p>
          <Button 
            variant="primary" 
            onClick={openOfferModal}
          >
            <i className="fas fa-plus me-2"></i>
            Add New Offer
          </Button>
        </div>
      ) : filteredOfferVehicles.length === 0 ? (
        <div className="text-center py-4">
          <i className="fas fa-filter fa-3x text-muted mb-3"></i>
          <h5 className="text-muted">No offers match your search</h5>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={() => setSearchText('')}
          >
            Clear Search
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
                    <th>Vehicle No</th>
                    <th>Free Days</th>
                    <th>Description</th>
                    <th>Offer Period</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedVehicles.map((vehicle, index) => (
                    <tr key={vehicle._id}>
                      <td className="text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td>
                        <strong>{vehicle.carName}</strong>
                        <br />
                        <small className="text-muted">ID: {vehicle._id.slice(-6)}</small>
                      </td>
                      <td>{vehicle.model || '-'}</td>
                      <td>{vehicle.vehicleNumber || '-'}</td>
                      <td>
                        <Badge bg="success" className="fs-6">
                          +{vehicle.offerDetails?.extraFreeDays || 0} day{vehicle.offerDetails?.extraFreeDays > 1 ? 's' : ''}
                        </Badge>
                      </td>
                      <td>
                        <div className="small">{vehicle.offerDetails?.offerDescription || '-'}</div>
                      </td>
                      <td>
                        <div className="small">
                          <div>
                            <strong>From:</strong>{' '}
                            {vehicle.offerDetails?.startDate ? 
                              new Date(vehicle.offerDetails.startDate).toLocaleDateString() : '-'}
                          </div>
                          <div>
                            <strong>To:</strong>{' '}
                            {vehicle.offerDetails?.endDate ? 
                              new Date(vehicle.offerDetails.endDate).toLocaleDateString() : '-'}
                          </div>
                          <div className="text-muted">
                            {vehicle.offerDetails?.startTime} - {vehicle.offerDetails?.endTime}
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge bg={vehicle.offerDetails?.isActive ? 'success' : 'warning'}>
                          {vehicle.offerDetails?.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleRemoveOffer(vehicle._id, vehicle.carName)}
                        >
                          <i className="fas fa-times me-1"></i> Remove
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="d-block d-lg-none">
            {paginatedVehicles.map((vehicle) => renderMobileCard(vehicle))}
          </div>

          {/* Items info */}
          <div className="d-flex justify-content-between align-items-center flex-wrap mt-3">
            <div className="text-muted small">
              Showing {paginatedVehicles.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{' '}
              {Math.min(currentPage * itemsPerPage, filteredOfferVehicles.length)} of {filteredOfferVehicles.length} vehicles
            </div>
          </div>

          {/* Pagination */}
          {renderPagination()}
        </>
      )}

      {/* Add Offer Modal */}
      <Modal show={showOfferModal} onHide={closeOfferModal} centered size="lg" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-tag me-2 text-primary"></i>
            Add New Offer
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmitOffer}>
            <div className="row">
              {/* Car Selection Section */}
              <div className="col-12 mb-3">
                <h6 className="text-primary mb-3">
                  <i className="fas fa-car me-2"></i>
                  Select Vehicle
                </h6>
                
                {selectedVehicle ? (
                  <div className="bg-success bg-opacity-10 p-3 rounded border border-success">
                    <div className="d-flex justify-content-between align-items-center">
                      <div>
                        <strong>{selectedVehicle.carName}</strong>
                        <br />
                        <small className="text-muted">
                          {selectedVehicle.model} • {selectedVehicle.vehicleNumber} • {selectedVehicle.location}
                        </small>
                      </div>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => setSelectedVehicle(null)}
                      >
                        <i className="fas fa-exchange-alt me-1"></i> Change
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="input-group mb-3">
                      <span className="input-group-text">
                        <i className="fas fa-search"></i>
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search vehicles by name, model, number..."
                        value={searchCarText}
                        onChange={(e) => setSearchCarText(e.target.value)}
                      />
                      {searchCarText && (
                        <button
                          className="btn btn-outline-secondary"
                          type="button"
                          onClick={() => setSearchCarText('')}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      )}
                    </div>
                    
                    <div className="vehicle-selection-list" style={{ maxHeight: '250px', overflowY: 'auto' }}>
                      {filteredCars.length === 0 ? (
                        <Alert variant="info">
                          {allVehicles.length === 0 ? 
                            'No vehicles available for offers. All vehicles already have offers.' : 
                            'No vehicles match your search.'}
                        </Alert>
                      ) : (
                        <div className="list-group">
                          {filteredCars.map((vehicle) => (
                            <button
                              key={vehicle._id}
                              type="button"
                              className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                              onClick={() => selectVehicle(vehicle)}
                            >
                              <div>
                                <strong>{vehicle.carName}</strong>
                                <br />
                                <small className="text-muted">
                                  {vehicle.model} • {vehicle.vehicleNumber || 'N/A'} • {vehicle.location || 'N/A'}
                                </small>
                              </div>
                              <Badge bg="secondary">₹{vehicle.pricePerDay}/day</Badge>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {selectedVehicle && (
                <>
                  <hr />
                  
                  {/* Offer Details */}
                  <div className="col-md-6 mb-3">
                    <Form.Label className="fw-bold">
                      Extra Free Days <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="number"
                      name="extraFreeDays"
                      value={formData.extraFreeDays}
                      onChange={handleChange}
                      min="1"
                      placeholder="e.g., 1"
                      required
                    />
                    <Form.Text className="text-muted">
                      Number of free days offered with booking
                    </Form.Text>
                  </div>

                  <div className="col-md-6 mb-3">
                    <Form.Label className="fw-bold">
                      Offer Description <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="offerDescription"
                      value={formData.offerDescription}
                      onChange={handleChange}
                      placeholder="e.g., Get 1 day free on weekly booking"
                      required
                    />
                  </div>

                  {/* Offer Period */}
                  <div className="col-12">
                    <h6 className="text-primary mb-3">
                      <i className="fas fa-calendar-alt me-2"></i>
                      Offer Period
                    </h6>
                  </div>

                  <div className="col-md-6 mb-3">
                    <Form.Label className="fw-bold">
                      Start Date <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <Form.Label className="fw-bold">
                      Start Time <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleChange}
                      required
                    />
                    <Form.Text className="text-muted">
                      Format: HH:MM (24-hour)
                    </Form.Text>
                  </div>

                  <div className="col-md-6 mb-3">
                    <Form.Label className="fw-bold">
                      End Date <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleChange}
                      min={formData.startDate || new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <Form.Label className="fw-bold">
                      End Time <span className="text-danger">*</span>
                    </Form.Label>
                    <Form.Control
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleChange}
                      required
                    />
                    <Form.Text className="text-muted">
                      Format: HH:MM (24-hour)
                    </Form.Text>
                  </div>

                  {/* Preview */}
                  {formData.startDate && formData.endDate && formData.extraFreeDays && formData.offerDescription && (
                    <div className="col-12 mt-2">
                      <Alert variant="info">
                        <i className="fas fa-info-circle me-2"></i>
                        <strong>Offer Preview:</strong> {formData.offerDescription} - 
                        +{formData.extraFreeDays} free day{formData.extraFreeDays > 1 ? 's' : ''}
                        <br />
                        <small>
                          Valid from {new Date(formData.startDate).toLocaleDateString()} to{' '}
                          {new Date(formData.endDate).toLocaleDateString()} ({formData.startTime} - {formData.endTime})
                        </small>
                      </Alert>
                    </div>
                  )}
                </>
              )}
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeOfferModal}>
            <i className="fas fa-times me-2"></i>Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmitOffer}
            disabled={isSubmitting || !selectedVehicle}
          >
            {isSubmitting ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Adding Offer...</span>
              </>
            ) : (
              <>
                <i className="fas fa-plus me-2"></i>
                Add Offer
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OfferSection;