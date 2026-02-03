import React from 'react';
import api from '../api/axios';

const PaymentButton = ({ tenderId, onPaymentSuccess }) => {

    const handlePayment = async () => {
        try {
            const { data: order } = await api.post('/payments/order', { tenderId });

            const options = {
                key: process.env.REACT_APP_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "Secure Tender Portal",
                description: "Tender Security Deposit",
                order_id: order.id,
                handler: async function (response) {
                    try {
                        const verifyRes = await api.post('/payments/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        alert(verifyRes.data.message);
                        if (onPaymentSuccess) onPaymentSuccess();
                    } catch (error) {
                        console.log(error);
                        alert("Payment verification failed");
                    }
                },
                prefill: {
                    name: "Contractor",
                    email: "contractor@example.com",
                    contact: "9999999999",
                },
                theme: {
                    color: "#3399cc",
                },
            };

            const rzp1 = new window.Razorpay(options);
            rzp1.on("payment.failed", function (response) {
                alert(response.error.description);
            });
            rzp1.open();

        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "Payment initialization failed");
        }
    };

    return (
        <button onClick={handlePayment} className="glass-btn" style={{ background: 'var(--primary)', fontSize: '0.8rem', padding: '0.25rem 0.5rem' }}>
            Pay Security Deposit
        </button>
    );
};

export default PaymentButton;
