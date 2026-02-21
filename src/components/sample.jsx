import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Spinner, Row, Col, Container, Card, Table, Button } from 'react-bootstrap';
import { FaUsers, FaCarSide, FaClipboardList } from 'react-icons/fa';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
);

const Dashboard = () => {
  const [userCount, setUserCount] = useState(0);
  const [vehicleCount, setVehicleCount] = useState(0);
  const [bookingStats, setBookingStats] = useState({
    paid: 0,
    pending: 0,
  });
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const bookingsPerPage = 5;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [usersRes, vehiclesRes, bookingsRes] = await Promise.all([
          axios.get('https://varahibackend.varahiselfdrivecars.com/api/admin/allusers'),
          axios.get('https://varahibackend.varahiselfdrivecars.com/api/car/get-cars'),
          axios.get('https://varahibackend.varahiselfdrivecars.com/api/staff/allbookings')
        ]);

        const userData = usersRes.data.users;
        const vehicleData = vehiclesRes.data.cars;
        const bookings = bookingsRes.data.bookings;

        if (!Array.isArray(bookings)) {
          throw new Error("Invalid booking data format");
        }

        setUserCount(userData?.length || 0);
        setVehicleCount(vehicleData?.length || 0);

        const statusCounts = {
          paid: 0,
          pending: 0,
        };

        bookings.forEach((booking) => {
          const paymentStatus = booking.paymentStatus?.toLowerCase();
          if (paymentStatus === 'paid') statusCounts.paid++;
          else if (paymentStatus === 'pending') statusCounts.pending++;
        });

        setBookingStats(statusCounts);
        setRecentBookings(bookings.slice(0, 10)); // Get first 10 bookings for recent
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const bookingCount = bookingStats.paid + bookingStats.pending;

  // Pagination logic for recent bookings
  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = recentBookings.slice(indexOfFirstBooking, indexOfLastBooking);
  const totalPages = Math.ceil(recentBookings.length / bookingsPerPage);

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };

  const barData = {
    labels: ['Users', 'Vehicles', 'Bookings'],
    datasets: [
      {
        label: 'Count',
        data: [userCount, vehicleCount, bookingCount],
        backgroundColor: ['#A66CFF', '#9C9EFE', '#A66CFF'],
        borderRadius: 10,
      },
    ],
  };

  const pieData = {
    labels: ['Paid', 'Pending'],
    datasets: [
      {
        label: 'Payment Status',
        data: [
          bookingStats.paid,
          bookingStats.pending,
        ],
        backgroundColor: ['#198754', '#ffc107'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <Container fluid className="p-4" style={{ background: 'linear-gradient(to bottom, #f8f9fa, #e9ecef)' }}>
      <h2 className="mb-4 fw-bold">Admin Dashboard</h2>

      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card className="text-white h-100 shadow" style={{ backgroundColor: '#A66CFF' }}>
            <Card.Body className="d-flex align-items-center justify-content-between">
              <div>
                <Card.Title>Users</Card.Title>
                <h3>{userCount}</h3>
              </div>
              <FaUsers size={40} />
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="text-white h-100 shadow" style={{ backgroundColor: '#9C9EFE' }}>
            <Card.Body className="d-flex align-items-center justify-content-between">
              <div>
                <Card.Title>Vehicles</Card.Title>
                <h3>{vehicleCount}</h3>
              </div>
              <FaCarSide size={40} />
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="text-white h-100 shadow" style={{ backgroundColor: '#A66CFF' }}>
            <Card.Body className="d-flex align-items-center justify-content-between">
              <div>
                <Card.Title>Bookings</Card.Title>
                <h3>{bookingCount}</h3>
              </div>
              <FaClipboardList size={40} />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6} className="mb-4">
          <div className="p-3 bg-white shadow rounded h-100" style={{ minHeight: '300px' }}>
            <h5 className="mb-3 fw-bold">Summary Bar Chart</h5>
            <Bar
              data={barData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 20,
                    },
                  },
                },
              }}
            />
          </div>
        </Col>

        <Col md={6} className="mb-4">
          <div className="p-3 bg-white shadow rounded h-100" style={{ minHeight: '300px', position: 'relative' }}>
            <h5 className="mb-3 fw-bold">Payment Status Pie Chart</h5>
            {loading ? (
              <div className="d-flex justify-content-center align-items-center h-100">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : (
              <div style={{ height: 'calc(100% - 40px)' }}>
                <Pie
                  data={pieData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* Recent Bookings Section */}
      <Row className="mt-4">
        <Col>
          <Card className="shadow">
            <Card.Body>
              <Card.Title className="fw-bold">Recent Bookings</Card.Title>
              {loading ? (
                <div className="d-flex justify-content-center py-4">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : (
                <>
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th>Id</th>
                        <th>User</th>
                        <th>Car</th>
                        <th>Dates</th>
                        <th>Pickup Location</th>
                        <th>Timing</th>
                        <th>Price</th>
                        <th>Payment Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentBookings.map((booking) => (
                        <tr key={booking._id}>
                          <td>{booking._id ? booking._id.slice(0, 6) : 'N/A'}</td>
                          <td>{booking.userId?.name || 'N/A'}</td>
                          <td>{booking.car?.carName || 'N/A'}</td>
                          <td>{booking.rentalStartDate} to {booking.rentalEndDate}</td>
                          <td>{booking.pickupLocation || 'N/A'}</td>
                          <td>{booking.from || 'N/A'} to {booking.to || 'N/A'}</td>
                          <td>₹{booking.totalPrice}</td>
                          <td>
                            <span className={`badge ${
                              booking.paymentStatus === 'Paid' ? 'bg-success' :
                              'bg-warning'
                            }`}>
                              {booking.paymentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  {/* Pagination */}
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <Button 
                      variant="outline-primary" 
                      onClick={handlePrevPage} 
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span>Page {currentPage} of {totalPages}</span>
                    <Button 
                      variant="outline-primary" 
                      onClick={handleNextPage} 
                      disabled={currentPage === totalPages || totalPages === 0}
                    >
                      Next
                    </Button>
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
