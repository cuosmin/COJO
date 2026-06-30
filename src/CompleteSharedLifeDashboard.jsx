import React, { useState, useEffect } from 'react';
import {
  Leaf, UtensilsCrossed, Wallet, Heart, MapPin, Plus, Trash2, Check,
  AlertCircle, LogOut, Settings, Camera, BarChart3, Calendar,
  Home, Mail, Bell
} from 'lucide-react';
import { auth } from './firebaseConfig';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { ref, onValue, set } from 'firebase/database';
import { getDatabase } from 'firebase/database';

import { calculatePlantHealth, calculateSpendingTrends, calculateIntimacyInsights, generateWeeklyInsight } from './analyticsUtils';
import { setupNotificationScheduler } from './notificationUtils';
import { getPlantPhotos, capturePhotoFromCamera, compressImage, savePhotoToStorage } from './photoJournalUtils';

const provider = new GoogleAuthProvider();
const database = getDatabase();

export default function COJO() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [showSettings, setShowSettings] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Data state
  const [plants, setPlants] = useState([]);
  const [meals, setMeals] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [intimacy, setIntimacy] = useState([]);
  const [travelMeals, setTravelMeals] = useState([]);
  const [photos, setPhotos] = useState({});

  // UI state
  const [newItem, setNewItem] = useState('');
  const [selectedMood, setSelectedMood] = useState('neutral');

  // Auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadSharedData(currentUser.uid);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load data
  const loadSharedData = (userId) => {
    const sharedRef = ref(database, 'shared-data/default');
    onValue(sharedRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setPlants(data.plants || []);
        setMeals(data.meals || []);
        setExpenses(data.expenses || []);
        setIntimacy(data.intimacy || []);
        setTravelMeals(data.travelMeals || []);
        setupNotificationScheduler(data.plants || [], data.expenses || [], data.intimacy || []);
      }
      setLoading(false);
    });
  };

  const saveData = async (newPlants, newMeals, newExpenses, newIntimacy, newTravelMeals) => {
    try {
      const sharedRef = ref(database, 'shared-data/default');
      await set(sharedRef, {
        plants: newPlants,
        meals: newMeals,
        expenses: newExpenses,
        intimacy: newIntimacy,
        travelMeals: newTravelMeals,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  // ==================== PLANTS ====================
  const addPlant = () => {
    if (newItem.trim()) {
      const plant = {
        id: Date.now().toString(),
        name: newItem,
        addedDate: new Date().toISOString(),
        lastWatered: new Date().toISOString(),
        wateringFreqDays: 7,
        healthLevel: 100,
      };
      const updated = [...plants, plant];
      setPlants(updated);
      saveData(updated, meals, expenses, intimacy, travelMeals);
      setNewItem('');
    }
  };

  const waterPlant = (id) => {
    const updated = plants.map(p =>
      p.id === id ? { ...p, lastWatered: new Date().toISOString(), healthLevel: Math.min(100, p.healthLevel + 10) } : p
    );
    setPlants(updated);
    saveData(updated, meals, expenses, intimacy, travelMeals);
  };

  const deletePlant = (id) => {
    const updated = plants.filter(p => p.id !== id);
    setPlants(updated);
    saveData(updated, meals, expenses, intimacy, travelMeals);
  };

  const takePlantPhoto = async (plantId) => {
    try {
      const photoData = await capturePhotoFromCamera();
      const compressed = await compressImage(photoData);
      const photoId = await savePhotoToStorage(plantId, compressed);
      if (photoId) {
        const plantPhotos = await getPlantPhotos(plantId);
        setPhotos({ ...photos, [plantId]: plantPhotos });
      }
    } catch (error) {
      console.error('Failed to take photo:', error);
    }
  };

  // ==================== FOOD ====================
  const addMeal = () => {
    if (newItem.trim()) {
      const meal = {
        id: Date.now().toString(),
        name: newItem,
        plannedDate: new Date().toISOString().split('T')[0],
        shoppingNeeded: false,
      };
      const updated = [...meals, meal];
      setMeals(updated);
      saveData(plants, updated, expenses, intimacy, travelMeals);
      setNewItem('');
    }
  };

  const toggleMealShopping = (id) => {
    const updated = meals.map(m =>
      m.id === id ? { ...m, shoppingNeeded: !m.shoppingNeeded } : m
    );
    setMeals(updated);
    saveData(plants, updated, expenses, intimacy, travelMeals);
  };

  const deleteMeal = (id) => {
    const updated = meals.filter(m => m.id !== id);
    setMeals(updated);
    saveData(plants, updated, expenses, intimacy, travelMeals);
  };

  // ==================== BUDGET ====================
  const addExpense = () => {
    if (newItem.trim()) {
      const expense = {
        id: Date.now().toString(),
        description: newItem,
        category: 'food',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
      };
      const updated = [...expenses, expense];
      setExpenses(updated);
      saveData(plants, meals, updated, intimacy, travelMeals);
      setNewItem('');
    }
  };

  const updateExpense = (id, amount) => {
    const updated = expenses.map(e =>
      e.id === id ? { ...e, amount: parseFloat(amount) } : e
    );
    setExpenses(updated);
    saveData(plants, meals, updated, intimacy, travelMeals);
  };

  const deleteExpense = (id) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    saveData(plants, meals, updated, intimacy, travelMeals);
  };

  // ==================== INTIMACY ====================
  const addIntimacyEvent = () => {
    if (newItem.trim()) {
      const event = {
        id: Date.now().toString(),
        title: newItem,
        scheduledDate: new Date().toISOString().split('T')[0],
        completed: false,
        mood: 'neutral',
      };
      const updated = [...intimacy, event];
      setIntimacy(updated);
      saveData(plants, meals, expenses, updated, travelMeals);
      setNewItem('');
      setSelectedMood('neutral');
    }
  };

  const toggleIntimacyComplete = (id) => {
    const updated = intimacy.map(i =>
      i.id === id ? { ...i, completed: !i.completed, mood: selectedMood } : i
    );
    setIntimacy(updated);
    saveData(plants, meals, expenses, updated, travelMeals);
  };

  const updateIntimacyMood = (id, mood) => {
    const updated = intimacy.map(i =>
      i.id === id ? { ...i, mood } : i
    );
    setIntimacy(updated);
    saveData(plants, meals, expenses, updated, travelMeals);
  };

  const deleteIntimacy = (id) => {
    const updated = intimacy.filter(i => i.id !== id);
    setIntimacy(updated);
    saveData(plants, meals, expenses, updated, travelMeals);
  };

  // ==================== TRAVEL ====================
  const addTravelMeal = () => {
    if (newItem.trim()) {
      const meal = {
        id: Date.now().toString(),
        hotelMeal: newItem,
        homeRecipe: '',
        date: new Date().toISOString().split('T')[0],
      };
      const updated = [...travelMeals, meal];
      setTravelMeals(updated);
      saveData(plants, meals, expenses, intimacy, updated);
      setNewItem('');
    }
  };

  const updateTravelMeal = (id, homeRecipe) => {
    const updated = travelMeals.map(tm =>
      tm.id === id ? { ...tm, homeRecipe } : tm
    );
    setTravelMeals(updated);
    saveData(plants, meals, expenses, intimacy, updated);
  };

  const deleteTravelMeal = (id) => {
    const updated = travelMeals.filter(tm => tm.id !== id);
    setTravelMeals(updated);
    saveData(plants, meals, expenses, intimacy, updated);
  };

  // ==================== AUTH ====================
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // ==================== HELPERS ====================
  const getDaysSinceWatered = (lastWatered) => {
    const last = new Date(lastWatered);
    const now = new Date();
    return Math.floor((now - last) / (1000 * 60 * 60 * 24));
  };

  const isWaterNeeded = (plant) => {
    return getDaysSinceWatered(plant.lastWatered) >= plant.wateringFreqDays - 1;
  };

  // ==================== CALCULATIONS ====================
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const foodExpenses = expenses.filter(e => e.category === 'food').reduce((sum, e) => sum + (e.amount || 0), 0);
  const plantHealthStats = calculatePlantHealth(plants);
  const spendingTrends = calculateSpendingTrends(expenses, 30);
  const intimacyInsights = calculateIntimacyInsights(intimacy);
  const weeklyInsight = generateWeeklyInsight(plants, expenses, intimacy, meals);

  // ==================== UI LOADING ====================
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: '600', marginBottom: '8px', color: 'var(--text-primary)' }}>COJO</div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '14px' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-primary)', padding: '20px' }}>
        <div style={{ maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', fontWeight: '600', marginBottom: '12px', color: 'var(--text-primary)' }}>COJO</div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>A beautiful dashboard for couples to organize plants, meals, budgets, and intimacy together.</p>
          <button onClick={handleLogin} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
            Sign in with Google
          </button>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '16px' }}>
            Both partners sign in to sync data in real-time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', padding: '20px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>COJO</h1>
            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>Real-time sync • Both connected</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {user.displayName || user.email}
            </div>
            <button onClick={() => setShowSettings(!showSettings)} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
              <Settings size={18} />
            </button>
            <button onClick={handleLogout} className="btn btn-ghost" style={{ color: 'var(--accent-red)' }}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', padding: '0 20px', display: 'flex', gap: '0', overflowX: 'auto', position: 'sticky', top: '80px', zIndex: 40 }}>
        {[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'plants', label: 'Plants', icon: Leaf },
          { id: 'food', label: 'Food', icon: UtensilsCrossed },
          { id: 'budget', label: 'Budget', icon: Wallet },
          { id: 'intimacy', label: 'Intimacy', icon: Heart },
          { id: 'travel', label: 'Travel', icon: MapPin },
          { id: 'insights', label: 'Insights', icon: BarChart3 },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: '1',
                padding: '12px 16px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? '2px solid var(--accent-blue)' : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--accent-blue)' : 'var(--text-tertiary)',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                gap: '8px',
                alignItems: 'center',
                transition: 'var(--transition)',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {/* Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 20px' }}>
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            <div className="card">
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-tertiary)', margin: '0 0 12px' }}>🌿 PLANT HEALTH</h3>
              <div style={{ fontSize: '32px', fontWeight: '600', margin: '0 0 8px' }}>{plantHealthStats.healthPercentage}%</div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                {plantHealthStats.healthy}/{plantHealthStats.total} thriving
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-tertiary)', margin: '0 0 12px' }}>💰 SPENDING (30 DAYS)</h3>
              <div style={{ fontSize: '32px', fontWeight: '600', margin: '0 0 8px' }}>€{spendingTrends.total.toFixed(2)}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                {spendingTrends.count} transactions
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-tertiary)', margin: '0 0 12px' }}>💕 INTIMACY</h3>
              <div style={{ fontSize: '32px', fontWeight: '600', margin: '0 0 8px' }}>{intimacyInsights.thisMonth}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                moments this month
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-tertiary)', margin: '0 0 12px' }}>🍽️ MEALS PLANNED</h3>
              <div style={{ fontSize: '32px', fontWeight: '600', margin: '0 0 8px' }}>{meals.length}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                {meals.filter(m => m.shoppingNeeded).length} need shopping
              </div>
            </div>
          </div>
        )}

        {/* PLANTS TAB */}
        {activeTab === 'plants' && (
          <div style={{ display: 'grid', gap: '24px' }}>
            <div className="card">
              <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 16px' }}>Plant Care</h2>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addPlant()}
                  placeholder="Add plant name..."
                  style={{ flex: 1 }}
                />
                <button onClick={addPlant} className="btn btn-primary">
                  <Plus size={18} />
                </button>
              </div>
              {plants.length === 0 ? (
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '32px 0' }}>No plants yet. Add your first one!</p>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {plants.map(plant => {
                    const daysSince = getDaysSinceWatered(plant.lastWatered);
                    const needsWater = isWaterNeeded(plant);
                    const healthPercent = plant.healthLevel;
                    const healthColor = healthPercent > 75 ? 'var(--accent-green)' : healthPercent > 50 ? 'var(--accent-orange)' : 'var(--accent-red)';

                    return (
                      <div key={plant.id} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', transition: 'var(--transition)' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--text-tertiary)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                          <div>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px' }}>{plant.name}</h3>
                            <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>
                              Last watered {daysSince}d ago
                            </p>
                          </div>
                          {needsWater && (
                            <span className="status-badge status-warning">
                              <AlertCircle size={12} /> Needs water
                            </span>
                          )}
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <label style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Health</label>
                            <span style={{ fontSize: '12px', fontWeight: '600', color: healthColor }}>{healthPercent}%</span>
                          </div>
                          <div style={{ background: 'var(--bg-secondary)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ background: healthColor, height: '100%', width: `${healthPercent}%`, transition: 'width 0.3s' }} />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => waterPlant(plant.id)} className="btn btn-success" style={{ flex: 1 }}>
                            <Check size={16} /> Water
                          </button>
                          <button onClick={() => takePlantPhoto(plant.id)} className="btn btn-secondary" style={{ flex: 1 }}>
                            <Camera size={16} /> Photo
                          </button>
                          <button onClick={() => deletePlant(plant.id)} className="btn btn-danger" style={{ padding: '8px 12px' }}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FOOD TAB */}
        {activeTab === 'food' && (
          <div className="card">
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 16px' }}>Meal Planning</h2>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addMeal()}
                placeholder="Add meal..."
                style={{ flex: 1 }}
              />
              <button onClick={addMeal} className="btn btn-primary">
                <Plus size={18} />
              </button>
            </div>
            {meals.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '32px 0' }}>No meals planned. Start organizing!</p>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {meals.map(meal => (
                  <div key={meal.id} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px' }}>{meal.name}</h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>{meal.plannedDate}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => toggleMealShopping(meal.id)}
                        className={`btn ${meal.shoppingNeeded ? 'btn-secondary' : 'btn-success'}`}
                        style={{ fontSize: '12px' }}
                      >
                        {meal.shoppingNeeded ? '🛒' : '✓'} Shop
                      </button>
                      <button onClick={() => deleteMeal(meal.id)} className="btn btn-danger" style={{ padding: '8px 12px' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* BUDGET TAB */}
        {activeTab === 'budget' && (
          <div className="card">
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 16px' }}>Budget Tracking</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '0 0 4px' }}>Total</p>
                <p style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: 'var(--accent-blue)' }}>€{totalExpenses.toFixed(2)}</p>
              </div>
              <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '0 0 4px' }}>Food</p>
                <p style={{ fontSize: '20px', fontWeight: '600', margin: 0, color: 'var(--accent-green)' }}>€{foodExpenses.toFixed(2)}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addExpense()}
                placeholder="Add expense..."
                style={{ flex: 1 }}
              />
              <button onClick={addExpense} className="btn btn-primary">
                <Plus size={18} />
              </button>
            </div>

            {expenses.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '32px 0' }}>No expenses tracked yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {expenses.map(exp => (
                  <div key={exp.id} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px' }}>{exp.description}</h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>{exp.date}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        value={exp.amount}
                        onChange={(e) => updateExpense(exp.id, e.target.value)}
                        placeholder="0"
                        style={{ width: '80px', textAlign: 'right', fontSize: '16px', fontWeight: '600' }}
                      />
                      <span style={{ fontSize: '14px', color: 'var(--text-tertiary)', minWidth: '20px' }}>€</span>
                      <button onClick={() => deleteExpense(exp.id)} className="btn btn-danger" style={{ padding: '8px 12px' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INTIMACY TAB */}
        {activeTab === 'intimacy' && (
          <div className="card">
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 8px' }}>Intimacy & Connection</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', margin: '0 0 16px' }}>Thoughtful reminders to prioritize each other</p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addIntimacyEvent()}
                placeholder="Add reminder..."
                style={{ flex: 1 }}
              />
              <button onClick={addIntimacyEvent} className="btn btn-primary">
                <Plus size={18} />
              </button>
            </div>

            {intimacy.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '32px 0' }}>No reminders yet. Add something to look forward to!</p>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {intimacy.map(event => (
                  <div key={event.id} style={{ background: 'var(--bg-primary)', border: `1px solid ${event.completed ? 'var(--accent-green)' : 'var(--border-color)'}`, borderRadius: 'var(--radius-md)', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px', textDecoration: event.completed ? 'line-through' : 'none', opacity: event.completed ? 0.6 : 1 }}>
                          {event.title}
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>{event.scheduledDate}</p>
                      </div>
                      <span className={`status-badge ${event.completed ? 'status-success' : ''}`} style={{ background: event.completed ? 'rgba(52, 199, 89, 0.1)' : 'transparent', color: event.completed ? 'var(--accent-green)' : 'var(--text-tertiary)' }}>
                        {event.completed ? '✓ Done' : 'Pending'}
                      </span>
                    </div>

                    {event.completed && (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                        {['amazing', 'great', 'good', 'neutral', 'low'].map(mood => (
                          <button
                            key={mood}
                            onClick={() => updateIntimacyMood(event.id, mood)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-color)',
                              background: event.mood === mood ? 'var(--accent-blue)' : 'transparent',
                              color: event.mood === mood ? 'white' : 'var(--text-tertiary)',
                              fontSize: '12px',
                              cursor: 'pointer',
                              transition: 'var(--transition)',
                            }}
                          >
                            {mood === 'amazing' && '🤩'}
                            {mood === 'great' && '😍'}
                            {mood === 'good' && '😊'}
                            {mood === 'neutral' && '😐'}
                            {mood === 'low' && '😔'}
                          </button>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => toggleIntimacyComplete(event.id)}
                        className={`btn ${event.completed ? 'btn-secondary' : 'btn-success'}`}
                        style={{ flex: 1 }}
                      >
                        {event.completed ? 'Undo' : 'Mark Complete'}
                      </button>
                      <button onClick={() => deleteIntimacy(event.id)} className="btn btn-danger" style={{ padding: '8px 12px' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TRAVEL TAB */}
        {activeTab === 'travel' && (
          <div className="card">
            <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 8px' }}>Travel Meal Sync</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', margin: '0 0 16px' }}>When one of you travels, cook together from afar</p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTravelMeal()}
                placeholder="Hotel meal..."
                style={{ flex: 1 }}
              />
              <button onClick={addTravelMeal} className="btn btn-primary">
                <Plus size={18} />
              </button>
            </div>

            {travelMeals.length === 0 ? (
              <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '32px 0' }}>No travel meals yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {travelMeals.map(tm => (
                  <div key={tm.id} style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 12px' }}>Hotel: {tm.hotelMeal}</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '0 0 12px' }}>{tm.date}</p>
                    <textarea
                      value={tm.homeRecipe}
                      onChange={(e) => updateTravelMeal(tm.id, e.target.value)}
                      placeholder="Your recipe for cooking the same meal at home..."
                      style={{ width: '100%', minHeight: '80px', marginBottom: '12px', borderRadius: 'var(--radius-md)' }}
                    />
                    <button onClick={() => deleteTravelMeal(tm.id)} className="btn btn-danger">
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* INSIGHTS TAB */}
        {activeTab === 'insights' && (
          <div style={{ display: 'grid', gap: '24px' }}>
            {weeklyInsight.sections.map((section, i) => (
              <div key={i} className="card">
                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 12px' }}>
                  {section.icon} {section.title}
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 8px' }}>{section.message}</p>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>{section.metric}</p>
              </div>
            ))}

            <div className="card">
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 12px' }}>📊 Spending by Category</h3>
              {Object.entries(spendingTrends.byCategory).map(([category, amount]) => (
                <div key={category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '14px', textTransform: 'capitalize' }}>{category}</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--accent-blue)' }}>€{amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Settings Panel */}
      {showSettings && (
        <div style={{ position: 'fixed', top: '0', right: '0', width: '350px', height: '100vh', background: 'var(--bg-secondary)', borderLeft: '1px solid var(--border-color)', padding: '20px', overflowY: 'auto', zIndex: 100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Settings</h3>
            <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>×</button>
          </div>

          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px', color: 'var(--text-tertiary)' }}>NOTIFICATIONS</h4>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`btn ${notificationsEnabled ? 'btn-success' : 'btn-secondary'}`}
                style={{ width: '100%' }}
              >
                <Bell size={16} /> {notificationsEnabled ? 'Enabled' : 'Enable'}
              </button>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '8px 0 0', lineHeight: '1.5' }}>
                Get alerts for plant watering, meal plans, and intimacy reminders.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px', color: 'var(--text-tertiary)' }}>CALENDAR</h4>
              <button className="btn btn-secondary" style={{ width: '100%' }}>
                <Calendar size={16} /> Connect Google Calendar
              </button>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '8px 0 0', lineHeight: '1.5' }}>
                Sync reminders to your iPhone calendar automatically.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px', color: 'var(--text-tertiary)' }}>BUDGET</h4>
              <button className="btn btn-secondary" style={{ width: '100%' }}>
                <Wallet size={16} /> Connect Revolut
              </button>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '8px 0 0', lineHeight: '1.5' }}>
                Auto-import expenses from your joint account.
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 8px', color: 'var(--text-tertiary)' }}>EMAIL DIGESTS</h4>
              <button className="btn btn-secondary" style={{ width: '100%' }}>
                <Mail size={16} /> Setup Weekly Digest
              </button>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '8px 0 0', lineHeight: '1.5' }}>
                Get weekly summaries emailed to both of you.
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '20px' }}>
              <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', lineHeight: '1.6' }}>
                ✨ <strong>Data is synced in real-time</strong><br />
                Both partners see updates instantly across all devices.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}