import React, { useState, useEffect } from 'react';
import { Table, Button, Spinner, Alert, Badge, Modal, Card, Row, Col, Pagination } from 'react-bootstrap';
import { toast } from 'react-toastify';

const HoldVehicles = () => {
  const [holdVehicles, setHoldVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isReleasing, setIsReleasing] = useState(false);
  const [summary, setSummary] = useState({ activeHolds: 0, expiredHolds: 0, totalOnHold: 0 });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Search states
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'expired'

  // Fetch on-hold vehicles
  const fetchHoldVehicles = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://varahibackend.varahiselfdrivecars.com/api/car/on-hold');
      if (!response.ok) {
        throw new Error('Failed to fetch on-hold vehicles');
      }
      const data = await response.json();
      
      setHoldVehicles(data.cars || []);
      setFilteredVehicles(data.cars || []);
      setSummary(data.summary || { activeHolds: 0, expiredHolds: 0, totalOnHold: 0 });
      setError('');
      setCurrentPage(1);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoldVehicles();
  }, []);

  // Filter vehicles based on search and status filter
  useEffect(() => {
    let filtered = [...holdVehicles];

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(vehicle => {
        const expired = isHoldExpired(vehicle.holdDetails);
        if (filterStatus === 'active') return !expired;
        if (filterStatus === 'expired') return expired;
        return true;
      });
    }

    // Apply search filter
    if (searchText.trim() !== '') {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(vehicle => 
        vehicle.carName?.toLowerCase().includes(searchLower) ||
        vehicle.model?.toLowerCase().includes(searchLower) ||
        vehicle.vehicleNumber?.toLowerCase().includes(searchLower) ||
        vehicle.location?.toLowerCase().includes(searchLower) ||
        vehicle.holdDetails?.reason?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredVehicles(filtered);
    setCurrentPage(1);
  }, [searchText, filterStatus, holdVehicles]);

  // Check if hold is expired
  const isHoldExpired = (holdDetails) => {
    if (!holdDetails) return false;
    try {
      const endDateTime = new Date(holdDetails.endDateTime);
      return endDateTime < new Date();
    } catch {
      return false;
    }
  };

  // Handle release vehicle
  const handleReleaseVehicle = async () => {
    if (!selectedVehicle) return;

    setIsReleasing(true);
    try {
      const response = await fetch(`https://varahibackend.varahiselfdrivecars.com/api/car/update-car-status/${selectedVehicle._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'active'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to release vehicle');
      }

      const data = await response.json();
      toast.success(`Vehicle "${selectedVehicle.carName}" released successfully!`);
      
      // Refresh the list
      fetchHoldVehicles();
      setShowReleaseModal(false);
      setSelectedVehicle(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsReleasing(false);
    }
  };

  const openReleaseModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowReleaseModal(true);
  };

  const closeReleaseModal = () => {
    setShowReleaseModal(false);
    setSelectedVehicle(null);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get hold status badge
  const getHoldStatusBadge = (vehicle) => {
    if (!vehicle.holdDetails) {
      return <Badge bg="secondary">Unknown</Badge>;
    }

    const expired = isHoldExpired(vehicle.holdDetails);
    if (expired) {
      return <Badge bg="danger">Expired</Badge>;
    }
    return <Badge bg="warning" text="dark">Active</Badge>;
  };

  // Pagination logic with ellipsis
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const paginatedVehicles = filteredVehicles.slice(
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

    // Always show first page
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

    // Show middle pages
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

    // Always show last page
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

  // Mobile card view for smaller screens
  const renderMobileCard = (vehicle, index) => {
    const holdDetails = vehicle.holdDetails || {};
    const expired = isHoldExpired(holdDetails);

    return (
      <Card key={vehicle._id} className={`mb-3 ${expired ? 'border-danger' : 'border-warning'}`}>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-start mb-2">
            <div>
              <h5 className="mb-1">{vehicle.carName}</h5>
              <div className="text-muted small">{vehicle.model || '-'}</div>
            </div>
            {getHoldStatusBadge(vehicle)}
          </div>

          <div className="row small mb-2">
            <div className="col-6">
              <strong>Vehicle No:</strong> {vehicle.vehicleNumber || '-'}
            </div>
            <div className="col-6">
              <strong>ID:</strong> {vehicle._id.slice(-6)}
            </div>
          </div>

          <div className="small mb-2">
            <div><strong>Hold Period:</strong></div>
            <div className="text-muted">
              {formatDateTime(holdDetails.startDateTime)} - {formatDateTime(holdDetails.endDateTime)}
            </div>
            <div className="text-muted">
              <i className="fas fa-clock me-1"></i>
              Duration: {holdDetails.duration?.formatted || '-'}
            </div>
          </div>

          <div className="small mb-2">
            <strong>Reason:</strong> {holdDetails.reason || '-'}
          </div>

          <div className="d-flex justify-content-between align-items-center mt-2">
            <div>
              {!expired && holdDetails.timeRemaining && (
                <span className="badge bg-info text-dark">
                  {holdDetails.timeRemaining.formatted}
                </span>
              )}
              {expired && <Badge bg="danger">Expired</Badge>}
            </div>
            <Button
              variant={expired ? "outline-danger" : "success"}
              size="sm"
              onClick={() => openReleaseModal(vehicle)}
            >
              <i className={`fas ${expired ? 'fa-times' : 'fa-check'} me-1`}></i>
              {expired ? 'Force Release' : 'Release'}
            </Button>
          </div>
        </Card.Body>
      </Card>
    );
  };

  return (
    <div className="container-fluid p-3">
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
        <h2 className="mb-2 mb-md-0">
          <i className="fas fa-pause-circle me-2 text-warning"></i>
          Vehicles On Hold
        </h2>
        <Button 
          variant="outline-primary" 
          onClick={fetchHoldVehicles}
          disabled={loading}
        >
          <i className="fas fa-sync-alt me-2"></i>
          Refresh
        </Button>
      </div>

      {/* Summary Cards - Responsive */}
      <Row className="mb-4 g-2 g-md-3">
        <Col xs={6} md={3}>
          <Card className="text-center border-warning h-100">
            <Card.Body className="p-2 p-md-3">
              <h4 className="text-warning mb-1 mb-md-2">{summary.activeHolds}</h4>
              <Card.Text className="text-muted small mb-0">Active Holds</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="text-center border-danger h-100">
            <Card.Body className="p-2 p-md-3">
              <h4 className="text-danger mb-1 mb-md-2">{summary.expiredHolds}</h4>
              <Card.Text className="text-muted small mb-0">Expired Holds</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="text-center border-info h-100">
            <Card.Body className="p-2 p-md-3">
              <h4 className="text-info mb-1 mb-md-2">{summary.totalOnHold}</h4>
              <Card.Text className="text-muted small mb-0">Total On Hold</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={6} md={3}>
          <Card className="text-center border-success h-100">
            <Card.Body className="p-2 p-md-3">
              <h4 className="text-success mb-1 mb-md-2">{holdVehicles.filter(v => v.status === 'onHold').length}</h4>
              <Card.Text className="text-muted small mb-0">Currently On Hold</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters - Responsive */}
      <div className="row mb-3 g-2">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="input-group">
            <span className="input-group-text">
              <i className="fas fa-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Search by name, model, number..."
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
        <div className="col-12 col-md-6 col-lg-3">
          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Holds</option>
            <option value="active">Active Only</option>
            <option value="expired">Expired Only</option>
          </select>
        </div>
        <div className="col-12 col-md-12 col-lg-5 d-flex justify-content-end align-items-center">
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
              {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Loading on-hold vehicles...</p>
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : holdVehicles.length === 0 ? (
        <div className="text-center py-5">
          <div className="mb-4">
            <i className="fas fa-check-circle fa-4x text-success"></i>
          </div>
          <h4 className="text-muted mb-3">No Vehicles On Hold</h4>
          <p className="text-muted mb-4">All vehicles are currently available or booked.</p>
          <Button 
            variant="primary" 
            onClick={() => window.location.href = '/vehicles'}
          >
            <i className="fas fa-arrow-left me-2"></i>
            Back to Vehicles
          </Button>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="text-center py-4">
          <i className="fas fa-filter fa-3x text-muted mb-3"></i>
          <h5 className="text-muted">No vehicles match your filters</h5>
          <Button 
            variant="outline-secondary" 
            size="sm" 
            onClick={() => {
              setSearchText('');
              setFilterStatus('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Table View - Hidden on small screens */}
          <div className="d-none d-lg-block">
            <div className="table-responsive">
              <Table bordered hover striped className="align-middle">
                <thead className="table-header">
                  <tr>
                    <th>#</th>
                    <th>Vehicle Name</th>
                    <th>Vehicle Number</th>
                    <th>Model</th>
                    <th>Hold Status</th>
                    <th>Hold Period</th>
                    <th>Hold Reason</th>
                    {/* <th>Time Remaining</th> */}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedVehicles.map((vehicle, index) => {
                    const holdDetails = vehicle.holdDetails || {};
                    const expired = isHoldExpired(holdDetails);

                    return (
                      <tr key={vehicle._id} className={expired ? 'table-danger' : ''}>
                        <td className="text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                        <td>
                          <strong>{vehicle.carName}</strong>
                          <br />
                          <small className="text-muted">ID: {vehicle._id.slice(-6)}</small>
                        </td>
                        <td>{vehicle.vehicleNumber || '-'}</td>
                        <td>{vehicle.model || '-'}</td>
                        <td>{getHoldStatusBadge(vehicle)}</td>
                        <td>
                          <div className="small">
                            <div><strong>Start:</strong> {formatDateTime(holdDetails.startDateTime)}</div>
                            <div><strong>End:</strong> {formatDateTime(holdDetails.endDateTime)}</div>
                            <div className="text-muted">
                              <i className="fas fa-clock me-1"></i>
                              Duration: {holdDetails.duration?.formatted || '-'}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="small">
                            <div>{holdDetails.reason || '-'}</div>
                            {holdDetails.isActive !== undefined && (
                              <div className="mt-1">
                                <Badge bg={holdDetails.isActive ? 'success' : 'secondary'} className="fs-7">
                                  {holdDetails.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </td>
                        {/* <td>
                          {!expired && holdDetails.timeRemaining ? (
                            <div className="text-center">
                              <span className="badge bg-info text-dark fs-6 p-2">
                                {holdDetails.timeRemaining.formatted || 'N/A'}
                              </span>
                            </div>
                          ) : (
                            <Badge bg="danger">Expired</Badge>
                          )}
                        </td> */}
                        <td className="text-center">
                          <Button
                            variant={expired ? "outline-danger" : "success"}
                            size="sm"
                            onClick={() => openReleaseModal(vehicle)}
                            title={expired ? "Force release this vehicle" : "Release this vehicle from hold"}
                          >
                            <i className={`fas ${expired ? 'fa-times' : 'fa-check'} me-1`}></i>
                            {expired ? 'Force Release' : 'Release'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          </div>

          {/* Mobile Card View - Visible on small screens */}
          <div className="d-block d-lg-none">
            {paginatedVehicles.map((vehicle, index) => renderMobileCard(vehicle, index))}
          </div>

          {/* Items info */}
          <div className="d-flex justify-content-between align-items-center flex-wrap mt-3">
            <div className="text-muted small">
              Showing {paginatedVehicles.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{' '}
              {Math.min(currentPage * itemsPerPage, filteredVehicles.length)} of {filteredVehicles.length} vehicles
              {summary.expiredHolds > 0 && (
                <span className="ms-3 text-danger">
                  <i className="fas fa-exclamation-triangle me-1"></i>
                  {summary.expiredHolds} hold{summary.expiredHolds !== 1 ? 's' : ''} expired
                </span>
              )}
            </div>
          </div>

          {/* Pagination with ellipsis */}
          {renderPagination()}
        </>
      )}

      {/* Release Confirmation Modal */}
      <Modal show={showReleaseModal} onHide={closeReleaseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-check-circle me-2 text-success"></i>
            Release Vehicle from Hold
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedVehicle && (
            <>
              <div className="mb-3">
                <h5>Vehicle Details</h5>
                <p className="mb-1"><strong>Name:</strong> {selectedVehicle.carName}</p>
                <p className="mb-1"><strong>Model:</strong> {selectedVehicle.model}</p>
                <p className="mb-1"><strong>Vehicle Number:</strong> {selectedVehicle.vehicleNumber || '-'}</p>
                {selectedVehicle.holdDetails && (
                  <>
                    <p className="mb-1"><strong>Hold Reason:</strong> {selectedVehicle.holdDetails.reason || '-'}</p>
                    <p className="mb-1">
                      <strong>Hold Period:</strong> 
                      {formatDateTime(selectedVehicle.holdDetails.startDateTime)} 
                      {' - '}
                      {formatDateTime(selectedVehicle.holdDetails.endDateTime)}
                    </p>
                    {selectedVehicle.holdDetails.timeRemaining && (
                      <p className="mb-1">
                        <strong>Time Remaining:</strong> 
                        <span className="badge bg-info ms-2 text-dark">
                          {selectedVehicle.holdDetails.timeRemaining.formatted}
                        </span>
                      </p>
                    )}
                  </>
                )}
              </div>

              <Alert variant="warning">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>Confirm Release:</strong> This will make the vehicle available for booking again. Are you sure you want to release "{selectedVehicle.carName}" from hold?
              </Alert>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeReleaseModal}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleReleaseVehicle}
            disabled={isReleasing}
          >
            {isReleasing ? (
              <>
                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                <span className="ms-2">Releasing...</span>
              </>
            ) : (
              <>
                <i className="fas fa-check me-2"></i>
                Confirm Release
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default HoldVehicles;