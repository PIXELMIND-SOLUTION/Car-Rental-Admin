import React, { useState, useEffect } from 'react';
import {
    Container, Row, Col, Card, Button, Form, Spinner, Alert, Modal
} from 'react-bootstrap';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_BASE = 'https://varahibackend.varahiselfdrivecars.com/api/car';

const AdminBannerManager = () => {
    const [banners, setBanners] = useState([]);
    const [images, setImages] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedBannerId, setSelectedBannerId] = useState(null);
    const [editImages, setEditImages] = useState([]);

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/allbanner`);
            setBanners(res.data.banners || []);
            // toast.success('Banners fetched successfully!');
        } catch (err) {
            setError('Failed to fetch banners');
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const handleImageChange = (e) => {
        setImages([...e.target.files]);
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (images.length === 0) return toast.error('Please select images to upload.');
        setUploading(true);
        try {
            const formData = new FormData();
            images.forEach((file) => formData.append('images', file));
            await axios.post(`${API_BASE}/bannercreate`, formData);
            toast.success('Banners uploaded successfully!');
            setImages([]);
            fetchBanners();
        } catch (err) {
            toast.error('Failed to upload banners');
        } finally {
            setUploading(false);
        }
    };

    const handleEditClick = (bannerId) => {
        setSelectedBannerId(bannerId);
        setEditImages([]);
        setShowEditModal(true);
    };

    const handleEditImageChange = (e) => {
        setEditImages([...e.target.files]);
    };

    const handleUpdate = async () => {
        if (!selectedBannerId || editImages.length === 0) {
            toast.error('Please select images to update.');
            return;
        }
        try {
            const formData = new FormData();
            editImages.forEach((file) => formData.append('images', file));
            await axios.put(`${API_BASE}/updatebanner/${selectedBannerId}`, formData);
            toast.success('Banner updated successfully!');
            setShowEditModal(false);
            fetchBanners();
        } catch (err) {
            toast.error('Failed to update banner');
        }
    };

    const handleDelete = async (bannerId) => {
        if (!window.confirm('Are you sure you want to delete this banner?')) return;
        try {
            await axios.delete(`${API_BASE}/deletebanner/${bannerId}`);
            toast.success('Banner deleted successfully!');
            fetchBanners();
        } catch (err) {
            toast.error('Failed to delete banner');
        }
    };

    return (
        <Container className="py-5">
            <ToastContainer position="top-right" autoClose={2000} />
            <h2 className="text-center mb-4">Admin Banner Management</h2>

            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <Form onSubmit={handleUpload}>
                        <Form.Group controlId="formFileMultiple" className="mb-3">
                            <Form.Label>Select Banner Images (multiple allowed)</Form.Label>
                            <Form.Control type="file" multiple onChange={handleImageChange} />
                        </Form.Group>
                        <Button
                            type="submit"
                            variant="primary"
                            className="px-4 py-2 rounded-pill"
                            disabled={uploading}
                        >
                            {uploading ? (
                                <>
                                    <Spinner animation="border" size="sm" className="me-2" />
                                    Uploading...
                                </>
                            ) : (
                                'Upload Banner'
                            )}
                        </Button>
                    </Form>
                </Card.Body>
            </Card>

            <h4 className="mb-3">Existing Banners</h4>

            {loading ? (
                <div className="text-center">
                    <Spinner animation="border" />
                </div>
            ) : banners.length === 0 ? (
                <Alert variant="info">No banners found.</Alert>
            ) : (
                <div
                    className="d-flex flex-row gap-3 pb-3 overflow-auto overflow-md-visible"
                    style={{
                        flexDirection: window.innerWidth < 768 ? 'column' : 'row',
                        maxHeight: window.innerWidth < 768 ? '500px' : 'none',
                    }}
                >

                    {banners.map((banner) => (
                        <Card key={banner._id} className="shadow-sm flex-shrink-0" style={{ minWidth: '300px' }}>
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <Card.Title className="mb-0">Banner Set</Card.Title>
                                    <div>
                                        <button
                                            className="me-2 btn btn-sm btn-outline-warning"
                                            onClick={() => handleEditClick(banner._id)}
                                        >
                                            <i className="fas fa-edit me-1"></i>
                                        </button>
                                        <button
                                            className="btn btn-sm btn-outline-danger"
                                            onClick={() => handleDelete(banner._id)}
                                        >
                                            <i className="fas fa-trash me-1"></i>
                                        </button>
                                    </div>
                                </div>

                                <div className="d-flex flex-wrap gap-2 mb-3">
                                    {banner.images.map((img, idx) => (
                                        <div
                                            key={idx}
                                            className="rounded"
                                            style={{
                                                width: '140px',
                                                height: '80px',
                                                background: `url(${img}) center center / cover no-repeat`,
                                                flexShrink: 0,
                                            }}
                                        />
                                    ))}
                                </div>

                                <p className="text-muted small">
                                    Uploaded: {new Date(banner.createdAt).toLocaleString()}
                                </p>
                            </Card.Body>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Banner</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group controlId="editImages" className="mb-3">
                        <Form.Label>Select new images for this banner</Form.Label>
                        <Form.Control type="file" multiple onChange={handleEditImageChange} />
                    </Form.Group>
                    <div className="text-end">
                        <Button variant="secondary" className="me-2" onClick={() => setShowEditModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleUpdate}>
                            Update Banner
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default AdminBannerManager;
