import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Container, Pagination, Spinner, Button } from 'react-bootstrap';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const notificationsPerPage = 10;

  // Fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axios.get('https://varahibackend.varahiselfdrivecars.com/api/admin/allnotifications');
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this notification?")) return;
    try {
      await axios.delete(`https://varahibackend.varahiselfdrivecars.com/api/admin/deletenotification/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
      alert("Failed to delete notification.");
    }
  };

  // Pagination logic
  const indexOfLast = currentPage * notificationsPerPage;
  const indexOfFirst = indexOfLast - notificationsPerPage;
  const currentNotifications = notifications.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(notifications.length / notificationsPerPage);

  const renderPagination = () => {
    if (!totalPages || totalPages <= 1) return null;

    const pages = [];
    const pageSet = new Set();

    // Always include first and last pages
    pageSet.add(1);
    if (totalPages > 1) pageSet.add(totalPages);

    // Add current page and neighbors
    if (currentPage > 1) pageSet.add(currentPage - 1);
    pageSet.add(currentPage);
    if (currentPage < totalPages) pageSet.add(currentPage + 1);

    // Sort pages for consistent rendering
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
      <h3 className="mb-4 text-dark fw-bold">Notifications</h3>

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
                <th>Message</th>
                <th>Type</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentNotifications.length > 0 ? (
                currentNotifications.map((notif, index) => (
                  <tr key={notif._id}>
                    <td>{indexOfFirst + index + 1}</td>
                    <td>{notif.message}</td>
                    <td className="text-capitalize">{notif.type}</td>
                    <td>{new Date(notif.createdAt).toLocaleString()}</td>
                    <td className="text-center">
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => handleDelete(notif._id)}
                      >
                        <i className="fas fa-trash-alt"></i>
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center text-muted">
                    No notifications found.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          {renderPagination()}
        </>
      )}
    </Container>
  );
};

export default Notifications;
