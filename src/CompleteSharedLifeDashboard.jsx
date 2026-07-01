import React, { useState, useEffect } from 'react';
import {
  Home, Leaf, UtensilsCrossed, Wallet, LogOut,
  Trash2, X, Sliders, Bell, Plus, Plane, Edit2, MapPin, ChefHat, Droplet,
  ShoppingCart as ShoppingBag, Heart, Wind, Smile
} from 'lucide-react';
import { auth } from './firebaseConfig';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { ref, onValue, set } from 'firebase/database';
import { getDatabase } from 'firebase/database';

const provider = new GoogleAuthProvider();
const database = getDatabase();

const ACCENT_COLOR = '#1234ff';
const BG_COLOR = '#000000';

const LANGUAGES = {
  EN: {
    home: 'Home',
    plants: 'Plants',
    meals: 'Meals',
    budget: 'Budget',
    travel: 'Travel',
    plantsNeedingWater: 'plants need watering today',
    noPlantsNeedingWater: 'No plants need watering today',
    daysApart: 'days apart this month',
    spentTogether: 'spent together this month',
    addPlant: 'Add Plant',
    editPlant: 'Edit Plant',
    markAsWatered: 'Mark as watered',
    viewRecipe: 'View Recipe',
    addMeal: 'Add Meal',
    editMeal: 'Edit Meal',
    mealName: 'Meal name...',
    recipe: 'Add recipe (optional)...',
    searchPhoto: 'Search photo',
    addExpense: 'Add Expense',
    editExpense: 'Edit Expense',
    category: 'Category',
    date: 'Date',
    amount: 'Amount (€)',
    addTravel: 'Add Travel',
    editTravel: 'Edit Travel',
    whoTraveling: 'Who is traveling?',
    location: 'Location',
    searchCity: 'Search city...',
    startDate: 'Start date',
    endDate: 'End date',
    delete: 'Delete',
    update: 'Update',
    add: 'Add',
    settings: 'Settings',
    language: 'Language',
    notifications: 'Notifications',
    enableNotifications: 'Enable Notifications',
    signOut: 'Sign Out',
    isCurrentlyIn: 'is currently in',
    plantName: 'Plant name...',
    wateringFrequency: 'Watering frequency (days)',
    currentMonth: 'Current Month',
    archive: 'Archive',
    summaryTotal: 'Total',
  },
  FR: {
    home: 'Accueil',
    plants: 'Plantes',
    meals: 'Repas',
    budget: 'Budget',
    travel: 'Voyage',
    plantsNeedingWater: 'plantes a arroser',
    noPlantsNeedingWater: 'Aucune plante a arroser',
    daysApart: 'jours separes ce mois',
    spentTogether: 'depense ensemble ce mois',
    addPlant: 'Ajouter une plante',
    editPlant: 'Modifier la plante',
    markAsWatered: 'Marquer comme arrosee',
    viewRecipe: 'Voir la recette',
    addMeal: 'Ajouter un repas',
    editMeal: 'Modifier le repas',
    mealName: 'Nom du repas...',
    recipe: 'Ajouter une recette (optionnel)...',
    searchPhoto: 'Rechercher une photo',
    addExpense: 'Ajouter une depense',
    editExpense: 'Modifier la depense',
    category: 'Categorie',
    date: 'Date',
    amount: 'Montant (€)',
    addTravel: 'Ajouter un voyage',
    editTravel: 'Modifier le voyage',
    whoTraveling: 'Qui voyage?',
    location: 'Localisation',
    searchCity: 'Rechercher une ville...',
    startDate: 'Date de debut',
    endDate: 'Date de fin',
    delete: 'Supprimer',
    update: 'Mettre a jour',
    add: 'Ajouter',
    settings: 'Parametres',
    language: 'Langue',
    notifications: 'Notifications',
    enableNotifications: 'Activer les notifications',
    signOut: 'Deconnexion',
    isCurrentlyIn: 'est actuellement a',
    plantName: 'Nom de la plante...',
    wateringFrequency: 'Frequence d\'arrosage (jours)',
    currentMonth: 'Mois actuel',
    archive: 'Archive',
    summaryTotal: 'Total',
  },
};

const BUDGET_CATEGORIES = [
  { name: 'Groceries', icon: ShoppingBag, color: '#ff3b30' },
  { name: 'Travel', icon: Plane, color: '#34c759' },
  { name: 'Clothes', icon: Heart, color: '#ff9500' },
  { name: 'House', icon: Home, color: '#5856d6' },
  { name: 'Personal Care', icon: Smile, color: '#00b4d8' },
  { name: 'Other', icon: Wind, color: '#999' },
];

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
  { name: 'Sao Paulo', country: 'Brazil' },
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

const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};

const sendNotification = (title, options = {}) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/cojo_icon.png',
      badge: '/cojo_icon.png',
      ...options,
    });
  }
};

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

const EmptyState = ({ icon: Icon, title, subtitle }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', padding: '40px 20px' }}>
    <div style={{ background: `rgba(18, 52, 255, 0.1)`, borderRadius: '60px', padding: '40px', marginBottom: '20px' }}>
      <Icon size={60} style={{ color: ACCENT_COLOR }} />
    </div>
    <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 8px', textAlign: 'center' }}>{title}</h3>
    <p style={{ fontSize: '14px', color: '#666', margin: 0, textAlign: 'center' }}>{subtitle}</p>
  </div>
);

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
  const [language, setLanguage] = useState('EN');

  const [plants, setPlants] = useState([]);
  const [meals, setMeals] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [travels, setTravels] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [archiveMonth, setArchiveMonth] = useState(new Date());

  const [newItemName, setNewItemName] = useState('');
  const [newItemRecipe, setNewItemRecipe] = useState('');
  const [newItemPhoto, setNewItemPhoto] = useState(null);
  const [newItemWateringDays, setNewItemWateringDays] = useState(7);
  const [newTravelStart, setNewTravelStart] = useState('');
  const [newTravelEnd, setNewTravelEnd] = useState('');
  const [newTravelLocation, setNewTravelLocation] = useState('');
  const [newTravelUserId, setNewTravelUserId] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('Groceries');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseDate, setNewExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [unsplashSearchResults, setUnsplashSearchResults] = useState([]);

  const t = LANGUAGES[language];

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
  }, []);

  const initializeUser = async (currentUser) => {
    try {
      const usersRef = ref(database, 'shared-data/users');
      onValue(usersRef, (snapshot) => {
        if (snapshot.exists()) {
          const usersData = snapshot.val();
          setUsers(usersData.filter(u => u && u.uid));
        }
      });
    } catch (error) {
      console.error('Error:', error);
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
      onValue(sharedRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          setPlants(data.plants || []);
          setMeals(data.meals || []);
          setExpenses(data.expenses || []);
          setTravels(data.travels || []);
          localStorage.setItem('cojoBackup', JSON.stringify(data));
        }
        setLoading(false);
      });
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
      console.error('Error:', error);
    }
  };

  const saveLanguage = async (lang) => {
    setLanguage(lang);
    try {
      const userRef = ref(database, `shared-data/users/${user.uid}/language`);
      await set(userRef, lang);
    } catch (error) {
      console.error('Error:', error);
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
      console.error('Error:', error);
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

  const addPlant = () => {
    if (newItemName.trim()) {
      const plant = {
        id: editingId || Date.now().toString(),
        name: newItemName,
        addedDate: new Date().toISOString(),
        lastWatered: new Date().toISOString(),
        wateringFreqDays: parseInt(newItemWateringDays) || 7,
        healthLevel: 100,
        photo: newItemPhoto || 'https://images.unsplash.com/photo-1599599810694-b5ac4dd84e02?w=400&h=400&fit=crop',
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
      p.id === id ? { ...p, lastWatered: new Date().toISOString() } : p
    );
    setPlants(updated);
    saveData(updated, meals, expenses, travels);
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

  const addMeal = () => {
    if (newItemName.trim()) {
      const meal = {
        id: editingId || Date.now().toString(),
        name: newItemName,
        recipe: newItemRecipe,
        photo: newItemPhoto || 'https://images.unsplash.com/photo-1495575621581-20dbe3ce2bad?w=400&h=400&fit=crop',
      };
      
      let updated;
      if (editingId) {
        updated = meals.map(m => m.id === editingId ? meal : m);
      } else {
        updated = [...meals, meal];
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

  const addExpense = () => {
    if (newExpenseAmount && newExpenseAmount > 0) {
      const expense = {
        id: editingId || Date.now().toString(),
        category: newExpenseCategory,
        amount: parseFloat(newExpenseAmount),
        date: newExpenseDate,
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

  const getExpensesForMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return expenses.filter(e => {
      const expDate = new Date(e.date);
      return expDate.getFullYear() === year && expDate.getMonth() === month;
    });
  };

  const getExpenseTotal = (exps) => {
    return exps.reduce((sum, e) => sum + e.amount, 0);
  };

  const getExpensesByCategory = (exps) => {
    const grouped = {};
    BUDGET_CATEGORIES.forEach(cat => {
      grouped[cat.name] = exps.filter(e => e.category === cat.name);
    });
    return grouped;
  };

  const addTravel = () => {
    if (newTravelStart && newTravelEnd && newTravelLocation && newTravelUserId) {
      const travel = {
        id: editingId || Date.now().toString(),
        startDate: newTravelStart,
        endDate: newTravelEnd,
        location: newTravelLocation,
        userId: newTravelUserId,
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

  const getTravelDaysThisMonth = (monthDate) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    let days = 0;

    getTravelsForMonth(monthDate).forEach(travel => {
      const start = new Date(travel.startDate);
      const end = new Date(travel.endDate);
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);

      const effStart = start > monthStart ? start : monthStart;
      const effEnd = end < monthEnd ? end : monthEnd;
      
      days += Math.ceil((effEnd - effStart) / (1000 * 60 * 60 * 24)) + 1;
    });

    return days;
  };

  const getCurrentTraveler = () => {
    const today = new Date().toISOString().split('T')[0];
    return travels.find(t => t.startDate <= today && t.endDate >= today);
  };

  const getTravelerInfo = (userId) => {
    if (userId === user?.uid) {
      return { name: user?.displayName || 'You', avatar: user?.photoURL };
    }
    const otherUser = users.find(u => u.uid === userId);
    return { name: otherUser?.displayName || 'Partner', avatar: otherUser?.photoURL };
  };

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
    setNewTravelUserId('');
    setNewExpenseCategory('Groceries');
    setNewExpenseAmount('');
    setNewExpenseDate(new Date().toISOString().split('T')[0]);
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
      setNewExpenseAmount(item.amount.toString());
      setNewExpenseDate(item.date);
    } else if (type === 'travel') {
      setNewTravelStart(item.startDate);
      setNewTravelEnd(item.endDate);
      setNewTravelLocation(item.location);
      setNewTravelUserId(item.userId);
    }
  };

  const handleEnableNotifications = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      setNotificationsEnabled(true);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowSettings(false);
    } catch (error) {
      console.error('Error:', error);
    }
  };

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
          <p style={{ color: '#999', marginBottom: '40px', fontSize: '16px' }}>Sharing life together.</p>
          <button onClick={handleLogin} style={{ width: '100%', padding: '14px', background: ACCENT_COLOR, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}>
            Sign in
          </button>
        </div>
      </div>
    );
  }

  const currentTraveler = getCurrentTraveler();
  const monthExpenses = getExpensesForMonth(currentMonth);
  const monthExpensesByCategory = getExpensesByCategory(monthExpenses);
  const monthTravels = getTravelsForMonth(currentMonth);
  const monthTravelDays = getTravelDaysThisMonth(currentMonth);

  return (
    <div style={{ background: BG_COLOR, minHeight: '100vh', color: '#fff' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid rgba(18, 52, 255, 0.15)`, background: '#000000', zIndex: 50 }}>
        <div onClick={() => setShowSettings(true)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: `url(${user?.photoURL}) no-repeat center / cover`, cursor: 'pointer', border: `2px solid ${ACCENT_COLOR}` }} />
        <img src="/cojo_logo.svg" alt="COJO" style={{ height: '32px' }} />
        <button onClick={() => setShowSettings(true)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px' }}>
          <Sliders size={24} />
        </button>
      </div>

      <div style={{ paddingTop: '80px', paddingBottom: '120px' }}>
        {activeTab === 'home' && (
          <div style={{ padding: '20px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 24px' }}>{t.home}</h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ background: `linear-gradient(135deg, ${plantsNeedingWater > 0 ? 'rgba(255, 59, 48, 0.15)' : 'rgba(18, 52, 255, 0.15)'} 0%, rgba(0, 0, 0, 0.8) 100%)`, borderRadius: '16px', padding: '32px 24px', border: `1px solid rgba(${plantsNeedingWater > 0 ? '255, 59, 48' : '18, 52, 255'}, 0.15)`, minHeight: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                {plantsNeedingWater > 0 ? (
                  <>
                    <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '8px', color: '#ff3b30' }}>{plantsNeedingWater}</div>
                    <div style={{ fontSize: '14px', color: '#999' }}>{t.plantsNeedingWater}</div>
                  </>
                ) : (
                  <div style={{ fontSize: '24px', fontWeight: '600' }}>{t.noPlantsNeedingWater}</div>
                )}
              </div>

              {currentTraveler && (() => {
                const info = getTravelerInfo(currentTraveler.userId);
                return (
                  <div style={{ background: `linear-gradient(135deg, rgba(18, 52, 255, 0.15) 0%, rgba(0, 0, 0, 0.8) 100%)`, borderRadius: '16px', padding: '24px', border: `1px solid rgba(18, 52, 255, 0.15)`, minHeight: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: `url(${info.avatar}) no-repeat center / cover`, border: `2px solid ${ACCENT_COLOR}` }} />
                      <div>
                        <div style={{ fontSize: '14px', color: '#999', marginBottom: '2px' }}>{t.isCurrentlyIn}</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: ACCENT_COLOR }}>{currentTraveler.location}</div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div style={{ background: `linear-gradient(135deg, rgba(18, 52, 255, 0.15) 0%, rgba(0, 0, 0, 0.8) 100%)`, borderRadius: '16px', padding: '32px 24px', border: `1px solid rgba(18, 52, 255, 0.15)`, minHeight: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '8px' }}>{monthTravelDays}</div>
                <div style={{ fontSize: '14px', color: '#999' }}>{t.daysApart}</div>
              </div>

              <div style={{ background: `linear-gradient(135deg, rgba(18, 52, 255, 0.15) 0%, rgba(0, 0, 0, 0.8) 100%)`, borderRadius: '16px', padding: '32px 24px', border: `1px solid rgba(18, 52, 255, 0.15)`, minHeight: '160px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '8px' }}>€{getExpenseTotal(monthExpenses).toFixed(2)}</div>
                <div style={{ fontSize: '14px', color: '#999' }}>{t.spentTogether}</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'plants' && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>{t.plants}</h2>
              <button onClick={() => { setModalType('plant'); setEditingId(null); setShowAddModal(true); setNewItemName(''); setNewItemWateringDays(7); setNewItemPhoto(null); }} style={{ background: ACCENT_COLOR, border: 'none', borderRadius: '12px', padding: '10px 16px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600' }}>
                <Plus size={18} /> {t.add}
              </button>
            </div>

            {plants.length === 0 ? (
              <EmptyState icon={Leaf} title="No plants" subtitle="Lets grow together" />
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {plants.map(plant => {
                  const status = getWateringStatus(plant);
                  return (
                    <div key={plant.id} style={{ background: `linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.95) 100%), url(${plant.photo}?w=400&h=300&fit=crop)`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '16px', padding: '16px', border: `1px solid rgba(${status.needsWatering ? '255, 59, 48' : '18, 52, 255'}, 0.15)`, minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px' }}>{plant.name}</h3>
                          <p style={{ fontSize: '12px', color: status.needsWatering ? '#ff3b30' : '#999', margin: 0 }}>{status.needsWatering ? 'Needs watering!' : `Next in ${status.daysUntil} days`}</p>
                        </div>
                        <button onClick={() => openEditModal('plant', plant)} style={{ background: `rgba(18, 52, 255, 0.2)`, border: '1px solid rgba(18, 52, 255, 0.3)`, borderRadius: '12px', padding: '8px', color: ACCENT_COLOR, cursor: 'pointer' }}>
                          <Edit2 size={18} />
                        </button>
                      </div>
                      <button onClick={() => waterPlant(plant.id)} style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '10px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '14px', fontWeight: '600' }}>
                        <Droplet size={16} /> {t.markAsWatered}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'food' && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>{t.meals}</h2>
              <button onClick={() => { setModalType('meal'); setEditingId(null); setShowAddModal(true); setNewItemName(''); setNewItemRecipe(''); setNewItemPhoto(null); }} style={{ background: ACCENT_COLOR, border: 'none', borderRadius: '12px', padding: '10px 16px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600' }}>
                <Plus size={18} /> {t.add}
              </button>
            </div>

            {meals.length === 0 ? (
              <EmptyState icon={UtensilsCrossed} title="No meals" subtitle="Collect recipes" />
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {meals.map(meal => (
                  <div key={meal.id} style={{ background: `linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.95) 100%), url(${meal.photo}?w=400&h=300&fit=crop)`, backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: '16px', padding: '16px', border: `1px solid rgba(18, 52, 255, 0.15)`, minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>{meal.name}</h3>
                      <button onClick={() => openEditModal('meal', meal)} style={{ background: `rgba(18, 52, 255, 0.2)`, border: '1px solid rgba(18, 52, 255, 0.3)`, borderRadius: '12px', padding: '8px', color: ACCENT_COLOR, cursor: 'pointer' }}>
                        <Edit2 size={18} />
                      </button>
                    </div>
                    <button onClick={() => { setSelectedRecipe(meal); setShowRecipeModal(true); }} style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '10px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '14px', fontWeight: '600' }}>
                      <ChefHat size={16} /> {t.viewRecipe}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'budget' && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>{t.budget}</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setShowArchive(true); setArchiveType('budget'); }} style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '12px', padding: '8px 12px', color: '#999', cursor: 'pointer', fontSize: '12px' }}>
                  {t.archive}
                </button>
                <button onClick={() => { setModalType('expense'); setEditingId(null); setShowAddModal(true); setNewExpenseCategory('Groceries'); setNewExpenseAmount(''); setNewExpenseDate(new Date().toISOString().split('T')[0]); }} style={{ background: ACCENT_COLOR, border: 'none', borderRadius: '12px', padding: '8px 12px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600' }}>
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {monthExpenses.length === 0 ? (
              <EmptyState icon={Wallet} title="No expenses" subtitle="Track together" />
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {BUDGET_CATEGORIES.map(category => {
                  const catExpenses = monthExpensesByCategory[category.name] || [];
                  if (catExpenses.length === 0) return null;
                  
                  const Icon = category.icon;
                  const total = catExpenses.reduce((sum, e) => sum + e.amount, 0);
                  
                  return (
                    <div key={category.name} style={{ background: `rgba(255, 255, 255, 0.02)`, borderRadius: '16px', padding: '16px', border: `1px solid rgba(18, 52, 255, 0.15)` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${category.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: category.color }}>
                          <Icon size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>{category.name}</h3>
                          <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>{catExpenses.length} items</p>
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '700', color: category.color }}>€{total.toFixed(2)}</div>
                      </div>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {catExpenses.map(exp => (
                          <div key={exp.id} style={{ background: `rgba(255, 255, 255, 0.02)`, borderRadius: '12px', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `1px solid rgba(255, 255, 255, 0.05)` }}>
                            <div>
                              <p style={{ fontSize: '14px', margin: 0, fontWeight: '500' }}>€{exp.amount.toFixed(2)}</p>
                              <p style={{ fontSize: '12px', color: '#666', margin: '2px 0 0' }}>{exp.date}</p>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button onClick={() => openEditModal('expense', exp)} style={{ background: 'none', border: 'none', color: ACCENT_COLOR, cursor: 'pointer' }}>
                                <Edit2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'travel' && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>{t.travel}</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { setShowArchive(true); setArchiveType('travel'); }} style={{ background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '12px', padding: '8px 12px', color: '#999', cursor: 'pointer', fontSize: '12px' }}>
                  {t.archive}
                </button>
                <button onClick={() => { setModalType('travel'); setEditingId(null); setShowAddModal(true); setNewTravelStart(''); setNewTravelEnd(''); setNewTravelLocation(''); setNewTravelUserId(user?.uid || ''); }} style={{ background: ACCENT_COLOR, border: 'none', borderRadius: '12px', padding: '8px 12px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '600' }}>
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {monthTravels.length === 0 ? (
              <EmptyState icon={Plane} title="No trips" subtitle="Plan travels" />
            ) : (
              <>
                <CalendarMonth travels={monthTravels} currentMonth={currentMonth} onMonthChange={(delta) => { const m = new Date(currentMonth); m.setMonth(m.getMonth() + delta); setCurrentMonth(m); }} />
                <div style={{ marginTop: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 12px' }}>Trips</h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {monthTravels.map(travel => {
                      const info = getTravelerInfo(travel.userId);
                      return (
                        <div key={travel.id} style={{ background: `rgba(18, 52, 255, 0.08)`, border: `1px solid rgba(18, 52, 255, 0.15)`, borderRadius: '16px', padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <MapPin size={16} style={{ color: ACCENT_COLOR }} />
                                <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>{travel.location}</h3>
                              </div>
                              <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px' }}>{travel.startDate} to {travel.endDate}</p>
                              <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>{info.name}</p>
                            </div>
                            <button onClick={() => openEditModal('travel', travel)} style={{ background: 'none', border: 'none', color: ACCENT_COLOR, cursor: 'pointer' }}>
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

      <div style={{ position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)', display: 'flex', justifyContent: 'center', gap: '12px', padding: '12px 16px', background: `rgba(0, 0, 0, 0.8)`, backdropFilter: 'blur(30px)', borderRadius: '60px', border: `1px solid rgba(18, 52, 255, 0.3)`, zIndex: 100 }}>
        {[{ id: 'home', icon: Home }, { id: 'plants', icon: Leaf }, { id: 'food', icon: UtensilsCrossed }, { id: 'budget', icon: Wallet }, { id: 'travel', icon: Plane }].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: isActive ? `rgba(18, 52, 255, 0.4)` : 'transparent', border: 'none', borderRadius: '50%', padding: '12px', width: '48px', height: '48px', color: isActive ? ACCENT_COLOR : '#666', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={24} />
            </button>
          );
        })}
      </div>

      {showSettings && (
        <div style={{ position: 'fixed', top: '0', left: '0', right: '0', bottom: '0', background: `rgba(0, 0, 0, 0.6)`, backdropFilter: 'blur(10px)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowSettings(false)}>
          <div style={{ width: '100%', background: BG_COLOR, borderTop: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '20px 20px 0 0', padding: '20px', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>{t.settings}</h3>
              <button onClick={() => setShowSettings(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '24px' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '16px', background: `rgba(18, 52, 255, 0.1)`, borderRadius: '12px' }}>
              <img src={user?.photoURL} alt="Avatar" style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: '600' }}>{user?.displayName}</p>
                <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>{user?.email}</p>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 12px', color: '#666', textTransform: 'uppercase' }}>{t.language}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {['EN', 'FR'].map(lang => (
                  <button key={lang} onClick={() => saveLanguage(lang)} style={{ background: language === lang ? ACCENT_COLOR : `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(${language === lang ? '18, 52, 255' : '255, 255, 255'}, ${language === lang ? 0.4 : 0.1})`, borderRadius: '12px', padding: '12px', color: language === lang ? '#fff' : '#999', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', margin: '0 0 12px', color: '#666', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Bell size={16} /> {t.notifications}
              </h4>
              {!notificationsEnabled ? (
                <button onClick={handleEnableNotifications} style={{ width: '100%', background: ACCENT_COLOR, border: 'none', borderRadius: '12px', padding: '12px', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                  {t.enableNotifications}
                </button>
              ) : (
                <div style={{ padding: '12px', background: `rgba(52, 199, 89, 0.1)`, borderRadius: '12px', border: `1px solid rgba(52, 199, 89, 0.2)` }}>
                  <p style={{ margin: 0, fontSize: '12px', color: '#34c759' }}>Enabled</p>
                </div>
              )}
            </div>

            <button onClick={handleLogout} style={{ width: '100%', background: 'rgba(255, 59, 48, 0.2)', border: `1px solid rgba(255, 59, 48, 0.3)`, borderRadius: '12px', padding: '12px', color: '#ff3b30', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '16px', fontWeight: '600' }}>
              <LogOut size={18} /> {t.signOut}
            </button>
          </div>
        </div>
      )}

      {showRecipeModal && selectedRecipe && (
        <div style={{ position: 'fixed', top: '0', left: '0', right: '0', bottom: '0', background: `rgba(0, 0, 0, 0.6)`, backdropFilter: 'blur(10px)', zIndex: 300, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowRecipeModal(false)}>
          <div style={{ width: '100%', background: BG_COLOR, borderTop: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '24px 24px 0 0', padding: '24px', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>{selectedRecipe.name}</h3>
              <button onClick={() => setShowRecipeModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '24px' }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ background: `rgba(18, 52, 255, 0.08)`, borderRadius: '16px', padding: '20px', border: `1px solid rgba(18, 52, 255, 0.15)` }}>
              {selectedRecipe.recipe ? (
                <p style={{ margin: 0, lineHeight: '1.6', color: '#ccc', whiteSpace: 'pre-wrap', fontSize: '14px' }}>
                  {selectedRecipe.recipe}
                </p>
              ) : (
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>No recipe</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showArchive && archiveType && (
        <div style={{ position: 'fixed', top: '0', left: '0', right: '0', bottom: '0', background: `rgba(0, 0, 0, 0.6)`, backdropFilter: 'blur(10px)', zIndex: 300, display: 'flex', alignItems: 'flex-end' }} onClick={() => setShowArchive(false)}>
          <div style={{ width: '100%', background: BG_COLOR, borderTop: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '24px 24px 0 0', padding: '24px', maxHeight: '80vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>{t.archive}</h3>
              <button onClick={() => setShowArchive(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '24px' }}>
                <X size={24} />
              </button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>{archiveMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}</h4>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => { const m = new Date(archiveMonth); m.setMonth(m.getMonth() - 1); setArchiveMonth(m); }} style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', borderRadius: '8px', padding: '8px 12px', color: '#999', cursor: 'pointer' }}>←</button>
                <button onClick={() => { const m = new Date(archiveMonth); m.setMonth(m.getMonth() + 1); setArchiveMonth(m); }} style={{ background: 'rgba(255, 255, 255, 0.1)', border: 'none', borderRadius: '8px', padding: '8px 12px', color: '#999', cursor: 'pointer' }}>→</button>
              </div>
            </div>
            {archiveType === 'budget' ? getExpensesForMonth(archiveMonth).length === 0 ? <p style={{ textAlign: 'center', color: '#666' }}>No data</p> : null : getTravelsForMonth(archiveMonth).length === 0 ? <p style={{ textAlign: 'center', color: '#666' }}>No data</p> : null}
          </div>
        </div>
      )}

      <AddModal isOpen={showAddModal && modalType === 'plant'} title={editingId ? t.editPlant : t.addPlant} onClose={resetModal}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder={t.plantName} style={{ background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px' }} />
          <div>
            <label style={{ fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }}>{t.wateringFrequency}</label>
            <input type="number" min="1" max="60" value={newItemWateringDays} onChange={(e) => setNewItemWateringDays(e.target.value)} style={{ width: '100%', background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px' }} />
          </div>
          <button onClick={addPlant} style={{ width: '100%', background: ACCENT_COLOR, border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>
            {editingId ? t.update : t.add}
          </button>
          {editingId && (
            <button onClick={() => { deletePlant(editingId); resetModal(); }} style={{ width: '100%', background: 'rgba(255, 59, 48, 0.2)', border: '1px solid rgba(255, 59, 48, 0.3)', borderRadius: '12px', padding: '14px', color: '#ff3b30', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>
              {t.delete}
            </button>
          )}
        </div>
      </AddModal>

      <AddModal isOpen={showAddModal && modalType === 'meal'} title={editingId ? t.editMeal : t.addMeal} onClose={resetModal}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder={t.mealName} style={{ background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px' }} />
          <textarea value={newItemRecipe} onChange={(e) => setNewItemRecipe(e.target.value)} placeholder={t.recipe} style={{ background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px', minHeight: '100px', fontFamily: 'inherit' }} />
          <button onClick={addMeal} style={{ width: '100%', background: ACCENT_COLOR, border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>
            {editingId ? t.update : t.add}
          </button>
          {editingId && (
            <button onClick={() => { deleteMeal(editingId); resetModal(); }} style={{ width: '100%', background: 'rgba(255, 59, 48, 0.2)', border: '1px solid rgba(255, 59, 48, 0.3)', borderRadius: '12px', padding: '14px', color: '#ff3b30', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>
              {t.delete}
            </button>
          )}
        </div>
      </AddModal>

      <AddModal isOpen={showAddModal && modalType === 'expense'} title={editingId ? t.editExpense : t.addExpense} onClose={resetModal}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }}>{t.category}</label>
            <select value={newExpenseCategory} onChange={(e) => setNewExpenseCategory(e.target.value)} style={{ width: '100%', background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px' }}>
              {BUDGET_CATEGORIES.map(cat => (
                <option key={cat.name} value={cat.name} style={{ background: BG_COLOR }}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }}>{t.date}</label>
            <input type="date" value={newExpenseDate} onChange={(e) => setNewExpenseDate(e.target.value)} style={{ width: '100%', background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px' }} />
          </div>
          <div>
            <label style={{ fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }}>{t.amount}</label>
            <input type="number" value={newExpenseAmount} onChange={(e) => setNewExpenseAmount(e.target.value)} placeholder="0.00" step="0.01" style={{ width: '100%', background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px' }} />
          </div>
          <button onClick={addExpense} style={{ width: '100%', background: ACCENT_COLOR, border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>
            {editingId ? t.update : t.add}
          </button>
          {editingId && (
            <button onClick={() => { deleteExpense(editingId); resetModal(); }} style={{ width: '100%', background: 'rgba(255, 59, 48, 0.2)', border: '1px solid rgba(255, 59, 48, 0.3)', borderRadius: '12px', padding: '14px', color: '#ff3b30', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>
              {t.delete}
            </button>
          )}
        </div>
      </AddModal>

      <AddModal isOpen={showAddModal && modalType === 'travel'} title={editingId ? t.editTravel : t.addTravel} onClose={resetModal}>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#666', marginBottom: '6px', display: 'block' }}>{t.whoTraveling}</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[{ id: user?.uid, name: user?.displayName || 'You', avatar: user?.photoURL }, ...users.filter(u => u.uid !== user?.uid)].map(person => (
                <button key={person.id} onClick={() => setNewTravelUserId(person.id)} style={{ background: newTravelUserId === person.id ? `${ACCENT_COLOR}40` : `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(${newTravelUserId === person.id ? '18, 52, 255' : '255, 255, 255'}, ${newTravelUserId === person.id ? 0.4 : 0.1})`, borderRadius: '12px', padding: '12px', color: newTravelUserId === person.id ? ACCENT_COLOR : '#999', cursor: 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <img src={person.avatar} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%' }} />
                  {person.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#666', marginBottom: '6px', display: 'block' }}>{t.location}</label>
            <input type="text" value={newTravelLocation} onChange={(e) => handleCitySearch(e.target.value)} placeholder={t.searchCity} style={{ width: '100%', background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px', boxSizing: 'border-box' }} />
            {citySuggestions.length > 0 && (
              <div style={{ marginTop: '8px', display: 'grid', gap: '4px' }}>
                {citySuggestions.map((city, idx) => (
                  <button key={idx} onClick={() => { setNewTravelLocation(`${city.name}, ${city.country}`); setCitySuggestions([]); }} style={{ background: `rgba(18, 52, 255, 0.1)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '8px', padding: '8px 12px', color: '#fff', cursor: 'pointer', fontSize: '14px', textAlign: 'left' }}>
                    {city.name}, {city.country}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#666', marginBottom: '6px', display: 'block' }}>{t.startDate}</label>
            <input type="date" value={newTravelStart} onChange={(e) => setNewTravelStart(e.target.value)} style={{ width: '100%', background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#666', marginBottom: '6px', display: 'block' }}>{t.endDate}</label>
            <input type="date" value={newTravelEnd} onChange={(e) => setNewTravelEnd(e.target.value)} style={{ width: '100%', background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px', boxSizing: 'border-box' }} />
          </div>
          <button onClick={addTravel} style={{ width: '100%', background: ACCENT_COLOR, border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>
            {editingId ? t.update : t.add}
          </button>
          {editingId && (
            <button onClick={() => { deleteTravel(editingId); resetModal(); }} style={{ width: '100%', background: 'rgba(255, 59, 48, 0.2)', border: '1px solid rgba(255, 59, 48, 0.3)', borderRadius: '12px', padding: '14px', color: '#ff3b30', cursor: 'pointer', fontSize: '16px', fontWeight: '600' }}>
              {t.delete}
            </button>
          )}
        </div>
      </AddModal>
    </div>
  );
}