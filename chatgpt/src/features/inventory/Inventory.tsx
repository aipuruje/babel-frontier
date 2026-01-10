// Inventory Management System

import { useState } from 'react';
import { usePlayerState } from '../../lib/playerState';
import './Inventory.css';

interface ItemDetails {
    id: string;
    name: string;
    description: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    category: 'Consumable' | 'Equipment' | 'Material' | 'Quest Item';
    icon: string;
    effects?: string[];
}

const mockItemDetails: Record<string, ItemDetails> = {
    'HP_POTION': {
        id: 'HP_POTION',
        name: 'HP Potion',
        description: 'Restores 2 HP in battle. Can turn the tide when facing tough enemies.',
        rarity: 'common',
        category: 'Consumable',
        icon: '🧪',
        effects: ['Restore 2 HP', 'Usable in battle']
    },
    'TIME_CRYSTAL': {
        id: 'TIME_CRYSTAL',
        name: 'Time Crystal',
        description: 'A fragment of crystallized time. Adds 30 seconds to your battle timer.',
        rarity: 'rare',
        category: 'Consumable',
        icon: '⏳',
        effects: ['+30 seconds', 'Usable in battle']
    },
    'MASTERY_SCROLL_READING': {
        id: 'MASTERY_SCROLL_READING',
        name: 'Reading Mastery Scroll',
        description: 'Ancient knowledge bound in runes. Boosts Reading mastery by 5%.',
        rarity: 'epic',
        category: 'Consumable',
        icon: '📜',
        effects: ['+5% Reading Mastery', 'One-time use']
    },
    'RUNE_FRAGMENT': {
        id: 'RUNE_FRAGMENT',
        name: 'Rune Fragment',
        description: 'A shard of an ancient rune. Used for crafting powerful items.',
        rarity: 'uncommon',
        category: 'Material',
        icon: '💎',
    },
    'QUEST_KEY': {
        id: 'QUEST_KEY',
        name: 'Mysterious Key',
        description: 'A key obtained from completing quests. Its purpose remains unknown...',
        rarity: 'rare',
        category: 'Quest Item',
        icon: '🔑',
    }
};

type Category = 'All' | 'Consumable' | 'Equipment' | 'Material' | 'Quest Item';

export default function Inventory() {
    const { playerState } = usePlayerState();
    const [selectedCategory, setSelectedCategory] = useState<Category>('All');
    const [selectedItem, setSelectedItem] = useState<ItemDetails | null>(null);

    // Get items from player state inventory
    const inventoryItems = playerState.inventory?.items || [];

    // Convert to flat array of itemIds for backward compatibility
    const playerItems: string[] = [];
    inventoryItems.forEach(item => {
        for (let i = 0; i < item.qty; i++) {
            playerItems.push(item.itemId);
        }
    });

    // Count and aggregate items
    const itemCounts: Record<string, number> = {};
    playerItems.forEach(itemId => {
        itemCounts[itemId] = (itemCounts[itemId] || 0) + 1;
    });

    // Get unique items with details
    const uniqueItems = Object.keys(itemCounts)
        .map(itemId => ({
            ...mockItemDetails[itemId],
            quantity: itemCounts[itemId]
        }))
        .filter(item => item.id); // Filter out items without details

    // Filter by category
    const filteredItems = selectedCategory === 'All'
        ? uniqueItems
        : uniqueItems.filter(item => item.category === selectedCategory);

    const handleItemClick = (item: ItemDetails) => {
        setSelectedItem(item);
    };

    const handleUseItem = (itemId: string) => {
        // TODO: Implement item usage when backend is ready
        console.log('Using item:', itemId);
        alert('Item usage coming soon! This will call the backend API.');
        setSelectedItem(null);
    };

    return (
        <div className="inventory-page">
            <div className="inventory-header">
                <h1>⚔️ Inventory</h1>
                <div className="shards-display">
                    <span className="shard-icon">✦</span>
                    <span className="shard-count">{playerState.shards || 0}</span>
                    <span className="shard-label">Rune Shards</span>
                </div>
            </div>

            <div className="category-filter">
                {(['All', 'Consumable', 'Equipment', 'Material', 'Quest Item'] as Category[]).map(cat => (
                    <button
                        key={cat}
                        className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {filteredItems.length === 0 ? (
                <div className="empty-inventory">
                    <div className="empty-icon">📦</div>
                    <p>No items in this category</p>
                    <p className="empty-hint">Complete quests to earn rewards!</p>
                </div>
            ) : (
                <div className="items-grid">
                    {filteredItems.map((item) => (
                        <div
                            key={item.id}
                            className={`item-card rarity-${item.rarity}`}
                            onClick={() => handleItemClick(item)}
                        >
                            <div className="item-icon">{item.icon}</div>
                            <div className="item-name">{item.name}</div>
                            <div className="item-quantity">×{item.quantity}</div>
                            <div className={`item-rarity rarity-${item.rarity}`}>
                                {item.rarity}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Item Details Modal */}
            {selectedItem && (
                <div className="item-modal-overlay" onClick={() => setSelectedItem(null)}>
                    <div className="item-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedItem(null)}>
                            ✕
                        </button>

                        <div className="modal-header">
                            <div className="modal-icon">{selectedItem.icon}</div>
                            <div>
                                <h2>{selectedItem.name}</h2>
                                <div className={`modal-rarity rarity-${selectedItem.rarity}`}>
                                    {selectedItem.rarity}
                                </div>
                            </div>
                        </div>

                        <div className="modal-category">{selectedItem.category}</div>

                        <p className="modal-description">{selectedItem.description}</p>

                        {selectedItem.effects && selectedItem.effects.length > 0 && (
                            <div className="modal-effects">
                                <h3>Effects:</h3>
                                <ul>
                                    {selectedItem.effects.map((effect, i) => (
                                        <li key={i}>{effect}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {selectedItem.category === 'Consumable' && (
                            <button
                                className="btn btn-gold use-item-btn"
                                onClick={() => handleUseItem(selectedItem.id)}
                            >
                                Use Item
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
