import React, { useState, useEffect } from 'react';
import {
  Home, Leaf, UtensilsCrossed, Wallet, Heart, LogOut,
  Trash2, Check, X, Sliders, Bell, Lock, Plus, ChefHat
} from 'lucide-react';
import { auth } from './firebaseConfig';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { ref, onValue, set } from 'firebase/database';
import { getDatabase } from 'firebase/database';

const provider = new GoogleAuthProvider();
const database = getDatabase();

const ACCENT_COLOR = '#1234ff';
const BG_COLOR = '#0A1014';

// Empty state component
const EmptyState = ({ icon: Icon, title, subtitle }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', padding: '40px 20px' }}>
    <div style={{ background: `rgba(18, 52, 255, 0.1)`, borderRadius: '60px', padding: '40px', marginBottom: '20px' }}>
      <Icon size={60} style={{ color: ACCENT_COLOR }} />
    </div>
    <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px', textAlign: 'center' }}>{title}</h3>
    <p style={{ fontSize: '14px', color: '#888', margin: 0, textAlign: 'center' }}>{subtitle}</p>
  </div>
);

// Modal overlay for adding items
const AddModal = ({ isOpen, title, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        background: `rgba(0, 0, 0, 0.6)`,
        backdropFilter: 'blur(10px)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'flex-end',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          background: BG_COLOR,
          borderTop: `1px solid rgba(18, 52, 255, 0.2)`,
          borderRadius: '24px 24px 0 0',
          padding: '24px',
          maxHeight: '80vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '24px' }}
          >
            <X size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default function CompleteSharedLifeDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [showSettings, setShowSettings] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalType, setModalType] = useState(null);

  // Data state
  const [plants, setPlants] = useState([]);
  const [meals, setMeals] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [intimacy, setIntimacy] = useState([]);
  const [dashboardBg, setDashboardBg] = useState(null);

  // Modal input state
  const [newItemName, setNewItemName] = useState('');
  const [newItemRecipe, setNewItemRecipe] = useState('');
  const [newItemPhoto, setNewItemPhoto] = useState(null);
  const [unsplashSearchResults, setUnsplashSearchResults] = useState([]);

  // Auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        console.log('User logged in:', currentUser.uid);
        loadSharedData();
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadSharedData = () => {
    try {
      const sharedRef = ref(database, 'shared-data/default');
      const unsubscribe = onValue(
        sharedRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            console.log('Data loaded from Firebase:', data);
            setPlants(data.plants || []);
            setMeals(data.meals || []);
            setExpenses(data.expenses || []);
            setIntimacy(data.intimacy || []);
            setDashboardBg(data.dashboardBg || null);
          } else {
            console.log('No data found in Firebase');
            setPlants([]);
            setMeals([]);
            setExpenses([]);
            setIntimacy([]);
          }
          setLoading(false);
        },
        (error) => {
          console.error('Firebase error:', error);
          setLoading(false);
        }
      );
      return unsubscribe;
    } catch (error) {
      console.error('Error setting up Firebase listener:', error);
      setLoading(false);
    }
  };

  const saveData = async (newPlants, newMeals, newExpenses, newIntimacy, newDashboardBg = dashboardBg) => {
    try {
      const sharedRef = ref(database, 'shared-data/default');
      await set(sharedRef, {
        plants: newPlants,
        meals: newMeals,
        expenses: newExpenses,
        intimacy: newIntimacy,
        dashboardBg: newDashboardBg,
        lastUpdated: new Date().toISOString(),
        lastUpdatedBy: user?.email,
      });
      console.log('Data saved successfully to Firebase');
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  // Search Unsplash
  const searchUnsplash = async (query) => {
    if (!query.trim()) {
      setUnsplashSearchResults([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${query}&per_page=6&client_id=${process.env.REACT_APP_UNSPLASH_ACCESS_KEY}`
      );
      const data = await response.json();
      setUnsplashSearchResults(data.results || []);
    } catch (error) {
      console.error('Failed to search Unsplash:', error);
    }
  };

  // ==================== PLANTS ====================
  const openAddPlantModal = () => {
    setModalType('plant');
    setShowAddModal(true);
    setNewItemName('');
    setNewItemPhoto(null);
  };

  const addPlant = () => {
    if (newItemName.trim()) {
      const plant = {
        id: Date.now().toString(),
        name: newItemName,
        addedDate: new Date().toISOString(),
        lastWatered: new Date().toISOString(),
        wateringFreqDays: 7,
        healthLevel: 100,
        photo: newItemPhoto || `https://images.unsplash.com/photo-1599599810694-b5ac4dd84e02?w=400&h=400&fit=crop&v=${Date.now()}`,
      };
      const updated = [...plants, plant];
      setPlants(updated);
      saveData(updated, meals, expenses, intimacy);
      setShowAddModal(false);
      setNewItemName('');
      setNewItemPhoto(null);
    }
  };

  const waterPlant = (id) => {
    const updated = plants.map(p =>
      p.id === id ? { ...p, lastWatered: new Date().toISOString(), healthLevel: Math.min(100, p.healthLevel + 10) } : p
    );
    setPlants(updated);
    saveData(updated, meals, expenses, intimacy);
  };

  const deletePlant = (id) => {
    const updated = plants.filter(p => p.id !== id);
    setPlants(updated);
    saveData(updated, meals, expenses, intimacy);
  };

  // ==================== MEALS ====================
  const openAddMealModal = () => {
    setModalType('meal');
    setShowAddModal(true);
    setNewItemName('');
    setNewItemRecipe('');
    setNewItemPhoto(null);
  };

  const addMeal = () => {
    if (newItemName.trim()) {
      const meal = {
        id: Date.now().toString(),
        name: newItemName,
        recipe: newItemRecipe,
        plannedDate: new Date().toISOString().split('T')[0],
        shoppingNeeded: false,
        photo: newItemPhoto || `https://images.unsplash.com/photo-1495575621581-20dbe3ce2bad?w=400&h=400&fit=crop&v=${Date.now()}`,
      };
      const updated = [...meals, meal];
      setMeals(updated);
      saveData(plants, updated, expenses, intimacy);
      setShowAddModal(false);
      setNewItemName('');
      setNewItemRecipe('');
      setNewItemPhoto(null);
    }
  };

  const updateMealRecipe = (id, recipe) => {
    const updated = meals.map(m =>
      m.id === id ? { ...m, recipe } : m
    );
    setMeals(updated);
    saveData(plants, updated, expenses, intimacy);
  };

  const toggleMealShopping = (id) => {
    const updated = meals.map(m =>
      m.id === id ? { ...m, shoppingNeeded: !m.shoppingNeeded } : m
    );
    setMeals(updated);
    saveData(plants, updated, expenses, intimacy);
  };

  const deleteMeal = (id) => {
    const updated = meals.filter(m => m.id !== id);
    setMeals(updated);
    saveData(plants, updated, expenses, intimacy);
  };

  // ==================== EXPENSES ====================
  const openAddExpenseModal = () => {
    setModalType('expense');
    setShowAddModal(true);
    setNewItemName('');
  };

  const addExpense = () => {
    if (newItemName.trim()) {
      const expense = {
        id: Date.now().toString(),
        description: newItemName,
        category: 'food',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
      };
      const updated = [...expenses, expense];
      setExpenses(updated);
      saveData(plants, meals, updated, intimacy);
      setShowAddModal(false);
      setNewItemName('');
    }
  };

  const updateExpense = (id, amount) => {
    const updated = expenses.map(e =>
      e.id === id ? { ...e, amount: parseFloat(amount) } : e
    );
    setExpenses(updated);
    saveData(plants, meals, updated, intimacy);
  };

  const deleteExpense = (id) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    saveData(plants, meals, updated, intimacy);
  };

  // ==================== INTIMACY ====================
  const openAddIntimacyModal = () => {
    setModalType('intimacy');
    setShowAddModal(true);
    setNewItemName('');
  };

  const addIntimacyEvent = () => {
    if (newItemName.trim()) {
      const event = {
        id: Date.now().toString(),
        title: newItemName,
        scheduledDate: new Date().toISOString().split('T')[0],
        completed: false,
        mood: 'neutral',
      };
      const updated = [...intimacy, event];
      setIntimacy(updated);
      saveData(plants, meals, expenses, updated);
      setShowAddModal(false);
      setNewItemName('');
    }
  };

  const toggleIntimacyComplete = (id) => {
    const updated = intimacy.map(i =>
      i.id === id ? { ...i, completed: !i.completed } : i
    );
    setIntimacy(updated);
    saveData(plants, meals, expenses, updated);
  };

  const deleteIntimacy = (id) => {
    const updated = intimacy.filter(i => i.id !== id);
    setIntimacy(updated);
    saveData(plants, meals, expenses, updated);
  };

  // ==================== DASHBOARD ====================
  const setDashboardBackground = (imageUrl) => {
    setDashboardBg(imageUrl);
    saveData(plants, meals, expenses, intimacy, imageUrl);
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
      setShowSettings(false);
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

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: BG_COLOR }}>
        <div style={{ textAlign: 'center' }}>
          <img src={`/cojo_logo.svg?v=${Date.now()}`} alt="COJO" style={{ height: '60px', marginBottom: '20px' }} />
          <div style={{ color: '#fff', fontSize: '14px' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: BG_COLOR, padding: '20px' }}>
        <div style={{ maxWidth: '400px', textAlign: 'center' }}>
          <img src={`/cojo_logo.svg?v=${Date.now()}`} alt="COJO" style={{ height: '80px', marginBottom: '30px' }} />
          <p style={{ color: '#ccc', marginBottom: '40px', fontSize: '16px' }}>Sharing life together.</p>
          <button
            onClick={handleLogin}
            style={{
              width: '100%',
              padding: '14px',
              background: ACCENT_COLOR,
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: BG_COLOR, minHeight: '100vh', color: '#fff' }}>
      {/* HEADER - Avatar | Logo | Settings */}
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid rgba(18, 52, 255, 0.1)` }}>
        <div
          onClick={() => setShowSettings(true)}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: `url(${user?.photoURL}) no-repeat center / cover`,
            cursor: 'pointer',
            border: `2px solid ${ACCENT_COLOR}`,
          }}
        />

        <img src={`/cojo_logo.svg?v=${Date.now()}`} alt="COJO" style={{ height: '32px' }} />

        <button
          onClick={() => setShowSettings(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            padding: '8px',
          }}
        >
          <Sliders size={24} />
        </button>
      </div>

      {/* Content Area */}
      <div style={{ paddingBottom: '120px' }}>
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 24px' }}>Home</h2>

            {/* Dashboard Customization */}
            <div style={{ marginBottom: '24px', padding: '16px', background: `rgba(18, 52, 255, 0.1)`, borderRadius: '12px', border: `1px solid rgba(18, 52, 255, 0.2)` }}>
              <label style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px', display: 'block', fontWeight: '600' }}>Customize Dashboard Background</label>
              <input
                type="text"
                placeholder="Search Unsplash... (e.g., sunset, mountains)"
                onChange={(e) => searchUnsplash(e.target.value)}
                style={{
                  width: '100%',
                  background: `rgba(255, 255, 255, 0.05)`,
                  border: `1px solid rgba(18, 52, 255, 0.2)`,
                  borderRadius: '8px',
                  padding: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  marginBottom: '8px',
                }}
              />
              {unsplashSearchResults.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {unsplashSearchResults.map((photo) => (
                    <img
                      key={photo.id}
                      src={`${photo.urls.thumb}?w=80&h=80&fit=crop`}
                      alt=""
                      onClick={() => setDashboardBackground(photo.urls.regular)}
                      style={{
                        width: '100%',
                        height: '60px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        border: dashboardBg === photo.urls.regular ? `2px solid ${ACCENT_COLOR}` : 'none',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              <div
                style={{
                  background: `linear-gradient(135deg, rgba(18, 52, 255, 0.15) 0%, rgba(10, 16, 20, 0.5) 100%), url(${dashboardBg || 'https://images.unsplash.com/photo-1469022563149-aa64dbd37dae?w=800&h=400&fit=crop'})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: '20px',
                  padding: '32px 24px',
                  border: `1px solid rgba(18, 52, 255, 0.2)`,
                  backdropFilter: 'blur(10px)',
                  minHeight: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                }}
              >
                <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '8px' }}>{plants.length}</div>
                <div style={{ fontSize: '14px', color: '#aaa' }}>plants to care for</div>
              </div>

              <div
                style={{
                  background: `linear-gradient(135deg, rgba(18, 52, 255, 0.15) 0%, rgba(10, 16, 20, 0.5) 100%)`,
                  borderRadius: '20px',
                  padding: '32px 24px',
                  border: `1px solid rgba(18, 52, 255, 0.2)`,
                  backdropFilter: 'blur(10px)',
                  minHeight: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                }}
              >
                <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '8px', color: ACCENT_COLOR }}>
                  €{totalExpenses.toFixed(2)}
                </div>
                <div style={{ fontSize: '14px', color: '#aaa' }}>spent this month</div>
              </div>

              <div
                style={{
                  background: `linear-gradient(135deg, rgba(18, 52, 255, 0.15) 0%, rgba(10, 16, 20, 0.5) 100%)`,
                  borderRadius: '20px',
                  padding: '32px 24px',
                  border: `1px solid rgba(18, 52, 255, 0.2)`,
                  backdropFilter: 'blur(10px)',
                  minHeight: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                }}
              >
                <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '8px' }}>{meals.length}</div>
                <div style={{ fontSize: '14px', color: '#aaa' }}>meals planned</div>
              </div>
            </div>
          </div>
        )}

        {/* PLANTS TAB */}
        {activeTab === 'plants' && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>Plants</h2>
              <button
                onClick={openAddPlantModal}
                style={{
                  background: ACCENT_COLOR,
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                }}
              >
                <Plus size={18} /> Add
              </button>
            </div>

            {plants.length === 0 ? (
              <EmptyState
                icon={Leaf}
                title="No plants yet"
                subtitle="Let's start growing together"
              />
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {plants.map(plant => (
                  <div
                    key={plant.id}
                    style={{
                      background: `linear-gradient(135deg, rgba(18, 52, 255, 0.15) 0%, rgba(10, 16, 20, 0.5) 100%), url(${plant.photo}?w=400&h=300&fit=crop&v=${Date.now()})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: '16px',
                      padding: '20px',
                      border: `1px solid rgba(18, 52, 255, 0.2)`,
                      backdropFilter: 'blur(10px)',
                      minHeight: '180px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px' }}>{plant.name}</h3>
                      <p style={{ fontSize: '12px', color: '#aaa', margin: 0 }}>Last watered {getDaysSinceWatered(plant.lastWatered)}d ago</p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => waterPlant(plant.id)}
                        style={{
                          flex: 1,
                          background: '#34c759',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '10px',
                          color: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          fontSize: '14px',
                          fontWeight: '500',
                        }}
                      >
                        <Check size={16} /> Water
                      </button>
                      <button
                        onClick={() => deletePlant(plant.id)}
                        style={{
                          background: 'rgba(255, 59, 48, 0.2)',
                          border: 'none',
                          borderRadius: '10px',
                          padding: '10px 12px',
                          color: '#ff3b30',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MEALS TAB */}
        {activeTab === 'food' && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>Meals</h2>
              <button
                onClick={openAddMealModal}
                style={{
                  background: ACCENT_COLOR,
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                }}
              >
                <Plus size={18} /> Add
              </button>
            </div>

            {meals.length === 0 ? (
              <EmptyState
                icon={UtensilsCrossed}
                title="No meals planned"
                subtitle="Let's start planning together"
              />
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {meals.map(meal => (
                  <div
                    key={meal.id}
                    style={{
                      background: `linear-gradient(135deg, rgba(18, 52, 255, 0.15) 0%, rgba(10, 16, 20, 0.5) 100%), url(${meal.photo}?w=400&h=300&fit=crop&v=${Date.now()})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: '16px',
                      padding: '16px',
                      border: `1px solid rgba(18, 52, 255, 0.2)`,
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <div style={{ marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px' }}>{meal.name}</h3>
                      <p style={{ fontSize: '12px', color: '#aaa', margin: '0 0 8px' }}>{meal.plannedDate}</p>
                      {meal.recipe && (
                        <details style={{ fontSize: '12px', color: '#ccc' }}>
                          <summary style={{ cursor: 'pointer', fontWeight: '500' }}>View Recipe</summary>
                          <p style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{meal.recipe}</p>
                        </details>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => toggleMealShopping(meal.id)}
                        style={{
                          flex: 1,
                          background: meal.shoppingNeeded ? `rgba(18, 52, 255, 0.3)` : 'rgba(255, 255, 255, 0.1)',
                          border: `1px solid rgba(18, 52, 255, ${meal.shoppingNeeded ? 0.4 : 0.2})`,
                          borderRadius: '8px',
                          padding: '8px 12px',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        {meal.shoppingNeeded ? '✓ Shop' : 'Shop'}
                      </button>
                      <button
                        onClick={() => {
                          setModalType('editMeal');
                          setShowAddModal(true);
                          setNewItemName(meal.name);
                          setNewItemRecipe(meal.recipe);
                        }}
                        style={{
                          background: `rgba(18, 52, 255, 0.2)`,
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          color: ACCENT_COLOR,
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <ChefHat size={14} />
                      </button>
                      <button
                        onClick={() => deleteMeal(meal.id)}
                        style={{
                          background: 'rgba(255, 59, 48, 0.2)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px',
                          color: '#ff3b30',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={14} />
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
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>Budget</h2>
              <button
                onClick={openAddExpenseModal}
                style={{
                  background: ACCENT_COLOR,
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                }}
              >
                <Plus size={18} /> Add
              </button>
            </div>

            {expenses.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="No expenses logged"
                subtitle="Track your spending together"
              />
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {expenses.map(exp => (
                  <div
                    key={exp.id}
                    style={{
                      background: `rgba(255, 255, 255, 0.05)`,
                      border: `1px solid rgba(18, 52, 255, 0.2)`,
                      borderRadius: '12px',
                      padding: '14px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: '500', margin: '0 0 4px' }}>{exp.description}</h3>
                      <p style={{ fontSize: '12px', color: '#aaa', margin: 0 }}>{exp.date}</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        value={exp.amount}
                        onChange={(e) => updateExpense(exp.id, e.target.value)}
                        placeholder="0"
                        style={{
                          width: '70px',
                          background: `rgba(255, 255, 255, 0.05)`,
                          border: `1px solid rgba(18, 52, 255, 0.2)`,
                          borderRadius: '8px',
                          padding: '6px',
                          color: '#fff',
                          textAlign: 'right',
                          fontSize: '14px',
                        }}
                      />
                      <span style={{ color: '#aaa', fontSize: '14px', minWidth: '20px' }}>€</span>
                      <button
                        onClick={() => deleteExpense(exp.id)}
                        style={{
                          background: 'rgba(255, 59, 48, 0.2)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 8px',
                          color: '#ff3b30',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={14} />
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
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>Intimacy</h2>
              <button
                onClick={openAddIntimacyModal}
                style={{
                  background: ACCENT_COLOR,
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 12px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                }}
              >
                <Plus size={18} /> Add
              </button>
            </div>

            {intimacy.length === 0 ? (
              <EmptyState
                icon={Heart}
                title="No reminders yet"
                subtitle="Keep the spark alive"
              />
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {intimacy.map(event => (
                  <div
                    key={event.id}
                    style={{
                      background: event.completed ? `rgba(18, 52, 255, 0.2)` : `rgba(255, 255, 255, 0.05)`,
                      border: `1px solid rgba(18, 52, 255, ${event.completed ? 0.4 : 0.2})`,
                      borderRadius: '12px',
                      padding: '14px 16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <h3 style={{ fontSize: '14px', fontWeight: '500', margin: '0 0 4px', textDecoration: event.completed ? 'line-through' : 'none', opacity: event.completed ? 0.6 : 1 }}>
                        {event.title}
                      </h3>
                      <p style={{ fontSize: '12px', color: '#aaa', margin: 0 }}>{event.scheduledDate}</p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => toggleIntimacyComplete(event.id)}
                        style={{
                          background: event.completed ? '#34c759' : 'rgba(255, 255, 255, 0.1)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          color: event.completed ? '#fff' : '#aaa',
                          cursor: 'pointer',
                          fontSize: '12px',
                        }}
                      >
                        {event.completed ? '✓' : 'Mark'}
                      </button>
                      <button
                        onClick={() => deleteIntimacy(event.id)}
                        style={{
                          background: 'rgba(255, 59, 48, 0.2)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 8px',
                          color: '#ff3b30',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Glass Morphism Pill Menu - Bottom */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          background: `rgba(10, 16, 20, 0.8)`,
          backdropFilter: 'blur(30px)',
          borderRadius: '60px',
          border: `1px solid rgba(18, 52, 255, 0.3)`,
          zIndex: 100,
          boxShadow: `0 8px 32px rgba(18, 52, 255, 0.1)`,
        }}
      >
        {[
          { id: 'home', icon: Home },
          { id: 'plants', icon: Leaf },
          { id: 'food', icon: UtensilsCrossed },
          { id: 'budget', icon: Wallet },
          { id: 'intimacy', icon: Heart },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: isActive ? `rgba(18, 52, 255, 0.4)` : 'transparent',
                border: 'none',
                borderRadius: '50%',
                padding: '12px',
                width: '48px',
                height: '48px',
                color: isActive ? ACCENT_COLOR : '#666',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s',
              }}
            >
              <Icon size={24} />
            </button>
          );
        })}
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: `rgba(0, 0, 0, 0.6)`,
            backdropFilter: 'blur(10px)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={() => setShowSettings(false)}
        >
          <div
            style={{
              width: '100%',
              background: BG_COLOR,
              borderTop: `1px solid rgba(18, 52, 255, 0.2)`,
              borderRadius: '20px 20px 0 0',
              padding: '20px',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '24px' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* User Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '16px', background: `rgba(18, 52, 255, 0.1)`, borderRadius: '12px' }}>
              <img
                src={user?.photoURL}
                alt="Avatar"
                style={{ width: '48px', height: '48px', borderRadius: '50%' }}
              />
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: '600' }}>{user?.displayName}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>{user?.email}</p>
              </div>
            </div>

            {/* Sync Status */}
            <div style={{ marginBottom: '24px', padding: '12px', background: `rgba(52, 199, 89, 0.1)`, borderRadius: '8px', border: `1px solid rgba(52, 199, 89, 0.2)` }}>
              <p style={{ margin: 0, fontSize: '12px', color: '#34c759' }}>✓ All data synced across devices</p>
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#888' }}>Last updated: {new Date().toLocaleTimeString()}</p>
            </div>

            {/* Configuration Section */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 12px', color: '#aaa', textTransform: 'uppercase' }}>Integrations</h4>
              
              <div style={{ display: 'grid', gap: '8px' }}>
                <button style={{
                  background: `rgba(18, 52, 255, 0.1)`,
                  border: `1px solid rgba(18, 52, 255, 0.2)`,
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  title: 'Coming soon: Connect your Revolut account for automatic expense tracking'
                }}>
                  💳 Revolut Integration (Coming Soon)
                </button>

                <button style={{
                  background: `rgba(18, 52, 255, 0.1)`,
                  border: `1px solid rgba(18, 52, 255, 0.2)`,
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <Bell size={18} />
                  Notifications
                </button>

                <button style={{
                  background: `rgba(18, 52, 255, 0.1)`,
                  border: `1px solid rgba(18, 52, 255, 0.2)`,
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}>
                  <Lock size={18} />
                  Privacy & Security
                </button>
              </div>
            </div>

            {/* Sign Out */}
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                background: 'rgba(255, 59, 48, 0.2)',
                border: `1px solid rgba(255, 59, 48, 0.3)`,
                borderRadius: '12px',
                padding: '12px',
                color: '#ff3b30',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '16px',
                fontWeight: '500',
              }}
            >
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Add Plant Modal */}
      <AddModal
        isOpen={showAddModal && modalType === 'plant'}
        title="Add Plant"
        onClose={() => setShowAddModal(false)}
      >
        <div style={{ display: 'grid', gap: '16px' }}>
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Plant name..."
            style={{
              background: `rgba(255, 255, 255, 0.05)`,
              border: `1px solid rgba(18, 52, 255, 0.2)`,
              borderRadius: '12px',
              padding: '12px',
              color: '#fff',
              fontSize: '16px',
            }}
          />

          <div>
            <label style={{ fontSize: '14px', color: '#aaa', marginBottom: '8px', display: 'block' }}>Search photo</label>
            <input
              type="text"
              placeholder="e.g. monstera, cactus..."
              onChange={(e) => searchUnsplash(e.target.value)}
              style={{
                width: '100%',
                background: `rgba(255, 255, 255, 0.05)`,
                border: `1px solid rgba(18, 52, 255, 0.2)`,
                borderRadius: '12px',
                padding: '12px',
                color: '#fff',
                fontSize: '16px',
                marginBottom: '12px',
              }}
            />

            {unsplashSearchResults.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {unsplashSearchResults.map((photo) => (
                  <img
                    key={photo.id}
                    src={`${photo.urls.thumb}?w=120&h=120&fit=crop&v=${Date.now()}`}
                    alt=""
                    onClick={() => setNewItemPhoto(photo.urls.regular)}
                    style={{
                      width: '100%',
                      height: '100px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: newItemPhoto === photo.urls.regular ? `2px solid ${ACCENT_COLOR}` : 'none',
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            onClick={addPlant}
            style={{
              width: '100%',
              background: ACCENT_COLOR,
              border: 'none',
              borderRadius: '12px',
              padding: '14px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
            }}
          >
            Add Plant
          </button>
        </div>
      </AddModal>

      {/* Add Meal Modal */}
      <AddModal
        isOpen={showAddModal && modalType === 'meal'}
        title="Add Meal"
        onClose={() => setShowAddModal(false)}
      >
        <div style={{ display: 'grid', gap: '16px' }}>
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="Meal name..."
            style={{
              background: `rgba(255, 255, 255, 0.05)`,
              border: `1px solid rgba(18, 52, 255, 0.2)`,
              borderRadius: '12px',
              padding: '12px',
              color: '#fff',
              fontSize: '16px',
            }}
          />

          <textarea
            value={newItemRecipe}
            onChange={(e) => setNewItemRecipe(e.target.value)}
            placeholder="Add recipe (optional)..."
            style={{
              background: `rgba(255, 255, 255, 0.05)`,
              border: `1px solid rgba(18, 52, 255, 0.2)`,
              borderRadius: '12px',
              padding: '12px',
              color: '#fff',
              fontSize: '16px',
              minHeight: '100px',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />

          <div>
            <label style={{ fontSize: '14px', color: '#aaa', marginBottom: '8px', display: 'block' }}>Search photo</label>
            <input
              type="text"
              placeholder="e.g. pasta, salad..."
              onChange={(e) => searchUnsplash(e.target.value)}
              style={{
                width: '100%',
                background: `rgba(255, 255, 255, 0.05)`,
                border: `1px solid rgba(18, 52, 255, 0.2)`,
                borderRadius: '12px',
                padding: '12px',
                color: '#fff',
                fontSize: '16px',
                marginBottom: '12px',
              }}
            />

            {unsplashSearchResults.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {unsplashSearchResults.map((photo) => (
                  <img
                    key={photo.id}
                    src={`${photo.urls.thumb}?w=120&h=120&fit=crop&v=${Date.now()}`}
                    alt=""
                    onClick={() => setNewItemPhoto(photo.urls.regular)}
                    style={{
                      width: '100%',
                      height: '100px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: newItemPhoto === photo.urls.regular ? `2px solid ${ACCENT_COLOR}` : 'none',
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            onClick={addMeal}
            style={{
              width: '100%',
              background: ACCENT_COLOR,
              border: 'none',
              borderRadius: '12px',
              padding: '14px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
            }}
          >
            Add Meal
          </button>
        </div>
      </AddModal>

      {/* Add Expense Modal */}
      <AddModal
        isOpen={showAddModal && modalType === 'expense'}
        title="Add Expense"
        onClose={() => setShowAddModal(false)}
      >
        <div style={{ display: 'grid', gap: '16px' }}>
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="What did you spend on?"
            style={{
              background: `rgba(255, 255, 255, 0.05)`,
              border: `1px solid rgba(18, 52, 255, 0.2)`,
              borderRadius: '12px',
              padding: '12px',
              color: '#fff',
              fontSize: '16px',
            }}
          />

          <button
            onClick={addExpense}
            style={{
              width: '100%',
              background: ACCENT_COLOR,
              border: 'none',
              borderRadius: '12px',
              padding: '14px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
            }}
          >
            Add Expense
          </button>
        </div>
      </AddModal>

      {/* Add Intimacy Modal */}
      <AddModal
        isOpen={showAddModal && modalType === 'intimacy'}
        title="Add Reminder"
        onClose={() => setShowAddModal(false)}
      >
        <div style={{ display: 'grid', gap: '16px' }}>
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="What would you like to plan?"
            style={{
              background: `rgba(255, 255, 255, 0.05)`,
              border: `1px solid rgba(18, 52, 255, 0.2)`,
              borderRadius: '12px',
              padding: '12px',
              color: '#fff',
              fontSize: '16px',
            }}
          />

          <button
            onClick={addIntimacyEvent}
            style={{
              width: '100%',
              background: ACCENT_COLOR,
              border: 'none',
              borderRadius: '12px',
              padding: '14px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
            }}
          >
            Add Reminder
          </button>
        </div>
      </AddModal>
    </div>
  );
}