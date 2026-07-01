import React, { useState, useEffect } from 'react';
import {
  Home, Leaf, UtensilsCrossed, Wallet, LogOut,
  X, Sliders, Bell, Plus, Plane, Edit2, MapPin, ChefHat, Droplet, Archive, ChevronDown,
  ShoppingCart as ShoppingBag, Heart, Wind, Smile
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { auth } from './firebaseConfig';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { ref, onValue, set } from 'firebase/database';
import { getDatabase } from 'firebase/database';

const provider = new GoogleAuthProvider();
const database = getDatabase();

const ACCENT_COLOR = '#1234ff';
const BG_COLOR = '#000000';

const BUDGET_CATEGORIES = [
  { name: 'Groceries', icon: ShoppingBag, color: '#ff3b30' },
  { name: 'Travel', icon: Plane, color: '#34c759' },
  { name: 'Clothes', icon: Heart, color: '#ff9500' },
  { name: 'House', icon: Home, color: '#5856d6' },
  { name: 'Personal Care', icon: Smile, color: '#00b4d8' },
  { name: 'Other', icon: Wind, color: '#999' },
];

const TRAVEL_CATEGORIES = [
  { name: 'Business', color: '#1234ff' },
  { name: 'Holiday', color: '#34c759' },
];

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
  { name: 'Bordeaux', country: 'France' },
  { name: 'Lyon', country: 'France' },
  { name: 'Grenoble', country: 'France' },
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
const CalendarMonth = ({ travels, currentMonth, onMonthChange }) => {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  let startingDayOfWeek = firstDay.getDay() - 1;
  if (startingDayOfWeek === -1) startingDayOfWeek = 6;

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

  const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div style={{ background: `rgba(255, 255, 255, 0.02)`, borderRadius: '16px', padding: '20px', border: `1px solid rgba(18, 52, 255, 0.15)` }}>
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
              style={{
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '12px',
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
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [archiveType, setArchiveType] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Data
  const [plants, setPlants] = useState([]);
  const [meals, setMeals] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [travels, setTravels] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [archiveMonth, setArchiveMonth] = useState(new Date());
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Modal states
  const [newItemName, setNewItemName] = useState('');
  const [newItemRecipe, setNewItemRecipe] = useState('');
  const [newItemPhoto, setNewItemPhoto] = useState(null);
  const [newItemWateringDays, setNewItemWateringDays] = useState(7);
  const [newTravelStart, setNewTravelStart] = useState('');
  const [newTravelEnd, setNewTravelEnd] = useState('');
  const [newTravelLocation, setNewTravelLocation] = useState('');
  const [newTravelUserIds, setNewTravelUserIds] = useState([]);
  const [newTravelCategory, setNewTravelCategory] = useState('Holiday');
  const [newExpenseCategory, setNewExpenseCategory] = useState('Groceries');
  const [newExpenseTitle, setNewExpenseTitle] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseDate, setNewExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [unsplashSearchResults, setUnsplashSearchResults] = useState([]);

  // Auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadSharedData();
        checkNotificationPermission();
        initializeUser(currentUser);
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeUser = async (currentUser) => {
    try {
      const usersRef = ref(database, 'shared-data/users');
      onValue(usersRef, (snapshot) => {
        if (snapshot.exists()) {
          const usersData = snapshot.val();
          setUsers(usersData.filter(u => u && u.uid));
        } else {
          setUsers([]);
        }
      });
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

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
            setPlants(toArray(data.plants));
            setMeals(toArray(data.meals));
            setExpenses(toArray(data.expenses));
            setTravels(toArray(data.travels));
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
            setPlants(toArray(data.plants));
            setMeals(toArray(data.meals));
            setExpenses(toArray(data.expenses));
            setTravels(toArray(data.travels));
          }
        }
      );
      return unsubscribe;
    } catch (error) {
      setLoading(false);
    }
  };

  const saveData = async (newPlants, newMeals, newExpenses, newTravels) => {
    try {
      const sharedRef = ref(database, 'shared-data/default');
      const data = {
        plants: newPlants,
        meals: newMeals,
        expenses: newExpenses,
        travels: newTravels,
        lastUpdated: new Date().toISOString(),
        lastUpdatedBy: user?.email,
      };
      await set(sharedRef, data);
      localStorage.setItem('cojoBackup', JSON.stringify(data));
    } catch (error) {
      console.error('❌ Error saving:', error);
    }
  };

  // Convert Firebase objects to arrays
  const toArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return Object.values(data).filter(item => item && typeof item === 'object');
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
    const amount = parseFloat(newExpenseAmount);
    console.log('Adding expense:', { amount, category: newExpenseCategory, title: newExpenseTitle, date: newExpenseDate });
    
    if (newExpenseAmount && amount > 0) {
      const expense = {
        id: editingId || Date.now().toString(),
        category: newExpenseCategory,
        title: newExpenseTitle || 'Untitled',
        amount: amount,
        date: newExpenseDate,
      };
      
      console.log('Expense object:', expense);
      
      let updated;
      if (editingId) {
        updated = expenses.map(e => e.id === editingId ? expense : e);
      } else {
        updated = [...expenses, expense];
      }
      
      console.log('Updated expenses array:', updated);
      
      setExpenses(updated);
      saveData(plants, meals, updated, travels);
      resetModal();
      console.log('✅ Expense added successfully');
    } else {
      console.log('❌ Validation failed:', { newExpenseAmount, amount, valid: amount > 0 });
    }
  };

  const deleteExpense = (id) => {
    const updated = expenses.filter(e => e.id !== id);
    setExpenses(updated);
    saveData(plants, meals, updated, travels);
  };

  // ==================== TRAVELS ====================
  const addTravel = () => {
    if (newTravelStart && newTravelEnd && newTravelLocation && newTravelUserIds.length > 0) {
      const travel = {
        id: editingId || Date.now().toString(),
        startDate: newTravelStart,
        endDate: newTravelEnd,
        location: newTravelLocation,
        userIds: newTravelUserIds,
        category: newTravelCategory,
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
      const travelUserIds = travel.userIds || [travel.userId];

      // Only count as days apart if not both users are traveling together
      const bothTraveling = travelUserIds.length > 1 && travelUserIds.includes(user?.uid) && 
                           travelUserIds.find(uid => uid !== user?.uid && users.find(u => u.uid === uid));

      if (start.getMonth() === month && start.getFullYear() === year && !bothTraveling) {
        days += Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      }
    });

    return days;
  };

  const getCurrentTraveler = () => {
    const today = new Date().toISOString().split('T')[0];
    return travels.find(t => t.startDate <= today && t.endDate >= today);
  };

  const getFirstName = (fullName) => {
    if (!fullName) return 'You';
    return fullName.split(' ')[0];
  };

  const getExpensesForMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return expenses.filter(e => {
      const expDate = new Date(e.date);
      return expDate.getFullYear() === year && expDate.getMonth() === month;
    });
  };

  const getExpensesByCategoryForMonth = (date) => {
    const monthExpenses = getExpensesForMonth(date);
    const grouped = {};
    BUDGET_CATEGORIES.forEach(cat => {
      grouped[cat.name] = monthExpenses.filter(e => e.category === cat.name);
    });
    return grouped;
  };

  const getTravelsForMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return travels.filter(t => {
      const start = new Date(t.startDate);
      const end = new Date(t.endDate);
      return (start.getMonth() === month && start.getFullYear() === year) ||
             (end.getMonth() === month && end.getFullYear() === year) ||
             (start < new Date(year, month, 1) && end > new Date(year, month + 1, 0));
    });
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
    setNewTravelUserIds([]);
    setNewTravelCategory('Holiday');
    setNewExpenseCategory('Groceries');
    setNewExpenseTitle('');
    setNewExpenseAmount('');
    setNewExpenseDate(new Date().toISOString().split('T')[0]);
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
      setNewExpenseCategory(item.category);
      setNewExpenseTitle(item.title || '');
      setNewExpenseAmount(item.amount.toString());
      setNewExpenseDate(item.date);
    } else if (type === 'travel') {
      setNewTravelStart(item.startDate);
      setNewTravelEnd(item.endDate);
      setNewTravelLocation(item.location);
      setNewTravelUserIds(item.userIds || [item.userId] || []);
      setNewTravelCategory(item.category || 'Holiday');
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
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#1234ff',
        padding: '20px',
        flexDirection: 'column',
        backgroundImage: 'url(/splash_screen.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        position: 'relative',
      }}>
        {/* Dark overlay for text readability */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.3) 100%)',
          pointerEvents: 'none',
        }} />
        
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '100vh',
          maxWidth: '500px',
          width: '100%',
          position: 'relative',
          zIndex: 1,
          padding: '40px 20px',
        }}>
          {/* Top section - Logo and tagline */}
          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <img src={`/cojo_logo.svg?v=${Date.now()}`} alt="COJO" style={{ height: '80px', marginBottom: '20px' }} />
            <p style={{
              fontSize: '18px',
              color: '#fff',
              margin: 0,
              fontWeight: '300',
              letterSpacing: '0.5px',
            }}>
              Sharing life together.
            </p>
          </div>

          {/* Bottom section - Sign in button */}
          <button
            onClick={handleLogin}
            style={{
              width: '100%',
              maxWidth: '300px',
              padding: '16px',
              background: ACCENT_COLOR,
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '600',
              cursor: 'pointer',
              marginBottom: '40px',
              boxShadow: '0 8px 24px rgba(18, 52, 255, 0.3)',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 12px 32px rgba(18, 52, 255, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 24px rgba(18, 52, 255, 0.3)';
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
        borderBottom: `1px solid rgba(18, 52, 255, 0.15)`,
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>Home</h2>
              <div style={{ width: '20px' }} />
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              {/* Currently traveling card - FIRST */}
              {currentTraveler && (() => {
                const avatar = currentTraveler.userIds && currentTraveler.userIds[0] === user?.uid ? user?.photoURL : 
                               currentTraveler.userIds && currentTraveler.userIds[0] ? users.find(u => u.uid === currentTraveler.userIds[0])?.photoURL :
                               currentTraveler.userId === user?.uid ? user?.photoURL : users.find(u => u.uid === currentTraveler.userId)?.photoURL;
                
                return (
                  <div
                    style={{
                      background: `linear-gradient(135deg, rgba(18, 52, 255, 0.15) 0%, rgba(0, 0, 0, 0.8) 100%)`,
                      borderRadius: '16px',
                      padding: '24px',
                      border: `1px solid rgba(18, 52, 255, 0.15)`,
                      backdropFilter: 'blur(10px)',
                      minHeight: '160px',
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
                          background: `url(${avatar}) no-repeat center / cover`,
                          border: `2px solid ${ACCENT_COLOR}`,
                        }}
                      />
                      <div>
                        <div style={{ fontSize: '14px', color: '#999', marginBottom: '2px' }}>
                          {currentTraveler.userIds && currentTraveler.userIds.length > 1 ? 'are currently in' : 'is currently in'}
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: ACCENT_COLOR }}>
                          {currentTraveler.location}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Plants needing water - FIRST CARD */}
              <div
                style={{
                  background: plantsNeedingWater > 0 
                    ? 'linear-gradient(135deg, rgba(255, 59, 48, 0.15) 0%, rgba(0, 0, 0, 0.8) 100%)'
                    : 'linear-gradient(135deg, rgba(18, 52, 255, 0.15) 0%, rgba(0, 0, 0, 0.8) 100%)',
                  borderRadius: '16px',
                  padding: '32px 24px',
                  border: plantsNeedingWater > 0 
                    ? '1px solid rgba(255, 59, 48, 0.15)'
                    : '1px solid rgba(18, 52, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  minHeight: '160px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                }}
              >
                {plantsNeedingWater > 0 ? (
                  <>
                    <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '8px', color: '#ff3b30' }}>{plantsNeedingWater}</div>
                    <div style={{ fontSize: '14px', color: '#999' }}>plants need watering today</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '8px' }}>All</div>
                    <div style={{ fontSize: '14px', color: '#999' }}>plants are watered</div>
                  </>
                )}
              </div>

              {/* Days apart this month */}
              <div
                style={{
                  background: `linear-gradient(135deg, rgba(18, 52, 255, 0.15) 0%, rgba(0, 0, 0, 0.8) 100%)`,
                  borderRadius: '16px',
                  padding: '32px 24px',
                  border: `1px solid rgba(18, 52, 255, 0.15)`,
                  backdropFilter: 'blur(10px)',
                  minHeight: '160px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                }}
              >
                <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '8px' }}>{getTravelDaysThisMonth()}</div>
                <div style={{ fontSize: '14px', color: '#999' }}>days apart this month</div>
              </div>

              {/* Spent together this month */}
              <div
                style={{
                  background: `linear-gradient(135deg, rgba(18, 52, 255, 0.15) 0%, rgba(0, 0, 0, 0.8) 100%)`,
                  borderRadius: '16px',
                  padding: '32px 24px',
                  border: `1px solid rgba(18, 52, 255, 0.15)`,
                  backdropFilter: 'blur(10px)',
                  minHeight: '160px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                }}
              >
                <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '8px' }}>€{getExpensesForMonth(currentMonth).reduce((sum, e) => sum + e.amount, 0).toFixed(2)}</div>
                <div style={{ fontSize: '14px', color: '#999' }}>spent together this month</div>
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
                  borderRadius: '12px',
                  padding: '10px 16px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
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
                        backgroundImage: `url(${plant.photo}?w=400&h=300&fit=crop)`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        borderRadius: '16px',
                        minHeight: '200px',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: `0 0 0 1px rgba(${status.needsWatering ? '255, 59, 48' : '18, 52, 255'}, 0.15)`,
                      }}
                    >
                      {/* Gradient overlay */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.95) 100%)',
                        pointerEvents: 'none',
                      }} />
                      
                      {/* Content */}
                      <div style={{
                        position: 'relative',
                        zIndex: 1,
                        padding: '16px',
                        minHeight: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        height: '100%',
                      }}>
                        <div style={{ marginBottom: '12px' }}>
                          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px' }}>{plant.name}</h3>
                          <p style={{ fontSize: '12px', color: status.needsWatering ? '#ff3b30' : '#999', margin: 0 }}>
                            {status.needsWatering ? 'Needs watering!' : `Next in ${status.daysUntil} days`}
                          </p>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <button
                            onClick={() => waterPlant(plant.id)}
                            style={{
                              flex: 1,
                              background: 'rgba(255, 255, 255, 0.08)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                              borderRadius: '12px',
                              padding: '10px',
                              color: '#fff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              fontSize: '14px',
                              fontWeight: '600',
                            }}
                          >
                            <Droplet size={16} /> Mark as watered
                          </button>
                          <button
                            onClick={() => openEditModal('plant', plant)}
                            style={{
                              background: '#1234ff',
                              border: 'none',
                              borderRadius: '12px',
                              padding: '10px 12px',
                              color: '#fff',
                              cursor: 'pointer',
                            }}
                          >
                            <Edit2 size={18} />
                          </button>
                        </div>
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
                  borderRadius: '12px',
                  padding: '10px 16px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
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
                      backgroundImage: `url(${meal.photo}?w=400&h=300&fit=crop)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: '16px',
                      minHeight: '200px',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: `0 0 0 1px rgba(18, 52, 255, 0.15)`,
                    }}
                  >
                    {/* Gradient overlay */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.95) 100%)',
                      pointerEvents: 'none',
                    }} />
                    
                    {/* Content */}
                    <div style={{
                      position: 'relative',
                      zIndex: 1,
                      padding: '16px',
                      minHeight: '200px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      height: '100%',
                    }}>
                      <div style={{ marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>{meal.name}</h3>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          onClick={() => {
                            setSelectedRecipe(meal);
                            setShowRecipeModal(true);
                          }}
                          style={{
                            flex: 1,
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '10px 12px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                          }}
                        >
                          <ChefHat size={16} /> View Recipe
                        </button>
                        <button
                          onClick={() => openEditModal('meal', meal)}
                          style={{
                            background: '#1234ff',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '10px 12px',
                            color: '#fff',
                            cursor: 'pointer',
                          }}
                        >
                          <Edit2 size={18} />
                        </button>
                      </div>
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
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => {
                    setShowArchive(true);
                    setArchiveType('budget');
                    setArchiveMonth(new Date());
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    color: '#999',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="View archive"
                >
                  <Archive size={18} />
                </button>
                <button
                  onClick={() => {
                    setModalType('expense');
                    setEditingId(null);
                    setShowAddModal(true);
                    setNewExpenseCategory('Groceries');
                    setNewExpenseAmount('');
                    setNewExpenseDate(new Date().toISOString().split('T')[0]);
                  }}
                  style={{
                    background: ACCENT_COLOR,
                    border: 'none',
                    borderRadius: '12px',
                    padding: '10px 16px',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  <Plus size={18} /> Add
                </button>
              </div>
            </div>

            {getExpensesForMonth(currentMonth).length === 0 ? (
              <EmptyState icon={Wallet} title="No expenses this month" subtitle="Track your spending together" />
            ) : (
              <div style={{ display: 'grid', gap: '24px' }}>
                {/* CIRCULAR CHART */}
                <div style={{ background: 'transparent', borderRadius: '20px', padding: '16px 24px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                      <Pie
                        data={BUDGET_CATEGORIES.map(cat => {
                          const catExpenses = getExpensesByCategoryForMonth(currentMonth)[cat.name];
                          const total = catExpenses.reduce((sum, exp) => sum + exp.amount, 0);
                          return { name: cat.name, value: total, color: cat.color };
                        }).filter(item => item.value > 0)}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={105}
                        startAngle={90}
                        endAngle={-270}
                        dataKey="value"
                        stroke="none"
                      >
                        {BUDGET_CATEGORIES.map(cat => {
                          const catExpenses = getExpensesByCategoryForMonth(currentMonth)[cat.name];
                          const total = catExpenses.reduce((sum, exp) => sum + exp.amount, 0);
                          if (total > 0) {
                            return <Cell key={cat.name} fill={cat.color} />;
                          }
                          return null;
                        })}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div style={{ textAlign: 'center', marginTop: '-100px', position: 'absolute', zIndex: 10 }}>
                    <p style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: '#fff', lineHeight: '1' }}>
                      €{getExpensesForMonth(currentMonth).reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                    </p>
                    <p style={{ fontSize: '9px', color: '#999', margin: '4px 0 0', letterSpacing: '0.5px' }}>
                      {currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase()}
                    </p>
                  </div>
                </div>

                {/* ACCORDION CATEGORIES */}
                <div style={{ display: 'grid', gap: '12px' }}>
                  {BUDGET_CATEGORIES.map(category => {
                    const categoryExpenses = getExpensesByCategoryForMonth(currentMonth)[category.name];
                    const total = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
                    
                    if (categoryExpenses.length === 0) return null;
                    
                    const Icon = category.icon;
                    const isExpanded = expandedCategory === category.name;
                    
                    return (
                      <div key={category.name}>
                        <button
                          onClick={() => setExpandedCategory(isExpanded ? null : category.name)}
                          style={{
                            width: '100%',
                            background: `rgba(255, 255, 255, 0.02)`,
                            border: `1px solid rgba(18, 52, 255, 0.1)`,
                            borderRadius: '12px',
                            padding: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            color: 'inherit',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                            e.currentTarget.style.borderColor = 'rgba(18, 52, 255, 0.15)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                            e.currentTarget.style.borderColor = 'rgba(18, 52, 255, 0.1)';
                          }}
                        >
                          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${category.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: category.color, flexShrink: 0 }}>
                            <Icon size={20} />
                          </div>
                          <div style={{ flex: 1, textAlign: 'left' }}>
                            <p style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#fff' }}>{category.name}</p>
                            <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>{categoryExpenses.length} transaction{categoryExpenses.length !== 1 ? 's' : ''}</p>
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: '700', color: category.color, marginRight: '8px', flexShrink: 0 }}>€{total.toFixed(2)}</div>
                          <ChevronDown size={20} color="#999" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }} />
                        </button>
                        
                        {isExpanded && (
                          <div style={{ background: 'transparent', borderRadius: '12px', padding: '12px 0 8px', display: 'grid', gap: '10px' }}>
                            {categoryExpenses.map((exp, idx) => (
                              <div key={exp.id} style={{ background: `rgba(255, 255, 255, 0.04)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: '10px', border: `1px solid rgba(255, 255, 255, 0.06)`, transition: 'all 0.2s' }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                  e.currentTarget.style.borderColor = 'rgba(18, 52, 255, 0.15)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                                }}
                              >
                                <div style={{ flex: 1 }}>
                                  <p style={{ fontSize: '13px', margin: 0, fontWeight: '500', color: '#fff' }}>{exp.title}</p>
                                  <p style={{ fontSize: '11px', color: '#999', margin: '3px 0 0' }}>{exp.date}</p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '4px' }}>
                                  <p style={{ fontSize: '13px', margin: 0, fontWeight: '600', color: '#fff', minWidth: '60px', textAlign: 'right' }}>€{exp.amount.toFixed(2)}</p>
                                  <button onClick={() => openEditModal('expense', exp)} style={{ background: '#1234ff', border: 'none', borderRadius: '6px', padding: '5px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                    onMouseEnter={(e) => e.target.style.background = '#0020cc'}
                                    onMouseLeave={(e) => e.target.style.background = '#1234ff'}
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TRAVEL TAB */}
        {activeTab === 'travel' && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>Travel</h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => {
                    setShowArchive(true);
                    setArchiveType('travel');
                    setArchiveMonth(new Date());
                  }}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '12px',
                    padding: '10px 12px',
                    color: '#999',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="View archive"
                >
                  <Archive size={18} />
                </button>
                <button
                  onClick={() => {
                    setModalType('travel');
                    setEditingId(null);
                    setShowAddModal(true);
                    setNewTravelStart('');
                    setNewTravelEnd('');
                    setNewTravelLocation('');
                    setNewTravelUserIds(user?.uid ? [user.uid] : []);
                    setNewTravelCategory('Holiday');
                  }}
                  style={{
                    background: ACCENT_COLOR,
                    border: 'none',
                    borderRadius: '12px',
                    padding: '10px 16px',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  <Plus size={18} /> Add
                </button>
              </div>
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
                  <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 12px' }}>Trips this month</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {getTravelsForMonth(currentMonth).map(travel => {
                      const categoryInfo = TRAVEL_CATEGORIES.find(c => c.name === travel.category) || TRAVEL_CATEGORIES[1];
                      const travelersNames = (travel.userIds || [travel.userId || '']).map(uid => {
                        if (uid === user?.uid) return getFirstName(user?.displayName);
                        const otherUser = users.find(u => u.uid === uid);
                        return getFirstName(otherUser?.displayName) || 'Guest';
                      }).join(' & ');
                      
                      return (
                        <div
                          key={travel.id}
                          style={{
                            background: `${categoryInfo.color}15`,
                            border: `1px solid ${categoryInfo.color}40`,
                            borderRadius: '16px',
                            padding: '16px',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <MapPin size={16} style={{ color: categoryInfo.color }} />
                                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>{travel.location}</h3>
                              </div>
                              <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px' }}>
                                {travel.startDate} → {travel.endDate}
                              </p>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>
                                  {travelersNames}
                                </p>
                                <span style={{ fontSize: '11px', color: categoryInfo.color, fontWeight: '600', background: `${categoryInfo.color}25`, padding: '2px 8px', borderRadius: '6px' }}>
                                  {travel.category}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => openEditModal('travel', travel)}
                              style={{
                                background: '#1234ff',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '8px 12px',
                                color: '#fff',
                                cursor: 'pointer',
                              }}
                            >
                              <Edit2 size={18} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ARCHIVE MODAL - BUDGET */}
      {showArchive && archiveType === 'budget' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'flex-end',
          zIndex: 1000,
        }}>
          <div style={{
            width: '100%',
            background: '#000',
            borderRadius: '20px 20px 0 0',
            padding: '24px',
            maxHeight: '80vh',
            overflowY: 'auto',
            animation: 'slideUp 0.3s ease-out',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>Budget Archive</h2>
              <button onClick={() => setShowArchive(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '28px' }}>×</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <button onClick={() => setArchiveMonth(new Date(archiveMonth.getFullYear(), archiveMonth.getMonth() - 1))} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}>←</button>
              <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][archiveMonth.getMonth()]} {archiveMonth.getFullYear()}
              </h3>
              <button onClick={() => setArchiveMonth(new Date(archiveMonth.getFullYear(), archiveMonth.getMonth() + 1))} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}>→</button>
            </div>

            {getExpensesForMonth(archiveMonth).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                <p>No expenses in this month</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '8px' }}>
                {BUDGET_CATEGORIES.map(category => {
                  const categoryExpenses = getExpensesByCategoryForMonth(archiveMonth)[category.name];
                  const total = categoryExpenses.reduce((sum, exp) => sum + exp.amount, 0);
                  
                  if (categoryExpenses.length === 0) return null;
                  
                  const Icon = category.icon;
                  const isExpanded = expandedCategory === `archive-${category.name}`;
                  
                  return (
                    <div key={category.name}>
                      <button
                        onClick={() => setExpandedCategory(isExpanded ? null : `archive-${category.name}`)}
                        style={{
                          width: '100%',
                          background: `rgba(255, 255, 255, 0.02)`,
                          border: `1px solid rgba(18, 52, 255, 0.1)`,
                          borderRadius: '12px',
                          padding: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.04)'}
                        onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.02)'}
                      >
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${category.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: category.color }}>
                          <Icon size={20} />
                        </div>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <p style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#fff' }}>{category.name}</p>
                          <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>{categoryExpenses.length} transaction{categoryExpenses.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: '700', color: category.color, marginRight: '8px' }}>€{total.toFixed(2)}</div>
                        <ChevronDown size={20} color="#666" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                      </button>
                      
                      {isExpanded && (
                        <div style={{ background: `rgba(18, 52, 255, 0.05)`, borderRadius: '0 0 12px 12px', borderLeft: `1px solid rgba(18, 52, 255, 0.1)`, borderRight: `1px solid rgba(18, 52, 255, 0.1)`, borderBottom: `1px solid rgba(18, 52, 255, 0.1)`, padding: '12px 16px', display: 'grid', gap: '8px' }}>
                          {categoryExpenses.map(exp => (
                            <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                              <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '14px', margin: 0, fontWeight: '500', color: '#fff' }}>{exp.title}</p>
                                <p style={{ fontSize: '12px', color: '#999', margin: '2px 0 0' }}>{exp.date}</p>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginRight: '8px' }}>
                                <p style={{ fontSize: '14px', margin: 0, fontWeight: '600', color: '#fff' }}>€{exp.amount.toFixed(2)}</p>
                                <button onClick={() => openEditModal('expense', exp)} style={{ background: '#1234ff', border: 'none', borderRadius: '8px', padding: '6px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Edit2 size={14} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ARCHIVE MODAL - TRAVEL */}
      {showArchive && archiveType === 'travel' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'flex-end',
          zIndex: 1000,
        }}>
          <div style={{
            width: '100%',
            background: '#000',
            borderRadius: '20px 20px 0 0',
            padding: '24px',
            maxHeight: '80vh',
            overflowY: 'auto',
            animation: 'slideUp 0.3s ease-out',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>Travel Archive</h2>
              <button onClick={() => setShowArchive(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '28px' }}>×</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <button onClick={() => setArchiveMonth(new Date(archiveMonth.getFullYear(), archiveMonth.getMonth() - 1))} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}>←</button>
              <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][archiveMonth.getMonth()]} {archiveMonth.getFullYear()}
              </h3>
              <button onClick={() => setArchiveMonth(new Date(archiveMonth.getFullYear(), archiveMonth.getMonth() + 1))} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}>→</button>
            </div>

            {getTravelsForMonth(archiveMonth).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                <p>No trips in this month</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {getTravelsForMonth(archiveMonth).map(travel => {
                  const categoryInfo = TRAVEL_CATEGORIES.find(c => c.name === travel.category) || TRAVEL_CATEGORIES[1];
                  const travelersNames = (travel.userIds || [travel.userId || '']).map(uid => {
                    if (uid === user?.uid) return getFirstName(user?.displayName);
                    const otherUser = users.find(u => u.uid === uid);
                    return getFirstName(otherUser?.displayName) || 'Guest';
                  }).join(' & ');
                  
                  return (
                    <div key={travel.id} style={{
                      background: `${categoryInfo.color}15`,
                      border: `1px solid ${categoryInfo.color}40`,
                      borderRadius: '16px',
                      padding: '16px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <MapPin size={20} style={{ color: categoryInfo.color, marginTop: '2px', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px' }}>{travel.location}</h3>
                          <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px' }}>
                            {travel.startDate} → {travel.endDate}
                          </p>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>
                              {travelersNames}
                            </p>
                            <span style={{ fontSize: '11px', color: categoryInfo.color, fontWeight: '600', background: `${categoryInfo.color}25`, padding: '2px 8px', borderRadius: '6px' }}>
                              {travel.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

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
                <p style={{ margin: '0 0 4px', fontWeight: '600' }}>{getFirstName(user?.displayName)}</p>
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
                    borderRadius: '12px',
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
                <div style={{ padding: '12px', background: `rgba(52, 199, 89, 0.1)`, borderRadius: '12px', border: `1px solid rgba(52, 199, 89, 0.2)` }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#34c759' }}>✓ Notifications enabled</p>
                </div>
              )}
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
                fontWeight: '600',
              }}
            >
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Recipe Modal */}
      {showRecipeModal && selectedRecipe && (
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
          onClick={() => setShowRecipeModal(false)}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>{selectedRecipe.name}</h3>
              <button
                onClick={() => setShowRecipeModal(false)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '24px' }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ background: `rgba(18, 52, 255, 0.08)`, borderRadius: '16px', padding: '20px', border: `1px solid rgba(18, 52, 255, 0.15)` }}>
              {selectedRecipe.recipe ? (
                <p style={{ margin: 0, lineHeight: '1.6', color: '#ccc', whiteSpace: 'pre-wrap', fontSize: '14px' }}>
                  {selectedRecipe.recipe}
                </p>
              ) : (
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>No recipe provided</p>
              )}
            </div>
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
          {editingId && (
            <button onClick={() => { deletePlant(editingId); resetModal(); }} style={{ width: '100%', background: 'rgba(255, 59, 48, 0.2)', border: '1px solid rgba(255, 59, 48, 0.3)', borderRadius: '12px', padding: '14px', color: '#ff3b30', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>
              Delete Plant
            </button>
          )}
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
          {editingId && (
            <button onClick={() => { deleteMeal(editingId); resetModal(); }} style={{ width: '100%', background: 'rgba(255, 59, 48, 0.2)', border: '1px solid rgba(255, 59, 48, 0.3)', borderRadius: '12px', padding: '14px', color: '#ff3b30', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>
              Delete Meal
            </button>
          )}
        </div>
      </AddModal>

      {/* Add Expense Modal */}
      <AddModal isOpen={showAddModal && modalType === 'expense'} title={editingId ? "Edit Expense" : "Add Expense"} onClose={resetModal}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }}>Category</label>
            <select value={newExpenseCategory} onChange={(e) => setNewExpenseCategory(e.target.value)} style={{ width: '100%', background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px' }}>
              {BUDGET_CATEGORIES.map(cat => (
                <option key={cat.name} value={cat.name} style={{ background: BG_COLOR }}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }}>Description <span style={{ color: '#999', fontSize: '12px' }}>(optional)</span></label>
            <input type="text" value={newExpenseTitle} onChange={(e) => setNewExpenseTitle(e.target.value)} placeholder="e.g., Grocery shopping" style={{ width: '100%', background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={{ fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }}>Date</label>
            <input type="date" value={newExpenseDate} onChange={(e) => setNewExpenseDate(e.target.value)} style={{ width: '100%', minWidth: '100%', maxWidth: '100%', background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px', boxSizing: 'border-box', lineHeight: '1.5', WebkitAppearance: 'none', MozAppearance: 'textfield', display: 'block' }} />
          </div>

          <div>
            <label style={{ fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }}>Amount (€)</label>
            <input type="number" value={newExpenseAmount} onChange={(e) => setNewExpenseAmount(e.target.value)} placeholder="0.00" step="0.01" style={{ width: '100%', background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px' }} />
          </div>

          <button onClick={addExpense} style={{ width: '100%', background: ACCENT_COLOR, border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>
            {editingId ? 'Update Expense' : 'Add Expense'}
          </button>
          {editingId && (
            <button onClick={() => { deleteExpense(editingId); resetModal(); }} style={{ width: '100%', background: 'rgba(255, 59, 48, 0.2)', border: '1px solid rgba(255, 59, 48, 0.3)', borderRadius: '12px', padding: '14px', color: '#ff3b30', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>
              Delete Expense
            </button>
          )}
        </div>
      </AddModal>

      {/* Add Travel Modal */}
      <AddModal isOpen={showAddModal && modalType === 'travel'} title={editingId ? "Edit Travel" : "Add Travel"} onClose={resetModal}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#666', marginBottom: '6px', display: 'block' }}>Who is traveling?</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                { id: user?.uid, name: getFirstName(user?.displayName) || 'You', avatar: user?.photoURL },
                ...users.filter(u => u.uid !== user?.uid).map(u => ({ id: u.uid, name: getFirstName(u.displayName), avatar: u.photoURL })),
              ].map(person => (
                <button
                  key={person.id}
                  onClick={() => {
                    if (newTravelUserIds.includes(person.id)) {
                      setNewTravelUserIds(newTravelUserIds.filter(id => id !== person.id));
                    } else {
                      setNewTravelUserIds([...newTravelUserIds, person.id]);
                    }
                  }}
                  style={{
                    background: newTravelUserIds.includes(person.id) ? `${ACCENT_COLOR}40` : `rgba(255, 255, 255, 0.05)`,
                    border: `1px solid rgba(${newTravelUserIds.includes(person.id) ? '18, 52, 255' : '255, 255, 255'}, ${newTravelUserIds.includes(person.id) ? 0.4 : 0.1})`,
                    borderRadius: '12px',
                    padding: '12px',
                    color: newTravelUserIds.includes(person.id) ? ACCENT_COLOR : '#999',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    justifyContent: 'center',
                  }}
                >
                  <img src={person.avatar} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                  {person.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#666', marginBottom: '6px', display: 'block' }}>Category</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {TRAVEL_CATEGORIES.map(cat => (
                <button
                  key={cat.name}
                  onClick={() => setNewTravelCategory(cat.name)}
                  style={{
                    background: newTravelCategory === cat.name ? `${cat.color}40` : `rgba(255, 255, 255, 0.05)`,
                    border: `1px solid rgba(${newTravelCategory === cat.name ? cat.color.slice(1) : '255, 255, 255'}, ${newTravelCategory === cat.name ? 0.4 : 0.1})`,
                    borderRadius: '12px',
                    padding: '12px',
                    color: newTravelCategory === cat.name ? cat.color : '#999',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                  }}
                >
                  {cat.name}
                </button>
              ))}
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
            <input type="date" value={newTravelStart} onChange={(e) => setNewTravelStart(e.target.value)} style={{ width: '100%', minWidth: '100%', maxWidth: '100%', background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px', boxSizing: 'border-box', lineHeight: '1.5', WebkitAppearance: 'none', MozAppearance: 'textfield', display: 'block' }} />
          </div>

          <div>
            <label style={{ fontSize: '12px', color: '#666', marginBottom: '6px', display: 'block' }}>End date</label>
            <input type="date" value={newTravelEnd} onChange={(e) => setNewTravelEnd(e.target.value)} style={{ width: '100%', minWidth: '100%', maxWidth: '100%', background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px', boxSizing: 'border-box', lineHeight: '1.5', WebkitAppearance: 'none', MozAppearance: 'textfield', display: 'block' }} />
          </div>

          <button onClick={addTravel} style={{ width: '100%', background: ACCENT_COLOR, border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>
            {editingId ? 'Update Travel' : 'Add Travel'}
          </button>
          {editingId && (
            <button onClick={() => { deleteTravel(editingId); resetModal(); }} style={{ width: '100%', background: 'rgba(255, 59, 48, 0.2)', border: '1px solid rgba(255, 59, 48, 0.3)', borderRadius: '12px', padding: '14px', color: '#ff3b30', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>
              Delete Travel
            </button>
          )}
        </div>
      </AddModal>
    </div>
  );
}