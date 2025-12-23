import React, { useEffect, useState } from 'react';
import { Modal, Button, Form, Table, Spinner, Alert, Pagination, InputGroup, FormControl } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import * as XLSX from 'xlsx';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewVehicle, setViewVehicle] = useState(null);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    carName: '',
    model: '',
    year: '',
    pricePerHour: '',
    pricePerDay: '',
    extendedPrice: { perHour: '', perDay: '' },
    fuel: '',
    seats: '',
    type: '',
    location: '',
    carType: '',
    carImage: [],
    carDocs: [],
    status: 'active',
    availabilityStatus: true,
    description: '',
    vehicleNumber: '',
    delayPerHour: '',
    delayPerDay: '',
    branchName: '',
    branchLat: '',
    branchLng: '',
    runningStatus: 'Available',
    isPremium: false // Added isPremium field
  });
  const [searchType, setSearchType] = useState('carName');
  const [searchText, setSearchText] = useState('');
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [files, setFiles] = useState([]);
  const [docFiles, setDocFiles] = useState([]);
  const itemsPerPage = 10;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCustomTypeInput, setShowCustomTypeInput] = useState(false);
  const [showCustomCarTypeInput, setShowCustomCarTypeInput] = useState(false);
  const [showCustomFuelInput, setShowCustomFuelInput] = useState(false);
  const [showPremiumOnly, setShowPremiumOnly] = useState(false); // Added state for premium filter

  // Predefined options for dropdowns
  const transmissionTypes = ['Automatic', 'Manual'];
  const carTypes = ['SUV', 'SEDAN'];
  const fuelTypes = ['Petrol', 'Diesel'];

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await fetch('http://194.164.148.244:4062/api/car/get-cars');
        if (!res.ok) throw new Error('Failed to fetch vehicles');
        const data = await res.json();
        const carList = data.cars || [];

        // Reverse order (newest first)
        const reversed = (data.cars || []).reverse();

        setVehicles(reversed);
        setFilteredVehicles(reversed);
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  const filterVehicles = () => {
    let filtered = vehicles;

    // Apply premium filter if enabled
    if (showPremiumOnly) {
      filtered = filtered.filter(v => v.isPremium === true);
    }

    // Apply search filter if there's search text
    if (searchText.trim() !== '') {
      filtered = filtered.filter((v) => {
        let value = '';
        switch (searchType) {
          case 'carName':
          case 'model':
          case 'location':
          case 'status':
          case 'vehicleNumber':
          case 'runningStatus':
          case 'type':
          case 'carType':
          case 'fuel':
            value = v[searchType] || '';
            break;
          case 'isPremium':
            // Handle premium status search specifically
            if (searchText.toLowerCase() === 'premium' || searchText.toLowerCase() === 'yes' || searchText === 'true') {
              return v.isPremium === true;
            } else if (searchText.toLowerCase() === 'standard' || searchText.toLowerCase() === 'no' || searchText === 'false') {
              return v.isPremium === false;
            }
            // Fallback to string comparison
            value = v.isPremium ? 'premium' : 'standard';
            return value.includes(searchText.toLowerCase());
          case 'branchName':
            value = v.branch?.name || '';
            break;
          default:
            value = '';
        }
        return value.toString().toLowerCase().includes(searchText.toLowerCase());
      });
    }

    setFilteredVehicles(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    filterVehicles();
  }, [searchText, searchType, vehicles, showPremiumOnly]); // Added showPremiumOnly dependency

  const openAddModal = () => {
    setEditingVehicle(null);
    setFormData({
      carName: '',
      model: '',
      year: '',
      pricePerHour: '',
      pricePerDay: '',
      extendedPrice: { perHour: '', perDay: '' },
      fuel: '',
      seats: '',
      type: '',
      location: '',
      carType: '',
      carImage: [],
      carDocs: [],
      status: 'active',
      availabilityStatus: true,
      description: '',
      vehicleNumber: '',
      delayPerHour: '',
      delayPerDay: '',
      branchName: '',
      branchLat: '',
      branchLng: '',
      runningStatus: 'Available',
      isPremium: false // Default value for new vehicle
    });
    setFiles([]);
    setDocFiles([]);
    setShowCustomTypeInput(false);
    setShowCustomCarTypeInput(false);
    setShowCustomFuelInput(false);
    setShowModal(true);
  };

  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      carName: vehicle.carName,
      model: vehicle.model,
      year: vehicle.year,
      pricePerHour: vehicle.pricePerHour,
      pricePerDay: vehicle.pricePerDay,
      extendedPrice: vehicle.extendedPrice || { perHour: '', perDay: '' },
      fuel: vehicle.fuel,
      seats: vehicle.seats,
      type: vehicle.type,
      location: vehicle.location,
      carType: vehicle.carType,
      carImage: vehicle.carImage || [],
      carDocs: vehicle.carDocs || [],
      status: vehicle.status || 'active',
      availabilityStatus: vehicle.availabilityStatus !== false,
      description: vehicle.description || '',
      vehicleNumber: vehicle.vehicleNumber || '',
      delayPerHour: vehicle.delayPerHour || '',
      delayPerDay: vehicle.delayPerDay || '',
      branchName: vehicle.branch?.name || '',
      branchLat: vehicle.branch?.location?.coordinates?.[1] || '',
      branchLng: vehicle.branch?.location?.coordinates?.[0] || '',
      runningStatus: vehicle.runningStatus || 'Available',
      isPremium: vehicle.isPremium || false // Added isPremium
    });

    // Check if fields are custom (not in predefined list)
    setShowCustomTypeInput(!transmissionTypes.includes(vehicle.type));
    setShowCustomCarTypeInput(!carTypes.includes(vehicle.carType));
    setShowCustomFuelInput(!fuelTypes.includes(vehicle.fuel));

    setFiles([]);
    setDocFiles([]);
    setShowModal(true);
  };

  const openViewModal = async (id) => {
    try {
      const res = await fetch(`http://194.164.148.244:4062/api/car/getcar/${id}`);
      if (!res.ok) throw new Error('Failed to fetch vehicle details');
      const data = await res.json();
      setViewVehicle(data);
      setShowViewModal(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const closeModal = () => setShowModal(false);
  const closeViewModal = () => setShowViewModal(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleExtendedPriceChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      extendedPrice: {
        ...prev.extendedPrice,
        [name]: value
      }
    }));
  };

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  const handleDocFileChange = (e) => {
    setDocFiles([...e.target.files]);
  };

  const handleTypeChange = (e) => {
    const value = e.target.value;
    if (value === 'custom') {
      setShowCustomTypeInput(true);
      setFormData(prev => ({ ...prev, type: '' }));
    } else {
      setShowCustomTypeInput(false);
      setFormData(prev => ({ ...prev, type: value }));
    }
  };

  const handleCarTypeChange = (e) => {
    const value = e.target.value;
    if (value === 'custom') {
      setShowCustomCarTypeInput(true);
      setFormData(prev => ({ ...prev, carType: '' }));
    } else {
      setShowCustomCarTypeInput(false);
      setFormData(prev => ({ ...prev, carType: value }));
    }
  };

  const handleFuelChange = (e) => {
    const value = e.target.value;
    if (value === 'custom') {
      setShowCustomFuelInput(true);
      setFormData(prev => ({ ...prev, fuel: '' }));
    } else {
      setShowCustomFuelInput(false);
      setFormData(prev => ({ ...prev, fuel: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    setIsSubmitting(true);

    const formDataToSend = new FormData();

    // Add all form fields to FormData
    Object.keys(formData).forEach(key => {
      if (key === 'extendedPrice') {
        formDataToSend.append(key, JSON.stringify(formData[key]));
      } else if (key === 'branch') {
        // Handle branch data structure
        const branchData = {
          name: formData.branchName,
          location: {
            type: "Point",
            coordinates: [
              parseFloat(formData.branchLng),
              parseFloat(formData.branchLat)
            ]
          }
        };
        formDataToSend.append(key, JSON.stringify(branchData));
      } else if (key !== 'carImage' && key !== 'carDocs' && key !== 'branchName' && key !== 'branchLat' && key !== 'branchLng') {
        // Convert boolean values to string for FormData
        if (key === 'isPremium') {
          formDataToSend.append(key, formData[key].toString());
        } else {
          formDataToSend.append(key, formData[key]);
        }
      }
    });

    // Add branch fields separately
    formDataToSend.append('branchName', formData.branchName);
    formDataToSend.append('branchLat', formData.branchLat);
    formDataToSend.append('branchLng', formData.branchLng);

    // Add car image files
    files.forEach(file => {
      formDataToSend.append('carImage', file);
    });

    // Add car document files
    docFiles.forEach(file => {
      formDataToSend.append('carDocs', file);
    });

    try {
      let res, result;
      if (editingVehicle) {
        res = await fetch(`http://194.164.148.244:4062/api/car/updatecar/${editingVehicle._id}`, {
          method: 'PUT',
          body: formDataToSend,
        });
        if (!res.ok) throw new Error('Failed to update vehicle');
        result = await res.json();
        setVehicles(prev =>
          prev.map(v => (v._id === editingVehicle._id ? result.car : v))
        );
        toast.success('Car updated successfully!');
      } else {
        res = await fetch('http://194.164.148.244:4062/api/car/add-cars', {
          method: 'POST',
          body: formDataToSend,
        });
        if (!res.ok) throw new Error('Failed to add vehicle');
        result = await res.json();
        setVehicles(prev => [...prev, result.car]);
        toast.success('Car added successfully!');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this vehicle?')) {
      try {
        const res = await fetch(`http://194.164.148.244:4062/api/car/deletecar/${id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Failed to delete vehicle');
        setVehicles((prev) => prev.filter((v) => v._id !== id));
        toast.success('Car deleted successfully!');
      } catch (err) {
        toast.error(err.message);
      }
    }
  };

  const handleDownload = () => {
    try {
      toast.info('Preparing Excel file with vehicle data...', { autoClose: 2000 });

      const wsData = vehicles.map(v => ({
        ID: v._id,
        Name: v.carName || '-',
        Model: v.model || '-',
        Year: v.year || '-',
        PricePerHour: v.pricePerHour || '-',
        PricePerDay: v.pricePerDay || '-',
        ExtendedPricePerHour: v.extendedPrice?.perHour || '-',
        ExtendedPricePerDay: v.extendedPrice?.perDay || '-',
        Status: v.status || 'active',
        RunningStatus: v.runningStatus || 'Available',
        AvailabilityStatus: v.availabilityStatus !== false ? 'Available' : 'Not Available',
        Fuel: v.fuel || '-',
        Seats: v.seats || '-',
        Type: v.type || '-',
        Location: v.location || '-',
        CarType: v.carType || '-',
        Description: v.description || '-',
        VehicleNumber: v.vehicleNumber || '-',
        DelayPerHour: v.delayPerHour || '-',
        DelayPerDay: v.delayPerDay || '-',
        BranchName: v.branch?.name || '-',
        BranchLocation: v.branch?.location ? `${v.branch.location.coordinates[1]}, ${v.branch.location.coordinates[0]}` : '-',
        Images: (v.carImage || []).join(', ') || '-',
        Documents: (v.carDocs || []).join(', ') || '-',
        IsPremium: v.isPremium ? 'Yes' : 'No' // Added isPremium to Excel export
      }));

      // Create sheet & workbook
      const ws = XLSX.utils.json_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Vehicles");

      // Set column widths
      ws['!cols'] = [
        { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 10 },
        { wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
        { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 10 },
        { wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 30 },
        { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 20 },
        { wch: 25 }, { wch: 40 }, { wch: 40 }, { wch: 10 }
      ];

      // Add header styling
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F81BD" } },
        alignment: { horizontal: "center" }
      };
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        if (ws[cellAddress]) {
          ws[cellAddress].s = headerStyle;
        }
      }

      // Save file
      XLSX.writeFile(wb, "Vehicles_Report.xlsx");
      toast.success('Excel file downloaded successfully!', { autoClose: 2000 });
    } catch (error) {
      console.error('Error generating vehicle Excel:', error);
      toast.error('Failed to download vehicle data.', { autoClose: 2000 });
    }
  };

  // Add this function to your component
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://194.164.148.244:4062/api/car/get-cars');
      if (!res.ok) throw new Error('Failed to fetch vehicles');
      const data = await res.json();
      const reversed = (data.cars || []).reverse();
      setVehicles(reversed);
      setFilteredVehicles(reversed);
      setCurrentPage(1);
      toast.success('Data refreshed successfully!');
    } catch (err) {
      toast.error('Failed to refresh: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle premium filter
  const togglePremiumFilter = () => {
    setShowPremiumOnly(!showPremiumOnly);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredVehicles.length / itemsPerPage);
  const paginatedVehicles = filteredVehicles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderPagination = () => {
    if (!totalPages || totalPages < 1) return null; // prevent rendering if totalPages is invalid

    const pages = [];
    const pageSet = new Set();

    // Always add first page
    pageSet.add(1);

    // Only add last page if more than 1
    if (totalPages > 1) {
      pageSet.add(totalPages);
    }

    // Add current page and its neighbors
    if (currentPage > 1) pageSet.add(currentPage - 1);
    pageSet.add(currentPage);
    if (currentPage < totalPages) pageSet.add(currentPage + 1);

    // Convert to sorted array
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
          onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
        >
          Prev
        </Pagination.Item>
        {pages}
        <Pagination.Item
          disabled={currentPage === totalPages}
          onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
        >
          Next
        </Pagination.Item>
      </Pagination>
    );
  };

  return (
    <div className="container-fluid p-3">
      <ToastContainer position="top-right" autoClose={2000} />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Vehicles Management</h2>
        <div>
          <Button
            variant="primary"
            onClick={openAddModal}
          >
            Add Vehicle
          </Button>
        </div>
      </div>      

      {/* Filter/Search */}
      <div className="row mb-3">
        <div className="col-md-3">
          <Form.Select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
          >
            <option value="carName">Search by Car Name</option>
            <option value="model">Search by Model</option>
            <option value="location">Search by Location</option>
            <option value="status">Search by Status</option>
            <option value="vehicleNumber">Search by Vehicle Number</option>
            <option value="runningStatus">Search by Running Status</option>
            <option value="branchName">Search by Branch Name</option>
            <option value="type">Search by Transmission Type</option>
            <option value="carType">Search by Car Type</option>
            <option value="fuel">Search by Fuel Type</option>
            <option value="isPremium">Search by Premium Status</option> {/* Added isPremium to search options */}
          </Form.Select>
        </div>
        <div className="col-md-5">
          <InputGroup>
            <FormControl
              type="text"
              placeholder={`Search by ${searchType}`}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </InputGroup>
        </div>
        <div className="col-md-4">
          <div className="d-flex justify-content-end">
            <Button 
              variant={showPremiumOnly ? "warning" : "outline-warning"} 
              className="me-2"
              onClick={togglePremiumFilter}
            >
              <i className="fas fa-crown me-2"></i>
              {showPremiumOnly ? "Show All Cars" : "Premium Cars Only"}
            </Button>
            <Button variant="info" className="me-2" onClick={handleRefresh}>
              <i className="fas fa-sync-alt"></i> Refresh
            </Button>
            <Button
              variant="success"
              onClick={handleDownload}
              disabled={vehicles.length === 0}
            >
              <i className="fas fa-file-excel me-2"></i>Export
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : vehicles.length === 0 ? (
        // No vehicles message
        <div className="text-center py-5">
          <div className="mb-4">
            <i className="fas fa-car fa-4x text-muted"></i>
          </div>
          <h4 className="text-muted mb-3">No Vehicles Found</h4>
          <p className="text-muted mb-4">Get started by adding your first vehicle to the system.</p>
          <Button variant="primary" size="lg" onClick={openAddModal}>
            <i className="fas fa-plus me-2"></i>Add Your First Vehicle
          </Button>
        </div>
      ) : (
        <>
          {showPremiumOnly && (
            <Alert variant="warning" className="mb-3">
              <i className="fas fa-crown me-2"></i>
              Showing only premium vehicles ({filteredVehicles.length} found)
            </Alert>
          )}
          
          <div className="table-responsive">
            <Table bordered hover striped>
              <thead>
                <tr className='table-header'>
                  <th>S.NO</th>
                  <th>ID</th>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Model</th>
                  <th>Year</th>
                  <th>Price/Hr</th>
                  <th>Price/Day</th>
                  <th>Ext. Price/Hr</th>
                  <th>Ext. Price/Day</th>
                  <th>Status</th>
                  <th>Bookings</th>
                  <th>Premium</th> {/* Added Premium column */}
                  <th>Fuel</th>
                  <th>Seats</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Car Type</th>
                  <th>Branch</th>
                  <th>Veh. Number</th>
                  <th>Delay/Hr</th>
                  <th>Delay/Day</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedVehicles.length === 0 ? (
                  <tr>
                    <td colSpan="24" className="text-center">No vehicles match your search criteria.</td>
                  </tr>
                ) : (
                  paginatedVehicles.map((vehicle, index) => (
                    <tr key={vehicle._id}>
                      <td className="text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td>{vehicle._id.slice(-6)}</td>
                      <td>
                        {vehicle.carImage?.[0] ? (
                          <img
                            src={vehicle.carImage[0]}
                            alt={vehicle.carName}
                            style={{ width: '80px', height: '50px', objectFit: 'cover' }}
                          />
                        ) : 'No Image'}
                      </td>
                      <td>{vehicle.carName}</td>
                      <td>{vehicle.model}</td>
                      <td>{vehicle.year}</td>
                      <td>₹{vehicle.pricePerHour}</td>
                      <td>₹{vehicle.pricePerDay}</td>
                      <td>₹{vehicle.extendedPrice?.perHour || '-'}</td>
                      <td>₹{vehicle.extendedPrice?.perDay || '-'}</td>
                      <td>
                        <span className={`badge bg-${vehicle.status === 'active' ? 'success' : 'warning'}`}>
                          {vehicle.status || 'active'}
                        </span>
                      </td>
                      {/* Bookings Column */}
                      <td>
                        <span
                          className={`badge bg-${vehicle.bookedStatus?.length > 0 ? "danger" : "info"
                            }`}
                        >
                          {vehicle.bookedStatus?.length || 0}
                        </span>
                      </td>
                      {/* Premium Column */}
                      <td>
                        <span className={`badge bg-${vehicle.isPremium ? 'warning' : 'secondary'}`}>
                          {vehicle.isPremium ? 'Premium' : 'Standard'}
                        </span>
                      </td>
                      <td>{vehicle.fuel}</td>
                      <td>{vehicle.seats}</td>
                      <td>{vehicle.type}</td>
                      <td>{vehicle.location}</td>
                      <td>{vehicle.carType}</td>
                      <td>{vehicle.branch?.name || '-'}</td>
                      <td>{vehicle.vehicleNumber || '-'}</td>
                      <td>₹{vehicle.delayPerHour || '-'}</td>
                      <td>₹{vehicle.delayPerDay || '-'}</td>
                      <td className="text-center align-middle">
                        <button
                          className="me-1 mb-1 mt-1 ms-1 btn btn-sm btn-outline-info"
                          onClick={() => openViewModal(vehicle._id)}
                        >
                          <i className="fas fa-eye"></i>
                        </button>
                        <button
                          className="me-1 mb-1 mt-1 ms-1 btn btn-sm btn-outline-warning"
                          onClick={() => openEditModal(vehicle)}
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(vehicle._id)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
          <div className="d-flex justify-content-center">{renderPagination()}</div>
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={closeModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <div className="row">
              {['carName', 'model', 'year', 'pricePerHour', 'pricePerDay',
                'seats', 'location', 'vehicleNumber', 'delayPerHour', 'delayPerDay',
                'branchName', 'branchLat', 'branchLng'].map((field) => (
                  <Form.Group key={field} className="mb-3 col-md-4">
                    <Form.Label>
                      {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                    </Form.Label>
                    <Form.Control
                      type={['year', 'pricePerHour', 'pricePerDay', 'seats',
                        'delayPerHour', 'delayPerDay', 'branchLat', 'branchLng'].includes(field)
                        ? 'number' : 'text'}
                      name={field}
                      value={formData[field]}
                      onChange={handleChange}
                      required={!['pricePerDay', 'delayPerHour', 'delayPerDay',
                        'branchLat', 'branchLng'].includes(field)}
                    />
                  </Form.Group>
                ))}

              {/* Transmission Type Dropdown */}
              <Form.Group className="mb-3 col-md-4">
                <Form.Label>Transmission Type</Form.Label>
                {showCustomTypeInput ? (
                  <Form.Control
                    type="text"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                  />
                ) : (
                  <Form.Select
                    name="type"
                    value={formData.type}
                    onChange={handleTypeChange}
                    required
                  >
                    <option value="">Select Transmission</option>
                    {transmissionTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                    <option value="custom">Custom...</option>
                  </Form.Select>
                )}
              </Form.Group>

              {/* Car Type Dropdown */}
              <Form.Group className="mb-3 col-md-4">
                <Form.Label>Car Type</Form.Label>
                {showCustomCarTypeInput ? (
                  <Form.Control
                    type="text"
                    name="carType"
                    value={formData.carType}
                    onChange={handleChange}
                    required
                  />
                ) : (
                  <Form.Select
                    name="carType"
                    value={formData.carType}
                    onChange={handleCarTypeChange}
                    required
                  >
                    <option value="">Select Car Type</option>
                    {carTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                    <option value="custom">Custom...</option>
                  </Form.Select>
                )}
              </Form.Group>

              {/* Fuel Type Dropdown */}
              <Form.Group className="mb-3 col-md-4">
                <Form.Label>Fuel Type</Form.Label>
                {showCustomFuelInput ? (
                  <Form.Control
                    type="text"
                    name="fuel"
                    value={formData.fuel}
                    onChange={handleChange}
                    required
                  />
                ) : (
                  <Form.Select
                    name="fuel"
                    value={formData.fuel}
                    onChange={handleFuelChange}
                    required
                  >
                    <option value="">Select Fuel Type</option>
                    {fuelTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                    <option value="custom">Custom...</option>
                  </Form.Select>
                )}
              </Form.Group>

              <Form.Group className="mb-3 col-md-6">
                <Form.Label>Extended Price Per Hour</Form.Label>
                <Form.Control
                  type="number"
                  name="perHour"
                  value={formData.extendedPrice.perHour}
                  onChange={handleExtendedPriceChange}
                />
              </Form.Group>

              <Form.Group className="mb-3 col-md-6">
                <Form.Label>Extended Price Per Day</Form.Label>
                <Form.Control
                  type="number"
                  name="perDay"
                  value={formData.extendedPrice.perDay}
                  onChange={handleExtendedPriceChange}
                />
              </Form.Group>

              <Form.Group className="mb-3 col-md-4">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="active">Active</option>
                  <option value="onHold">On Hold</option>
                  <option value="underRepair">Under Repair</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3 col-md-4">
                <Form.Label>Running Status</Form.Label>
                <Form.Select
                  name="runningStatus"
                  value={formData.runningStatus}
                  onChange={handleChange}
                >
                  <option value="Available">Available</option>
                  <option value="Booked">Booked</option>
                </Form.Select>
              </Form.Group>

              {/* Premium Status Checkbox */}
              <Form.Group className="mb-3 col-md-4">
                <Form.Label>Premium Vehicle</Form.Label>
                <div className="mt-2">
                  <Form.Check
                    type="switch"
                    id="isPremium"
                    name="isPremium"
                    label={formData.isPremium ? "Premium Vehicle" : "Standard Vehicle"}
                    checked={formData.isPremium}
                    onChange={handleChange}
                  />
                </div>
              </Form.Group>

              <Form.Group className="mb-3 col-12">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group className="mb-3 col-md-6">
                <Form.Label>Car Images</Form.Label>
                <Form.Control
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept="image/*"
                />
                {editingVehicle && formData.carImage?.length > 0 && (
                  <div className="mt-2">
                    <small>Current Images: {formData.carImage.join(', ')}</small>
                  </div>
                )}
              </Form.Group>

              <Form.Group className="mb-3 col-md-6">
                <Form.Label>Car Documents</Form.Label>
                <Form.Control
                  type="file"
                  multiple
                  onChange={handleDocFileChange}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                />
                {editingVehicle && formData.carDocs?.length > 0 && (
                  <div className="mt-2">
                    <small>Current Documents: {formData.carDocs.join(', ')}</small>
                  </div>
                )}
              </Form.Group>
            </div>
            <div className="d-flex justify-content-end">
              <Button variant="secondary" onClick={closeModal} className="me-2">Cancel</Button>
              <Button variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                    <span className="ms-2">Submitting...</span>
                  </>
                ) : editingVehicle ? 'Update' : 'Add'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* View Modal */}
      <Modal show={showViewModal} onHide={closeViewModal} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Vehicle Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewVehicle ? (
            <div className="row">
              <div className="col-md-6">
                <h4 className="mb-3">{viewVehicle.carName} - {viewVehicle.model}</h4>
                <div className="mb-3"><strong>Year:</strong> {viewVehicle.year}</div>
                <div className="mb-3"><strong>Vehicle Number:</strong> {viewVehicle.vehicleNumber || '-'}</div>
                <div className="mb-3"><strong>Location:</strong> {viewVehicle.location}</div>
                <div className="mb-3"><strong>Branch:</strong> {viewVehicle.branch?.name || '-'}</div>
                <div className="mb-3">
                  <strong>Branch Coordinates:</strong>{" "}
                  {viewVehicle.branch?.location?.coordinates[1]},{" "}
                  {viewVehicle.branch?.location?.coordinates[0]}
                </div>
                <div className="mb-3"><strong>Transmission:</strong> {viewVehicle.type}</div>
                <div className="mb-3"><strong>Car Type:</strong> {viewVehicle.carType}</div>
                <div className="mb-3"><strong>Fuel:</strong> {viewVehicle.fuel}</div>
                <div className="mb-3"><strong>Seats:</strong> {viewVehicle.seats}</div>
                <div className="mb-3">
                  <strong>Premium Status:</strong>
                  <span className={`badge bg-${viewVehicle.isPremium ? 'warning' : 'secondary'} ms-2`}>
                    {viewVehicle.isPremium ? 'Premium Vehicle' : 'Standard Vehicle'}
                  </span>
                </div>
              </div>

              <div className="col-md-6">
                <div className="mb-3"><strong>Price Per Hour:</strong> ₹{viewVehicle.pricePerHour}</div>
                <div className="mb-3"><strong>Price Per Day:</strong> ₹{viewVehicle.pricePerDay}</div>
                <div className="mb-3"><strong>Extended Price Per Hour:</strong> ₹{viewVehicle.extendedPrice?.perHour || '-'}</div>
                <div className="mb-3"><strong>Extended Price Per Day:</strong> ₹{viewVehicle.extendedPrice?.perDay || '-'}</div>
                <div className="mb-3"><strong>Delay Per Hour:</strong> ₹{viewVehicle.delayPerHour || '-'}</div>
                <div className="mb-3"><strong>Delay Per Day:</strong> ₹{viewVehicle.delayPerDay || '-'}</div>
                <div className="mb-3">
                  <strong>Status:</strong>
                  <span className={`badge bg-${viewVehicle.status === 'active' ? 'success' : 'warning'} ms-2`}>
                    {viewVehicle.status || 'active'}
                  </span>
                </div>
                <div className="mb-3">
                  <strong>Running Status:</strong>
                  <span className={`badge bg-${viewVehicle.runningStatus === 'Available' ? 'success' : 'danger'} ms-2`}>
                    {viewVehicle.runningStatus || 'Available'}
                  </span>
                </div>
              </div>

              <div className="col-12">
                <div className="mb-3">
                  <strong>Description:</strong>
                  <p>{viewVehicle.description || '-'}</p>
                </div>
              </div>

              {/* Car Images */}
              <div className="row">
                <div className="col-md-6">
                  <h5>Car Images</h5>
                  {viewVehicle.carImage?.length > 0 ? (
                    <div className="d-flex flex-wrap">
                      {viewVehicle.carImage.map((img, index) => (
                        <div key={index} className="me-2 mb-2">
                          <img
                            src={img}
                            alt={`Car Image ${index}`}
                            style={{ width: '150px', height: '100px', objectFit: 'cover' }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No images available</p>
                  )}
                </div>

                <div className="col-md-6">
                  <h5>Car Documents</h5>
                  {viewVehicle.carDocs?.length > 0 ? (
                    <div className="d-flex flex-wrap">
                      {viewVehicle.carDocs.map((doc, index) => (
                        <div key={index} className="me-2 mb-2">
                          <img
                            src={doc}
                            alt={`Car Document ${index}`}
                            style={{ width: '150px', height: '100px', objectFit: 'cover' }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No documents available</p>
                  )}
                </div>
              </div>

              {/* Booked Status Table */}
              <div className="col-12 mt-4">
                <h5 className="mb-3">Booked Status</h5>
                {viewVehicle.bookedStatus?.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle shadow-sm rounded">
                      <thead className="table-header">
                        <tr>
                          <th style={{ width: "70px" }} className="text-center">SNO</th>
                          <th>Booking Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewVehicle.bookedStatus.map((status, index) => (
                          <tr key={index}>
                            <td className="text-center fw-bold">{index + 1}</td>
                            <td>
                              <span className="badge bg-light text-dark p-2 shadow-sm">
                                {status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="alert alert-info mb-0">No bookings yet</div>
                )}
              </div>

            </div>
          ) : (
            <Spinner animation="border" variant="primary" />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeViewModal}>Close</Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
};

export default Vehicles;