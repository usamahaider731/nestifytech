import React, { useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';
import { useLang } from '@/contexts/LanguageContext';
import { RiDeleteBinLine, RiSecurePaymentLine, RiTruckLine, RiShieldCheckLine } from 'react-icons/ri';
import ImageViwer from '@/Components/Admin/ImageViwer';
import { useCart } from '@/contexts/CartContext';
import { selectCartItems, selectCartCount, selectCartTotal, setComboQty, removeFromCart } from '@/store/cartSlice';
import { useSelector, useDispatch } from 'react-redux';

import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import QuantitySelector from '@/Components/Single/QuantitySelector';

// Initialize Stripe outside of the component to avoid recreating the `Stripe` object on every render.
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_KEY || 'pk_test_51UJo7aGy3HXmj7syMxgPwUGkHesj5DgbXY3zeFQEs0UyUpuRaIA6w2Cxrm2gvnj37GDa0YAWguiiCWH25qoOKsSM0040HXjtZq');

function CheckoutFormContent() {
    const { setting } = usePage().props;
    const { __ } = useLang();


    const dispatch = useDispatch();
    const stripe = useStripe();
    const elements = useElements();

    const items = useSelector(selectCartItems);
    const itemCount = useSelector(selectCartCount);
    const subtotal = useSelector(selectCartTotal);

    const currency = setting?.site?.currency?.value ?? 'PKR';
    const totalAmount = subtotal;
    const shippingAmount = totalAmount > 0 ? 250 : 0; // Example flat rate
    const finalAmount = totalAmount + shippingAmount;

    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postal_code: '',
        payment_method: 'cod'
    });

    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState(null);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (form.payment_method === 'card') {
            if (!stripe || !elements) return;

            setIsProcessing(true);
            setPaymentError(null);

            try {
                // Get CSRF token
                let csrfToken = document.head.querySelector('meta[name="csrf-token"]')?.content;

                // Create PaymentIntent on the server
                const response = await fetch('/checkout/create-payment-intent', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken || ''
                    },
                    body: JSON.stringify({
                        amount: finalAmount,
                        currency: currency.toLowerCase(),
                    }),
                });

                const data = await response.json();

                if (data.error) {
                    setPaymentError(data.error);
                    setIsProcessing(false);
                    return;
                }

                const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
                    payment_method: {
                        card: elements.getElement(CardElement),
                        billing_details: {
                            name: `${form.first_name} ${form.last_name}`,
                            email: form.email,
                            phone: form.phone,
                            address: {
                                city: form.city,
                                line1: form.address,
                                postal_code: form.postal_code,
                            }
                        },
                    },
                });

                if (error) {
                    setPaymentError(error.message);
                    setIsProcessing(false);
                    return;
                }

                if (paymentIntent.status === 'succeeded') {
                    // 1. Place the order with the payment intent ID
                    const orderRes = await fetch('/api/cart/order', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': csrfToken || ''
                        },
                        body: JSON.stringify({
                            items: items,
                            payment_method: 'card',
                            payment_intent_id: paymentIntent.id,
                        }),
                    });
                    const orderData = await orderRes.json();

                    if (!orderData.success) {
                        setPaymentError(orderData.message || 'Failed to place order.');
                        setIsProcessing(false);
                        return;
                    }

                    alert(`Payment successful! Your order #${orderData.order_id} has been placed.`);
                }

            } catch (err) {
                setPaymentError('An error occurred while processing your payment. Please try again.');
            }

            setIsProcessing(false);

        } else {
            // Handle COD — place order without payment
            const csrfToken = document.head.querySelector('meta[name="csrf-token"]')?.content;
            try {
                const orderRes = await fetch('/api/cart/order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken || ''
                    },
                    body: JSON.stringify({
                        items: items,
                        payment_method: 'cod',
                    }),
                });
                const orderData = await orderRes.json();
                if (orderData.success) {
                    alert(`Order #${orderData.order_id} placed successfully! Pay on delivery.`);
                    dispatch(clearCart());
                } else {
                    alert(orderData.message || 'Failed to place order.');
                }
            } catch (err) {
                alert('An error occurred while placing your order. Please try again.');
            }
        }
    };


    console.log(items)
    return (
        <div className="bg-bg min-h-screen py-10">
            <Head title="Secure Checkout" />

            <div className="max-w-[1400px] mx-auto px-4 md:px-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-heading">Secure Checkout</h1>
                    <p className="text-res mt-2">Please review your order and enter your delivery details.</p>
                </div>

                {items.length === 0 ? (
                    <div className="bg-white rounded-md  p-12 text-center shadow-sm border border-permanent/10 flex flex-col items-center">
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
                            <RiSecurePaymentLine className="size-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-heading mb-4">Your Cart is Empty</h2>
                        <p className="text-res mb-8 max-w-md mx-auto">Looks like you haven't added anything to your cart yet. Head back to the store and find something you love!</p>
                        <Link href="/" className="px-8 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-primary/30 hover:-translate-y-1 transition-transform">
                            Continue Shopping
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Billing and Shipping Form */}
                        <div className="flex-1">
                            <form id="checkout-form" onSubmit={handleSubmit} className="bg-white rounded p-6 md:p-8 shadow-sm border border-permanent/10">
                                <h3 className="text-xl font-bold text-heading mb-6 pb-4 border-b border-permanent/10">Delivery Information</h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-heading mb-2">First Name</label>
                                        <input required type="text" name="first_name" value={form.first_name} onChange={handleChange} className="w-full border-border focus:bg-white focus:border-primary rounded-md px-4 py-3 text-sm transition-colors" placeholder="John" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-heading mb-2">Last Name</label>
                                        <input required type="text" name="last_name" value={form.last_name} onChange={handleChange} className="w-full border-border focus:bg-white focus:border-primary rounded-md px-4 py-3 text-sm transition-colors" placeholder="Doe" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-heading mb-2">Email Address</label>
                                        <input required type="email" name="email" value={form.email} onChange={handleChange} className="w-full border-border focus:bg-white focus:border-primary rounded-md px-4 py-3 text-sm transition-colors" placeholder="john@example.com" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-heading mb-2">Phone Number</label>
                                        <input required type="tel" name="phone" value={form.phone} onChange={handleChange} className="w-full border-border focus:bg-white focus:border-primary rounded-md px-4 py-3 text-sm transition-colors" placeholder="+92 300 1234567" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-semibold text-heading mb-2">Street Address</label>
                                        <input required type="text" name="address" value={form.address} onChange={handleChange} className="w-full border-border focus:bg-white focus:border-primary rounded-md px-4 py-3 text-sm transition-colors" placeholder="123 Main Street, Apt 4B" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-heading mb-2">City</label>
                                        <input required type="text" name="city" value={form.city} onChange={handleChange} className="w-full border-border focus:bg-white focus:border-primary rounded-md px-4 py-3 text-sm transition-colors" placeholder="Karachi" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-heading mb-2">Postal Code</label>
                                        <input required type="text" name="postal_code" value={form.postal_code} onChange={handleChange} className="w-full border-border focus:bg-white focus:border-primary rounded-md px-4 py-3 text-sm transition-colors" placeholder="75000" />
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-heading mb-4 pb-4 border-b border-permanent/10 mt-8">Payment Method</h3>
                                <div className="space-y-3 mb-8">
                                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.payment_method === 'cod' ? 'border-primary bg-primary/5' : 'border-permanent/20 hover:border-permanent/40'}`}>
                                        <input type="radio" name="payment_method" value="cod" checked={form.payment_method === 'cod'} onChange={handleChange} className="w-5 h-5 text-primary focus:ring-primary border-gray-300" />
                                        <div className="flex-1">
                                            <span className="block font-bold text-heading">Cash on Delivery</span>
                                            <span className="block text-xs text-res mt-1">Pay when you receive your order</span>
                                        </div>
                                    </label>
                                    <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.payment_method === 'card' ? 'border-primary bg-primary/5' : 'border-permanent/20 hover:border-permanent/40'}`}>
                                        <input type="radio" name="payment_method" value="card" checked={form.payment_method === 'card'} onChange={handleChange} className="w-5 h-5 text-primary focus:ring-primary border-gray-300" />
                                        <div className="flex-1">
                                            <span className="block font-bold text-heading">Credit / Debit Card</span>
                                            <span className="block text-xs text-res mt-1">Secure payment via Stripe</span>
                                        </div>
                                    </label>
                                </div>

                                {form.payment_method === 'card' && (
                                    <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                                        <label className="block text-sm font-semibold text-heading mb-4">Card Details</label>
                                        <div className="bg-white p-4 rounded-lg border border-gray-300">
                                            <CardElement options={{
                                                style: {
                                                    base: {
                                                        fontSize: '16px',
                                                        color: '#424770',
                                                        '::placeholder': {
                                                            color: '#aab7c4',
                                                        },
                                                    },
                                                    invalid: {
                                                        color: '#9e2146',
                                                    },
                                                },
                                            }} />

                                        </div>
                                        {paymentError && <div className="text-red-500 text-sm mt-3">{paymentError}</div>}
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-permanent/10">
                                    <div className="flex items-center gap-3 text-sm text-res font-medium">
                                        <RiTruckLine className="size-5 text-primary" /> Free Returns
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-res font-medium">
                                        <RiShieldCheckLine className="size-5 text-primary" /> Secure Checkout
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:w-[450px] shrink-0">
                            <div className="bg-white rounded p-6 shadow-sm border border-permanent/10 sticky top-28">
                                <h3 className="text-xl font-bold text-heading mb-6 pb-4 border-b border-permanent/10">Order Summary</h3>

                                <div className="max-h-[300px] overflow-y-auto scroll-hidden pr-2 space-y-4 mb-6">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex gap-4">
                                            <div className="w-16 h-16 rounded-md shrink-0 flex items-center justify-center p-1.5 border border-permanent">
                                                <ImageViwer image={item.image} className="w-full h-full object-contain" />
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h4 className="font-semibold text-sm text-heading line-clamp-2">{item.title}</h4>
                                                    <button type="button" onClick={() => dispatch(removeFromCart(item.comboId))} className="text-red-400 hover:text-red-500 p-1">
                                                        <RiDeleteBinLine className="size-4" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-between mt-2">
                                                    <QuantitySelector
                                                    
                                                    selectedStock={item.qty}
                                                    minStock={1}
                                                    maxStock={item.maxStock}
                                                    onChange={(newQty) => {
                                                        if(newQty > item.qty+10){
                                                            toast.error("Maximum quantity reached");
                                                            return;
                                                        }
                                                        dispatch(setComboQty({ comboId: item.comboId, qty: newQty }))
                                                    }}/>
                                                    <span className="font-bold text-primary text-sm">
                                                        {currency} {Number(item.price * item.qty).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-3 pt-6 border-t border-permanent/10 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-res font-medium">Subtotal</span>
                                        <span className="font-bold text-heading">{currency} {totalAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-res font-medium">Shipping</span>
                                        <span className="font-bold text-heading">{currency} {shippingAmount.toLocaleString()}</span>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t-2 border-dashed border-permanent/20 mb-8">
                                    <span className="font-bold text-heading text-lg">Total</span>
                                    <span className="font-black text-primary text-2xl">{currency} {finalAmount.toLocaleString()}</span>
                                </div>

                                <button
                                    type="submit"
                                    form="checkout-form"
                                    disabled={isProcessing}
                                    className={`w-full bg-primary text-white rounded-xl py-4 font-bold text-lg shadow-lg shadow-primary/30 transition-transform flex items-center justify-center gap-2 ${isProcessing ? 'opacity-70 cursor-not-allowed' : 'hover:-translate-y-1'}`}
                                >
                                    <RiSecurePaymentLine className="size-5" />
                                    {isProcessing ? 'Processing...' : 'Place Order'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Checkout() {
    return (
        <Elements stripe={stripePromise}>
            <CheckoutFormContent />
        </Elements>
    );
}

Checkout.layout = (view) => <FrontendLayout>{view}</FrontendLayout>;
