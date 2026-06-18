import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';

const HoldModal = ({ show, onHide, vehicleId, vehicleName, onHoldSuccess }) => {
    const [formData, setFormData] = useState({
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        holdReason: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        if (!formData.startDate) {
            setError('Please select hold start date');
            return false;
        }
        if (!formData.startTime) {
            setError('Please select hold start time');
            return false;
        }
        if (!formData.endDate) {
            setError('Please select hold end date');
            return false;
        }
        if (!formData.endTime) {
            setError('Please select hold end time');
            return false;
        }

        // Validate that end date/time is after start date/time
        const startDateTime = new Date(`${formData.startDate}T${formData.startTime}`);
        const endDateTime = new Date(`${formData.endDate}T${formData.endTime}`);

        if (endDateTime <= startDateTime) {
            setError('Hold end date/time must be after start date/time');
            return false;
        }

        setError('');
        return true;
    };

    // Helper function to format time to 12-hour format with AM/PM
    const formatTimeTo12Hour = (time) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Format time to 12-hour format with AM/PM
            const formattedStartTime = formatTimeTo12Hour(formData.startTime);
            const formattedEndTime = formatTimeTo12Hour(formData.endTime);

            const payload = {
                status: "onHold",
                holdStartDate: formData.startDate,
                holdEndDate: formData.endDate,
                holdStartTime: formattedStartTime,
                holdEndTime: formattedEndTime,
                holdReason: formData.holdReason || 'Maintenance',
            };

            const response = await fetch(`https://varahibackend.varahiselfdrivecars.com/api/car/update-car-status/${vehicleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to place vehicle on hold');
            }

            const data = await response.json();
            toast.success(`Vehicle "${vehicleName}" placed on hold successfully!`);

            // Reset form
            setFormData({
                startDate: '',
                startTime: '',
                endDate: '',
                endTime: '',
                holdReason: '',
            });

            // Callback to refresh parent data
            if (onHoldSuccess) {
                onHoldSuccess();
            }

            onHide();
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            startDate: '',
            startTime: '',
            endDate: '',
            endTime: '',
            holdReason: '',
        });
        setError('');
        onHide();
    };

    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];

    return (
        <Modal show={show} onHide={handleClose} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>
                    <i className="fas fa-pause-circle me-2 text-warning"></i>
                    Hold Vehicle: {vehicleName || 'Vehicle'}
                </Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {error && (
                    <Alert variant="danger" onClose={() => setError('')} dismissible>
                        {error}
                    </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                    <div className="row">
                        {/* Vehicle Info Card */}
                        <div className="col-12 mb-3">
                            <div className="bg-light p-3 rounded border">
                                <p className="mb-1"><strong>Vehicle ID:</strong> {vehicleId || 'N/A'}</p>
                                <p className="mb-0"><strong>Note:</strong> The vehicle will be marked as "On Hold" and unavailable for booking during the specified period.</p>
                            </div>
                        </div>

                        {/* Hold Period Section */}
                        <div className="col-12">
                            <h6 className="text-primary mb-3">
                                <i className="fas fa-calendar-alt me-2"></i>
                                Hold Period
                            </h6>
                        </div>

                        <div className="col-md-6 mb-3">
                            <Form.Label className="fw-bold">Hold Start Date <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                min={today}
                                required
                            />
                        </div>

                        <div className="col-md-6 mb-3">
                            <Form.Label className="fw-bold">Hold Start Time <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="time"
                                name="startTime"
                                value={formData.startTime}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="col-md-6 mb-3">
                            <Form.Label className="fw-bold">Hold End Date <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                min={formData.startDate || today}
                                required
                            />
                        </div>

                        <div className="col-md-6 mb-3">
                            <Form.Label className="fw-bold">Hold End Time <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="time"
                                name="endTime"
                                value={formData.endTime}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Hold Details Section */}
                        <div className="col-12 mt-2">
                            <h6 className="text-primary mb-3">
                                <i className="fas fa-info-circle me-2"></i>
                                Hold Details
                            </h6>
                        </div>

                        <div className="col-md-12 mb-3">
                            <Form.Label className="fw-bold">Hold Reason <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                name="holdReason"
                                value={formData.holdReason}
                                onChange={handleChange}
                                placeholder="Enter hold reason"
                                required
                            />

                            <div className="mt-2 d-flex flex-wrap gap-2">
                                {[
                                    "Maintenance",
                                    "Repair",
                                    "Cleaning",
                                    "Inspection",
                                    "Service",
                                    "Insurance",
                                    "Breakdown",
                                    "Other"
                                ].map((tag) => (
                                    <Button
                                        key={tag}
                                        size="sm"
                                        variant={
                                            formData.holdReason === tag
                                                ? "warning"
                                                : "outline-secondary"
                                        }
                                        onClick={() =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                holdReason: tag,
                                            }))
                                        }
                                    >
                                        {tag}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Duration Summary */}
                        {formData.startDate && formData.startTime && formData.endDate && formData.endTime && (
                            <div className="col-12 mt-2">
                                <div className="alert alert-info">
                                    <i className="fas fa-clock me-2"></i>
                                    <strong>Hold Duration:</strong>{' '}
                                    {new Date(`${formData.startDate}T${formData.startTime}`).toLocaleString()} - {' '}
                                    {new Date(`${formData.endDate}T${formData.endTime}`).toLocaleString()}
                                </div>
                            </div>
                        )}
                    </div>
                </Form>
            </Modal.Body>

            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    <i className="fas fa-times me-2"></i>Cancel
                </Button>
                <Button
                    variant="warning"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                            <span className="ms-2">Processing...</span>
                        </>
                    ) : (
                        <>
                            <i className="fas fa-pause-circle me-2"></i>
                            Place on Hold
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default HoldModal;