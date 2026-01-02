import React, { useState, useEffect } from 'react';

const PRODUCTS = [
    {
        id: 'plov_potion',
        name: 'Plov Potion Bundle',
        nameUz: 'Osh Iksiri',
        description: '5 Energy Potions - Play 5 more Speaking Battles',
        price: 5000,
        icon: '🍜',
        glow: 'from-green-400 to-emerald-600',
        tier: 'micro',
        energyGrant: 5
    },
    {
        id: 'sultan_pass',
        name: 'Samarkand Sultan Pass',
        nameUz: 'Samarqand Sulton Pasporti',
        description: 'Unlimited Writing Foundry + Custom 3D Avatar + 20% XP Boost for 30 days',
        price: 150000,
        icon: '👑',
        glow: 'from-yellow-400 to-amber-600',
        tier: 'premium',
        featured: true,
        duration: 30
    },
    {
        id: 'scholarship_oracle',
        name: 'Scholarship Oracle',
        nameUz: 'Stipendiya Bashorati',
        description: 'Full IELTS Mock Test graded by Titan AI + Signed Certificate',
        price: 300000,
        icon: '🏆',
        glow: 'from-purple-400 to-indigo-600',
        tier: 'elite',
        mockTests: 1
    }
];

export default function Marketplace({ userId, onClose }) {
    const [inventory, setInventory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(null);

    useEffect(() => {
        fetchInventory();
    }, [userId]);

    async function fetchInventory() {
        try {
            const response = await fetch(`/api/inventory/${userId}`);
            const data = await response.json();
            setInventory(data.inventory);
        } catch (error) {
            console.error('Failed to fetch inventory:', error);
        } finally {
            setLoading(false);
        }
    }

    async function initiatePayment(product) {
        setPurchasing(product.id);

        try {
            const response = await fetch('/api/marketplace/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    productId: product.id,
                    amount: product.price
                })
            });

            const { paymentUrl, mockPurchase } = await response.json();

            if (mockPurchase) {
                // Mock payment for testing (auto-complete after 2 seconds)
                setTimeout(async () => {
                    await fetch('/api/payment/webhook/mock', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            transaction_id: `MOCK_${Date.now()}`,
                            user_id: userId,
                            product_type: product.id,
                            amount: product.price,
                            status: 'success'
                        })
                    });
                    alert(`✅ Purchase successful! ${product.name} added to your inventory.`);
                    fetchInventory(); // Refresh inventory
                    setPurchasing(null);
                }, 2000);
            } else {
                // Real payment - open external page
                window.open(paymentUrl, '_blank');
                setPurchasing(null);
            }
        } catch (error) {
            console.error('Payment initiation failed:', error);
            alert('❌ Payment failed. Please try again.');
            setPurchasing(null);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 to-black p-4 md:p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-4xl md:text-6xl font-bold">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600">
                            Grand Bazaar
                        </span>
                    </h1>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-white transition-colors text-2xl"
                        >
                            ✕
                        </button>
                    )}
                </div>
                <p className="text-slate-400 text-center text-sm md:text-base">
                    Equip for victory. Upgrade your linguistic arsenal.
                </p>

                {/* Current Inventory */}
                {inventory && (
                    <div className="mt-6 bg-slate-800/50 backdrop-blur-xl rounded-2xl p-4 border border-slate-700">
                        <h3 className="text-sm font-bold text-slate-300 mb-3">Your Arsenal</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                                <div className="text-2xl mb-1">⚡</div>
                                <div className="text-xs text-slate-400">Energy</div>
                                <div className="text-lg font-bold text-green-400">{inventory.current_energy}/{inventory.max_energy}</div>
                            </div>
                            <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                                <div className="text-2xl mb-1">🍜</div>
                                <div className="text-xs text-slate-400">Potions</div>
                                <div className="text-lg font-bold text-emerald-400">{inventory.energy_potions}</div>
                            </div>
                            <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                                <div className="text-2xl mb-1">👑</div>
                                <div className="text-xs text-slate-400">Sultan Pass</div>
                                <div className="text-xs font-bold text-yellow-400">
                                    {inventory.sultan_pass_expires && new Date(inventory.sultan_pass_expires) > new Date()
                                        ? 'Active'
                                        : 'Inactive'}
                                </div>
                            </div>
                            <div className="bg-slate-900/50 rounded-xl p-3 text-center">
                                <div className="text-2xl mb-1">🏆</div>
                                <div className="text-xs text-slate-400">Oracles</div>
                                <div className="text-lg font-bold text-purple-400">{inventory.scholarship_oracle_count}</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {PRODUCTS.map(product => (
                    <div
                        key={product.id}
                        className={`relative rounded-3xl p-6 md:p-8 border-2 ${product.featured
                                ? 'border-yellow-500 md:scale-105 shadow-2xl shadow-yellow-500/20'
                                : 'border-slate-700'
                            } bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl hover:scale-105 transition-transform duration-300`}
                    >
                        {/* Featured Badge */}
                        {product.featured && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-black px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                Most Popular
                            </div>
                        )}

                        {/* Icon */}
                        <div className={`text-5xl md:text-6xl mb-4 bg-gradient-to-br ${product.glow} w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center mx-auto shadow-lg`}>
                            {product.icon}
                        </div>

                        {/* Product Info */}
                        <h3 className="text-xl md:text-2xl font-bold text-white text-center mb-2">{product.name}</h3>
                        <p className="text-slate-400 text-xs md:text-sm text-center mb-1">{product.nameUz}</p>
                        <p className="text-slate-300 text-xs md:text-sm text-center mb-6 min-h-[3rem]">{product.description}</p>

                        {/* Price */}
                        <div className="text-center mb-6">
                            <span className="text-3xl md:text-4xl font-bold text-yellow-400">
                                {product.price.toLocaleString()}
                            </span>
                            <span className="text-slate-400 ml-2 text-sm">UZS</span>
                            <div className="text-xs text-slate-500 mt-1">
                                ≈ ${(product.price / 12500).toFixed(2)} USD
                            </div>
                        </div>

                        {/* Purchase Button */}
                        <button
                            onClick={() => initiatePayment(product)}
                            disabled={purchasing === product.id}
                            className={`w-full py-3 md:py-4 rounded-xl font-bold text-white bg-gradient-to-r ${product.glow} hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base`}
                        >
                            {purchasing === product.id ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="animate-spin">⏳</span> Processing...
                                </span>
                            ) : (
                                'Purchase Now'
                            )}
                        </button>
                    </div>
                ))}
            </div>

            {/* Payment Info */}
            <div className="max-w-4xl mx-auto mt-12 text-center">
                <p className="text-slate-500 text-xs mb-2">
                    Secure payments powered by Click.uz and Payme.uz
                </p>
                <p className="text-slate-600 text-[10px]">
                    🔒 All transactions are encrypted and secure. Refunds available within 24 hours.
                </p>
            </div>
        </div>
    );
}
