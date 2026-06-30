javascript
import React, { useState, useEffect } from 'react';
import {
  Home, Leaf, UtensilsCrossed, Wallet, Heart, MapPin, Settings, LogOut,
  Plus, Trash2, Check, Camera, MoreVertical, X
} from 'lucide-react';
import { auth } from './firebaseConfig';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { ref, onValue, set } from 'firebase/database';
import { getDatabase } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const provider = new GoogleAuthProvider();
const database = getDatabase();
const storage = getStorage();

const ACCENT_COLOR = '#1234ff';
const BG_COLOR = '#0A1014';

export default function COJO() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [showSettings, setShowSettings] = useState(false);

  // Data state
  const [plants, setPlants] = useState([]);
  const [meals, setMeals] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [intimacy, setIntimacy] = useState([]);
  const [travelMeals, setTravelMeals] = useState([]);

  // UI state
  const [newItem, setNewItem] = useState('');
  const [unsplashBg, setUnsplashBg] = useState(null);

  // Auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadSharedData(currentUser.uid);
        fetchUnsplashImage();
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchUnsplashImage = async () => {
    try {
      const response = await fetch(
        `https://api.unsplash.com/photos/random?query=lifestyle,couples&w=800&h=600&client_id=YOUR_UNSPLASH_ACCESS_KEY`
      );
      const data = await response.json();
      if (data.urls) {
        setUnsplashBg(data.urls.regular);
      }
    } catch (error) {
      console.error('Failed to fetch Unsplash image:', error);
    }
  };

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

  // Upload photo to Firebase Storage
  const uploadPhoto = async (file, folder) => {
    try {
      const fileName = `${folder}/${Date.now()}_${file.name}`;
      const fileRef = storageRef(storage, fileName);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      return url;
    } catch (error) {
      console.error('Failed to upload photo:', error);
      return null;
    }
  };

  // Plants
  const addPlant = () => {
    if (newItem.trim()) {
      const plant = {
        id: Date.now().toString(),
        name: newItem,
        addedDate: new Date().toISOString(),
        lastWatered: new Date().toISOString(),
        wateringFreqDays: 7,
        healthLevel: 100,
        photo: unsplashBg,
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

  // Meals
  const addMeal = () => {
    if (newItem.trim()) {
      const meal = {
        id: Date.now().toString(),
        name: newItem,
        plannedDate: new Date().toISOString().split('T')[0],
        shoppingNeeded: false,
        photo: unsplashBg,
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

  // Expenses
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

  // Intimacy
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
    }
  };

  const toggleIntimacyComplete = (id) => {
    const updated = intimacy.map(i =>
      i.id === id ? { ...i, completed: !i.completed } : i
    );
    setIntimacy(updated);
    saveData(plants, meals, expenses, updated, travelMeals);
  };

  const deleteIntimacy = (id) => {
    const updated = intimacy.filter(i => i.id !== id);
    setIntimacy(updated);
    saveData(plants, meals, expenses, updated, travelMeals);
  };

  // Travel
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

  // Auth
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

  // Helpers
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
          <img src="/cojo_logo.svg" alt="COJO" style={{ height: '60px', marginBottom: '20px' }} />
          <div style={{ color: '#fff', fontSize: '14px' }}>Loading...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: BG_COLOR, padding: '20px' }}>
        <div style={{ maxWidth: '400px', textAlign: 'center' }}>
          <img src="/cojo_logo.svg" alt="COJO" style={{ height: '80px', marginBottom: '30px' }} />
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
            onMouseEnter={(e) => e.target.style.boxShadow = `0 8px 24px ${ACCENT_COLOR}40`}
            onMouseLeave={(e) => e.target.style.boxShadow = 'none'}
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: BG_COLOR, minHeight: '100vh', color: '#fff' }}>
      {/* Content Area */}
      <div style={{ paddingBottom: '100px' }}>
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '20px' }}>
              <img src="/cojo_logo.svg" alt="COJO" style={{ height: '40px', marginBottom: '20px' }} />
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              {/* Plants Card */}
              <div
                style={{
                  background: `linear-gradient(135deg, rgba(18, 52, 255, 0.1) 0%, rgba(10, 16, 20, 0.5) 100%), url(${unsplashBg})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: '20px',
                  padding: '24px',
                  border: `1px solid rgba(18, 52, 255, 0.2)`,
                  backdropFilter: 'blur(10px)',
                  minHeight: '140px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                }}
              >
                <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '8px' }}>{plants.length}</div>
                <div style={{ fontSize: '14px', color: '#aaa' }}>plants to care for</div>
              </div>

              {/* Spending Card */}
              <div
                style={{
                  background: `linear-gradient(135deg, rgba(18, 52, 255, 0.1) 0%, rgba(10, 16, 20, 0.5) 100%), url(${unsplashBg})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: '20px',
                  padding: '24px',
                  border: `1px solid rgba(18, 52, 255, 0.2)`,
                  backdropFilter: 'blur(10px)',
                  minHeight: '140px',
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

              {/* Meals Card */}
              <div
                style={{
                  background: `linear-gradient(135deg, rgba(18, 52, 255, 0.1) 0%, rgba(10, 16, 20, 0.5) 100%), url(${unsplashBg})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: '20px',
                  padding: '24px',
                  border: `1px solid rgba(18, 52, 255, 0.2)`,
                  backdropFilter: 'blur(10px)',
                  minHeight: '140px',
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
            <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>Plants</h2>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addPlant()}
                placeholder="Add plant..."
                style={{
                  flex: 1,
                  background: `rgba(255, 255, 255, 0.05)`,
                  border: `1px solid rgba(18, 52, 255, 0.2)`,
                  borderRadius: '12px',
                  padding: '12px',
                  color: '#fff',
                  fontSize: '16px',
                }}
              />
              <button
                onClick={addPlant}
                style={{
                  background: ACCENT_COLOR,
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
              >
                <Plus size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              {plants.map(plant => (
                <div
                  key={plant.id}
                  style={{
                    background: `linear-gradient(135deg, rgba(18, 52, 255, 0.1) 0%, rgba(10, 16, 20, 0.5) 100%), url(${plant.photo})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '16px',
                    padding: '16px',
                    border: `1px solid rgba(18, 52, 255, 0.2)`,
                    backdropFilter: 'blur(10px)',
                    minHeight: '140px',
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
          </div>
        )}

        {/* MEALS TAB */}
        {activeTab === 'food' && (
          <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>Meals</h2>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addMeal()}
                placeholder="Add meal..."
                style={{
                  flex: 1,
                  background: `rgba(255, 255, 255, 0.05)`,
                  border: `1px solid rgba(18, 52, 255, 0.2)`,
                  borderRadius: '12px',
                  padding: '12px',
                  color: '#fff',
                  fontSize: '16px',
                }}
              />
              <button
                onClick={addMeal}
                style={{
                  background: ACCENT_COLOR,
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
              >
                <Plus size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              {meals.map(meal => (
                <div
                  key={meal.id}
                  style={{
                    background: `linear-gradient(135deg, rgba(18, 52, 255, 0.1) 0%, rgba(10, 16, 20, 0.5) 100%), url(${meal.photo})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderRadius: '16px',
                    padding: '16px',
                    border: `1px solid rgba(18, 52, 255, 0.2)`,
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px' }}>{meal.name}</h3>
                    <p style={{ fontSize: '12px', color: '#aaa', margin: 0 }}>{meal.plannedDate}</p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => toggleMealShopping(meal.id)}
                      style={{
                        background: meal.shoppingNeeded ? 'rgba(18, 52, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                        border: `1px solid rgba(18, 52, 255, ${meal.shoppingNeeded ? 0.4 : 0.2})`,
                        borderRadius: '8px',
                        padding: '6px 12px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '12px',
                      }}
                    >
                      {meal.shoppingNeeded ? '✓ Shop' : 'Shop'}
                    </button>
                    <button
                      onClick={() => deleteMeal(meal.id)}
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
          </div>
        )}

        {/* BUDGET TAB */}
        {activeTab === 'budget' && (
          <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>Budget</h2>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addExpense()}
                placeholder="Add expense..."
                style={{
                  flex: 1,
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
                  background: ACCENT_COLOR,
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
              >
                <Plus size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              {expenses.map(exp => (
                <div
                  key={exp.id}
                  style={{
                    background: `rgba(255, 255, 255, 0.05)`,
                    border: `1px solid rgba(18, 52, 255, 0.2)`,
                    borderRadius: '12px',
                    padding: '12px 16px',
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
          </div>
        )}

        {/* INTIMACY TAB */}
        {activeTab === 'intimacy' && (
          <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>Intimacy</h2>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addIntimacyEvent()}
                placeholder="Add reminder..."
                style={{
                  flex: 1,
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
                  background: ACCENT_COLOR,
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
              >
                <Plus size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              {intimacy.map(event => (
                <div
                  key={event.id}
                  style={{
                    background: event.completed ? `rgba(18, 52, 255, 0.2)` : `rgba(255, 255, 255, 0.05)`,
                    border: `1px solid rgba(18, 52, 255, ${event.completed ? 0.4 : 0.2})`,
                    borderRadius: '12px',
                    padding: '12px 16px',
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
          </div>
        )}

        {/* TRAVEL TAB */}
        {activeTab === 'travel' && (
          <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: '600' }}>Travel</h2>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTravelMeal()}
                placeholder="Hotel meal..."
                style={{
                  flex: 1,
                  background: `rgba(255, 255, 255, 0.05)`,
                  border: `1px solid rgba(18, 52, 255, 0.2)`,
                  borderRadius: '12px',
                  padding: '12px',
                  color: '#fff',
                  fontSize: '16px',
                }}
              />
              <button
                onClick={addTravelMeal}
                style={{
                  background: ACCENT_COLOR,
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  color: '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                }}
              >
                <Plus size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              {travelMeals.map(tm => (
                <div
                  key={tm.id}
                  style={{
                    background: `rgba(255, 255, 255, 0.05)`,
                    border: `1px solid rgba(18, 52, 255, 0.2)`,
                    borderRadius: '12px',
                    padding: '12px',
                  }}
                >
                  <h3 style={{ fontSize: '14px', fontWeight: '500', margin: '0 0 8px' }}>Hotel: {tm.hotelMeal}</h3>
                  <textarea
                    value={tm.homeRecipe}
                    onChange={(e) => updateTravelMeal(tm.id, e.target.value)}
                    placeholder="Your recipe..."
                    style={{
                      width: '100%',
                      minHeight: '60px',
                      background: `rgba(18, 52, 255, 0.1)`,
                      border: `1px solid rgba(18, 52, 255, 0.2)`,
                      borderRadius: '8px',
                      padding: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      marginBottom: '8px',
                      fontFamily: 'inherit',
                    }}
                  />
                  <button
                    onClick={() => deleteTravelMeal(tm.id)}
                    style={{
                      background: 'rgba(255, 59, 48, 0.2)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      color: '#ff3b30',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Glass Morphism Bottom Menu - Instagram Style */}
      <div
        style={{
          position: 'fixed',
          bottom: '0',
          left: '0',
          right: '0',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '8px 0 20px',
          background: `rgba(10, 16, 20, 0.7)`,
          backdropFilter: 'blur(20px)',
          borderTop: `1px solid rgba(18, 52, 255, 0.2)`,
          zIndex: 100,
        }}
      >
        {[
          { id: 'home', label: 'Home', icon: Home },
          { id: 'plants', label: 'Plants', icon: Leaf },
          { id: 'food', label: 'Meals', icon: UtensilsCrossed },
          { id: 'budget', label: 'Budget', icon: Wallet },
          { id: 'intimacy', label: 'Intimacy', icon: Heart },
          { id: 'travel', label: 'Travel', icon: MapPin },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: isActive ? `rgba(18, 52, 255, 0.3)` : 'transparent',
                border: 'none',
                borderRadius: '12px',
                padding: '8px 12px',
                color: isActive ? ACCENT_COLOR : '#888',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                fontSize: '10px',
                transition: 'all 0.3s',
              }}
            >
              <Icon size={24} />
              <span>{tab.label}</span>
            </button>
          );
        })}
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            background: showSettings ? `rgba(18, 52, 255, 0.3)` : 'transparent',
            border: 'none',
            borderRadius: '12px',
            padding: '8px 12px',
            color: showSettings ? ACCENT_COLOR : '#888',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            fontSize: '10px',
            transition: 'all 0.3s',
          }}
        >
          <Settings size={24} />
          <span>Settings</span>
        </button>
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
              maxHeight: '60vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '24px',
                }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
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
        </div>
      )}
    </div>
  );
}
Done
