import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Table, Button, Modal, Form, Pagination, Badge, Row, Col, InputGroup, Card } from "react-bootstrap";
import { ToastContainer, toast } from 'react-toastify';
import * as XLSX from "xlsx";
import 'react-toastify/dist/ReactToastify.css';

// Razorpay configuration
const RAZORPAY_KEY_ID = 'rzp_live_R7WEc7UNXkN075';

// Load Razorpay script dynamically
const loadRazorpayScript = (src) => {
  return new Promise((resolve) => {
    // Check if script is already loaded
    if (window.Razorpay) {
      console.log('Razorpay SDK already loaded');
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.onload = () => {
      console.log('Razorpay SDK loaded successfully');
      resolve(true);
    };
    script.onerror = (error) => {
      console.error('Failed to load Razorpay SDK:', error);
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterField, setFilterField] = useState("name");
  const [searchQuery, setSearchQuery] = useState("");
  const [replacedCarDetails, setReplacedCarDetails] = useState({ oldCar: null, newCar: null });
  const [extensionData, setExtensionData] = useState({
    extendDeliveryDate: "",
    extendDeliveryTime: "",
    hours: "",
    amount: ""
  });
  const [replaceData, setReplaceData] = useState({
    newCarId: "",
    transactionId: "",
    amount: "",
    staffRefund: "",
    paymentType: "none" // "none", "partial", "full"
  });
  const [cars, setCars] = useState([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isReplacingCar, setIsReplacingCar] = useState(false);
  const bookingsPerPage = 10;

  useEffect(() => {
    fetchBookings();
    fetchCars();
  }, []);

  const filterBookings = useCallback(() => {
    const filtered = bookings.filter((booking) => {
      const fieldVal = (() => {
        switch (filterField) {
          case "id":
            return booking._id || '';
          case "name":
            return booking.userId?.name || '';
          case "email":
            return booking.userId?.email || '';
          case "pickuplocation":
            return booking.pickupLocation || '';
          case "status":
            return booking.status || '';
          case "paymentstatus":
            return booking.paymentStatus || '';
          case "rentaldate":
            return booking.rentalStartDate ? new Date(booking.rentalStartDate).toLocaleDateString() : '';
          case "replaced":
            // Search for bookings with car replacement
            const hasReplacement = booking.carReplacementHistory && 
              booking.carReplacementHistory.newCarId;
            return hasReplacement ? "Yes" : "No";
          default:
            return "";
        }
      })();
      return fieldVal.toString().toLowerCase().includes(searchQuery.toLowerCase());
    });
    setFilteredBookings(filtered);
    setCurrentPage(1);
  }, [bookings, searchQuery, filterField]);

  useEffect(() => {
    filterBookings();
  }, [filterBookings]);

  const fetchBookings = async () => {
    try {
      const response = await axios.get("https://varahibackend.varahiselfdrivecars.com/api/staff/allbookings");
      if (response.data?.bookings) {
        // Reverse order (newest first)
        const reversed = (response.data.bookings || []).reverse();
        setBookings(reversed);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to fetch bookings.");
    }
  };

  const fetchCars = async () => {
    try {
      const response = await axios.get("https://varahibackend.varahiselfdrivecars.com/api/car/get-cars");
      if (response.data?.cars) {
        setCars(response.data.cars);
      }
    } catch (error) {
      console.error("Error fetching cars:", error);
      toast.error("Failed to fetch available cars.");
    }
  };

  const fetchCarDetails = async (carId) => {
    if (!carId) return null;
    try {
      const response = await axios.get(`https://varahibackend.varahiselfdrivecars.com/api/car/getcar/${carId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching car details for ${carId}:`, error);
      return null;
    }
  };

  const fetchBookingDetails = async (bookingId) => {
    try {
      // Find the booking in our existing bookings array first to get delayedPaymentProof
      const existingBooking = bookings.find(b => b._id === bookingId);

      // Then fetch the detailed booking info
      const response = await axios.get(`https://varahibackend.varahiselfdrivecars.com/api/staff/singlebooking/${bookingId}`);

      if (response.data?.booking) {
        // Combine the data from both sources
        const combinedBooking = {
          ...response.data.booking,
          delayedPaymentProof: existingBooking?.delayedPaymentProof
        };

        setBookingDetails(combinedBooking);

        // Fetch car details if there's replacement history
        if (combinedBooking.carReplacementHistory) {
          const oldCarId = combinedBooking.carReplacementHistory.oldCarId?._id;
          const newCarId = combinedBooking.carReplacementHistory.newCarId?._id;

          const [oldCarDetails, newCarDetails] = await Promise.all([
            oldCarId ? fetchCarDetails(oldCarId) : null,
            newCarId ? fetchCarDetails(newCarId) : null
          ]);

          setReplacedCarDetails({
            oldCar: oldCarDetails || combinedBooking.carReplacementHistory.oldCarId,
            newCar: newCarDetails || combinedBooking.carReplacementHistory.newCarId
          });
        } else {
          setReplacedCarDetails({ oldCar: null, newCar: null });
        }

        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error("Error fetching booking details:", error);
      toast.error("Failed to fetch booking details.");
    }
  };

  const handleEdit = (booking) => {
    setSelectedBooking({
      ...booking,
      editedAmount: booking.totalPrice // Initialize edited amount with current total price
    });
    setShowEditModal(true);
  };

  const handleExtend = (booking) => {
    setSelectedBooking(booking);
    // Reset extension data
    setExtensionData({
      extendDeliveryDate: "",
      extendDeliveryTime: "",
      hours: "",
      amount: ""
    });
    setShowExtendModal(true);
  };

  const handleReplace = (booking) => {
    setSelectedBooking(booking);
    // Reset replace data
    setReplaceData({
      newCarId: "",
      transactionId: "",
      amount: "",
      staffRefund: "",
      paymentType: "none"
    });
    setShowReplaceModal(true);
  };

  const initRazorpayPayment = async () => {
  try {
    if (!selectedBooking) {
      toast.error("No booking selected");
      return;
    }

    // FIX: Extract userId from selectedBooking.userId._id
    const userId = selectedBooking.userId?._id;
    const bookingId = selectedBooking._id;

    if (!userId) {
      toast.error("User ID not found in booking data");
      return;
    }

    // Validate required fields
    if (!extensionData.amount || parseFloat(extensionData.amount) <= 0) {
      toast.error("Please enter a valid extension amount");
      return;
    }

    // Validate date/time or hours
    if (!extensionData.hours && (!extensionData.extendDeliveryDate || !extensionData.extendDeliveryTime)) {
      toast.error("Please provide either hours or date/time for extension");
      return;
    }

    setIsProcessingPayment(true);
    toast.info("Initializing payment gateway...", { autoClose: 1500 });

    // Load Razorpay script if not already loaded
    const isScriptLoaded = await loadRazorpayScript('https://checkout.razorpay.com/v1/checkout.js');
    
    if (!isScriptLoaded) {
      toast.error("Payment gateway failed to load. Please check your connection and try again.");
      setIsProcessingPayment(false);
      return;
    }

    // Wait a moment to ensure Razorpay is fully loaded
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if Razorpay is available
    if (!window.Razorpay) {
      toast.error("Payment service is temporarily unavailable. Please refresh the page and try again.");
      setIsProcessingPayment(false);
      return;
    }

    // Create Razorpay order options
    const amountInPaise = Math.round(parseFloat(extensionData.amount) * 100); // Convert to paise
    const currentDate = new Date().toLocaleDateString('en-IN');

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: amountInPaise,
      currency: "INR",
      name: "Car Rental Extension",
      description: `Booking Extension - ${bookingId.slice(-6)}`,
      handler: async (response) => {
        // Payment successful, now extend the booking
        await handleExtensionPaymentSuccess(response.razorpay_payment_id);
      },
      prefill: {
        name: selectedBooking.userId?.name || "",
        email: selectedBooking.userId?.email || "",
        contact: selectedBooking.userId?.mobile || ""
      },
      notes: {
        bookingId: bookingId,
        userId: userId, // Now passing correct userId string
        extensionDate: currentDate,
        extensionType: extensionData.hours ? 'hours' : 'datetime',
        value: extensionData.hours || `${extensionData.extendDeliveryDate} ${extensionData.extendDeliveryTime}`
      },
      theme: {
        color: "#3399cc"
      },
      modal: {
        ondismiss: function() {
          console.log('Checkout form closed by user');
          if (!isProcessingPayment) {
            toast.info("Payment was cancelled");
          }
          setIsProcessingPayment(false);
        }
      }
    };

    // Initialize Razorpay
    const razorpayInstance = new window.Razorpay(options);
    
    razorpayInstance.on('payment.failed', function (response) {
      console.error('Payment failed:', response.error);
      const errorDescription = response.error?.description || response.error?.error?.description || 'Payment failed';
      toast.error(`Payment Failed: ${errorDescription}`);
      setIsProcessingPayment(false);
    });

    razorpayInstance.open();
    
  } catch (error) {
    console.error("Error initializing Razorpay:", error);
    toast.error("Failed to initialize payment. Please try again.");
    setIsProcessingPayment(false);
  }
};

  const handleExtensionPaymentSuccess = async (paymentId) => {
  try {
    if (!selectedBooking) return;

    // FIX: Extract userId from selectedBooking.userId._id
    const userId = selectedBooking.userId?._id;
    const bookingId = selectedBooking._id;
    
    if (!userId) {
      toast.error("User ID not found in booking data");
      setIsProcessingPayment(false);
      return;
    }

    // Prepare extension data with transaction ID
    const extensionPayload = {
      ...extensionData,
      transactionId: paymentId
    };

    console.log("Sending extension request:", {
      userId,
      bookingId,
      payload: extensionPayload
    });

    // Make API call to extend booking
    const response = await axios.put(
      `https://varahibackend.varahiselfdrivecars.com/api/users/extendbookings/${userId}/${bookingId}`,
      extensionPayload
    );

    if (response.data.message) {
      toast.success(response.data.message);
      setShowExtendModal(false);
      fetchBookings(); // Refresh bookings list
      
      // Reset extension data
      setExtensionData({
        extendDeliveryDate: "",
        extendDeliveryTime: "",
        hours: "",
        amount: ""
      });
    }
  } catch (error) {
    console.error("Error extending booking:", error);
    const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to extend booking after payment";
    toast.error(`Error: ${errorMessage}`);
  } finally {
    setIsProcessingPayment(false);
  }
};

  const handleReplaceCar = async () => {
  try {
    if (!selectedBooking) {
      toast.error("No booking selected");
      return;
    }

    const userId = selectedBooking.userId?._id;
    const bookingId = selectedBooking._id;
    
    if (!userId) {
      toast.error("User ID not found in booking data");
      return;
    }

    if (!replaceData.newCarId) {
      toast.error("Please select a new car");
      return;
    }

    setIsReplacingCar(true);

    // Prepare payload based on payment type
    let payload = {
      bookingId,
      newCarId: replaceData.newCarId
    };

    // Add staff refund if provided
    if (replaceData.staffRefund) {
      payload.staffRefund = parseFloat(replaceData.staffRefund);
      
      // If amount and transaction ID also provided, add them
      if (replaceData.amount && replaceData.transactionId) {
        payload.amount = parseFloat(replaceData.amount);
        payload.transactionId = replaceData.transactionId;
      }
    } else {
      // No staff refund, check if payment is required
      // if (replaceData.requirePayment && (!replaceData.transactionId || !replaceData.amount)) {
      //   toast.error("Transaction ID and Amount are required for payment");
      //   setIsReplacingCar(false);
      //   return;
      // }
      
      // Add payment details if required
      if (replaceData.requirePayment && replaceData.transactionId && replaceData.amount) {
        payload.transactionId = replaceData.transactionId;
        payload.amount = parseFloat(replaceData.amount);
      }
    }

    console.log("Sending car replacement request:", {
      userId,
      payload
    });

    // Make API call to replace car
    const response = await axios.put(
      `https://varahibackend.varahiselfdrivecars.com/api/users/replace-car/${userId}`,
      payload
    );

    if (response.data.message) {
      toast.success(response.data.message);
      setShowReplaceModal(false);
      fetchBookings(); // Refresh bookings list
      
      // Reset replace data
      setReplaceData({
        newCarId: "",
        transactionId: "",
        amount: "",
        staffRefund: "",
        requirePayment: false
      });
    }
  } catch (error) {
    console.error("Error replacing car:", error);
    const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to replace car";
    toast.error(`Error: ${errorMessage}`);
  } finally {
    setIsReplacingCar(false);
  }
};

// New function to handle payment with Razorpay
const initReplaceCarPayment = async () => {
  try {
    if (!selectedBooking) {
      toast.error("No booking selected");
      return;
    }

    if (!replaceData.amount || parseFloat(replaceData.amount) <= 0) {
      toast.error("Please enter a valid amount for payment");
      return;
    }

    setIsProcessingPayment(true);
    toast.info("Initializing payment gateway...", { autoClose: 1500 });

    // Load Razorpay script if not already loaded
    const isScriptLoaded = await loadRazorpayScript('https://checkout.razorpay.com/v1/checkout.js');
    
    if (!isScriptLoaded) {
      toast.error("Payment gateway failed to load. Please check your connection and try again.");
      setIsProcessingPayment(false);
      return;
    }

    // Wait a moment to ensure Razorpay is fully loaded
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if Razorpay is available
    if (!window.Razorpay) {
      toast.error("Payment service is temporarily unavailable. Please refresh the page and try again.");
      setIsProcessingPayment(false);
      return;
    }

    const bookingId = selectedBooking._id;
    const amountInPaise = Math.round(parseFloat(replaceData.amount) * 100);
    const currentDate = new Date().toLocaleDateString('en-IN');

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: amountInPaise,
      currency: "INR",
      name: "Car Replacement Payment",
      description: `Car Replacement - Booking ${bookingId.slice(-6)}`,
      handler: async (response) => {
        // Payment successful, now set transaction ID and proceed with replacement
        setReplaceData(prev => ({
          ...prev,
          transactionId: response.razorpay_payment_id
        }));
        
        // Wait a moment for state to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Now proceed with car replacement
        await handleReplaceCar();
      },
      prefill: {
        name: selectedBooking.userId?.name || "",
        email: selectedBooking.userId?.email || "",
        contact: selectedBooking.userId?.mobile || ""
      },
      notes: {
        bookingId: bookingId,
        purpose: "car_replacement",
        date: currentDate
      },
      theme: {
        color: "#3399cc"
      },
      modal: {
        ondismiss: function() {
          console.log('Checkout form closed by user');
          toast.info("Payment was cancelled");
          setIsProcessingPayment(false);
        }
      }
    };

    // Initialize Razorpay
    const razorpayInstance = new window.Razorpay(options);
    
    razorpayInstance.on('payment.failed', function (response) {
      console.error('Payment failed:', response.error);
      const errorDescription = response.error?.description || response.error?.error?.description || 'Payment failed';
      toast.error(`Payment Failed: ${errorDescription}`);
      setIsProcessingPayment(false);
    });

    razorpayInstance.open();
    
  } catch (error) {
    console.error("Error initializing Razorpay for replacement:", error);
    toast.error("Failed to initialize payment. Please try again.");
    setIsProcessingPayment(false);
  }
};


  const handleViewDetails = (bookingId) => {
    fetchBookingDetails(bookingId);
  };

  const handleSaveChanges = async () => {
    try {
      const { _id, status, paymentStatus, editedAmount } = selectedBooking;

      // Update booking status
      await axios.put(`https://varahibackend.varahiselfdrivecars.com/api/admin/statusbookings/${_id}`, { status });

      // Update payment status and amount
      await axios.put(`https://varahibackend.varahiselfdrivecars.com/api/admin/payment-status/${_id}`, {
        paymentStatus,
        amount: editedAmount
      });

      fetchBookings();
      setShowEditModal(false);
      toast.success("Booking updated successfully!");
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("Failed to update booking.");
    }
  };

  const handleDelete = async (bookingId) => {
    if (window.confirm("Are you sure you want to delete this booking?")) {
      try {
        await axios.delete(`https://varahibackend.varahiselfdrivecars.com/api/admin/deletebooking/${bookingId}`);
        fetchBookings();
        toast.success("Booking deleted successfully!");
      } catch (error) {
        console.error("Error deleting booking:", error);
        toast.error("Failed to delete booking.");
      }
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

  const getReplacementBadge = (booking) => {
    const hasReplacement = booking?.carReplacementHistory && 
      booking.carReplacementHistory.newCarId;

    if (hasReplacement) {
      return (
        <Badge bg="warning" className="ms-1">
          Car Replaced
        </Badge>
      );
    }
    return null;
  };

  const getReplacementStatus = (booking) => {
    const hasReplacement = booking?.carReplacementHistory && 
      booking.carReplacementHistory.newCarId;

    if (hasReplacement) {
      return (
        <Badge bg="warning" className="text-capitalize">
          Yes
        </Badge>
      );
    }
    return (
      <Badge bg="secondary" className="text-capitalize">
        No
      </Badge>
    );
  };

  const indexOfLastBooking = currentPage * bookingsPerPage;
  const indexOfFirstBooking = indexOfLastBooking - bookingsPerPage;
  const currentBookings = filteredBookings.slice(indexOfFirstBooking, indexOfLastBooking);
  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage);

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

  const handleDownloadExcel = async () => {
    try {
      toast.info('Preparing detailed booking report...', { autoClose: 2000 });

      // Fetch detailed data for all bookings
      const detailedBookings = await Promise.all(
        bookings.map(async (booking) => {
          try {
            const response = await axios.get(`https://varahibackend.varahiselfdrivecars.com/api/staff/singlebooking/${booking._id}`);
            return {
              ...response.data.booking,
              delayedPaymentProof: booking.delayedPaymentProof // Include from all bookings API
            };
          } catch (error) {
            console.error(`Error fetching details for booking ${booking._id}:`, error);
            return booking; // Fallback to basic booking data if detailed fetch fails
          }
        })
      );

      // Prepare Excel data with car replacement info
      const data = detailedBookings.map(booking => ({
        'Booking ID': booking._id || '-',
        'User Name': booking.userId?.name || '-',
        'User Email': booking.userId?.email || '-',
        'User Mobile': booking.userId?.mobile || '-',
        'Car Name': booking.car?.carName || '-',
        'Car Model': booking.car?.model || '-',
        'Vehicle Number': booking.car?.vehicleNumber || '-',
        'Car Replacement': booking.carReplacementHistory ? 'Yes' : 'No',
        'Original Car': booking.carReplacementHistory?.oldCarId?.carName || '-',
        'Original Car Model': booking.carReplacementHistory?.oldCarId?.model || '-',
        'Replacement Car': booking.carReplacementHistory?.newCarId?.carName || '-',
        'Replacement Car Model': booking.carReplacementHistory?.newCarId?.model || '-',
        'Replaced At': booking.carReplacementHistory?.replacedAt ? new Date(booking.carReplacementHistory.replacedAt).toLocaleString() : '-',
        'Payment Adjustment': booking.carReplacementHistory?.paymentAdjustment || 0,
        'Staff Payment Status': booking.carReplacementHistory?.staffPaymentStatus || '-',
        'Rental Start': booking.rentalStartDate ? new Date(booking.rentalStartDate).toLocaleDateString() : '-',
        'Rental End': booking.rentalEndDate ? new Date(booking.rentalEndDate).toLocaleDateString() : '-',
        'Timings': `${booking.from || '-'} - ${booking.to || '-'}`,
        'Total Price': booking.totalPrice || 0,
        'Pickup Location': booking.pickupLocation || '-',
        'Status': booking.status || '-',
        'Payment Status': booking.paymentStatus || '-',
        'OTP': booking.otp || '-',
        'Return OTP': booking.returnOTP || '-',
        'Deposit Amount': booking.deposit || 0,
        'Aadhar Status': booking.userId?.documents?.aadharCard?.status || 'Not uploaded',
        'License Status': booking.userId?.documents?.drivingLicense?.status || 'Not uploaded',
        'Booking Created': booking.createdAt ? new Date(booking.createdAt).toLocaleString() : '-',
        'Last Updated': booking.updatedAt ? new Date(booking.updatedAt).toLocaleString() : '-',
        'Deposit Proof Count': booking.depositeProof?.length || 0,
        'Car Return Images Count': booking.carReturnImages?.length || 0,
        'Car Pickup Images Count': booking.carImagesBeforePickup?.length || 0,
        'Delayed Payment Proof': booking.delayedPaymentProof?.url ? 'Available' : 'Not available',
        'Final Booking PDF': booking.finalBookingPDF ? 'Available' : 'Not available',
        'Deposit PDF': booking.depositPDF ? 'Available' : 'Not available',
        'Advance Paid Status': booking.advancePaidStatus ? 'Yes' : 'No',
        'Transaction ID': booking.transactionId || '-'
      }));

      // Create worksheet and workbook
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bookings");

      // Set column widths
      const wscols = [
        { wch: 25 }, // Booking ID
        { wch: 20 }, // User Name
        { wch: 25 }, // User Email
        { wch: 15 }, // User Mobile
        { wch: 20 }, // Car Name
        { wch: 15 }, // Car Model
        { wch: 15 }, // Vehicle Number
        { wch: 15 }, // Car Replacement
        { wch: 20 }, // Original Car
        { wch: 20 }, // Original Car Model
        { wch: 20 }, // Replacement Car
        { wch: 20 }, // Replacement Car Model
        { wch: 20 }, // Replaced At
        { wch: 18 }, // Payment Adjustment
        { wch: 18 }, // Staff Payment Status
        { wch: 15 }, // Rental Start
        { wch: 15 }, // Rental End
        { wch: 20 }, // Timings
        { wch: 12 }, // Total Price
        { wch: 20 }, // Pickup Location
        { wch: 15 }, // Status
        { wch: 15 }, // Payment Status
        { wch: 10 }, // OTP
        { wch: 12 }, // Return OTP
        { wch: 15 }, // Deposit Amount
        { wch: 15 }, // Aadhar Status
        { wch: 15 }, // License Status
        { wch: 20 }, // Booking Created
        { wch: 20 }, // Last Updated
        { wch: 20 }, // Deposit Proof Count
        { wch: 20 }, // Car Return Images Count
        { wch: 20 }, // Car Pickup Images Count
        { wch: 20 }, // Delayed Payment Proof
        { wch: 20 }, // Final Booking PDF
        { wch: 15 }, // Deposit PDF
        { wch: 15 }, // Advance Paid Status
        { wch: 25 }  // Transaction ID
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
      XLSX.writeFile(wb, "detailed_bookings_report.xlsx");
      toast.success('Excel report downloaded successfully!', { autoClose: 2000 });

    } catch (error) {
      console.error('Error generating Excel report:', error);
      toast.error('Failed to generate Excel report', { autoClose: 2000 });
    }
  };

  const renderCarInfo = (booking) => {
    if (booking.carReplacementHistory) {
      return (
        <>
          <div>
            <strong>Current Car:</strong> {booking.car?.carName || 'N/A'}
            {getReplacementBadge(booking)}
          </div>
        </>
      );
    }
    return <div>{booking.car?.carName || 'N/A'}</div>;
  };

  const renderCarModel = (booking) => {
    if (booking.carReplacementHistory) {
      return (
        <>
          <div>{booking.car?.model || 'N/A'}</div>
        </>
      );
    }
    return <div>{booking.car?.model || 'N/A'}</div>;
  };

  return (
    <div className="container-fluid mt-4">
      <ToastContainer position="top-right" autoClose={2000} />
      <div className="d-flex justify-content-start align-items-center">
        <h2 className="mb-4">Bookings Management</h2>
      </div>

      <Row className="mb-3">
        <Col md={3}>
          <Form.Select value={filterField} onChange={(e) => setFilterField(e.target.value)}>
            <option value="id">Search by Booking Id</option>
            <option value="name">Search by Name</option>
            <option value="email">Search by Email</option>
            <option value="pickuplocation">Search by Pickup Location</option>
            <option value="status">Search by Status</option>
            <option value="paymentstatus">Search by Payment Status</option>
            <option value="rentaldate">Search by Rental Date</option>
            <option value="replaced">Search Car Replacements</option>
          </Form.Select>
        </Col>
        <Col md={6}>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder={`Search by ${filterField === 'id' ? 'Booking Id'
                : filterField === 'name' ? 'Name'
                  : filterField === 'email' ? 'Email'
                    : filterField === 'pickuplocation' ? 'Pickup Location'
                      : filterField === 'status' ? 'Status'
                        : filterField === 'paymentstatus' ? 'Payment Status'
                          : filterField === 'rentaldate' ? 'Rental Date'
                            : filterField === 'replaced' ? 'Car Replacements (Yes/No)'
                              : ''}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
        </Col>
        <Col md={3} className="text-end">
          <Button variant="success" onClick={handleDownloadExcel}><i className="fas fa-file-excel me-2"></i>Export to Excel</Button>
        </Col>
      </Row>

      <div className="table-responsive">
        <Table bordered hover responsive>
          <thead>
            <tr className="table-header">
              <th>S.NO</th>
              <th>Booking ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Car</th>
              <th>Model</th>
              <th>Replaced</th>
              <th>Rental Start Date</th>
              <th>Rental End Date</th>
              <th>Timings</th>
              <th>Total Price</th>
              <th>Pickup Location</th>
              <th>Status</th>
              <th>Payment</th>
              <th>OTP</th>
              <th>Return OTP</th>
              <th>Actions</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {currentBookings.length > 0 ? (
              currentBookings.map((booking, index) => (
                <tr key={booking._id} className={booking.carReplacementHistory?.newCarId ? 'table-info' : ''}>
                  <td className="text-center">{(currentPage - 1) * bookingsPerPage + index + 1}</td>
                  <td>{booking._id.slice(-6) || 'N/A'}</td>
                  <td>{booking.userId?.name || 'N/A'}</td>
                  <td>{booking.userId?.email || 'N/A'}</td>
                  <td>{renderCarInfo(booking)}</td>
                  <td>{renderCarModel(booking)}</td>
                  <td>{getReplacementStatus(booking)}</td>
                  <td>{booking.rentalStartDate ? new Date(booking.rentalStartDate).toLocaleDateString() : 'N/A'}</td>
                  <td>{booking.rentalEndDate ? new Date(booking.rentalEndDate).toLocaleDateString() : 'N/A'}</td>
                  <td>{booking.from || 'N/A'} - {booking.to || 'N/A'}</td>
                  <td>₹{booking.totalPrice || '0'}</td>
                  <td>{booking.pickupLocation || 'N/A'}</td>
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
                  <td>{booking.otp || 'N/A'}</td>
                  <td>{booking.returnOTP || 'N/A'}</td>
                  <td className="text-center align-middle">
                    <Button variant="outline-warning" size="sm" className="me-1 mb-1 mt-1" onClick={() => handleEdit(booking)}>
                      <i className="fas fa-edit"></i>
                    </Button>
                    <Button variant="outline-primary" size="sm" className="me-1 mb-1 mt-1" onClick={() => handleExtend(booking)}>
                      <i className="fas fa-clock"></i>
                    </Button>
                    <Button variant="outline-info" size="sm" className="me-1 mb-1 mt-1" onClick={() => handleReplace(booking)}>
                      <i className="fas fa-exchange-alt"></i>
                    </Button>
                    <Button variant="outline-danger" size="sm" onClick={() => handleDelete(booking._id)}>
                      <i className="fas fa-trash-alt"></i>
                    </Button>
                  </td>
                  <td className="text-center align-middle">
                    <Button variant="outline-info" size="sm" className="me-1 mb-1 mt-1" onClick={() => handleViewDetails(booking._id)}>
                      view
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="18" className="text-center">No bookings found</td>
              </tr>
            )}
          </tbody>
        </Table>
        {renderPagination()}
      </div>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBooking && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={selectedBooking.status}
                  onChange={(e) => setSelectedBooking({ ...selectedBooking, status: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Payment Status</Form.Label>
                <Form.Select
                  value={selectedBooking.paymentStatus}
                  onChange={(e) => setSelectedBooking({ ...selectedBooking, paymentStatus: e.target.value })}
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Payment Amount (₹)</Form.Label>
                <Form.Control
                  type="number"
                  value={selectedBooking.editedAmount}
                  onChange={(e) => setSelectedBooking({ ...selectedBooking, editedAmount: e.target.value })}
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSaveChanges}>Save Changes</Button>
        </Modal.Footer>
      </Modal>

      {/* Extend Booking Modal */}
      <Modal show={showExtendModal} onHide={() => setShowExtendModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Extend Booking</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBooking && (
            <Form>
              <div className="mb-3">
                <p><strong>Booking ID:</strong> {selectedBooking._id}</p>
                <p><strong>User:</strong> {selectedBooking.userId?.name} ({selectedBooking.userId?.email})</p>
                <p><strong>Current End:</strong> {new Date(selectedBooking.rentalEndDate).toLocaleDateString()} {selectedBooking.to}</p>
              </div>

              <Form.Group className="mb-3">
                <Form.Label>Extension Hours</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Enter hours to extend (optional)"
                  value={extensionData.hours}
                  onChange={(e) => setExtensionData({ ...extensionData, hours: e.target.value })}
                  min="1"
                  step="1"
                />
                <Form.Text className="text-muted">
                  Enter hours OR specify date/time below
                </Form.Text>
              </Form.Group>

              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Extended Delivery Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={extensionData.extendDeliveryDate}
                      onChange={(e) => setExtensionData({ ...extensionData, extendDeliveryDate: e.target.value })}
                      min={selectedBooking.rentalEndDate}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Extended Delivery Time</Form.Label>
                    <Form.Control
                      type="time"
                      value={extensionData.extendDeliveryTime}
                      onChange={(e) => setExtensionData({ ...extensionData, extendDeliveryTime: e.target.value })}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Extension Amount (₹)</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Enter amount"
                  value={extensionData.amount}
                  onChange={(e) => setExtensionData({ ...extensionData, amount: e.target.value })}
                  required
                  min="1"
                  step="0.01"
                />
                <Form.Text className="text-muted">
                  Payment will be processed via Razorpay
                </Form.Text>
              </Form.Group>

              <div className="alert alert-info">
                <small>
                  <i className="fas fa-info-circle me-2"></i>
                  <strong>Note:</strong> 
                  <ul className="mb-0 mt-1">
                    <li>Provide either hours OR date/time for extension</li>
                    <li>Razorpay payment gateway will open for payment</li>
                    <li>Extension will be applied after successful payment</li>
                  </ul>
                </small>
              </div>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExtendModal(false)} disabled={isProcessingPayment}>
            Cancel
          </Button>
          <Button 
            variant="success" 
            onClick={initRazorpayPayment}
            disabled={isProcessingPayment || !extensionData.amount}
          >
            {isProcessingPayment ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Processing Payment...
              </>
            ) : (
              <>
                <i className="fas fa-credit-card me-2"></i>
                Pay & Extend Booking
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Replace Car Modal */}
     {/* Replace Car Modal */}
<Modal show={showReplaceModal} onHide={() => setShowReplaceModal(false)} size="lg">
  <Modal.Header closeButton>
    <Modal.Title>Replace Car in Booking</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {selectedBooking && (
      <Form>
        <div className="mb-3">
          <p><strong>Booking ID:</strong> {selectedBooking._id}</p>
          <p><strong>User:</strong> {selectedBooking.userId?.name} ({selectedBooking.userId?.email})</p>
          <p><strong>Current Car:</strong> {selectedBooking.car?.carName} ({selectedBooking.car?.model})</p>
          <p><strong>Vehicle Number:</strong> {selectedBooking.car?.vehicleNumber}</p>
        </div>

        <Form.Group className="mb-3">
          <Form.Label>Select New Car</Form.Label>
          <Form.Select
            value={replaceData.newCarId}
            onChange={(e) => setReplaceData({ ...replaceData, newCarId: e.target.value })}
            required
          >
            <option value="">Select a car</option>
            {cars.map((car) => (
              <option key={car._id} value={car._id}>
                {car.carName} - {car.model} - {car.vehicleNumber} - ₹{car.pricePerDay}/day
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Staff Refund Amount (Optional)</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter staff refund amount"
            value={replaceData.staffRefund}
            onChange={(e) => setReplaceData({ 
              ...replaceData, 
              staffRefund: e.target.value,
              // If staff refund provided, disable payment option
              requirePayment: e.target.value ? false : replaceData.requirePayment
            })}
            min="0"
            step="0.01"
          />
          <Form.Text className="text-muted">
            If staff needs to be refunded (no Razorpay payment required)
          </Form.Text>
        </Form.Group>

        {/* Payment section - only show if no staff refund */}
        {!replaceData.staffRefund && (
          <>
            <Form.Check 
              type="checkbox"
              label="Require Customer Payment"
              checked={replaceData.requirePayment}
              onChange={(e) => setReplaceData({ ...replaceData, requirePayment: e.target.checked })}
              className="mb-3"
            />

            {replaceData.requirePayment && (
              <>
                <Row className="mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Payment Amount (₹)</Form.Label>
                      <Form.Control
                        type="number"
                        placeholder="Enter amount"
                        value={replaceData.amount}
                        onChange={(e) => setReplaceData({ ...replaceData, amount: e.target.value })}
                        required={replaceData.requirePayment}
                        min="1"
                        step="0.01"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Transaction ID</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Will be filled by Razorpay"
                        value={replaceData.transactionId}
                        readOnly
                        className="bg-light"
                      />
                      <Form.Text className="text-muted">
                        Will be auto-filled after payment
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
                
                <div className="alert alert-info">
                  <small>
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>Note:</strong> Click "Pay & Replace Car" to open Razorpay payment gateway. 
                    Transaction ID will be automatically captured.
                  </small>
                </div>
              </>
            )}
          </>
        )}

        <div className="alert alert-warning">
          <small>
            <i className="fas fa-exclamation-triangle me-2"></i>
            <strong>Important:</strong> 
            <ul className="mb-0 mt-1">
              <li>If staff refund is entered, no Razorpay payment is required</li>
              <li>If no staff refund and payment is required, Razorpay will open</li>
              <li>New car must be available during the booking period</li>
            </ul>
          </small>
        </div>
      </Form>
    )}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowReplaceModal(false)} disabled={isReplacingCar || isProcessingPayment}>
      Cancel
    </Button>
    
    {/* If staff refund is provided, no Razorpay needed */}
    {replaceData.staffRefund ? (
      <Button 
        variant="warning" 
        onClick={handleReplaceCar}
        disabled={isReplacingCar || !replaceData.newCarId}
      >
        {isReplacingCar ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Replacing Car...
          </>
        ) : (
          <>
            <i className="fas fa-exchange-alt me-2"></i>
            Replace Car (Staff Refund)
          </>
        )}
      </Button>
    ) : (
      /* No staff refund - show conditional button */
      !replaceData.requirePayment ? (
        <Button 
          variant="warning" 
          onClick={handleReplaceCar}
          disabled={isReplacingCar || !replaceData.newCarId}
        >
          {isReplacingCar ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Replacing Car...
            </>
          ) : (
            <>
              <i className="fas fa-exchange-alt me-2"></i>
              Replace Car (No Payment)
            </>
          )}
        </Button>
      ) : (
        <Button 
          variant="success" 
          onClick={initReplaceCarPayment}
          disabled={isProcessingPayment || !replaceData.newCarId || !replaceData.amount}
        >
          {isProcessingPayment ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Processing Payment...
            </>
          ) : (
            <>
              <i className="fas fa-credit-card me-2"></i>
              Pay & Replace Car
            </>
          )}
        </Button>
      )
    )}
  </Modal.Footer>
</Modal>
      {/* Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="xl" centered scrollable>
        <Modal.Header closeButton>
          <Modal.Title>Booking Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {bookingDetails && (
            <div className="row">
              {/* Left Column - User Information */}
              <div className="col-md-6">
                <h5 className="text-primary">User Information</h5>
                <div className="mb-3">
                  <p><strong>Name:</strong> {bookingDetails.userId?.name || 'N/A'}</p>
                  <p><strong>Email:</strong> {bookingDetails.userId?.email || 'N/A'}</p>
                  <p><strong>Mobile:</strong> {bookingDetails.userId?.mobile || 'N/A'}</p>
                </div>

                <h5 className="mt-4 text-primary">Document Status</h5>
                <div className="mb-3">
                  <p>
                    <strong>Aadhar Card:</strong>
                    <Badge bg={
                      bookingDetails.userId?.documents?.aadharCard?.status === 'approved'
                        ? 'success'
                        : bookingDetails.userId?.documents?.aadharCard?.status === 'rejected'
                          ? 'danger'
                          : 'warning'
                    } className="ms-2">
                      {bookingDetails.userId?.documents?.aadharCard?.status || 'Not uploaded'}
                    </Badge>
                  </p>
                  <p>
                    <strong>Driving License:</strong>
                    <Badge bg={
                      bookingDetails.userId?.documents?.drivingLicense?.status === 'approved'
                        ? 'success'
                        : bookingDetails.userId?.documents?.drivingLicense?.status === 'rejected'
                          ? 'danger'
                          : 'warning'
                    } className="ms-2">
                      {bookingDetails.userId?.documents?.drivingLicense?.status || 'Not uploaded'}
                    </Badge>
                  </p>
                </div>

                <h5 className="mt-4 text-primary">Document Images</h5>
                <div className="mb-3">
                  {bookingDetails.userId?.documents?.aadharCard?.url && (
                    <div className="mb-3">
                      <h6>Aadhar Card</h6>
                      <img
                        src={bookingDetails.userId.documents.aadharCard.url}
                        alt="Aadhar Card"
                        className="img-fluid img-thumbnail"
                        style={{ maxHeight: '200px' }}
                      />
                      <p className="text-muted small mt-1">
                        Uploaded: {new Date(bookingDetails.userId.documents.aadharCard.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {bookingDetails.userId?.documents?.drivingLicense?.url && (
                    <div className="mb-3">
                      <h6>Driving License</h6>
                      <img
                        src={bookingDetails.userId.documents.drivingLicense.url}
                        alt="Driving License"
                        className="img-fluid img-thumbnail"
                        style={{ maxHeight: '200px' }}
                      />
                      <p className="text-muted small mt-1">
                        Uploaded: {new Date(bookingDetails.userId.documents.drivingLicense.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <h5 className="mt-4 text-primary">Deposit PDF</h5>
                  <div className="mb-3">
                    {bookingDetails.depositPDF ? (
                      <a
                        href={`https://varahibackend.varahiselfdrivecars.com${bookingDetails.depositPDF}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-success"
                      >
                        View Deposit PDF
                      </a>
                    ) : (
                      <p>No Deposit PDF available</p>
                    )}
                  </div>
                </div>

                <div>
                  <h5 className="mt-4 text-primary">Final Booking PDF</h5>
                  <div className="mb-3">
                    {bookingDetails.finalBookingPDF ? (
                      <a
                        href={`https://varahibackend.varahiselfdrivecars.com${bookingDetails.finalBookingPDF}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-info"
                      >
                        View Final Booking PDF
                      </a>
                    ) : (
                      <p>No Final Booking PDF available</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column - Booking & Car Information */}
              <div className="col-md-6">
                <h5 className="text-primary">Booking Information</h5>
                <div className="mb-3">
                  <p><strong>Booking ID:</strong> {bookingDetails._id}</p>
                  <p><strong>Status:</strong>
                    <Badge bg={getStatusBadge(bookingDetails.status)} className="ms-2">
                      {bookingDetails.status}
                    </Badge>
                  </p>
                  <p><strong>Payment Status:</strong>
                    <Badge bg={getPaymentBadge(bookingDetails.paymentStatus)} className="ms-2">
                      {bookingDetails.paymentStatus}
                    </Badge>
                  </p>
                  <p><strong>Transaction ID:</strong> {bookingDetails.transactionId || 'N/A'}</p>
                  <p><strong>Advance Paid:</strong> {bookingDetails.advancePaidStatus ? 'Yes' : 'No'}</p>
                  <p><strong>Created:</strong> {new Date(bookingDetails.createdAt).toLocaleString()}</p>
                  <p><strong>Last Updated:</strong> {new Date(bookingDetails.updatedAt).toLocaleString()}</p>
                </div>

                {/* Car Replacement History Section */}
                {bookingDetails.carReplacementHistory && bookingDetails.carReplacementHistory.newCarId && (
                  <Card className="mb-4 border-warning">
                    <Card.Header className="bg-warning text-dark d-flex justify-content-between align-items-center">
                      <div>
                        <strong><i className="fas fa-exchange-alt me-2"></i>Car Replacement Details</strong>
                      </div>
                      <Badge bg="danger">Car Replaced</Badge>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Col md={12} className="mb-3">
                          <div className="alert alert-info">
                            <i className="fas fa-info-circle me-2"></i>
                            <strong>Note:</strong> The original car was replaced with a different vehicle during this booking.
                          </div>
                        </Col>
                      </Row>
                      
                      <Row>
                        <Col md={6}>
                          <Card className="border-danger h-100">
                            <Card.Header className="bg-danger text-white">
                              <strong>Original Car (Assigned Initially)</strong>
                            </Card.Header>
                            <Card.Body>
                              <p><strong>Name:</strong> {bookingDetails.carReplacementHistory.oldCarId?.carName || 'N/A'}</p>
                              <p><strong>Model:</strong> {bookingDetails.carReplacementHistory.oldCarId?.model || 'N/A'}</p>
                              <p><strong>Vehicle Number:</strong> {replacedCarDetails.oldCar?.vehicleNumber || 'N/A'}</p>
                              <p><strong>Year:</strong> {replacedCarDetails.oldCar?.year || 'N/A'}</p>
                              <p><strong>Type:</strong> {replacedCarDetails.oldCar?.type || 'N/A'}</p>
                              <p><strong>Fuel:</strong> {replacedCarDetails.oldCar?.fuel || 'N/A'}</p>
                              <p><strong>Seats:</strong> {replacedCarDetails.oldCar?.seats || 'N/A'}</p>
                              {bookingDetails.carReplacementHistory.oldCarId?.carImage?.[0] && (
                                <div className="mt-2">
                                  <p><strong>Car Image:</strong></p>
                                  <img
                                    src={bookingDetails.carReplacementHistory.oldCarId.carImage[0]}
                                    alt="Original Car"
                                    className="img-thumbnail"
                                    style={{ maxHeight: '150px' }}
                                  />
                                </div>
                              )}
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={6}>
                          <Card className="border-success h-100">
                            <Card.Header className="bg-success text-white">
                              <strong>Current Car (Replacement)</strong>
                            </Card.Header>
                            <Card.Body>
                              <p><strong>Name:</strong> {bookingDetails.carReplacementHistory.newCarId?.carName || 'N/A'}</p>
                              <p><strong>Model:</strong> {bookingDetails.carReplacementHistory.newCarId?.model || 'N/A'}</p>
                              <p><strong>Vehicle Number:</strong> {replacedCarDetails.newCar?.vehicleNumber || 'N/A'}</p>
                              <p><strong>Year:</strong> {replacedCarDetails.newCar?.year || 'N/A'}</p>
                              <p><strong>Type:</strong> {replacedCarDetails.newCar?.type || 'N/A'}</p>
                              <p><strong>Fuel:</strong> {replacedCarDetails.newCar?.fuel || 'N/A'}</p>
                              <p><strong>Seats:</strong> {replacedCarDetails.newCar?.seats || 'N/A'}</p>
                              {bookingDetails.carReplacementHistory.newCarId?.carImage?.[0] && (
                                <div className="mt-2">
                                  <p><strong>Car Image:</strong></p>
                                  <img
                                    src={bookingDetails.carReplacementHistory.newCarId.carImage[0]}
                                    alt="Replacement Car"
                                    className="img-thumbnail"
                                    style={{ maxHeight: '150px' }}
                                  />
                                </div>
                              )}
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                      
                      <hr />
                      
                      <div className="mt-3">
                        <h6><i className="fas fa-cog me-2"></i>Replacement Details</h6>
                        <Row>
                          <Col md={6}>
                            <p><strong>Replaced At:</strong> {new Date(bookingDetails.carReplacementHistory.replacedAt).toLocaleString()}</p>
                            <p><strong>Payment Adjustment:</strong> ₹{bookingDetails.carReplacementHistory.paymentAdjustment || 0}</p>
                            <p><strong>Extra Payment Required:</strong> 
                              <Badge bg={bookingDetails.carReplacementHistory.extraPaymentRequired ? 'danger' : 'success'} className="ms-2">
                                {bookingDetails.carReplacementHistory.extraPaymentRequired ? 'Yes' : 'No'}
                              </Badge>
                            </p>
                          </Col>
                          <Col md={6}>
                            <p><strong>Staff Payment Due:</strong> ₹{bookingDetails.carReplacementHistory.staffPaymentDue || 0}</p>
                            <p><strong>Staff Payment Status:</strong>
                              <Badge bg={bookingDetails.carReplacementHistory.staffPaymentStatus === 'paid' ? 'success' : 'warning'} className="ms-2">
                                {bookingDetails.carReplacementHistory.staffPaymentStatus || 'Pending'}
                              </Badge>
                            </p>
                            <p><strong>Replacement Transaction ID:</strong> {bookingDetails.carReplacementHistory.transactionId || 'N/A'}</p>
                            <p><strong>Payment Status:</strong>
                              <Badge bg={bookingDetails.carReplacementHistory.paymentStatus === 'paid' ? 'success' : 'warning'} className="ms-2">
                                {bookingDetails.carReplacementHistory.paymentStatus || 'Pending'}
                              </Badge>
                            </p>
                          </Col>
                        </Row>
                      </div>
                    </Card.Body>
                  </Card>
                )}

                <h5 className="mt-4 text-primary">Rental Details</h5>
                <div className="mb-3">
                  <p><strong>Dates:</strong> {new Date(bookingDetails.rentalStartDate).toLocaleDateString()} to {new Date(bookingDetails.rentalEndDate).toLocaleDateString()}</p>
                  <p><strong>Timings:</strong> {bookingDetails.from} - {bookingDetails.to}</p>
                  <p><strong>Total Price:</strong> ₹{bookingDetails.totalPrice}</p>
                  <p><strong>Pickup Location:</strong> {bookingDetails.pickupLocation}</p>
                  <p><strong>Deposit Type:</strong> {bookingDetails.deposit}</p>
                  <p><strong>OTP:</strong> {bookingDetails.otp || 'N/A'}</p>
                  <p><strong>Return OTP:</strong> {bookingDetails.returnOTP || 'Not generated'}</p>
                </div>

                {bookingDetails.delayedPaymentProof && (
                  <>
                    <h5 className="mt-4 text-primary">Delayed Payment Proof</h5>
                    <div className="mb-3">
                      <img
                        src={bookingDetails.delayedPaymentProof.url}
                        alt="Delayed Payment Proof"
                        className="img-fluid img-thumbnail"
                        style={{ maxHeight: '200px' }}
                      />
                      <p className="text-muted small mt-1">
                        Uploaded: {new Date(bookingDetails.delayedPaymentProof.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                  </>
                )}

                <h5 className="mt-4 text-primary">Current Car Information</h5>
                <div className="mb-3">
                  <p><strong>Name:</strong> {bookingDetails.car?.carName}</p>
                  <p><strong>Model:</strong> {bookingDetails.car?.model}</p>
                  <p><strong>Year:</strong> {bookingDetails.car?.year}</p>
                  <p><strong>Vehicle Number:</strong> {bookingDetails.car?.vehicleNumber}</p>
                  <p><strong>Type:</strong> {bookingDetails.car?.type}</p>
                  <p><strong>Fuel:</strong> {bookingDetails.car?.fuel}</p>
                  <p><strong>Seats:</strong> {bookingDetails.car?.seats}</p>
                  <p><strong>Location:</strong> {bookingDetails.car?.location}</p>
                  <p><strong>Car Type:</strong> {bookingDetails.car?.carType}</p>
                  <p><strong>Status:</strong> {bookingDetails.car?.status}</p>
                  <p><strong>Running Status:</strong> {bookingDetails.car?.runningStatus || 'N/A'}</p>
                  {replacedCarDetails.newCar?.branch && (
                    <p><strong>Branch:</strong> {replacedCarDetails.newCar.branch.name}</p>
                  )}
                </div>

                {replacedCarDetails.newCar && (
                  <>
                    <h5 className="mt-4 text-primary">Current Car Pricing (From Car API)</h5>
                    <div className="mb-3">
                      <p><strong>Price/Hour:</strong> ₹{replacedCarDetails.newCar.pricePerHour || bookingDetails.car?.pricePerHour}</p>
                      <p><strong>Price/Day:</strong> ₹{replacedCarDetails.newCar.pricePerDay || bookingDetails.car?.pricePerDay}</p>
                      <p><strong>Extended/Hour:</strong> ₹{replacedCarDetails.newCar.extendedPrice?.perHour || bookingDetails.car?.extendedPrice?.perHour}</p>
                      <p><strong>Extended/Day:</strong> ₹{replacedCarDetails.newCar.extendedPrice?.perDay || bookingDetails.car?.extendedPrice?.perDay}</p>
                      <p><strong>Delay/Hour:</strong> ₹{replacedCarDetails.newCar.delayPerHour || bookingDetails.car?.delayPerHour}</p>
                      <p><strong>Delay/Day:</strong> ₹{replacedCarDetails.newCar.delayPerDay || bookingDetails.car?.delayPerDay}</p>
                      {replacedCarDetails.newCar.depositOptions && (
                        <p><strong>Deposit Options:</strong> {replacedCarDetails.newCar.depositOptions.join(', ')}</p>
                      )}
                    </div>
                  </>
                )}

                <h5 className="mt-4 text-primary">Car Images</h5>
                <div className="d-flex flex-wrap mb-3">
                  {bookingDetails.car?.carImage?.length > 0 ? (
                    bookingDetails.car.carImage.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Car ${idx + 1}`}
                        className="img-thumbnail me-2 mb-2"
                        style={{ width: '120px', height: '80px', objectFit: 'cover' }}
                      />
                    ))
                  ) : (
                    <p>No car images available</p>
                  )}
                </div>

                <h5 className="mt-4 text-primary">Car Pickup Images</h5>
                <div className="d-flex flex-wrap mb-3">
                  {bookingDetails.carImagesBeforePickup?.length > 0 ? (
                    bookingDetails.carImagesBeforePickup.map((img, idx) => (
                      <img
                        key={idx}
                        src={img.url}
                        alt={`Pickup ${idx + 1}`}
                        className="img-thumbnail me-2 mb-2"
                        style={{ width: '120px', height: '80px', objectFit: 'cover' }}
                      />
                    ))
                  ) : (
                    <p>No pickup images available</p>
                  )}
                </div>

                <h5 className="mt-4 text-primary">Car Return Images</h5>
                <div className="d-flex flex-wrap mb-3">
                  {bookingDetails.carReturnImages?.length > 0 ? (
                    bookingDetails.carReturnImages.map((img, idx) => (
                      <img
                        key={idx}
                        src={img.url}
                        alt={`Return ${idx + 1}`}
                        className="img-thumbnail me-2 mb-2"
                        style={{ width: '120px', height: '80px', objectFit: 'cover' }}
                      />
                    ))
                  ) : (
                    <p>No return images available</p>
                  )}
                </div>

                <h5 className="mt-4 text-primary">Deposit Proof</h5>
                <div className="d-flex flex-wrap mb-3">
                  {bookingDetails.depositeProof?.length > 0 ? (
                    bookingDetails.depositeProof.map((proof, idx) => (
                      <div key={idx} className="me-3 mb-3">
                        <img
                          src={proof.url}
                          alt={`Deposit Proof ${idx + 1}`}
                          className="img-thumbnail"
                          style={{ width: '120px', height: '80px', objectFit: 'cover' }}
                        />
                        <p className="small text-center mt-1">{proof.label}</p>
                      </div>
                    ))
                  ) : (
                    <p>No deposit proof available</p>
                  )}
                </div>
              </div>
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

export default Bookings;