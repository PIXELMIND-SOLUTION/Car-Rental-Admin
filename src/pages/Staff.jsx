import React, { useEffect, useState } from 'react';
import {
  Modal,
  Button,
  Form,
  Table,
  Spinner,
  Alert,
  Image,
  Pagination,
  Row,
  Col,
  Badge,
  ButtonGroup
} from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import 'react-toastify/dist/ReactToastify.css';

const Staff = () => {
  const [staffList, setStaffList] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [viewingStaff, setViewingStaff] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    profileImage: '',
    address: '',
    role: 'staff',
    status: 'active',
  });
  const [error, setError] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const staffPerPage = 10;
  const indexOfLastStaff = currentPage * staffPerPage;
  const indexOfFirstStaff = indexOfLastStaff - staffPerPage;
  const currentStaff = filteredStaff.slice(indexOfFirstStaff, indexOfLastStaff);
  const totalPages = Math.ceil(filteredStaff.length / staffPerPage);

  // Filter & Search
  const [filterField, setFilterField] = useState('name');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query) => {
    setSearchQuery(query);
    const filtered = staffList.filter((staff) =>
      staff[filterField]?.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredStaff(filtered);
    setCurrentPage(1);
  };

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


  const fetchStaff = async () => {
    try {
      const res = await fetch('https://varahibackend.varahiselfdrivecars.com/api/admin/getallstaffs');
      if (!res.ok) throw new Error('Failed to fetch staff');
      const data = await res.json();
      // Reverse order (newest first)
      const reversed = (data.staff || []).reverse();

      setStaffList(reversed);
      setFilteredStaff(reversed);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const openEditModal = (staff) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name,
      email: staff.email,
      mobile: staff.mobile,
      profileImage: staff.profileImage || 'default-profile-image.jpg',
      address: staff.address || '',
      role: staff.role || 'staff',
      status: staff.status || 'active',
    });
    setShowModal(true);
  };

  const openViewModal = (staff) => {
    setViewingStaff(staff);
    setShowViewModal(true);
  };

  const openAddModal = () => {
    setEditingStaff(null);
    setFormData({
      name: '',
      email: '',
      mobile: '',
      profileImage: 'default-profile-image.jpg',
      address: '',
      role: 'staff',
      status: 'active',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingStaff(null);
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setViewingStaff(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingStaff ? 'PUT' : 'POST';
      const url = editingStaff
        ? `https://varahibackend.varahiselfdrivecars.com/api/admin/updatestaff/${editingStaff._id}`
        : 'https://varahibackend.varahiselfdrivecars.com/api/admin/addstaff';

      const payload = {
        ...formData,
        createdBy: 'admin',
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(editingStaff ? 'Failed to update staff' : 'Failed to add staff');

      toast.success(editingStaff ? 'Staff updated successfully!' : 'Staff added successfully!');
      await fetchStaff();
      closeModal();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff member?')) return;
    try {
      const res = await fetch(
        `https://varahibackend.varahiselfdrivecars.com/api/admin/deletestaff/${id}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Failed to delete staff');
      toast.success('Staff deleted successfully!');
      await fetchStaff();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin': return 'danger';
      case 'manager': return 'warning';
      case 'staff': return 'primary';
      default: return 'secondary';
    }
  };

  const getStatusBadge = (status) => {
    return status === 'active' ? 'success' : 'danger';
  };

  const downloadExcel = () => {
    try {
      toast.info('Preparing Excel file with staff data...', { autoClose: 2000 });

      // Prepare worksheet
      const worksheet = XLSX.utils.json_to_sheet(
        staffList.map((staff) => ({
          ID: staff._id,
          Name: staff.name || '-',
          Email: staff.email || '-',
          Mobile: staff.mobile || '-',
          Address: staff.address || '-',
          Role: staff.role || '-',
          Status: staff.status || '-',
          'Profile Image': staff.profileImage || '-',
        }))
      );

      // Create workbook and append sheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'StaffList');

      // Optional: set column widths
      worksheet['!cols'] = [
        { wch: 20 }, // ID
        { wch: 25 }, // Name
        { wch: 30 }, // Email
        { wch: 15 }, // Mobile
        { wch: 30 }, // Address
        { wch: 15 }, // Role
        { wch: 15 }, // Status
        { wch: 40 }, // Profile Image
      ];

      // Add header style
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F81BD" } },
        alignment: { horizontal: "center" }
      };
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = headerStyle;
        }
      }

      // Write file
      XLSX.writeFile(workbook, 'StaffList.xlsx');
      toast.success('Excel file downloaded successfully!', { autoClose: 2000 });
    } catch (error) {
      console.error('Error generating Excel:', error);
      toast.error('Failed to generate Excel file', { autoClose: 2000 });
    }
  };


  return (
    <div className="container-fluid p-3">
      <ToastContainer position="top-right" autoClose={2000} />
      <div className='d-flex justify-content-between align-items-center mb-4'>
        <h2 className="mb-0">Staff Members</h2>
        <div>
          <Button variant="primary" onClick={openAddModal}>
            <i className="fas fa-plus me-2"></i>Add Staff
          </Button>
        </div>
      </div>

      <Row className="mb-3">
        <Col md={3}>
          <Form.Select value={filterField} onChange={(e) => setFilterField(e.target.value)}>
            <option value="name">Search by Name</option>
            <option value="email">Search by Email</option>
            <option value="mobile">Search by Mobile</option>
            <option value="role">Search by Role</option>
          </Form.Select>
        </Col>
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder={`Search by ${filterField}`}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </Col>
        <Col md={3} className="text-end">
          <Button variant="success" className="me-2" onClick={downloadExcel}>
            <i className="fas fa-file-excel me-2"></i>Export to Excel
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
              <thead>
                <tr className="table-header">
                  <th>S.NO</th>
                  <th>Profile</th>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentStaff.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center">No staff found</td>
                  </tr>
                ) : (
                  currentStaff.map((staff, index) => (
                    <tr key={staff._id}>
                      <td className="text-center">{(currentPage - 1) * staffPerPage + index + 1}</td>
                      <td>
                        <Image
                          src={staff.profileImage || 'default-profile-image.jpg'}
                          alt={staff.name}
                          roundedCircle
                          style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                        />
                      </td>
                      <td>
                        <div><strong>{staff.name}</strong></div>
                        <div className="small text-muted">{staff.email}</div>
                      </td>
                      <td>
                        <div>{staff.mobile}</div>
                        <div className="small text-muted">{staff.address || 'No address'}</div>
                      </td>
                      <td>
                        <Badge bg={getRoleBadge(staff.role)} className="text-capitalize">
                          {staff.role}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={getStatusBadge(staff.status)} className="text-capitalize">
                          {staff.status}
                        </Badge>
                      </td>
                      <td className="text-center align-middle">
                        <ButtonGroup size="sm">
                          <Button variant="outline-info" onClick={() => openViewModal(staff)}>
                            <i className="fas fa-eye" />
                          </Button>
                          <Button variant="outline-warning" onClick={() => openEditModal(staff)}>
                            <i className="fas fa-edit" />
                          </Button>
                          <Button variant="outline-danger" onClick={() => handleDelete(staff._id)}>
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

      {/* Add/Edit Modal */}
      <Modal show={showModal} onHide={closeModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingStaff ? 'Edit Staff' : 'Add Staff'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            {['name', 'email', 'mobile', 'address', 'profileImage'].map((field) => (
              <Form.Group key={field} className="mb-3">
                <Form.Label>{field.charAt(0).toUpperCase() + field.slice(1)}</Form.Label>
                <Form.Control
                  type={field === 'mobile' ? 'tel' : 'text'}
                  name={field}
                  value={formData[field]}
                  onChange={handleChange}
                  required={field !== 'address'}
                />
              </Form.Group>
            ))}
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select name="role" value={formData.role} onChange={handleChange} required>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select name="status" value={formData.status} onChange={handleChange} required>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Form.Select>
            </Form.Group>
            <div className="d-flex justify-content-end">
              <Button variant="secondary" onClick={closeModal} className="me-2">
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingStaff ? 'Update' : 'Add'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* View Modal */}
      <Modal show={showViewModal} onHide={closeViewModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Staff Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewingStaff && (
            <div className="row">
              <div className="col-md-4 text-center">
                <Image
                  src={viewingStaff.profileImage || 'default-profile-image.jpg'}
                  alt={viewingStaff.name}
                  fluid
                  roundedCircle
                  style={{
                    width: '200px',
                    height: '200px',
                    objectFit: 'cover',
                    border: '3px solid #dee2e6'
                  }}
                />
              </div>
              <div className="col-md-8">
                <h4>{viewingStaff.name}</h4>
                <hr />

                <div className="row mb-3">
                  <div className="col-md-6">
                    <p><strong>Email:</strong> {viewingStaff.email}</p>
                    <p><strong>Mobile:</strong> {viewingStaff.mobile}</p>
                    <p><strong>Address:</strong> {viewingStaff.address || 'Not specified'}</p>
                  </div>
                  <div className="col-md-6">
                    <p>
                      <strong>Role:</strong>
                      <Badge bg={getRoleBadge(viewingStaff.role)} className="ms-2">
                        {viewingStaff.role}
                      </Badge>
                    </p>
                    <p>
                      <strong>Status:</strong>
                      <Badge bg={getStatusBadge(viewingStaff.status)} className="ms-2">
                        {viewingStaff.status}
                      </Badge>
                    </p>
                    <p><strong>Created By:</strong> {viewingStaff.createdBy || 'System'}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <h5>Additional Information</h5>
                  <hr />
                  <p><strong>Staff ID:</strong> {viewingStaff._id}</p>
                  <p><strong>OTP Status:</strong> {viewingStaff.otp ? 'Generated' : 'Not generated'}</p>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeViewModal}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Staff;