import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function EquipmentInventory({ currentBandScore }) {
    const [equipmentCatalog, setEquipmentCatalog] = useState(null);
    const [unlockedItems, setUnlockedItems] = useState([]);
    const [equippedItems, setEquippedItems] = useState({});

    const bandValue = parseFloat(currentBandScore?.replace('band_', '') || '0');

    // Load equipment catalog
    useEffect(() => {
        fetch('/equipment-catalog.json')
            .then(res => res.json())
            .then(data => setEquipmentCatalog(data))
            .catch(err => console.error('Failed to load equipment:', err));
    }, []);

    useEffect(() => {
        if (!equipmentCatalog) return;
        // Filter equipment based on current band score
        const unlocked = equipmentCatalog.equipment_catalog.filter(
            item => item.band_required <= bandValue
        );
        setUnlockedItems(unlocked);
    }, [bandValue, equipmentCatalog]);

    const getRarityStyle = (rarity) => {
        if (!equipmentCatalog) return {};
        const color = equipmentCatalog.rarity_colors[rarity];
        return {
            borderColor: color,
            boxShadow: `0 0 15px ${color}40`
        };
    };

    const toggleEquip = (itemId, itemType) => {
        setEquippedItems(prev => {
            const newEquipped = { ...prev };
            if (newEquipped[itemType] === itemId) {
                delete newEquipped[itemType];
            } else {
                newEquipped[itemType] = itemId;
            }
            return newEquipped;
        });
    };

    const isEquipped = (itemId, itemType) => {
        return equippedItems[itemType] === itemId;
    };

    if (!equipmentCatalog) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white p-4 flex items-center justify-center">
                <div className="text-2xl">Loading equipment...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-2">
                        ⚔️ Equipment Vault
                    </h1>
                    <p className="text-zinc-400">
                        Unlock legendary gear by mastering IELTS
                    </p>
                    <div className="mt-4 text-sm text-zinc-500">
                        Current Band: <span className="text-yellow-400 font-bold">{bandValue.toFixed(1)}</span>
                    </div>
                </motion.div>

                {/* Equipment Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {equipmentCatalog.equipment_catalog.map((item, index) => {
                        const isUnlocked = item.band_required <= bandValue;
                        const equipped = isEquipped(item.id, item.type);

                        return (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.05 }}
                                className={`relative p-4 rounded-xl border-2 transition-all ${isUnlocked
                                    ? 'bg-zinc-800 hover:scale-105 cursor-pointer'
                                    : 'bg-zinc-900 opacity-50 cursor-not-allowed'
                                    }`}
                                style={isUnlocked ? getRarityStyle(item.rarity) : {}}
                                onClick={() => isUnlocked && toggleEquip(item.id, item.type)}
                            >
                                {/* Equipped Badge */}
                                {equipped && (
                                    <div className="absolute top-2 right-2 bg-green-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                                        EQUIPPED
                                    </div>
                                )}

                                {/* Lock Icon */}
                                {!isUnlocked && (
                                    <div className="absolute top-2 right-2 text-3xl">
                                        🔒
                                    </div>
                                )}

                                {/* Item Icon */}
                                <div className="text-6xl text-center mb-3">
                                    {item.icon}
                                </div>

                                {/* Item Name */}
                                <h3 className="text-lg font-bold text-center mb-2" style={{
                                    color: isUnlocked ? equipmentCatalog.rarity_colors[item.rarity] : '#6B7280'
                                }}>
                                    {item.name}
                                </h3>

                                {/* Rarity & Type */}
                                <div className="flex justify-center gap-2 mb-3">
                                    <span className="text-xs px-2 py-1 rounded-full bg-zinc-700 uppercase">
                                        {item.type}
                                    </span>
                                    <span
                                        className="text-xs px-2 py-1 rounded-full uppercase font-bold"
                                        style={{
                                            backgroundColor: isUnlocked ? equipmentCatalog.rarity_colors[item.rarity] : '#374151',
                                            color: '#000'
                                        }}
                                    >
                                        {item.rarity}
                                    </span>
                                </div>

                                {/* Description */}
                                <p className="text-sm text-zinc-400 text-center mb-3">
                                    {item.description}
                                </p>

                                {/* Stats */}
                                <div className="bg-zinc-900 rounded-lg p-2 mb-3">
                                    {Object.entries(item.stat_bonus).map(([stat, bonus]) => (
                                        <div key={stat} className="flex justify-between text-xs">
                                            <span className="text-zinc-500">{stat.replace('_', ' ')}</span>
                                            <span className="text-green-400">+{bonus}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Unlock Requirement */}
                                <div className="text-center text-xs">
                                    {isUnlocked ? (
                                        <span className="text-green-400">✓ Unlocked</span>
                                    ) : (
                                        <span className="text-red-400">
                                            🔒 Requires Band {item.band_required.toFixed(1)}
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Summary */}
                <div className="mt-8 bg-zinc-800 rounded-xl p-6 border border-zinc-700">
                    <h3 className="text-xl font-bold mb-4 text-center">📊 Collection Progress</h3>
                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div>
                            <div className="text-3xl font-bold text-yellow-400">
                                {unlockedItems.length}/{equipmentCatalog.equipment_catalog.length}
                            </div>
                            <div className="text-sm text-zinc-400">Items Unlocked</div>
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-green-400">
                                {Object.keys(equippedItems).length}
                            </div>
                            <div className="text-sm text-zinc-400">Items Equipped</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
