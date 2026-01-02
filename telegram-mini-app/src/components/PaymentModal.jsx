import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PaymentModal({ isOpen, onClose, itemName = "Sultan's Pass", price = "49,000 UZS" }) {
    const [step, setStep] = useState('select'); // select, processing, success

    if (!isOpen) return null;

    const handlePayment = (provider) => {
        // Prevent double-click
        if (step === 'processing' || step === 'success') return;

        // Idempotency check (prevent infinite buying in same session)
        const transactionKey = `tx_${itemName}_${new Date().toISOString().split('T')[0]}`;
        if (localStorage.getItem(transactionKey)) {
            alert("You have already purchased this item today!");
            return;
        }

        setStep('processing');

        // Simulate network latency & verification
        setTimeout(() => {
            localStorage.setItem(transactionKey, 'success');
            setStep('success');
        }, 2000);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-zinc-900 border border-zinc-700 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
                >
                    {step === 'select' && (
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-white">Secure Checkout</h3>
                                <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
                            </div>

                            <div className="mb-8 text-center relative">
                                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black font-bold text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                                    Demo Mode
                                </div>
                                <div className="text-sm text-gray-400 mb-1">Purchasing</div>
                                <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                                    {itemName}
                                </div>
                                <div className="text-3xl font-bold text-white mt-2">{price}</div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => handlePayment('click')}
                                    className="w-full bg-white hover:bg-gray-100 py-4 rounded-xl flex items-center justify-between px-6 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-xs italic">C</div>
                                        <span className="text-black font-bold text-lg">CLICK</span>
                                    </div>
                                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 group-hover:border-blue-500"></div>
                                </button>

                                <button
                                    onClick={() => handlePayment('payme')}
                                    className="w-full bg-teal-50 hover:bg-teal-100 py-4 rounded-xl flex items-center justify-between px-6 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-teal-400 flex items-center justify-center text-white font-bold text-xs">P</div>
                                        <span className="text-teal-600 font-bold text-lg">Payme</span>
                                    </div>
                                    <div className="w-4 h-4 rounded-full border-2 border-teal-300 group-hover:border-teal-500"></div>
                                </button>
                            </div>

                            <p className="text-xs text-center text-gray-500 mt-6">
                                Secure payments processed via UZCARD / HUMO
                            </p>
                        </div>
                    )}

                    {step === 'processing' && (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                            <h3 className="text-xl font-bold text-white mb-2">Processing...</h3>
                            <p className="text-gray-400">Jarayon ketmoqda...</p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="p-8 text-center bg-gradient-to-b from-green-900/20 to-zinc-900">
                            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-lg shadow-green-500/20">
                                ✓
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Payment Successful!</h3>
                            <p className="text-green-400 mb-2">To'lov muvaffaqiyatli amalga oshirildi.</p>
                            <p className="text-xs text-gray-500 mb-8">(Simulation Only - No Charge)</p>
                            <button
                                onClick={onClose}
                                className="w-full py-3 bg-green-500 hover:bg-green-600 text-black font-bold rounded-xl transition-colors"
                            >
                                Continue
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
