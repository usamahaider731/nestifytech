import React, { useMemo, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import FrontendLayout from '@/Layouts/FrontendLayout';
import { useLang } from '@/contexts/LanguageContext';
import { RiDeleteBinLine, RiSecurePaymentLine, RiTruckLine, RiShieldCheckLine, RiBankCardLine, RiPaypalLine, RiHandCoinLine, RiGlobalLine } from 'react-icons/ri';
import ImageViwer from '@/Components/Admin/ImageViwer';
import { useCart } from '@/contexts/CartContext';
import { selectCartItems, selectCartCount, selectCartTotal, setComboQty, removeFromCart, clearCart } from '@/store/cartSlice';
import { useSelector, useDispatch } from 'react-redux';

import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import QuantitySelector from '@/Components/Single/QuantitySelector';

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

    // Detect enabled payment gateways from setting.json
    const paymentSettings = setting?.payment || {};
    const stripeEnabled  = paymentSettings.stripe_enabled?.value  ?? true;
    // PayPal: only show if enabled AND a real client_id is configured
    const paypalClientId = paymentSettings.paypal_client_id?.value || '';
    const paypalEnabled  = (paymentSettings.paypal_enabled?.value  ?? false)
                           && paypalClientId.length > 0
                           && !paypalClientId.includes('@'); // exclude placeholder emails
    // COD: enabled by default
    const codEnabled     = paymentSettings.cod_enabled?.value     ?? true;
    // Payoneer: only show if enabled AND a real program_id is configured
    const payoneerProgramId = paymentSettings.payoneer_program_id?.value || '';
    const payoneerEnabled   = (paymentSettings.payoneer_enabled?.value ?? false)
                              && payoneerProgramId.length > 0;

    // Determine default payment method
    const defaultMethod = useMemo(() => {
        if (codEnabled) return 'cod';
        if (stripeEnabled) return 'card';
        if (paypalEnabled) return 'paypal';
        if (payoneerEnabled) return 'payoneer';
        return 'cod';
    }, [codEnabled, stripeEnabled, paypalEnabled, payoneerEnabled]);

    const [form, setForm] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postal_code: '',
        payment_method: defaultMethod
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
                            shipping_amount: shippingAmount,
                            first_name: form.first_name,
                            last_name: form.last_name,
                            email: form.email,
                            phone: form.phone,
                            address: form.address,
                            city: form.city,
                            postal_code: form.postal_code,
                        }),
                    });
                    const orderData = await orderRes.json();

                    if (!orderData.success) {
                        setPaymentError(orderData.message || 'Failed to place order.');
                        setIsProcessing(false);
                        return;
                    }
                    dispatch(clearCart());
                    alert(`Payment successful! Your order #${orderData.order_id} has been placed.`);
                }

            } catch (err) {
                setPaymentError('An error occurred while processing your payment. Please try again.');
            }

            setIsProcessing(false);

        } else {
            // Handle COD, PayPal, or Payoneer order placement
            const csrfToken = document.head.querySelector('meta[name="csrf-token"]')?.content;
            setIsProcessing(true);
            setPaymentError(null);

            try {
                const orderRes = await fetch('/api/cart/order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken || ''
                    },
                    body: JSON.stringify({
                        items: items,
                        payment_method: form.payment_method,
                        shipping_amount: shippingAmount,
                        first_name: form.first_name,
                        last_name: form.last_name,
                        email: form.email,
                        phone: form.phone,
                        address: form.address,
                        city: form.city,
                        postal_code: form.postal_code,
                    }),
                });
                const orderData = await orderRes.json();
                if (orderData.success) {
                    const methodLabels = {
                        cod: 'Cash on Delivery',
                        paypal: 'PayPal',
                        payoneer: 'Payoneer'
                    };
                    const label = methodLabels[form.payment_method] || form.payment_method.toUpperCase();
                    alert(`Order #${orderData.order_id} placed successfully via ${label}!`);
                    dispatch(clearCart());
                } else {
                    setPaymentError(orderData.message || 'Failed to place order.');
                    alert(orderData.message || 'Failed to place order.');
                }
            } catch (err) {
                setPaymentError('An error occurred while placing your order. Please try again.');
                alert('An error occurred while placing your order. Please try again.');
            } finally {
                setIsProcessing(false);
            }
        }
    };
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
                                    {/* Cash on Delivery */}
                                    {codEnabled && (
                                        <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.payment_method === 'cod' ? 'border-primary bg-primary/5' : 'border-permanent/20 hover:border-permanent/40'}`}>
                                            <input type="radio" name="payment_method" value="cod" checked={form.payment_method === 'cod'} onChange={handleChange} className="w-5 h-5 text-primary focus:ring-primary border-gray-300 mt-0.5" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <RiHandCoinLine className="size-5 text-primary" />
                                                    <span className="block font-bold text-heading">Cash on Delivery (COD)</span>
                                                </div>
                                                <span className="block text-xs text-res mt-1">
                                                    {paymentSettings.cod_instructions?.value || 'Pay in cash upon delivery of your items.'}
                                                </span>
                                            </div>
                                        </label>
                                    )}

                                    {/* Credit / Debit Card (Stripe) */}
                                    {stripeEnabled && (
                                        <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.payment_method === 'card' ? 'border-primary bg-primary/5' : 'border-permanent/20 hover:border-permanent/40'}`}>
                                            <input type="radio" name="payment_method" value="card" checked={form.payment_method === 'card'} onChange={handleChange} className="w-5 h-5 text-primary focus:ring-primary border-gray-300 mt-0.5" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <RiBankCardLine className="size-5 text-primary" />
                                                    <span className="block font-bold text-heading">Credit / Debit Card (Stripe)</span>
                                                </div>
                                                <span className="block text-xs text-res mt-1">Pay instantly with Visa, MasterCard, or American Express</span>
                                            </div>
                                        </label>
                                    )}

                                    {/* PayPal */}
                                    {paypalEnabled && (
                                        <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.payment_method === 'paypal' ? 'border-primary bg-primary/5' : 'border-permanent/20 hover:border-permanent/40'}`}>
                                            <input type="radio" name="payment_method" value="paypal" checked={form.payment_method === 'paypal'} onChange={handleChange} className="w-5 h-5 text-primary focus:ring-primary border-gray-300 mt-0.5" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <RiPaypalLine className="size-5 text-[#0070ba]" />
                                                    <span className="block font-bold text-heading">PayPal</span>
                                                </div>
                                                <span className="block text-xs text-res mt-1">Pay securely via PayPal account balance or saved card</span>
                                            </div>
                                        </label>
                                    )}

                                    {/* Payoneer */}
                                    {payoneerEnabled && (
                                        <label className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.payment_method === 'payoneer' ? 'border-primary bg-primary/5' : 'border-permanent/20 hover:border-permanent/40'}`}>
                                            <input type="radio" name="payment_method" value="payoneer" checked={form.payment_method === 'payoneer'} onChange={handleChange} className="w-5 h-5 text-primary focus:ring-primary border-gray-300 mt-0.5" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <RiGlobalLine className="size-5 text-[#ff4800]" />
                                                    <span className="block font-bold text-heading">Payoneer</span>
                                                </div>
                                                <span className="block text-xs text-res mt-1">Global payment & mass checkout via Payoneer</span>
                                            </div>
                                        </label>
                                    )}

                                    {!codEnabled && !stripeEnabled && !paypalEnabled && !payoneerEnabled && (
                                        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-sm">
                                            No payment gateways are currently enabled in the Admin Settings.
                                        </div>
                                    )}
                                </div>

                                {form.payment_method === 'card' && stripeEnabled && (
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

                                {form.payment_method === 'paypal' && (
                                    <div className="mb-8 p-5 rounded-xl border border-blue-200 bg-blue-50/60 flex items-start gap-3">
                                        <RiPaypalLine className="size-6 text-[#0070ba] shrink-0 mt-0.5" />
                                        <div className="text-xs text-heading">
                                            <p className="font-semibold text-sm">PayPal Checkout Active</p>
                                            <p className="text-res mt-1">When clicking "Place Order", your order will be initialized with PayPal secure checkout.</p>
                                        </div>
                                    </div>
                                )}

                                {form.payment_method === 'payoneer' && (
                                    <div className="mb-8 p-5 rounded-xl border border-orange-200 bg-orange-50/60 flex items-start gap-3">
                                        <RiGlobalLine className="size-6 text-[#ff4800] shrink-0 mt-0.5" />
                                        <div className="text-xs text-heading">
                                            <p className="font-semibold text-sm">Payoneer Checkout Active</p>
                                            <p className="text-res mt-1">Your order will be processed through your Payoneer global account checkout.</p>
                                        </div>
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
    const { setting } = usePage().props;

    // Resolve the Stripe publishable key from settings (secret keys are stripped server-side)
    const stripeKey =
        setting?.payment?.stripe_key?.value ||
        setting?.payment?.stripe_publishable_key?.value ||
        setting?.stripe?.stripe_key?.value ||
        import.meta.env.VITE_STRIPE_KEY ||
        null;

    // loadStripe is safe to call with null — Elements will simply not initialise Stripe
    const stripePromise = useMemo(
        () => (stripeKey ? loadStripe(stripeKey) : null),
        [stripeKey]
    );

    return (
        <Elements stripe={stripePromise}>
            <CheckoutFormContent />
        </Elements>
    );
}

Checkout.layout = (view) => <FrontendLayout>{view}</FrontendLayout>;
