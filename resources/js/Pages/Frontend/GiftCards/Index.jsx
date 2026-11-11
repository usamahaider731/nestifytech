import React, { useState, useMemo } from 'react'
import FrontendLayout from '@/Layouts/FrontendLayout'
import { Head, Link, usePage } from '@inertiajs/react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import {
  RiGiftLine,
  RiSparklingFill,
  RiCheckDoubleLine,
  RiSecurePaymentLine,
  RiFileCopyLine,
  RiShoppingBag3Line,
  RiArrowRightLine,
  RiShieldCheckLine,
  RiBankCardLine,
  RiMoneyDollarCircleLine,
  RiPaypalLine,
  RiLockLine,
} from 'react-icons/ri'

// Internal component wrapped inside Stripe Elements
function GiftCardPurchaseForm({
  selectedTier,
  isProcessing,
  setIsProcessing,
  setPurchasedCard,
  stripePublishableKey,
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [paymentMethod, setPaymentMethod] = useState('card') // 'card' | 'wallet'
  const [recipientEmail, setRecipientEmail] = useState('')
  const [cardError, setCardError] = useState(null)

  const handlePurchase = async (e) => {
    e.preventDefault()
    if (!selectedTier) return
    setIsProcessing(true)
    setCardError(null)

    try {
      if (paymentMethod === 'card') {
        if (!stripe || !elements) {
          toast.error('Payment gateway is loading. Please try again.')
          setIsProcessing(false)
          return
        }

        const cardElement = elements.getElement(CardElement)
        if (!cardElement) {
          toast.error('Card input not found.')
          setIsProcessing(false)
          return
        }

        // 1. Create Payment Intent from backend
        const intentRes = await axios.post(route('api.gift-card.create-payment-intent'), {
          purchase_price: selectedTier.purchase_price,
          initial_balance: selectedTier.initial_balance,
          title: selectedTier.title,
          recipient_email: recipientEmail,
        })

        const { clientSecret, paymentIntentId } = intentRes.data

        if (!clientSecret) {
          throw new Error('Unable to initialize card transaction.')
        }

        // 2. Confirm card payment through Stripe.js
        const confirmResult = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: recipientEmail || undefined,
            },
          },
        })

        if (confirmResult.error) {
          setCardError(confirmResult.error.message)
          toast.error(confirmResult.error.message)
          setIsProcessing(false)
          return
        }

        // 3. Issue gift card on verified payment
        const successRes = await axios.post(route('api.gift-card.purchase-success'), {
          payment_intent_id: confirmResult.paymentIntent.id,
          purchase_price: selectedTier.purchase_price,
          initial_balance: selectedTier.initial_balance,
          title: selectedTier.title,
        })

        if (successRes.data?.success) {
          setPurchasedCard({
            code: successRes.data.code,
            balance: successRes.data.initial_balance,
            price: successRes.data.purchase_price,
            bonus: successRes.data.bonus,
            title: selectedTier.title,
          })
          toast.success('Gift card successfully purchased & activated!')
        }
      }
    } catch (err) {
      console.error(err)
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Payment failed.'
      setCardError(msg)
      toast.error(msg)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handlePurchase} className="space-y-6">
      {/* Recipient Email */}
      <div>
        <label className="block text-xs font-bold text-heading uppercase tracking-wider mb-2">
          Your Email / Recipient Email <span className="text-secondary font-normal">(for digital delivery)</span>
        </label>
        <input
          type="email"
          placeholder="e.g. name@example.com"
          value={recipientEmail}
          onChange={(e) => setRecipientEmail(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 text-sm heading focus:ring-2 focus:ring-primary/30 outline-none"
        />
      </div>

      {/* Payment Method Selector */}
      <div>
        <label className="block text-xs font-bold text-heading uppercase tracking-wider mb-2.5">
          Select Payment Method
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod('card')}
            className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all text-left ${
              paymentMethod === 'card'
                ? 'border-primary bg-primary/5 text-heading font-bold shadow-sm'
                : 'border-gray-200 dark:border-slate-800 text-secondary hover:border-primary/40'
            }`}
          >
            <div className={`size-10 rounded-xl flex items-center justify-center text-xl ${
              paymentMethod === 'card' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-slate-800 text-secondary'
            }`}>
              <RiBankCardLine />
            </div>
            <div>
              <span className="block text-sm">Credit / Debit Card</span>
              <span className="text-[11px] opacity-70">Visa, Mastercard, Stripe</span>
            </div>
          </button>
        </div>
      </div>

      {/* Card Details Element */}
      {paymentMethod === 'card' && (
        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-heading flex items-center gap-1.5">
              <RiLockLine className="text-emerald-500" /> Secure Card Details
            </span>
            <span className="text-[10px] text-secondary">256-bit SSL Encryption</span>
          </div>
          <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-gray-300 dark:border-slate-700">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '15px',
                    color: '#32325d',
                    '::placeholder': { color: '#aab7c4' },
                  },
                  invalid: { color: '#fa755a' },
                },
              }}
            />
          </div>
          {cardError && (
            <p className="text-xs text-rose-500 font-medium">{cardError}</p>
          )}
        </div>
      )}

      {/* Purchase Submit Button */}
      <button
        type="submit"
        disabled={isProcessing}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-orange-500 text-white font-extrabold text-base shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-3 disabled:opacity-60 cursor-pointer"
      >
        <RiSecurePaymentLine className="text-xl" />
        <span>
          {isProcessing
            ? 'Processing Secure Payment...'
            : `Pay PKR ${Number(selectedTier.purchase_price).toLocaleString()} & Get PKR ${Number(selectedTier.initial_balance).toLocaleString()}`}
        </span>
      </button>
    </form>
  )
}

export default function GiftCardsIndex({
  availableCards = [],
  defaultTiers = [],
  myGiftCards = [],
  stripePublishableKey,
}) {
  const { auth } = usePage().props
  const [selectedTier, setSelectedTier] = useState(defaultTiers[2] || defaultTiers[0])
  const [isProcessing, setIsProcessing] = useState(false)
  const [purchasedCard, setPurchasedCard] = useState(null)
  const [copiedCode, setCopiedCode] = useState(false)

  // Initialize Stripe
  const stripePromise = useMemo(() => {
    return stripePublishableKey ? loadStripe(stripePublishableKey) : null
  }, [stripePublishableKey])

  // Combined cards list
  const tiersToDisplay = availableCards.length > 0
    ? availableCards.map(c => ({
        id: c.id,
        title: c.title || 'Gift Voucher',
        purchase_price: Number(c.purchase_price || c.initial_balance),
        initial_balance: Number(c.initial_balance),
        bonus: Math.max(0, Number(c.initial_balance) - Number(c.purchase_price || c.initial_balance)),
        note: c.note || `Get PKR ${Number(c.initial_balance).toLocaleString()} shopping credit`,
      }))
    : defaultTiers

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(true)
    toast.success('Gift card code copied to clipboard!')
    setTimeout(() => setCopiedCode(false), 2500)
  }

  return (
    <FrontendLayout>
      <Head title="Buy Gift Cards & Discount Vouchers - NestifyTech" />

      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-12">

          {/* ── Hero Header ── */}
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider">
              <RiSparklingFill className="text-primary animate-pulse" />
              <span>Special Promotional Offer • Pay Less, Get More</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-extrabold text-heading tracking-tight">
              Buy Gift Cards & Get <span className="text-primary underline decoration-primary/40 underline-offset-8">Extra Shopping Credit</span>
            </h1>
            <p className="text-base sm:text-lg text-secondary">
              Pay securely via Credit/Debit card and instantly receive your gift card code. Redeem anytime at checkout for 100% instant shopping credit!
            </p>
          </div>

          {/* ── Success Modal / Card Generated Banner ── */}
          {purchasedCard && (
            <div className="p-8 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-teal-500/10 border-2 border-emerald-500/30 text-center max-w-2xl mx-auto shadow-xl space-y-5">
              <div className="size-16 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center text-3xl shadow-lg">
                <RiGiftLine />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-heading">Gift Card Issued Successfully!</h3>
                <p className="text-sm text-secondary mt-1">
                  You paid <strong>PKR {Number(purchasedCard.price).toLocaleString()}</strong> and received <strong>PKR {Number(purchasedCard.balance).toLocaleString()}</strong> shopping balance (+PKR {Number(purchasedCard.bonus).toLocaleString()} Bonus).
                </p>
              </div>

              {/* Code Box */}
              <div className="flex items-center justify-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-emerald-500/30 shadow-inner">
                <span className="font-mono text-2xl font-extrabold text-primary tracking-widest">
                  {purchasedCard.code}
                </span>
                <button
                  onClick={() => handleCopy(purchasedCard.code)}
                  className="px-4 py-2 rounded-xl bg-primary text-white font-semibold text-xs flex items-center gap-1.5 hover:opacity-90 transition-opacity cursor-pointer"
                >
                  {copiedCode ? <RiCheckDoubleLine className="text-base" /> : <RiFileCopyLine className="text-base" />}
                  <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-4 pt-2">
                <Link
                  href={route('checkout')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 shadow-md transition-all"
                >
                  <RiShoppingBag3Line />
                  <span>Redeem at Checkout</span>
                </Link>
                <button
                  onClick={() => setPurchasedCard(null)}
                  className="px-5 py-3 rounded-xl border border-gray-300 dark:border-slate-700 text-secondary hover:text-heading font-medium text-sm transition-colors cursor-pointer"
                >
                  Buy Another Card
                </button>
              </div>
            </div>
          )}

          {/* ── Tier Cards Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiersToDisplay.map((tier, idx) => {
              const isSelected = selectedTier?.title === tier.title || selectedTier?.id === tier.id
              const bonusAmount = tier.bonus || (tier.initial_balance - tier.purchase_price)

              return (
                <div
                  key={tier.id || idx}
                  onClick={() => setSelectedTier(tier)}
                  className={`relative cursor-pointer rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between border-2 ${
                    isSelected
                      ? 'border-primary bg-primary/[0.03] shadow-2xl scale-[1.02]'
                      : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-primary/40 shadow-sm'
                  }`}
                >
                  {tier.popular && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-[11px] uppercase tracking-wider shadow-md">
                      Most Popular
                    </span>
                  )}

                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">
                        <RiGiftLine />
                      </div>
                      <div className="text-right">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                          +PKR {Number(bonusAmount).toLocaleString()} Free
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-lg text-heading">{tier.title}</h3>
                      <p className="text-xs text-secondary mt-1">{tier.note}</p>
                    </div>

                    {/* Pricing Breakdown */}
                    <div className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/60 space-y-2 border border-gray-100 dark:border-slate-700">
                      <div className="flex justify-between items-center text-xs text-secondary">
                        <span>You Pay (Cost):</span>
                        <strong className="text-heading text-sm font-bold">
                          PKR {Number(tier.purchase_price).toLocaleString()}
                        </strong>
                      </div>
                      <div className="flex justify-between items-center text-xs text-emerald-600 font-semibold">
                        <span>Free Bonus Credit:</span>
                        <span>+PKR {Number(bonusAmount).toLocaleString()}</span>
                      </div>
                      <div className="pt-2 border-t border-gray-200 dark:border-slate-700 flex justify-between items-center">
                        <span className="text-xs font-bold text-heading">Shopping Balance:</span>
                        <span className="text-lg font-black text-primary font-mono">
                          PKR {Number(tier.initial_balance).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Radio Selector */}
                  <div className="pt-6">
                    <button
                      type="button"
                      className={`w-full py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                        isSelected
                          ? 'bg-primary text-white shadow-md'
                          : 'border border-primary/30 text-primary hover:bg-primary/10'
                      }`}
                    >
                      <span>{isSelected ? 'Selected Plan' : 'Choose Plan'}</span>
                      <RiArrowRightLine />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── Summary & Integrated Payment Panel ── */}
          {selectedTier && (
            <div className="max-w-xl mx-auto rounded-3xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-8 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xl font-bold text-heading">Checkout & Payment</h3>
                  <p className="text-xs text-secondary mt-0.5">Pay securely to instantly unlock code</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-secondary block">Selected Card</span>
                  <span className="text-sm font-bold text-primary">{selectedTier.title}</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-secondary">
                  <span>Gift Card Total Face Value:</span>
                  <span className="font-semibold text-heading font-mono">
                    PKR {Number(selectedTier.initial_balance).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Instant Promotional Bonus:</span>
                  <span>- PKR {Number(selectedTier.bonus || (selectedTier.initial_balance - selectedTier.purchase_price)).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-heading pt-3 border-t border-gray-100 dark:border-slate-800">
                  <span>Total Amount to Pay:</span>
                  <span className="text-2xl text-primary font-mono">
                    PKR {Number(selectedTier.purchase_price).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Stripe Elements Payment Form */}
              <Elements stripe={stripePromise}>
                <GiftCardPurchaseForm
                  selectedTier={selectedTier}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                  setPurchasedCard={setPurchasedCard}
                  stripePublishableKey={stripePublishableKey}
                />
              </Elements>

              <div className="flex items-center justify-center gap-6 text-xs text-secondary pt-2">
                <span className="flex items-center gap-1">
                  <RiShieldCheckLine className="text-emerald-500" /> 100% Secure Checkout
                </span>
                <span className="flex items-center gap-1">
                  <RiCheckDoubleLine className="text-primary" /> Instant Code Generation
                </span>
              </div>
            </div>
          )}

          {/* ── User's Existing Gift Cards ── */}
          {myGiftCards.length > 0 && (
            <div className="mt-16 space-y-6">
              <div className="border-t border-gray-200 dark:border-slate-800 pt-10">
                <h2 className="text-2xl font-bold text-heading flex items-center gap-2">
                  <RiGiftLine className="text-primary" />
                  <span>My Active Gift Cards</span>
                </h2>
                <p className="text-sm text-secondary mt-1">All gift vouchers linked to your account.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {myGiftCards.map(gc => (
                  <div
                    key={gc.id}
                    className="p-5 rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-primary">{gc.code}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        gc.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-500/10 text-gray-400'
                      }`}>
                        {gc.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-[11px] text-secondary block">Remaining Balance</span>
                        <strong className="text-lg font-bold text-heading font-mono">
                          PKR {Number(gc.remaining_balance).toLocaleString()}
                        </strong>
                      </div>
                      <button
                        onClick={() => handleCopy(gc.code)}
                        className="px-3 py-1.5 rounded-lg border border-primary/30 text-primary text-xs font-semibold hover:bg-primary hover:text-white transition-colors cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </FrontendLayout>
  )
}
