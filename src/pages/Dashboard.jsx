import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Spinner, Row, Col, Container, Card, Table, Button, Badge } from 'react-bootstrap';
import { FaUsers, FaCarSide, FaClipboardList, FaRupeeSign, FaUserTie } from 'react-icons/fa';
import { Bar, Pie, Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  PointElement,
  LineElement,
} from 'chart.js';


// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  PointElement,
  LineElement
);

const Dashboard = () => {
  const [userCount, setUserCount] = useState(0);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [bookingStats, setBookingStats] = useState({
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
    active: 0
  });
  const [paymentStats, setPaymentStats] = useState({ paid: 0, pending: 0 });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 5;
  const [vehicleTypes, setVehicleTypes] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [userRes, vehicleRes, bookingRes, staffRes] = await Promise.all([
          axios.get('https://varahibackend.varahiselfdrivecars.com/api/admin/allusers'),
          axios.get('https://varahibackend.varahiselfdrivecars.com/api/car/get-cars'),
          axios.get('https://varahibackend.varahiselfdrivecars.com/api/staff/allbookingsforadmin'),
          axios.get('https://varahibackend.varahiselfdrivecars.com/api/admin/getallstaffs'),
        ]);

        const users = userRes.data.users || [];
        const vehicles = vehicleRes.data.cars || [];
        const bookings = bookingRes.data.bookings || [];
        const staffs = staffRes.data.staff || [];

        setUserCount(users.length);
        setVehicleCount(vehicleRes.data.total);
        setStaffCount(staffs.length);

        const statusCounts = {
          pending: 0,
          confirmed: 0,
          cancelled: 0,
          completed: 0,
          active: 0
        };
        
        const paymentCounts = { paid: 0, pending: 0 };
        const vehicleTypeCounts = {};

        bookings.forEach((booking) => {
          // Count booking statuses
          const status = booking.status?.toLowerCase();
          if (status && statusCounts.hasOwnProperty(status)) {
            statusCounts[status]++;
          }

          // Count payment statuses
          const paymentStatus = booking.paymentStatus?.toLowerCase();
          if (paymentStatus === 'paid') paymentCounts.paid++;
          else if (paymentStatus === 'pending') paymentCounts.pending++;
        });

        vehicles.forEach(car => {
          const type = car.type || 'Unknown';
          vehicleTypeCounts[type] = (vehicleTypeCounts[type] || 0) + 1;
        });

        setBookingStats(statusCounts);
        setPaymentStats(paymentCounts);
        setVehicleTypes(vehicleTypeCounts);
        setRecentBookings(bookings.slice(0, 10));
        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const bookingCount = Object.values(bookingStats).reduce((a, b) => a + b, 0);

  // Pagination logic
  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = recentBookings.slice(indexOfFirstBooking, indexOfLastBooking);
  const totalPages = Math.ceil(recentBookings.length / bookingsPerPage);

  const handlePrevPage = () => currentPage > 1 && setCurrentPage(prev => prev - 1);
  const handleNextPage = () => currentPage < totalPages && setCurrentPage(prev => prev + 1);

  // Chart data configurations
  const barData = {
    labels: ['Users', 'Staff', 'Vehicles', 'Bookings'],
    datasets: [{
      label: 'Count',
      data: [userCount, staffCount, vehicleCount, bookingCount],
      backgroundColor: ['#6f42c1', '#20c997', '#6610f2', '#fd7e14'],
      borderRadius: 8,
    }],
  };

  const pieData = {
    labels: ['Paid', 'Pending'],
    datasets: [{
      label: 'Payment Status',
      data: [paymentStats.paid, paymentStats.pending],
      backgroundColor: ['#28a745', '#ffc107'],
      borderWidth: 1,
    }],
  };

  const statusPieData = {
    labels: ['Pending', 'Confirmed', 'Active', 'Completed', 'Cancelled'],
    datasets: [{
      label: 'Booking Status',
      data: [
        bookingStats.pending,
        bookingStats.confirmed,
        bookingStats.active,
        bookingStats.completed,
        bookingStats.cancelled
      ],
      backgroundColor: [
        '#ffc107', // pending - yellow
        '#17a2b8', // confirmed - teal
        '#007bff', // active - blue
        '#28a745', // completed - green
        '#dc3545'  // cancelled - red
      ],
      borderWidth: 1,
    }],
  };

  const lineData = {
    labels: recentBookings.map((_, i) => `Booking ${i + 1}`),
    datasets: [{
      label: 'Total Price (₹)',
      data: recentBookings.map(b => b.totalPrice || 0),
      fill: false,
      borderColor: '#6f42c1',
      backgroundColor: '#6f42c1',
      tension: 0.3,
    }],
  };

  const doughnutData = {
    labels: ['Users', 'Staff', 'Vehicles', 'Bookings'],
    datasets: [{
      label: 'System Distribution',
      data: [userCount, staffCount, vehicleCount, bookingCount],
      backgroundColor: ['#6f42c1', '#20c997', '#6610f2', '#fd7e14'],
      borderWidth: 1,
    }],
  };

  // Common chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 20,
        }
      },
    },
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'info';
      case 'active':
        return 'primary';
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getPaymentBadge = (paymentStatus) => {
    switch (paymentStatus?.toLowerCase()) {
      case 'paid':
        return 'success';
      case 'pending':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  return (
    <Container fluid className="px-4 py-3">
      <h2 className="mb-4 fw-bold text-primary text-center">Admin Dashboard</h2>

      {/* Summary Cards */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-3 d-flex align-items-center">
              <div className="bg-primary bg-opacity-10 p-3 rounded me-3">
                <FaUsers size={24} className="text-primary" />
              </div>
              <div>
                <Card.Title className="text-muted mb-1">Total Users</Card.Title>
                <h3 className="mb-0">{userCount}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-3 d-flex align-items-center">
              <div className="bg-success bg-opacity-10 p-3 rounded me-3">
                <FaUserTie size={24} className="text-success" />
              </div>
              <div>
                <Card.Title className="text-muted mb-1">Total Staff</Card.Title>
                <h3 className="mb-0">{staffCount}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-3 d-flex align-items-center">
              <div className="bg-info bg-opacity-10 p-3 rounded me-3">
                <FaCarSide size={24} className="text-info" />
              </div>
              <div>
                <Card.Title className="text-muted mb-1">Total Vehicles</Card.Title>
                <h3 className="mb-0">{vehicleCount}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-3 d-flex align-items-center">
              <div className="bg-warning bg-opacity-10 p-3 rounded me-3">
                <FaClipboardList size={24} className="text-warning" />
              </div>
              <div>
                <Card.Title className="text-muted mb-1">Total Bookings</Card.Title>
                <h3 className="mb-0">{bookingCount}</h3>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts Row 1 */}
      <Row className="g-4 mb-4">
        <Col xl={6}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body>
              <Card.Title className="fw-bold mb-3">Summary Overview</Card.Title>
              <div style={{ height: '300px' }}>
                <Bar
                  data={barData}
                  options={{
                    ...chartOptions,
                    plugins: {
                      legend: { display: false }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        grid: {
                          drawBorder: false
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        }
                      }
                    }
                  }}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={6}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body>
              <Card.Title className="fw-bold mb-3">Booking Status</Card.Title>
              <div style={{ height: '300px' }}>
                {loading ? (
                  <div className="d-flex justify-content-center align-items-center h-100">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : (
                  <Pie data={statusPieData} options={chartOptions} />
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row className="g-4 mb-4">
        <Col xl={6}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body>
              <Card.Title className="fw-bold mb-3">Booking Price Trend</Card.Title>
              <div style={{ height: '300px' }}>
                <Line
                  data={lineData}
                  options={{
                    ...chartOptions,
                    scales: {
                      y: {
                        beginAtZero: false,
                        grid: {
                          drawBorder: false
                        }
                      },
                      x: {
                        grid: {
                          display: false
                        }
                      }
                    }
                  }}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xl={6}>
          <Card className="shadow-sm border-0 h-100">
            <Card.Body>
              <Card.Title className="fw-bold mb-3">Payment Status</Card.Title>
              <div style={{ height: '300px' }}>
                <Doughnut data={pieData} options={chartOptions} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Bookings */}
      <Row>
        <Col>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title className="fw-bold mb-0">Recent Bookings</Card.Title>
                <Button variant="outline-primary" size="sm" onClick={() => navigate('/admin/bookings')}>
                  View All
                </Button>
              </div>

              {loading ? (
                <div className="d-flex justify-content-center py-4">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : (
                <>
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>ID</th>
                          <th>User</th>
                          <th>Vehicle</th>
                          <th>Dates</th>
                          <th>Location</th>
                          <th>Price</th>
                          <th>Status</th>
                          <th>Payment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentBookings.map((booking) => (
                          <tr key={booking._id}>
                            <td className="text-muted">{booking._id?.slice(-6)}</td>
                            <td>{booking.userId?.name || 'N/A'}</td>
                            <td>{booking.car?.carName || 'N/A'}</td>
                            <td>
                              <small>{new Date(booking.rentalStartDate).toLocaleDateString()}</small>
                              <span className="mx-1">-</span>
                              <small>{new Date(booking.rentalEndDate).toLocaleDateString()}</small>
                            </td>
                            <td>{booking.pickupLocation || 'N/A'}</td>
                            <td className="text-success">
                              <FaRupeeSign size={12} className="me-1" />
                              {booking.totalPrice}
                            </td>
                            <td>
                              <Badge bg={getStatusBadge(booking.status)} className="text-capitalize">
                                {booking.status || 'N/A'}
                              </Badge>
                            </td>
                            <td>
                              <Badge bg={getPaymentBadge(booking.paymentStatus)} className="text-capitalize">
                                {booking.paymentStatus || 'N/A'}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <button
                      className={`btn ${currentPage === 1 ? `btn-outline-secondary` : `btn-outline-primary`}`}
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <button
                      className={`btn ${currentPage === totalPages || totalPages === 0 ? `btn-outline-secondary` : `btn-outline-primary`}`}
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages || totalPages === 0}
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;