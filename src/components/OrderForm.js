import React, { useState, useEffect } from 'react';
import { Form, Button, Table, Row, Col } from "react-bootstrap";
import 'bootstrap/dist/css/bootstrap.min.css';
import Select from 'react-select';
import './OrderForm.css';
import useFetchData from './useFetchData';
import Swal from 'sweetalert2';

const OrderForm = ({ authToken,onLogout }) => {
    const [orderNo, setOrderNo] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [productSKU, setProductSKU] = useState('');
    const [unpickedItems, setUnpickedItems] = useState([]);
    const [pickedItems, setPickedItems] = useState([]);
    const [orderList, setOrderList] = useState([]);
    const [error, setError] = useState('');
    const [selectedOption, setSelectedOption] = useState(null);
    const [orderOptions, setOrderOptions] = useState([]);
    const [checkBtn, setCheckBtn] = useState(false);
    const [isUserActive, setIsUserActive] = useState(true);
    const [isOrderLoaded, setIsOrderLoaded] = useState(false);

    const orders = useFetchData();
    const [pickedQuantities, setPickedQuantities] = useState({});
    useEffect(() => {
        const fetchOrderOptions = async () => {
            try {
                const response = await fetch('http://localhost:3000/get-order');

                if (response.ok) {
                    const orderData = await response.json();
                    const options = orderData.map((order) => ({
                        value: order.id,
                        label: `Order #${order.id}`,
                    }));

                    setOrderOptions(options);
                }
            } catch (error) {
                console.error('Error fetching order options:', error);
            }
        };

        fetchOrderOptions();
    }, [authToken]);

    const callUnassignOrderApi = () => {
        if (isOrderLoaded) {
            const requestBody = {
                id: orderNo,
            };

            fetch('http://localhost:3000/unassign-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            })
                .then((response) => {
                    if (response.ok) {
                        setSelectedOrder(null);
                        setPickedItems([]);
                        setUnpickedItems([]);
                        setOrderNo('');
                        setSelectedOption(null);
                        // Swal.fire({
                        //     text: 'Due to No event ouccur Order is unassign',
                        //     icon: 'warning',
                        //   });
                    } else {
                        console.error('Error unassigning order:', response);
                    }
                })
                .catch((error) => {
                    console.error('Fetch error:', error);
                });
        }
    };
    useEffect(() => {
        let activityTimer;
        const inactivityTime = 30 * 1000;
        const resetActivityTimer = () => {
            clearTimeout(activityTimer);
            activityTimer = setTimeout(callUnassignOrderApi, inactivityTime);
        };

        const handleUserActivity = () => {
            resetActivityTimer();
        };

        window.addEventListener('mousemove', handleUserActivity);
        window.addEventListener('keydown', handleUserActivity);

        return () => {
            window.removeEventListener('mousemove', handleUserActivity);
            window.removeEventListener('keydown', handleUserActivity);
            clearTimeout(activityTimer);
        };
    }, [isOrderLoaded]);

    const handlePickOrder = async () => {
        try {
            const response = await fetch(`http://localhost:3000/load-order/${orderNo}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({ order_id: orderNo }),
            });

            if (response.ok) {
                setError('');
                setIsOrderLoaded(true);
                const selectedOrderData = await response.json();

                if (selectedOrderData) {
                    setCheckBtn(true);
                    setSelectedOrder(selectedOrderData);

                    const products = selectedOrderData.items.map((item) => ({
                        id: item.id,
                        orderNo: selectedOrderData.order[0].id,
                        productSKU: item.sku,
                        image_url: item.image,
                        quantity: item.qty,
                        qty_packed: item.qty_packed,
                        status: item.status,
                        p_count: 1
                    }));
                    const pickedItemsFromLocalStorage = products.filter((item) => ((item.qty_packed > 0)));
                    const unpickedItemsFromLocalStorage = products.filter((item) => (item.quantity - item.qty_packed) > 0);
                    setPickedItems(pickedItemsFromLocalStorage);
                    setUnpickedItems(unpickedItemsFromLocalStorage);
                }
            } else {
                if (response.status === 400) {
                    const errorData = await response.json();
                    setCheckBtn(false);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: errorData.error,
                      });
                }
            }
        } catch (error) {
            // setError('Error loading order. Please try again.');
            // console.error('Error:', error);
        }
    };
    const handlePickItem = async (sku) => {
        const pickedItem = unpickedItems.find((item) => item.productSKU === sku);
        const unpickedItem = pickedItems.find((item) => item.productSKU === sku);
        if (pickedItem) {
            try {
                const response = await fetch('http://localhost:3000/pick-item', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`,
                    },
                    body: JSON.stringify({
                        id: pickedItem.id,
                        order_id: pickedItem.orderNo,
                        qty_picked: pickedItem.p_count,
                        ip_addr: "202.100.101.1"
                    }),
                });

                if (response.ok) {
                    setUnpickedItems((prevItems) =>
                        prevItems.map((item) =>
                            (item.productSKU === sku && (Number(item.quantity) - Number(item.qty_packed) - Number(item.p_count)) !== 0)
                                ? { ...item, p_count: 1, qty_packed: (Number(item.qty_packed) + Number(item.p_count)) }
                                : item
                        ).filter((item) => (Number(item.quantity) - Number(item.qty_packed) - Number(item.p_count)) !== 0)
                    );
                    // setUnpickedItems((prevItems) => prevItems.filter((item) => item.productSKU !== sku));
                    if (unpickedItem) {
                        setPickedItems((prevItems) => prevItems.map((item) =>
                            item.productSKU === sku ? { ...item, qty_packed: item.qty_packed + pickedItem.p_count } : item
                        ));
                    } else {
                        setPickedItems((prevItems) => [...prevItems, { ...pickedItem, qty_packed: pickedItem.p_count }]);
                    }
                    // setPickedItems((prevItems) => [...prevItems, pickedItem]);
                } else {
                    setError('Error picking item. Please try again.');
                }
            } catch (error) {
                setError('Error picking item. Please try again.');
                console.error('Error:', error);
            }
        }
    };
    const handlegetSKU = async (sku) => {
        if (!sku) return;

        try {
            const response = await fetch(`http://localhost:3000/search-sku/${sku}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`,
                    },
                });

            if (response.ok) {
                const skuData = await response.json();
                const products = skuData.map((item) => ({
                    id: item.id,
                    orderNo: orderNo,
                    productSKU: item.sku,
                    image_url: item.image,
                    quantity: item.qty,
                    qty_packed: item.qty_packed,
                    status: item.status,
                    p_count: 1
                }));
                const pickedItemsFromLocalStorage = products.filter((item) => ((item.qty_packed > 0)));
                const unpickedItemsFromLocalStorage = products.filter((item) => (item.quantity - item.qty_packed) > 0);
                setPickedItems(pickedItemsFromLocalStorage);
                setUnpickedItems(unpickedItemsFromLocalStorage);
                
            } else {
                setPickedItems([]);
                setUnpickedItems([]);
            }
        } catch (error) {
            console.error('Error fetching SKU:', error);
        }
    };

    const handleUnpickItem = async (sku) => {
        const unpickedItem = pickedItems.find((item) => item.productSKU === sku);
        if (unpickedItem) {
            try {
                const response = await fetch('http://localhost:3000/unpick-item', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`,
                    },
                    body: JSON.stringify({
                        id: unpickedItem.id,
                        order_id: unpickedItem.orderNo,
                        qty_picked: 0,
                    }),
                });

                if (response.ok) {
                    setPickedItems((prevItems) => prevItems.filter((item) => item.productSKU !== sku));
                    setUnpickedItems((prevItems) => prevItems.filter((item) => item.productSKU !== sku));
                    setUnpickedItems((prevItems) => [...prevItems, { ...unpickedItem, qty_packed: 0, p_count: 1 }]);
                } else {
                    setError('Error unpicking item. Please try again.');
                }
            } catch (error) {
                setError('Error unpicking item. Please try again.');
                console.error('Error:', error);
            }
        }
    };

    const handleSubmitOrder = async (orderId) => {
        try {
            const response = await fetch('http://localhost:3000/submit-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`,
                },
                body: JSON.stringify({
                    id: orderId,
                }),
            });

            if (response.ok) {
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Error submitting order. Please try again.');
            }
        } catch (error) {
            setError('Error submitting order. Please try again.');
            console.error('Error:', error);
        }
    };
    const handleSubmit = () => {
        if (!selectedOrder) return; 

        const hasUnpickedItems = unpickedItems.length > 0;
        if (hasUnpickedItems) {
            Swal.fire({
                text: 'There are still unpicked items. Do you want to continue and submit the order?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, Process!',
              }).then((result) => {
                if (result.isConfirmed) {
                    handleSubmitOrder(selectedOrder.order[0].id);
                    setSelectedOrder(null);
                    setPickedItems([]);
                    setUnpickedItems([]);
                    setOrderNo('');
                    setSelectedOption(null);
                }
              });
        }
    };
    const mapStatusToLabel = (status) => {
        switch (status) {
            case 'P':
                return 'Processing';
            case 'K':
                return 'Packed';
            case 'S':
                return 'Submitted';
            default:
                return '';
        }
    };

    const handleQuantityChange = (sku, value) => {
        setPickedQuantities((prevQuantities) => ({
            ...prevQuantities,
            [sku]: value,
        }));
    };
    const handleUnpickQuantityChange = (sku, value) => {
        setUnpickedItems((prevItems) =>
            prevItems.map((item) =>
                item.productSKU === sku ? { ...item, p_count: Number(value) } : item
            )
        );

    };
    const handleLogout = () =>{
        localStorage.removeItem('token');
        onLogout();
    }
    const handleChange = (selected) => {
        setSelectedOption(selected); 
        setOrderNo(selected?.value || '');
      };
    return (
        <div className="order-form">
            <Row>
                <Col md={8}>
                    <Form.Group controlId="orderNo">
                        <Row>
                            <Col md={2} className="text-left">
                                <Form.Label>ORDER # </Form.Label>
                            </Col>
                            <Col md={10}>
                                <div className="input-group">
                                    {/* Use react-select for the dropdown */}
                                    <Select
                                        options={orderOptions}
                                        placeholder="Search for Order"
                                        value={selectedOption}
                                        onChange={handleChange} 
                                        className="select-input"
                                        // onChange={(selectedOption) => setOrderNo(selectedOption?.value || '')}
                                    />

                                    <Button variant="primary" className="m-0 w-auto load-button" onClick={handlePickOrder}>
                                        LOAD ORDER
                                    </Button>
                                    <Button className = "btn-logout"  variant="danger" onClick={() => handleLogout()}>
                                            Logout
                                        </Button>
                                </div>
                            </Col>
                        </Row>
                    </Form.Group>
                </Col>
            </Row>

            <Form.Group className="mt-3 text-left">
                <Form.Label>Order Status:</Form.Label>{' '}
                <Form.Text>
                    {selectedOrder ? mapStatusToLabel(selectedOrder.order[0]['status']) : 'Select an order'}
                </Form.Text>
            </Form.Group>

            <Form.Group controlId="productSKU" className="mt-3">
                <div className="input-group ">
                    <Form.Control
                        type="text"
                        placeholder="SEARCH FOR SKU"
                        value={productSKU}
                        className="m-0"
                        onChange={(e) => setProductSKU(e.target.value)}
                    />

                    <Button variant="primary" className="m-0" onClick={() => handlegetSKU(productSKU)} disabled={!orderNo}>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            fill="currentColor"
                            class="bi bi-search"
                            viewBox="0 0 16 16"
                        >
                            <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                        </svg>
                    </Button>
                </div>
            </Form.Group>
            {/* Display the selected order details */}
            {selectedOrder && selectedOrder.order && selectedOrder.order.length > 0 && (
                <div>
                    <h4>Selected Order Details:</h4>
                    <p>Order ID: {selectedOrder.order[0].id}</p>
                    <p>
                        Customer: {selectedOrder.order[0].firstname} {selectedOrder.order[0].lastname}
                    </p>
                    <p>
                        Billing Address:{' '}
                        {`${selectedOrder.order[0].address}, ${selectedOrder.order[0].suburb}, ${selectedOrder.order[0].state}, ${selectedOrder.order[0].postcode}, ${selectedOrder.order[0].country}`}
                    </p>
                </div>
            )}



            <div className="items-section">
                <div className="unpicked-items">
                    <h5>Un-picked-up items</h5>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Product SKU</th>
                                <th>Quantity</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {unpickedItems.map((item, index) => (
                                <tr key={index}>
                                    <td>
                                        <img src={item.image_url} alt={`Product ${item.productSKU}`} width="50" height="50" />
                                    </td>
                                    <td>{item.productSKU}</td>
                                    <td>{item.quantity - item.qty_packed}</td>
                                    <td>{'Unpicked'}</td> {/* Show status */}
                                    <td>
                                        <Form.Control
                                            as="select"
                                            value={[item.p_count] || 1}
                                            onChange={(e) => handleUnpickQuantityChange(item.productSKU, e.target.value)}
                                        >
                                            {[...Array(item.quantity - item.qty_packed + 1).keys()].map((num) => (
                                                <>{num != 0 &&
                                                    <option key={num} value={num}>
                                                        {num}
                                                    </option>
                                                }
                                                </>
                                            ))}
                                        </Form.Control>
                                        <Button variant="success" onClick={() => handlePickItem(item.productSKU)}>
                                            Pick
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
                <div className="picked-items">
                    <h5>Picked items</h5>
                    <Table striped bordered hover>
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Product SKU</th>
                                <th>Quantity</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pickedItems.map((item, index) => (
                                <tr key={index}>
                                    <td>
                                        <img src={item.image_url} alt={`Product ${item.productSKU}`} width="50" height="50" />
                                    </td>
                                    <td>{item.productSKU}</td>
                                    <td>{item.qty_packed}</td>
                                    <td>{(item.quantity - item.qty_packed) > 0 ? 'Unpicked' : 'Picked'}</td>
                                    <td>
                                        <Button variant="warning" onClick={() => handleUnpickItem(item.productSKU)}>
                                            Unpick
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
            </div>

            <div className="submit-section">
                <Button variant="primary" onClick={handleSubmit} disabled= {!checkBtn}>
                    Submit
                </Button>
            </div>
        </div>
    );
};

export default OrderForm;