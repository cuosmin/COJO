import React, { useState, useEffect } from 'react';
import {
  Home, Leaf, UtensilsCrossed, Wallet, LogOut,
  Trash2, Check, X, Sliders, Bell, Plus, Palette, Plane, Edit2, MapPin
} from 'lucide-react';
import { auth } from './firebaseConfig';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { ref, onValue, set } from 'firebase/database';
import { getDatabase } from 'firebase/database';

const provider = new GoogleAuthProvider();
const database = getDatabase();

const ACCENT_COLOR = '#1234ff';
const BG_COLOR = '#000000';

// Major cities for autocomplete
const MAJOR_CITIES = [
  { name: 'Paris', country: 'France' },
  { name: 'London', country: 'United Kingdom' },
  { name: 'New York', country: 'United States' },
  { name: 'Tokyo', country: 'Japan' },
  { name: 'Barcelona', country: 'Spain' },
  { name: 'Berlin', country: 'Germany' },
  { name: 'Amsterdam', country: 'Netherlands' },
  { name: 'Rome', country: 'Italy' },
  { name: 'Milan', country: 'Italy' },
  { name: 'Dubai', country: 'United Arab Emirates' },
  { name: 'Singapore', country: 'Singapore' },
  { name: 'Sydney', country: 'Australia' },
  { name: 'Bangkok', country: 'Thailand' },
  { name: 'Istanbul', country: 'Turkey' },
  { name: 'Mexico City', country: 'Mexico' },
  { name: 'São Paulo', country: 'Brazil' },
  { name: 'Buenos Aires', country: 'Argentina' },
  { name: 'Madrid', country: 'Spain' },
  { name: 'Vienna', country: 'Austria' },
  { name: 'Prague', country: 'Czech Republic' },
  { name: 'Copenhagen', country: 'Denmark' },
  { name: 'Stockholm', country: 'Sweden' },
  { name: 'Oslo', country: 'Norway' },
  { name: 'Bucharest', country: 'Romania' },
  { name: 'Athens', country: 'Greece' },
];

// Request notification permission
const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

// Send notification
const sendNotification = (title, options = {}) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/cojo_icon.png',
      badge: '/cojo_icon.png',
      ...options,
    });
  }
};

// Export to iOS Calendar
const exportToCalendar = (title, date) => {
  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//COJO//COJO Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:COJO Events
X-WR-TIMEZONE:UTC
BEGIN:VEVENT
DTSTART:${date.toISOString().split('T')[0].replace(/-/g, '')}
DTEND:${date.toISOString().split('T')[0].replace(/-/g, '')}
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
UID:${Date.now()}@cojo.app
CREATED:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DESCRIPTION:${title}
LAST-MODIFIED:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
LOCATION:
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:${title}
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([ics], { type: 'text/calendar' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${title}.ics`);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
};

// Empty state
const EmptyState = ({ icon: Icon, title, subtitle }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', padding: '40px 20px' }}>
    <div style={{ background: `rgba(18, 52, 255, 0.1)`, borderRadius: '60px', padding: '40px', marginBottom: '20px' }}>
      <Icon size={60} style={{ color: ACCENT_COLOR }} />
    </div>
    <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px', textAlign: 'center' }}>{title}</h3>
    <p style={{ fontSize: '14px', color: '#666', margin: 0, textAlign: 'center' }}>{subtitle}</p>
  </div>
);

// Modal overlay
const AddModal = ({ isOpen, title, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', top: '0', left: '0', right: '0', bottom: '0', background: `rgba(0, 0, 0, 0.6)`, backdropFilter: 'blur(10px)', zIndex: 300, display: 'flex', alignItems: 'flex-end' }} onClick={onClose}>
      <div style={{ width: '100%', background: BG_COLOR, borderTop: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '24px 24px 0 0', padding: '24px', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '24px' }}>
            <X size={24} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

// Calendar Component for Travel Tab
const CalendarMonth = ({ travels, onDateClick, currentMonth, onMonthChange }) => {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getTravelIndicators = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return travels.filter(travel => {
      const start = new Date(travel.startDate);
      const end = new Date(travel.endDate);
      const current = new Date(dateStr);
      return current >= start && current <= end;
    });
  };

  const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div style={{ background: `rgba(255, 255, 255, 0.02)`, borderRadius: '16px', padding: '20px', border: `1px solid rgba(18, 52, 255, 0.1)` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => onMonthChange(-1)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}>←</button>
        <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>{monthNames[month]} {year}</h3>
        <button onClick={() => onMonthChange(1)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}>→</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '12px' }}>
        {weekDays.map(day => (
          <div key={day} style={{ textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#666', padding: '8px' }}>{day}</div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {days.map((day, idx) => {
          const indicators = day ? getTravelIndicators(day) : [];
          return (
            <div
              key={idx}
              onClick={() => day && onDateClick && onDateClick(day)}
              style={{
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '8px',
                background: day ? `rgba(255, 255, 255, 0.02)` : 'transparent',
                border: day && indicators.length > 0 ? `2px solid ${ACCENT_COLOR}` : `1px solid rgba(255, 255, 255, 0.05)`,
                cursor: day ? 'pointer' : 'default',
                position: 'relative',
                fontSize: '14px',
                fontWeight: day ? '500' : '400',
                color: day ? '#fff' : '#333',
              }}
            >
              {day}
              {indicators.length > 0 && (
                <div style={{ position: 'absolute', bottom: '4px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '2px' }}>
                  {indicators.map((_, i) => (
                    <div key={i} style={{ width: '4px', height: '4px', borderRadius: '50%', background: ACCENT_COLOR }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
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
  const [editingId, setEditingId] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Data
  const [plants, setPlants] = useState([]);
  const [meals, setMeals] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [travels, setTravels] = useState([]);
  const [dashboardBg, setDashboardBg] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Modal states
  const [newItemName, setNewItemName] = useState('');
  const [newItemRecipe, setNewItemRecipe] = useState('');
  const [newItemPhoto, setNewItemPhoto] = useState(null);
  const [newItemWateringDays, setNewItemWateringDays] = useState(7);
  const [newTravelStart, setNewTravelStart] = useState('');
  const [newTravelEnd, setNewTravelEnd] = useState('');
  const [newTravelLocation, setNewTravelLocation] = useState('');
  const [newTravelPerson, setNewTravelPerson] = useState('me');
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [unsplashSearchResults, setUnsplashSearchResults] = useState([]);

  // Auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadSharedData();
        checkNotificationPermission();
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const checkNotificationPermission = () => {
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  };

  const loadSharedData = () => {
    try {
      const sharedRef = ref(database, 'shared-data/default');
      const unsubscribe = onValue(
        sharedRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            setPlants(data.plants || []);
            setMeals(data.meals || []);
            setExpenses(data.expenses || []);
            setTravels(data.travels || []);
            setDashboardBg(data.dashboardBg || null);
            localStorage.setItem('cojoBackup', JSON.stringify(data));
          }
          setLoading(false);
        },
        (error) => {
          console.error('❌ Firebase error:', error);
          setLoading(false);
          const backup = localStorage.getItem('cojoBackup');
          if (backup) {
            const data = JSON.parse(backup);
            setPlants(data.plants || []);
            setMeals(data.meals || []);
            setExpenses(data.expenses || []);
            setTravels(data.travels || []);
            setDashboardBg(data.dashboardBg || null);
          }
        }
      );
      return unsubscribe;
    } catch (error) {
      setLoading(false);
    }
  };

  const saveData = async (newPlants, newMeals, newExpenses, newTravels, newDashboardBg = dashboardBg) => {
    try {
      const sharedRef = ref(database, 'shared-data/default');
      const data = {
        plants: newPlants,
        meals: newMeals,
        expenses: newExpenses,
        travels: newTravels,
        dashboardBg: newDashboardBg,
        lastUpdated: new Date().toISOString(),
        lastUpdatedBy: user?.email,
      };
      await set(sharedRef, data);
      localStorage.setItem('cojoBackup', JSON.stringify(data));
    } catch (error) {
      console.error('❌ Error saving:', error);
    }
  };

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

  const handleCitySearch = (query) => {
    setNewTravelLocation(query);
    if (query.length > 0) {
      const filtered = MAJOR_CITIES.filter(city =>
        city.name.toLowerCase().includes(query.toLowerCase())
      );
      setCitySuggestions(filtered);
    } else {
      setCitySuggestions([]);
    }
  };

  // ==================== PLANTS ====================
  const addPlant = () => {
    if (newItemName.trim()) {
      const plant = {
        id: editingId || Date.now().toString(),
        name: newItemName,
        addedDate: new Date().toISOString(),
        lastWatered: new Date().toISOString(),
        wateringFreqDays: parseInt(newItemWateringDays) || 7,
        healthLevel: 100,
        photo: newItemPhoto || `https://images.unsplash.com/photo-1599599810694-b5ac4dd84e02?w=400&h=400&fit=crop&v=${Date.now()}`,
      };
      
      let updated;
      if (editingId) {
        updated = plants.map(p => p.id === editingId ? plant : p);
      } else {
        updated = [...plants, plant];
      }
      
      setPlants(updated);
      saveData(updated, meals, expenses, travels);
      resetModal();
    }
  };

  const waterPlant = (id) => {
    const updated = plants.map(p =>
      p.id === id ? { ...p, lastWatered: new Date().toISOString(), healthLevel: Math.min(100, p.healthLevel + 10) } : p
    );
    setPlants(updated);
    saveData(updated, meals, expenses, travels);
    sendNotification('💧 Plant watered!');
  };

  const deletePlant = (id) => {
    const updated = plants.filter(p => p.id !== id);
    setPlants(updated);
    saveData(updated, meals, expenses, travels);
  };

  const getDaysSinceWatered = (lastWatered) => {
    const last = new Date(lastWatered);
    const now = new Date();
    return Math.floor((now - last) / (1000 * 60 * 60 * 24));
  };

  const getWateringStatus = (plant) => {
    const daysSince = getDaysSinceWatered(plant.lastWatered);
    const freq = plant.wateringFreqDays || 7;
    const daysUntil = Math.max(0, freq - daysSince);
    return { daysSince, daysUntil, needsWatering: daysUntil === 0 };
  };

  const plantsNeedingWater = plants.filter(p => getWateringStatus(p).needsWatering).length;

  // ==================== MEALS ====================
  const addMeal = () => {
    if (newItemName.trim()) {
      const mealDate = new Date().toISOString().split('T')[0];
      const meal = {
        id: editingId || Date.now().toString(),
        name: newItemName,
        recipe: newItemRecipe,
        plannedDate: mealDate,
        shoppingNeeded: false,
        photo: newItemPhoto || `https://images.unsplash.com/photo-1495575621581-20dbe3ce2bad?w=400&h=400&fit=crop&v=${Date.now()}`,
      };
      
      let updated;
      if (editingId) {
        updated = meals.map(m => m.id === editingId ? meal : m);
      } else {
        updated = [...meals, meal];
        exportToCalendar(`🍽️ ${newItemName}`, new Date(mealDate));
      }
      
      setMeals(updated);
      saveData(plants, updated, expenses, travels);
      resetModal();
    }
  };

  const deleteMeal = (id) => {
    const updated = meals.filter(m => m.id !== id);
    setMeals(updated);
    saveData(plants, updated, expenses, travels);
  };

  // ==================== EXPENSES ====================
  const addExpense = () => {
    if (newItemName.trim()) {
      const expense = {
        id: editingId || Date.now().toString(),
        description: newItemName,
        amount: 0,
        date: new Date().toISOString().split('T')[0],
      };
      
      let updated;
      if (editingId) {
        updated = expenses.map(e => e.id === editingId ? expense : e);
      } else {
        updated = [...expenses, expense];
      }
      
      setExpenses(updated);
      saveData(plants, meals, updated, travels);
      resetModal();
    }
  };

  const deleteExpense = (id) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    saveData(plants, meals, updated, travels);
  };

  // ==================== TRAVELS ====================
  const addTravel = () => {
    if (newTravelStart && newTravelEnd && newTravelLocation && newTravelPerson) {
      const travel = {
        id: editingId || Date.now().toString(),
        startDate: newTravelStart,
        endDate: newTravelEnd,
        location: newTravelLocation,
        person: newTravelPerson,
      };
      
      let updated;
      if (editingId) {
        updated = travels.map(t => t.id === editingId ? travel : t);
      } else {
        updated = [...travels, travel];
      }
      
      setTravels(updated);
      saveData(plants, meals, expenses, updated);
      resetModal();
    }
  };

  const deleteTravel = (id) => {
    const updated = travels.filter(t => t.id !== id);
    setTravels(updated);
    saveData(plants, meals, expenses, updated);
  };

  const getTravelDaysThisMonth = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    let days = 0;

    travels.forEach(travel => {
      const start = new Date(travel.startDate);
      const end = new Date(travel.endDate);

      if (start.getMonth() === month && start.getFullYear() === year) {
        days += Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      }
    });

    return days;
  };

  const getCurrentTraveler = () => {
    const today = new Date().toISOString().split('T')[0];
    return travels.find(t => t.startDate <= today && t.endDate >= today);
  };

  // ==================== HELPERS ====================
  const resetModal = () => {
    setShowAddModal(false);
    setModalType(null);
    setEditingId(null);
    setNewItemName('');
    setNewItemRecipe('');
    setNewItemPhoto(null);
    setNewItemWateringDays(7);
    setNewTravelStart('');
    setNewTravelEnd('');
    setNewTravelLocation('');
    setNewTravelPerson('me');
    setCitySuggestions([]);
  };

  const openEditModal = (type, item) => {
    setModalType(type);
    setEditingId(item.id);
    setShowAddModal(true);
    
    if (type === 'plant') {
      setNewItemName(item.name);
      setNewItemWateringDays(item.wateringFreqDays);
      setNewItemPhoto(item.photo);
    } else if (type === 'meal') {
      setNewItemName(item.name);
      setNewItemRecipe(item.recipe || '');
      setNewItemPhoto(item.photo);
    } else if (type === 'expense') {
      setNewItemName(item.description);
    } else if (type === 'travel') {
      setNewTravelStart(item.startDate);
      setNewTravelEnd(item.endDate);
      setNewTravelLocation(item.location);
      setNewTravelPerson(item.person);
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationsEnabled(true);
      sendNotification('🔔 Notifications enabled!');
    }
  };

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

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: BG_COLOR }}>
        <div style={{ textAlign: 'center' }}>
          <img src={`/cojo_logo.svg?v=${Date.now()}`} alt="COJO" style={{ height: '60px', marginBottom: '20px' }} />
          <div style={{ color: '#fff', fontSize: '14px' }}>Loading your data...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: BG_COLOR, padding: '20px' }}>
        <div style={{ maxWidth: '400px', textAlign: 'center' }}>
          <img src={`/cojo_logo.svg?v=${Date.now()}`} alt="COJO" style={{ height: '80px', marginBottom: '30px' }} />
          <p style={{ color: '#999', marginBottom: '40px', fontSize: '16px' }}>Sharing life together.</p>
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
            }}
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  const currentTraveler = getCurrentTraveler();

  return (
    <div style={{ background: BG_COLOR, minHeight: '100vh', color: '#fff' }}>
      {/* STICKY HEADER */}
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0,
        padding: '16px 20px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        borderBottom: `1px solid rgba(18, 52, 255, 0.1)`,
        background: '#000000',
        zIndex: 50,
      }}>
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

      {/* Content Area with top padding for sticky header */}
      <div style={{ paddingTop: '80px', paddingBottom: '120px' }}>
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 24px' }}>Home</h2>

            <div style={{ display: 'grid', gap: '12px' }}>
              {/* Main dashboard card with bg */}
              <div
                style={{
                  background: `linear-gradient(135deg, rgba(18, 52, 255, 0.15) 0%, rgba(0, 0, 0, 0.8) 100%), url(${dashboardBg || 'https://images.unsplash.com/photo-1469022563149-aa64dbd37dae?w=800&h=400&fit=crop'})`,
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
                <div style={{ fontSize: '14px', color: '#999' }}>plants to care for</div>
              </div>

              {/* Currently traveling card */}
              {currentTraveler && (
                <div
                  style={{
                    background: `linear-gradient(135deg, rgba(18, 52, 255, 0.15) 0%, rgba(0, 0, 0, 0.8) 100%)`,
                    borderRadius: '20px',
                    padding: '24px',
                    border: `1px solid rgba(18, 52, 255, 0.2)`,
                    backdropFilter: 'blur(10px)',
                    minHeight: '180px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: currentTraveler.person === 'me' ? `url(${user?.photoURL}) no-repeat center / cover` : '#999',
                        border: `2px solid ${ACCENT_COLOR}`,
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '600' }}>
                        {currentTraveler.person === 'me' ? 'You are' : 'Your partner is'} in
                      </div>
                      <div style={{ fontSize: '24px', fontWeight: '700', color: ACCENT_COLOR }}>
                        {currentTraveler.location}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Plants needing water */}
              <div
                style={{
                  background: `linear-gradient(135deg, rgba(255, 59, 48, 0.15) 0%, rgba(0, 0, 0, 0.8) 100%)`,
                  borderRadius: '20px',
                  padding: '32px 24px',
                  border: `1px solid rgba(255, 59, 48, 0.2)`,
                  backdropFilter: 'blur(10px)',
                  minHeight: '180px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                }}
              >
                <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '8px', color: '#ff3b30' }}>{plantsNeedingWater}</div>
                <div style={{ fontSize: '14px', color: '#999' }}>plants need watering</div>
              </div>

              {/* Travel days */}
              <div
                style={{
                  background: `linear-gradient(135deg, rgba(18, 52, 255, 0.15) 0%, rgba(0, 0, 0, 0.8) 100%)`,
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
                <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '8px' }}>{getTravelDaysThisMonth()}</div>
                <div style={{ fontSize: '14px', color: '#999' }}>travel days this month</div>
              </div>

              {/* Meals */}
              <div
                style={{
                  background: `linear-gradient(135deg, rgba(18, 52, 255, 0.15) 0%, rgba(0, 0, 0, 0.8) 100%)`,
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
                <div style={{ fontSize: '14px', color: '#999' }}>meals planned</div>
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
                onClick={() => {
                  setModalType('plant');
                  setEditingId(null);
                  setShowAddModal(true);
                  setNewItemName('');
                  setNewItemWateringDays(7);
                  setNewItemPhoto(null);
                }}
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
              <EmptyState icon={Leaf} title="No plants yet" subtitle="Let's start growing together" />
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {plants.map(plant => {
                  const status = getWateringStatus(plant);
                  return (
                    <div
                      key={plant.id}
                      style={{
                        background: `linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.8) 100%), url(${plant.photo}?w=400&h=300&fit=crop&v=${Date.now()})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: '16px',
                        padding: '16px',
                        border: `1px solid rgba(${status.needsWatering ? '255, 59, 48' : '18, 52, 255'}, 0.2)`,
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px' }}>{plant.name}</h3>
                          <p style={{ fontSize: '12px', color: status.needsWatering ? '#ff3b30' : '#999', margin: 0 }}>
                            {status.needsWatering ? '💧 Needs watering now!' : `Next watering in ${status.daysUntil} days`}
                          </p>
                        </div>
                        <button
                          onClick={() => openEditModal('plant', plant)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: ACCENT_COLOR,
                            cursor: 'pointer',
                            padding: '4px',
                          }}
                        >
                          <Edit2 size={18} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => waterPlant(plant.id)}
                          style={{
                            flex: 1,
                            background: status.needsWatering ? '#ff3b30' : '#34c759',
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
                  );
                })}
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
                onClick={() => {
                  setModalType('meal');
                  setEditingId(null);
                  setShowAddModal(true);
                  setNewItemName('');
                  setNewItemRecipe('');
                  setNewItemPhoto(null);
                }}
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
              <EmptyState icon={UtensilsCrossed} title="No meals planned" subtitle="Let's start planning together" />
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {meals.map(meal => (
                  <div
                    key={meal.id}
                    style={{
                      background: `linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.8) 100%), url(${meal.photo}?w=400&h=300&fit=crop&v=${Date.now()})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: '16px',
                      padding: '16px',
                      border: `1px solid rgba(18, 52, 255, 0.2)`,
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px' }}>{meal.name}</h3>
                        <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>{meal.plannedDate}</p>
                      </div>
                      <button
                        onClick={() => openEditModal('meal', meal)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: ACCENT_COLOR,
                          cursor: 'pointer',
                          padding: '4px',
                        }}
                      >
                        <Edit2 size={18} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          const updated = meals.map(m => m.id === meal.id ? { ...m, shoppingNeeded: !m.shoppingNeeded } : m);
                          setMeals(updated);
                          saveData(plants, updated, expenses, travels);
                        }}
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
                onClick={() => {
                  setModalType('expense');
                  setEditingId(null);
                  setShowAddModal(true);
                  setNewItemName('');
                }}
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
              <EmptyState icon={Wallet} title="No expenses logged" subtitle="Track your spending together" />
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
                      <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>{exp.date}</p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="number"
                        value={exp.amount || 0}
                        onChange={(e) => {
                          const updated = expenses.map(ex => ex.id === exp.id ? { ...ex, amount: parseFloat(e.target.value) } : ex);
                          setExpenses(updated);
                          saveData(plants, meals, updated, travels);
                        }}
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
                      <span style={{ color: '#666', fontSize: '14px', minWidth: '20px' }}>€</span>
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

        {/* TRAVEL TAB */}
        {activeTab === 'travel' && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>Travel</h2>
              <button
                onClick={() => {
                  setModalType('travel');
                  setEditingId(null);
                  setShowAddModal(true);
                  setNewTravelStart('');
                  setNewTravelEnd('');
                  setNewTravelLocation('');
                  setNewTravelPerson('me');
                }}
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

            {travels.length === 0 ? (
              <EmptyState icon={Plane} title="No trips planned" subtitle="Plan your travels together" />
            ) : (
              <>
                <CalendarMonth
                  travels={travels}
                  currentMonth={currentMonth}
                  onMonthChange={(delta) => {
                    const newMonth = new Date(currentMonth);
                    newMonth.setMonth(newMonth.getMonth() + delta);
                    setCurrentMonth(newMonth);
                  }}
                />

                <div style={{ marginTop: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 12px' }}>Trips</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {travels.map(travel => (
                      <div
                        key={travel.id}
                        style={{
                          background: `rgba(18, 52, 255, 0.1)`,
                          border: `1px solid rgba(18, 52, 255, 0.2)`,
                          borderRadius: '12px',
                          padding: '16px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <MapPin size={16} style={{ color: ACCENT_COLOR }} />
                              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>{travel.location}</h3>
                            </div>
                            <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px' }}>
                              {travel.startDate} → {travel.endDate}
                            </p>
                            <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>
                              {travel.person === 'me' ? 'You' : 'Your partner'}
                            </p>
                          </div>
                          <button
                            onClick={() => openEditModal('travel', travel)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: ACCENT_COLOR,
                              cursor: 'pointer',
                              padding: '4px',
                            }}
                          >
                            <Edit2 size={18} />
                          </button>
                        </div>

                        <button
                          onClick={() => deleteTravel(travel.id)}
                          style={{
                            width: '100%',
                            background: 'rgba(255, 59, 48, 0.2)',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '8px',
                            color: '#ff3b30',
                            cursor: 'pointer',
                            fontSize: '12px',
                          }}
                        >
                          <Trash2 size={14} style={{ marginRight: '4px' }} />
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom Menu */}
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
          background: `rgba(0, 0, 0, 0.8)`,
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
          { id: 'travel', icon: Plane },
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
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{user?.email}</p>
              </div>
            </div>

            {/* Notifications */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 12px', color: '#666', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Bell size={16} /> Notifications
              </h4>

              {!notificationsEnabled ? (
                <button
                  onClick={handleEnableNotifications}
                  style={{
                    width: '100%',
                    background: ACCENT_COLOR,
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  🔔 Enable Notifications
                </button>
              ) : (
                <div style={{ padding: '12px', background: `rgba(52, 199, 89, 0.1)`, borderRadius: '8px', border: `1px solid rgba(52, 199, 89, 0.2)` }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#34c759' }}>✓ Notifications enabled</p>
                </div>
              )}
            </div>

            {/* Customization */}
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 12px', color: '#666', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Palette size={16} /> Customize
              </h4>

              <div style={{ padding: '12px', background: `rgba(18, 52, 255, 0.1)`, borderRadius: '8px', border: `1px solid rgba(18, 52, 255, 0.2)` }}>
                <label style={{ fontSize: '12px', color: '#666', marginBottom: '8px', display: 'block', fontWeight: '600' }}>Dashboard Background</label>
                <input
                  type="text"
                  placeholder="Search Unsplash..."
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
                    boxSizing: 'border-box',
                  }}
                />
                {unsplashSearchResults.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                    {unsplashSearchResults.map((photo) => (
                      <img
                        key={photo.id}
                        src={`${photo.urls.thumb}?w=80&h=80&fit=crop`}
                        alt=""
                        onClick={() => {
                          setDashboardBg(photo.urls.regular);
                          saveData(plants, meals, expenses, travels, photo.urls.regular);
                        }}
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

      {/* MODALS */}
      {/* Add Plant Modal */}
      <AddModal isOpen={showAddModal && modalType === 'plant'} title={editingId ? "Edit Plant" : "Add Plant"} onClose={resetModal}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Plant name..." style={{ background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px' }} />
          
          <div>
            <label style={{ fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }}>Watering frequency (days)</label>
            <input type="number" min="1" max="60" value={newItemWateringDays} onChange={(e) => setNewItemWateringDays(e.target.value)} style={{ width: '100%', background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px' }} />
          </div>

          <div>
            <label style={{ fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }}>Search photo</label>
            <input type="text" placeholder="e.g. monstera, cactus..." onChange={(e) => searchUnsplash(e.target.value)} style={{ width: '100%', background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px', marginBottom: '12px' }} />
            {unsplashSearchResults.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {unsplashSearchResults.map((photo) => (
                  <img key={photo.id} src={`${photo.urls.thumb}?w=120&h=120&fit=crop`} alt="" onClick={() => setNewItemPhoto(photo.urls.regular)} style={{ width: '100%', height: '100px', borderRadius: '8px', cursor: 'pointer', border: newItemPhoto === photo.urls.regular ? `2px solid ${ACCENT_COLOR}` : 'none' }} />
                ))}
              </div>
            )}
          </div>

          <button onClick={addPlant} style={{ width: '100%', background: ACCENT_COLOR, border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>
            {editingId ? 'Update Plant' : 'Add Plant'}
          </button>
        </div>
      </AddModal>

      {/* Add Meal Modal */}
      <AddModal isOpen={showAddModal && modalType === 'meal'} title={editingId ? "Edit Meal" : "Add Meal"} onClose={resetModal}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Meal name..." style={{ background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px' }} />
          <textarea value={newItemRecipe} onChange={(e) => setNewItemRecipe(e.target.value)} placeholder="Add recipe (optional)..." style={{ background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px', minHeight: '100px', fontFamily: 'inherit' }} />
          
          <div>
            <label style={{ fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }}>Search photo</label>
            <input type="text" placeholder="e.g. pasta, salad..." onChange={(e) => searchUnsplash(e.target.value)} style={{ width: '100%', background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px', marginBottom: '12px' }} />
            {unsplashSearchResults.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {unsplashSearchResults.map((photo) => (
                  <img key={photo.id} src={`${photo.urls.thumb}?w=120&h=120&fit=crop`} alt="" onClick={() => setNewItemPhoto(photo.urls.regular)} style={{ width: '100%', height: '100px', borderRadius: '8px', cursor: 'pointer', border: newItemPhoto === photo.urls.regular ? `2px solid ${ACCENT_COLOR}` : 'none' }} />
                ))}
              </div>
            )}
          </div>

          <button onClick={addMeal} style={{ width: '100%', background: ACCENT_COLOR, border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>
            {editingId ? 'Update Meal' : 'Add Meal'}
          </button>
        </div>
      </AddModal>

      {/* Add Expense Modal */}
      <AddModal isOpen={showAddModal && modalType === 'expense'} title={editingId ? "Edit Expense" : "Add Expense"} onClose={resetModal}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="What did you spend on?" style={{ background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px' }} />
          <button onClick={addExpense} style={{ width: '100%', background: ACCENT_COLOR, border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>
            {editingId ? 'Update Expense' : 'Add Expense'}
          </button>
        </div>
      </AddModal>

      {/* Add Travel Modal */}
      <AddModal isOpen={showAddModal && modalType === 'travel'} title={editingId ? "Edit Travel" : "Add Travel"} onClose={resetModal}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#666', marginBottom: '6px', display: 'block' }}>Who is traveling?</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                onClick={() => setNewTravelPerson('me')}
                style={{
                  background: newTravelPerson === 'me' ? ACCENT_COLOR : `rgba(255, 255, 255, 0.05)`,
                  border: `1px solid rgba(${newTravelPerson === 'me' ? '18, 52, 255' : '255, 255, 255'}, ${newTravelPerson === 'me' ? 0.4 : 0.1})`,
                  borderRadius: '12px',
                  padding: '12px',
                  color: newTravelPerson === 'me' ? '#fff' : '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                You
              </button>
              <button
                onClick={() => setNewTravelPerson('partner')}
                style={{
                  background: newTravelPerson === 'partner' ? ACCENT_COLOR : `rgba(255, 255, 255, 0.05)`,
                  border: `1px solid rgba(${newTravelPerson === 'partner' ? '18, 52, 255' : '255, 255, 255'}, ${newTravelPerson === 'partner' ? 0.4 : 0.1})`,
                  borderRadius: '12px',
                  padding: '12px',
                  color: newTravelPerson === 'partner' ? '#fff' : '#666',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                Partner
              </button>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#666', marginBottom: '6px', display: 'block' }}>Location</label>
            <input type="text" value={newTravelLocation} onChange={(e) => handleCitySearch(e.target.value)} placeholder="Search city..." style={{ width: '100%', background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px', boxSizing: 'border-box' }} />
            {citySuggestions.length > 0 && (
              <div style={{ marginTop: '8px', display: 'grid', gap: '4px' }}>
                {citySuggestions.map((city, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setNewTravelLocation(`${city.name}, ${city.country}`);
                      setCitySuggestions([]);
                    }}
                    style={{
                      background: `rgba(18, 52, 255, 0.1)`,
                      border: `1px solid rgba(18, 52, 255, 0.2)`,
                      borderRadius: '8px',
                      padding: '8px 12px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '14px',
                      textAlign: 'left',
                    }}
                  >
                    {city.name}, {city.country}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div>
            <label style={{ fontSize: '12px', color: '#666', marginBottom: '6px', display: 'block' }}>Start date</label>
            <input type="date" value={newTravelStart} onChange={(e) => setNewTravelStart(e.target.value)} style={{ width: '100%', background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#666', marginBottom: '6px', display: 'block' }}>End date</label>
            <input type="date" value={newTravelEnd} onChange={(e) => setNewTravelEnd(e.target.value)} style={{ width: '100%', background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px', boxSizing: 'border-box' }} />
          </div>

          <button onClick={addTravel} style={{ width: '100%', background: ACCENT_COLOR, border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>
            {editingId ? 'Update Travel' : 'Add Travel'}
          </button>
        </div>
      </AddModal>
    </div>
  );
}