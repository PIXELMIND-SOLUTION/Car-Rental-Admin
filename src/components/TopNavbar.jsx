import React, { useEffect, useState } from 'react';
import { Navbar, Container, Nav, Badge, Dropdown } from 'react-bootstrap';
import { BellFill } from 'react-bootstrap-icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TopNavbar = ({ onToggleSidebar }) => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  const storedUser = sessionStorage.getItem('adminUser');
  const sessionUser = storedUser ? JSON.parse(storedUser) : null;
  const name = sessionUser?.name;

  // Fetch notifications from API
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get('https://varahibackend.varahiselfdrivecars.com/api/admin/allnotifications');
        if (response.data?.notifications) {
          setNotifications(response.data.notifications);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  return (
    <Navbar
      bg="light"
      expand="lg"
      className="shadow-sm px-3"
      sticky="top"
      collapseOnSelect
    >
      <Container fluid className="d-flex justify-content-between align-items-center">
        {/* Sidebar toggle button */}
        <button
          className="navbar-toggler me-2"
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Brand name */}
        <Navbar.Brand className="fw-bold text-primary m-0">
          Admin Panel
        </Navbar.Brand>

        {/* Toggle for collapse */}
        <Navbar.Toggle aria-controls="admin-navbar-nav" />

        <Navbar.Collapse id="admin-navbar-nav" className="justify-content-end">
          <Nav className="align-items-center gap-3">
            {/* Notifications Dropdown */}
            <Dropdown align="end">
              <Dropdown.Toggle
                variant="light"
                className="position-relative border-0"
                id="notification-dropdown"
              >
                <BellFill size={20} className="text-primary" />
                {notifications.length > 0 && (
                  <Badge
                    bg="danger"
                    pill
                    className="position-absolute top-0 start-100 translate-middle"
                  >
                    {notifications.length}
                  </Badge>
                )}
              </Dropdown.Toggle>

              <Dropdown.Menu className="dropdown-menu-end p-0" style={{ width: '300px' }}>
                <Dropdown.Header className="bg-light px-3 py-2">Notifications</Dropdown.Header>
                {notifications.length === 0 ? (
                  <Dropdown.ItemText className="text-muted px-3 py-2">No notifications</Dropdown.ItemText>
                ) : (
                  <>
                    <div
                      style={{
                        maxHeight: '250px',
                        overflowY: 'auto',
                      }}
                    >
                      {notifications.slice(0, 5).map((notif) => (
                        <Dropdown.ItemText
                          key={notif._id}
                          className="px-3 py-2 border-bottom small text-wrap"
                        >
                          {notif.message}
                        </Dropdown.ItemText>
                      ))}
                    </div>
                    <Dropdown.Divider />
                    <Dropdown.Item
                      onClick={() => navigate('/admin/notifications')}
                      className="text-center text-primary fw-semibold"
                    >
                      View All
                    </Dropdown.Item>

                  </>
                )}
              </Dropdown.Menu>
            </Dropdown>

            {/* User greeting */}
            <span className="navbar-text fw-semibold text-secondary">
              Welcome, {name}
            </span>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default TopNavbar;
