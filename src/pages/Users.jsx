import React, { useEffect, useState } from 'react';
import { Button, Modal, Table, Row, Col, Form, Spinner, Alert, Pagination, Image, FormControl } from 'react-bootstrap';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as XLSX from 'xlsx';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    profileImage: '',
    documents: {
      aadharCard: { status: 'pending' },
      drivingLicense: { status: 'pending' }
    }
  });
  const [editingIndex, setEditingIndex] = useState(null);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailedUser, setDetailedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterField, setFilterField] = useState('name');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const usersPerPage = 10;

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('http://194.164.148.244:4062/api/admin/allusers');
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();

        // Reverse order (newest first)
        const reversed = (data.users || []).reverse();

        setUsers(reversed);
        setFilteredUsers(reversed);
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);


  useEffect(() => {
    if (searchTerm === '') {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => {
        const value = user[filterField] ? user[filterField].toString().toLowerCase() : '';
        return value.includes(searchTerm.toLowerCase());
      });
      setFilteredUsers(filtered);
      setCurrentPage(1);
    }
  }, [searchTerm, filterField, users]);

  const handleShow = async (user = null, index = null) => {
    try {
      setEditingIndex(index);

      // Fetch detailed user data before showing edit form
      const res = await fetch(`http://194.164.148.244:4062/api/users/get-user/${user.id}`);
      if (!res.ok) throw new Error('Failed to fetch user details');
      const data = await res.json();

      setFormData({
        name: data.user?.name || '',
        email: data.user?.email || '',
        mobile: data.user?.mobile || '',
        profileImage: data.user?.profileImage || '',
        documents: {
          aadharCard: {
            status: data.user?.documents?.aadharCard?.status || 'pending',
            url: data.user?.documents?.aadharCard?.url || ''
          },
          drivingLicense: {
            status: data.user?.documents?.drivingLicense?.status || 'pending',
            url: data.user?.documents?.drivingLicense?.url || ''
          }
        }
      });
      setShow(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDocumentStatusChange = (docType, status) => {
    setFormData(prev => ({
      ...prev,
      documents: {
        ...prev.documents,
        [docType]: {
          ...prev.documents[docType],
          status
        }
      }
    }));
  };

  const handleSave = async () => {
    try {
      if (editingIndex !== null) {
        const userId = users[editingIndex].id;
        const res = await fetch(`http://194.164.148.244:4062/api/admin/updateuser/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            mobile: formData.mobile,
            profileImage: formData.profileImage,
            aadharStatus: formData.documents.aadharCard.status,
            licenseStatus: formData.documents.drivingLicense.status
          }),
        });

        if (!res.ok) throw new Error('Failed to update user');

        const updatedUsers = [...users];
        updatedUsers[editingIndex] = {
          ...updatedUsers[editingIndex],
          name: formData.name,
          email: formData.email,
          mobile: formData.mobile,
          profileImage: formData.profileImage,
          documents: {
            aadharCard: {
              ...updatedUsers[editingIndex].documents?.aadharCard,
              status: formData.documents.aadharCard.status
            },
            drivingLicense: {
              ...updatedUsers[editingIndex].documents?.drivingLicense,
              status: formData.documents.drivingLicense.status
            }
          }
        };
        setUsers(updatedUsers);

        toast.success('User updated successfully!');
      }

      setShow(false);
      setEditingIndex(null);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (index) => {
    const user = filteredUsers[index];
    const confirmDelete = window.confirm(`Are you sure you want to delete user ${user.name}?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`http://194.164.148.244:4062/api/admin/deleteuser/${user.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete user');

      const updatedUsers = users.filter(u => u.id !== user.id);
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);

      toast.success('User deleted successfully!');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleViewDetails = async (userId) => {
    try {
      const res = await fetch(`http://194.164.148.244:4062/api/users/get-user/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch user details');
      const data = await res.json();
      setDetailedUser(data.user);
      setShowDetailsModal(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortConfig.key) {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
    }
    return 0;
  });

  const getDocStatusBadge = (status) => {
    if (!status) return 'secondary';
    switch (status.toLowerCase()) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusBadge = (status) => {
    if (!status) return 'secondary';
    switch (status.toLowerCase()) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'active': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  const getPaymentBadge = (paymentStatus) => {
    if (!paymentStatus) return 'secondary';
    switch (paymentStatus.toLowerCase()) {
      case 'paid': return 'success';
      case 'pending': return 'warning';
      default: return 'secondary';
    }
  };

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);

  const downloadExcel = async () => {
    try {
      setLoading(true);
      toast.info('Preparing Excel file with detailed user data...', { autoClose: 2000 });

      // Fetch detailed data for all users
      const detailedUsers = await Promise.all(
        users.map(async (user) => {
          try {
            const res = await fetch(`http://194.164.148.244:4062/api/users/get-user/${user.id}`);
            if (!res.ok) throw new Error(`Failed to fetch details for user ${user.id}`);
            const data = await res.json();
            return data.user;
          } catch (error) {
            console.error(error);
            return user; // Fallback to basic user data if detailed fetch fails
          }
        })
      );

      // Prepare Excel data
      const data = detailedUsers.map(user => ({
        'User ID': user.id,
        'Name': user.name || '-',
        'Email': user.email || '-',
        'Mobile': user.mobile || '-',
        'Profile Image': user.profileImage || '-',
        'Registered Date': user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-',
        'Aadhar Status': user.documents?.aadharCard?.status || 'Not uploaded',
        'Aadhar URL': user.documents?.aadharCard?.url || '-',
        'License Status': user.documents?.drivingLicense?.status || 'Not uploaded',
        'License URL': user.documents?.drivingLicense?.url || '-',
        'Total Bookings': user.myBookings?.length || 0,
        'Total Spent': user.myBookings?.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0) || 0,
        'Wallet Balance': user.totalWalletAmount || 0,
        'Last Booking Date': user.myBookings?.length > 0
          ? new Date(Math.max(...user.myBookings.map(b => new Date(b.rentalStartDate || 0))))?.toLocaleDateString()
          : '-'
      }));

      // Create worksheet and workbook
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Users");

      // Set column widths
      const wscols = [
        { wch: 20 }, // User ID
        { wch: 25 }, // Name
        { wch: 30 }, // Email
        { wch: 15 }, // Mobile
        { wch: 30 }, // Profile Image
        { wch: 15 }, // Registered Date
        { wch: 15 }, // Aadhar Status
        { wch: 50 }, // Aadhar URL
        { wch: 15 }, // License Status
        { wch: 50 }, // License URL
        { wch: 15 }, // Total Bookings
        { wch: 15 }, // Total Spent
        { wch: 15 }, // Wallet Balance
        { wch: 15 }  // Last Booking Date
      ];
      ws['!cols'] = wscols;

      // Add header style
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F81BD" } },
        alignment: { horizontal: "center" }
      };

      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = headerStyle;
      }

      // Export the file
      XLSX.writeFile(wb, "detailed_users_report.xlsx");
      toast.success('Excel file downloaded successfully!', { autoClose: 2000 });

    } catch (err) {
      console.error('Error generating Excel:', err);
      toast.error('Failed to generate Excel file', { autoClose: 2000 });
    } finally {
      setLoading(false);
    }
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


  return (
    <div className="p-3">
      <ToastContainer position="top-right" autoClose={2000} />
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Users Management</h2>
      </div>

      <Row className="mb-3">
        <Col md={3}>
          <Form.Select
            value={filterField}
            onChange={(e) => setFilterField(e.target.value)}
          >
            <option value="name">Search by Name</option>
            <option value="email">Search by Email</option>
            <option value="mobile">Search by Mobile</option>
            <option value="id">Search by ID</option>
          </Form.Select>
        </Col>
        <Col md={6}>
          <FormControl
            type="text"
            placeholder={`Search by ${filterField}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Col>
        <Col md={3} className="text-end">
          <Button
            variant="success"
            onClick={downloadExcel}
            className="ms-2"
          >
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
          <div className='table-responsive'>
            <Table striped bordered hover responsive>
              <thead>
                <tr className='table-header'>
                  <th >SNO</th>
                  <th>ID</th>
                  <th>Profile</th>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Email</th>
                  <th>Actions</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.length > 0 ? (
                  currentUsers.map((u, i) => (
                    <tr key={indexOfFirstUser + i}>
                      <td className="text-center">{indexOfFirstUser + i + 1}</td>
                      <td>{u.id?.slice(-6) || '-'}</td>
                      <td>
                        <Image
                          src={u.profileImage ? u.profileImage : "/profile.png"}
                          alt="profile"
                          roundedCircle
                          width="40"
                          height="40"
                        />
                      </td>
                      <td>{u.name || '-'}</td>
                      <td>{u.mobile || '-'}</td>
                      <td>{u.email || '-'}</td>
                      <td className="text-center align-middle">
                        <button
                          onClick={() => handleShow(u, users.findIndex(user => user.id === u.id))}
                          className="me-1 mb-1 mt-1 ms-1 btn btn-sm btn-outline-warning"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(filteredUsers.findIndex(user => user.id === u.id))}
                          className="btn btn-sm btn-outline-danger"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                      <td className="text-center align-middle">
                        <button
                          className="me-2 btn btn-sm btn-outline-info text-center"
                          onClick={() => handleViewDetails(u.id)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center">No users found</td>
                  </tr>
                )}
              </tbody>
            </Table>
            {renderPagination()}
          </div>
        </>
      )}

      {/* Edit User Modal */}
      <Modal show={show} onHide={() => setShow(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Edit User</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mobile</Form.Label>
                  <Form.Control
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Profile Image URL</Form.Label>
                  <Form.Control
                    value={formData.profileImage}
                    onChange={(e) => setFormData({ ...formData, profileImage: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <hr />

            <h5>Document Status</h5>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Aadhar Card Status</Form.Label>
                  <Form.Select
                    value={formData.documents.aadharCard.status}
                    onChange={(e) => handleDocumentStatusChange('aadharCard', e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Driving License Status</Form.Label>
                  <Form.Select
                    value={formData.documents.drivingLicense.status}
                    onChange={(e) => handleDocumentStatusChange('drivingLicense', e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className='text-primary'>User Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {detailedUser ? (
            <>
              <Row className="mb-3">
                <Col md={4} className="text-center">
                  <Image
                    src={detailedUser.profileImage || "/profile.png"}
                    alt="Profile"
                    fluid
                    style={{
                      width: "250px",
                      height: "250px",
                      objectFit: "cover",
                      borderRadius: "50%",
                      border: "2px solid #ccc"
                    }}
                  />
                </Col>
                <Col md={8}>
                  <p><strong>User ID: </strong> {detailedUser.id}</p>
                  <p><strong>Name: </strong>{detailedUser.name}</p>
                  <p><strong>Email:</strong> {detailedUser.email}</p>
                  <p><strong>Mobile:</strong> {detailedUser.mobile}</p>
                  <p><strong>Created At:</strong> {new Date(detailedUser.createdAt).toLocaleString()}</p>
                  <p><strong>Updated At:</strong> {new Date(detailedUser.updatedAt).toLocaleString()}</p>
                </Col>
              </Row>

              <hr />

              <h4 className='text-primary'>Documents</h4>
              <Row className="mb-4">
                <Col md={6} className="d-flex flex-column align-items-center text-center">
                  <p><strong>Aadhar Card:</strong></p>
                  {detailedUser.documents?.aadharCard?.url ? (
                    <>
                      <Image
                        src={detailedUser.documents.aadharCard.url}
                        style={{ maxWidth: "200px", height: "auto", marginBottom: "10px" }}
                        fluid
                        thumbnail
                      />
                      <p>Status:
                        <span className={`badge bg-${getDocStatusBadge(detailedUser.documents.aadharCard.status)} ms-2`}>
                          {detailedUser.documents.aadharCard.status}
                        </span>
                      </p>
                    </>
                  ) : (
                    <p>Not uploaded</p>
                  )}
                </Col>

                <Col md={6} className="d-flex flex-column align-items-center text-center">
                  <p><strong>Driving License:</strong></p>
                  {detailedUser.documents?.drivingLicense?.url ? (
                    <>
                      <Image
                        src={detailedUser.documents.drivingLicense.url}
                        style={{ maxWidth: "200px", height: "auto", marginBottom: "10px" }}
                        fluid
                        thumbnail
                      />
                      <p>Status:
                        <span className={`badge bg-${getDocStatusBadge(detailedUser.documents.drivingLicense.status)} ms-2`}>
                          {detailedUser.documents.drivingLicense.status}
                        </span>
                      </p>
                    </>
                  ) : (
                    <p>Not uploaded</p>
                  )}
                </Col>
              </Row>

              <hr />

              <h4 className='text-primary'>Bookings ({detailedUser.myBookings?.length || 0})</h4>
              <div className="table-responsive mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                <table className="table table-sm table-striped table-bordered">
                  <thead>
                    <tr className='table-header'>
                      <th>Car ID</th>
                      <th>Date</th>
                      <th>Deposit</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Price</th>
                      <th>Payment</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedUser.myBookings?.length > 0 ? (
                      detailedUser.myBookings.map((booking, idx) => (
                        <tr key={idx}>
                          <td>{booking.carId?.slice(-6)}</td>
                          <td>{booking.rentalStartDate}</td>
                          <td>{booking.deposit}</td>
                          <td>{booking.from}</td>
                          <td>{booking.to}</td>
                          <td>₹{booking.totalPrice}</td>
                          <td>
                            <span className={`badge bg-${getPaymentBadge(booking.paymentStatus)} text-white`}>
                              {booking.paymentStatus || "Unknown"}
                            </span>
                          </td>
                          <td>
                            <span className={`badge bg-${getStatusBadge(booking.status)} text-white`}>
                              {booking.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">No bookings found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <hr />

              <h4 className='text-primary'>Wallet Transactions (Total: ₹{detailedUser.totalWalletAmount || 0})</h4>
              <ul className="list-group mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {detailedUser.wallet?.length > 0 ? (
                  detailedUser.wallet.map((entry) => (
                    <li key={entry._id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <span className="fw-bold">{entry.type?.toUpperCase()}</span>: {entry.message}
                        <div className="text-muted small">{new Date(entry.date).toLocaleString()}</div>
                      </div>
                      <span className="badge bg-primary rounded-pill">₹{entry.amount}</span>
                    </li>
                  ))
                ) : (
                  <li className="list-group-item text-center">No wallet transactions</li>
                )}
              </ul>
            </>
          ) : (
            <div className="text-center">
              <Spinner animation="border" />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>

        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Users;