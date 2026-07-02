import React, { useState, useEffect } from 'react';
import {
  Home, Leaf, UtensilsCrossed, Wallet, LogOut,
  X, Bell, Plus, Plane, Edit2, MapPin, Droplet, Archive, ChevronDown, Briefcase, Palmtree, Check,
  ShoppingCart as ShoppingBag, Heart, Wind, Smile, Clock, Shuffle, MessageCircle, Send,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import LinkifyIt from 'linkify-it';
import { auth } from './firebaseConfig';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { ref, onValue, set, update } from 'firebase/database';
import { getDatabase } from 'firebase/database';
import axios from 'axios';

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
  { name: 'Business', color: '#1234ff', icon: Briefcase },
  { name: 'Holiday', color: '#34c759', icon: Palmtree },
];

// 🌱 COMPREHENSIVE PLANT DATABASE
const PLANT_DATABASE = {
  'peace-lily': {
    name: 'Peace Lily',
    image: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=400',
    wateringDaysMin: 5,
    wateringDaysMax: 7,
    light: 'Low to Medium',
    humidity: 'High',
    difficulty: 'Easy',
    description: 'Graceful plant with white flowers, perfect for low-light spaces.',
    fertilizeFrequency: 30,
    bloomSeason: 'Spring',
  },
  'snake-plant': {
    name: 'Snake Plant',
    image: 'https://images.unsplash.com/photo-1608767221051-8ce9baddc3a9?w=400',
    wateringDaysMin: 14,
    wateringDaysMax: 21,
    light: 'Low to High',
    humidity: 'Low',
    difficulty: 'Very Easy',
    description: 'Nearly indestructible plant, great for beginners.',
    fertilizeFrequency: 60,
    bloomSeason: 'Summer',
  },
  'monstera': {
    name: 'Monstera Deliciosa',
    image: 'https://images.unsplash.com/photo-1523694159952-900d2e6f3cpg?w=400',
    wateringDaysMin: 7,
    wateringDaysMax: 10,
    light: 'Bright Indirect',
    humidity: 'Medium',
    difficulty: 'Easy',
    description: 'Trendy plant with iconic split leaves.',
    fertilizeFrequency: 30,
    bloomSeason: 'Spring',
  },
  'pothos': {
    name: 'Pothos',
    image: 'https://images.unsplash.com/photo-1599599810694-e5a0b594f7ab?w=400',
    wateringDaysMin: 7,
    wateringDaysMax: 10,
    light: 'Low to Medium',
    humidity: 'Medium',
    difficulty: 'Very Easy',
    description: 'Cascading vine, perfect for hanging baskets.',
    fertilizeFrequency: 30,
    bloomSeason: 'Summer',
  },
  'fiddle-leaf': {
    name: 'Fiddle Leaf Fig',
    image: 'https://images.unsplash.com/photo-1545241047-d71222147293?w=400',
    wateringDaysMin: 7,
    wateringDaysMax: 10,
    light: 'Bright Indirect',
    humidity: 'Medium',
    difficulty: 'Medium',
    description: 'Statement plant with large, violin-shaped leaves.',
    fertilizeFrequency: 30,
    bloomSeason: 'Spring',
  },
  'rubber-plant': {
    name: 'Rubber Plant',
    image: 'https://images.unsplash.com/photo-1585470881645-b727a5d674f5?w=400',
    wateringDaysMin: 7,
    wateringDaysMax: 10,
    light: 'Bright Indirect',
    humidity: 'Medium',
    difficulty: 'Easy',
    description: 'Bold plant with glossy leaves, great air purifier.',
    fertilizeFrequency: 30,
    bloomSeason: 'Summer',
  },
  'pothosquin': {
    name: 'Pilea Peperomioides',
    image: 'https://images.unsplash.com/photo-1638449386894-92d77bc17b73?w=400',
    wateringDaysMin: 5,
    wateringDaysMax: 7,
    light: 'Bright Indirect',
    humidity: 'Medium',
    difficulty: 'Easy',
    description: 'Cute coin-shaped leaves, Instagram favorite.',
    fertilizeFrequency: 30,
    bloomSeason: 'Spring',
  },
  'zz-plant': {
    name: 'ZZ Plant',
    image: 'https://images.unsplash.com/photo-1590826834476-e2b7eb1d8f9c?w=400',
    wateringDaysMin: 10,
    wateringDaysMax: 14,
    light: 'Low to Medium',
    humidity: 'Low',
    difficulty: 'Very Easy',
    description: 'Shiny leaflets, extremely tolerant.',
    fertilizeFrequency: 45,
    bloomSeason: 'Spring',
  },
};

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
  const today = new Date();
  const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
  const todayDate = today.getDate();

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
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Split days into weeks
  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div style={{ background: 'transparent', padding: '0', margin: '0 -20px 24px -20px', width: 'calc(100% + 40px)' }}>
      {/* Month Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '20px', paddingRight: '20px', marginBottom: '16px' }}>
        <button onClick={() => onMonthChange(-1)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '24px', padding: '8px', fontWeight: '300' }}>‹</button>
        <h2 style={{ fontSize: '34px', fontWeight: '600', margin: 0, flex: 1, textAlign: 'center' }}>{monthNames[month]}</h2>
        <button onClick={() => onMonthChange(1)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '24px', padding: '8px', fontWeight: '300' }}>›</button>
      </div>

      {/* Weekday Headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, paddingLeft: '20px', paddingRight: '20px', marginBottom: '12px' }}>
        {weekDays.map(day => (
          <div key={day} style={{ textAlign: 'center', fontSize: '13px', fontWeight: '500', color: '#999', paddingTop: '8px', paddingBottom: '8px' }}>{day}</div>
        ))}
      </div>

      {/* Calendar Grid with Week Dividers */}
      {weeks.map((week, weekIdx) => (
        <div key={weekIdx}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0, paddingLeft: '20px', paddingRight: '20px', paddingTop: '12px', paddingBottom: '12px' }}>
            {week.map((day, dayIdx) => {
              const indicators = day ? getTravelIndicators(day) : [];
              const isToday = isCurrentMonth && day === todayDate;
              
              return (
                <div key={dayIdx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', minHeight: '50px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '50%',
                      background: isToday ? '#ff3b30' : 'transparent',
                      cursor: day ? 'pointer' : 'default',
                      fontSize: '16px',
                      fontWeight: '400',
                      color: isToday ? '#fff' : day ? '#fff' : 'transparent',
                    }}
                  >
                    {day}
                  </div>
                  {indicators.length > 0 && (
                    <div style={{ display: 'flex', gap: '3px', marginTop: '6px', minHeight: '4px', justifyContent: 'center' }}>
                      {indicators.slice(0, 3).map((indicator, i) => (
                        <div key={i} style={{ width: '4px', height: '4px', borderRadius: '50%', background: ACCENT_COLOR }} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Week Divider */}
          {weekIdx < weeks.length - 1 && (
            <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '0 20px' }} />
          )}
        </div>
      ))}
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
  const [showRecipeDetail, setShowRecipeDetail] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showArchive, setShowArchive] = useState(false);
  const [archiveType, setArchiveType] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newChatMessage, setNewChatMessage] = useState('');

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
  const [newItemCookTime, setNewItemCookTime] = useState('');
  const [newItemIngredients, setNewItemIngredients] = useState('');
  const [newItemInstructions, setNewItemInstructions] = useState('');
  const [newItemRecipeUrl, setNewItemRecipeUrl] = useState('');
  const [newItemDietaryLabels, setNewItemDietaryLabels] = useState([]);
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

  // 🌱 PLANTS REDESIGN STATES
  const [careLogs, setCareLogs] = useState([]);
  const [weatherData, setWeatherData] = useState(null);

  // Auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadSharedData();
        checkNotificationPermission();
        fetchWeather(); // 🌱 FETCH WEATHER
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
      if (!database) {
        console.error('Database not initialized');
        return;
      }

      // Create user object
      const userData = {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || 'User',
        photoURL: currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`,
        lastLogin: new Date().toISOString(),
      };

      console.log('Saving user to Firebase:', userData);

      // Save to shared-data/users/{uid}
      const userRef = ref(database, `shared-data/users/${currentUser.uid}`);
      await set(userRef, userData);
      console.log('✅ User saved successfully');

      // Now load all users
      const usersRef = ref(database, 'shared-data/users');
      
      onValue(usersRef, (snapshot) => {
        console.log('📍 Users snapshot received');
        if (snapshot.exists()) {
          const usersData = snapshot.val();
          console.log('Raw Firebase data:', usersData);
          
          // Convert object to array
          let usersArray = [];
          if (Array.isArray(usersData)) {
            usersArray = usersData.filter(u => u && u.uid);
          } else if (typeof usersData === 'object') {
            // This should be the case - Firebase stores as object with UIDs as keys
            usersArray = Object.entries(usersData).map(([key, value]) => {
              console.log(`Loading user ${key}:`, value);
              return value;
            }).filter(u => u && u.uid);
          }
          
          console.log('✅ Loaded users:', usersArray);
          console.log('Total users:', usersArray.length);
          setUsers(usersArray);
        } else {
          console.log('❌ No users node exists yet');
          setUsers([]);
        }
      });
    } catch (error) {
      console.error('❌ Error initializing user:', error);
      console.error('Error details:', error.message);
    }
  };

  // 🌱 WEATHER API - fetch Paris weather
  const fetchWeather = async () => {
    try {
      const response = await axios.get(
        'https://api.openweathermap.org/data/2.5/weather',
        {
          params: {
            q: 'Paris,FR',
            appid: 'c0e0b27da88f67c2f2d9b82f5c80a9e5',
            units: 'metric',
          },
        }
      );
      setWeatherData({
        temp: response.data.main.temp,
        humidity: response.data.main.humidity,
        description: response.data.weather[0].description,
        rain: response.data.rain?.['1h'] || 0,
      });
      console.log('✅ Weather fetched:', response.data.main);
    } catch (error) {
      console.error('Weather API error:', error);
    }
  };


  // 🌱 UNSPLASH - search for plant photos

  // 🌱 INTELLIGENT WATERING STATUS
  const getWateringStatus = (plant) => {
    if (!plant.lastWatered) return { status: 'New', color: '#FFD700', urgency: 2 };

    const daysSinceWatered = Math.floor(
      (new Date() - new Date(plant.lastWatered)) / (1000 * 60 * 60 * 24)
    );

    const plantData = PLANT_DATABASE[plant.type] || PLANT_DATABASE['peace-lily'];
    const baseWateringDays = (plantData.wateringDaysMin + plantData.wateringDaysMax) / 2;

    // Adjust for weather
    let adjustedDays = baseWateringDays;
    if (weatherData) {
      if (weatherData.humidity > 70) adjustedDays += 2; // High humidity = water less
      if (weatherData.humidity < 40) adjustedDays -= 1; // Low humidity = water more
      if (weatherData.temp > 25) adjustedDays -= 1; // Hot = water more
      if (weatherData.rain > 0) adjustedDays += 1; // Recent rain = wait longer
    }

    if (daysSinceWatered >= adjustedDays) {
      return { status: 'Water Now!', color: '#ff3b30', urgency: 3 }; // Red - urgent
    } else if (daysSinceWatered >= adjustedDays - 1) {
      return { status: 'Water Soon', color: '#ff9500', urgency: 2 }; // Orange - soon
    } else if (daysSinceWatered < adjustedDays / 2) {
      return { status: 'Healthy', color: '#34c759', urgency: 1 }; // Green - good
    } else {
      return { status: 'Monitor', color: '#5AC8FA', urgency: 1 }; // Blue - monitor
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

  // Load chat messages
  useEffect(() => {
    if (!user) return;
    try {
      const chatRef = ref(database, 'shared-data/chat');
      const unsubscribe = onValue(
        chatRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const messages = toArray(snapshot.val());
            setChatMessages(messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
          }
        }
      );
      return unsubscribe;
    } catch (error) {
      console.error('❌ Chat loading error:', error);
    }
  }, [user]);

  // 🌱 Load care logs
  useEffect(() => {
    if (!user) return;
    try {
      const careLogsRef = ref(database, 'shared-data/careLogs');
      const unsubscribe = onValue(
        careLogsRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const logsData = snapshot.val();
            const logsArray = Array.isArray(logsData) ? logsData : Object.values(logsData);
            setCareLogs(logsArray.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
          } else {
            setCareLogs([]);
          }
        }
      );
      return unsubscribe;
    } catch (error) {
      console.error('❌ Care logs loading error:', error);
    }
  }, [user]);

  // Send chat message
  const fetchLinkPreview = async (url) => {
    try {
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      if (!data.contents) return null;
      
      // Extract Open Graph tags from HTML string
      const titleMatch = data.contents.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) || 
                        data.contents.match(/<meta\s+name="og:title"\s+content="([^"]+)"/i) ||
                        data.contents.match(/<title>([^<]+)<\/title>/i);
      
      const descMatch = data.contents.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i) ||
                       data.contents.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
      
      const imageMatch = data.contents.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) ||
                        data.contents.match(/<meta\s+name="og:image"\s+content="([^"]+)"/i);
      
      return {
        url: url,
        title: titleMatch?.[1] || new URL(url).hostname,
        description: descMatch?.[1] || '',
        image: imageMatch?.[1] || '',
      };
    } catch (error) {
      console.log('Could not fetch preview for:', url);
      return {
        url: url,
        title: new URL(url).hostname,
        description: '',
        image: '',
      };
    }
  };

  const sendChatMessage = async () => {
    if (!newChatMessage.trim() || !user) return;

    try {
      if (!database) {
        alert('❌ Database not initialized. Please reload the page.');
        return;
      }

      const linkify = new LinkifyIt();
      const urlMatches = linkify.match(newChatMessage);
      const links = urlMatches ? urlMatches.map(match => match.url) : [];
      
      const message = {
        id: Date.now().toString(),
        userId: user.uid,
        displayName: user.displayName || 'User',
        avatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        text: newChatMessage,
        timestamp: new Date().toISOString(),
        links: links,
        linkPreviews: {},
      };

      // Send message first
      const chatRef = ref(database, `shared-data/chat/${message.id}`);
      await set(chatRef, message);
      setNewChatMessage('');

      // Fetch link previews in the background (non-blocking)
      if (links.length > 0) {
        for (const link of links) {
          try {
            const preview = await fetchLinkPreview(link);
            if (preview) {
              // Update message with preview data
              const updateRef = ref(database, `shared-data/chat/${message.id}/linkPreviews/${link.replace(/[.#$[\]]/g, '_')}`);
              await set(updateRef, preview);
            }
          } catch (err) {
            console.log('Preview fetch error for', link, err);
          }
        }
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      alert('Failed to send message: ' + error.message);
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

  // ==================== MEALS ====================
  const addMeal = () => {
    if (newItemName.trim()) {
      const mealDate = new Date().toISOString().split('T')[0];
      
      // Parse ingredients - can be comma-separated or line-separated
      const ingredientsList = newItemIngredients
        .split('\n')
        .map(i => i.trim())
        .filter(i => i.length > 0);
      
      const meal = {
        id: editingId || Date.now().toString(),
        name: newItemName,
        recipe: newItemRecipe,
        plannedDate: mealDate,
        shoppingNeeded: false,
        photo: newItemPhoto || `https://images.unsplash.com/photo-1495575621581-20dbe3ce2bad?w=400&h=400&fit=crop&v=${Date.now()}`,
        cookTime: newItemCookTime ? parseInt(newItemCookTime) : null,
        ingredients: ingredientsList,
        instructions: newItemInstructions,
        recipeUrl: newItemRecipeUrl,
        dietaryLabels: newItemDietaryLabels,
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
    setNewItemCookTime('');
    setNewItemIngredients('');
    setNewItemInstructions('');
    setNewItemRecipeUrl('');
    setNewItemDietaryLabels([]);
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
    
    if (type === 'meal') {
      setNewItemName(item.name);
      setNewItemRecipe(item.recipe || '');
      setNewItemPhoto(item.photo);
      setNewItemCookTime(item.cookTime ? item.cookTime.toString() : '');
      setNewItemIngredients((item.ingredients || []).join('\n'));
      setNewItemInstructions(item.instructions || '');
      setNewItemRecipeUrl(item.recipeUrl || '');
      setNewItemDietaryLabels(item.dietaryLabels || []);
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowSettings(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login error:', error);
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



  // ============ PLANTS TAB COMPONENT ============
    const PlantsTab = ({ plants, setPlants, careLogs, weatherData, database, user: currentUser }) => {
      const [selectedPlant, setSelectedPlant] = useState(null);
      const [showPlantDetail, setShowPlantDetail] = useState(false);
      const [showAddModal, setShowAddModal] = useState(false);
      const [editingPlantId, setEditingPlantId] = useState(null);
      const [searchQuery, setSearchQuery] = useState('');
      const [perenualResults, setPerenualResults] = useState([]);
      const [showPlantSearch, setShowPlantSearch] = useState(false);
      const [plantSearchLoading, setPlantSearchLoading] = useState(false);
      const [unsplashSearchResults, setUnsplashSearchResults] = useState([]);
      const [selectedPlantDetails, setSelectedPlantDetails] = useState(null);

      const [newPlantName, setNewPlantName] = useState('');
      const [newPlantType, setNewPlantType] = useState('');
      const [newPlantLocation, setNewPlantLocation] = useState('');
      const [newPlantPhoto, setNewPlantPhoto] = useState('');
      const [wateringDays, setWateringDays] = useState(7);
      const [lastWatered, setLastWatered] = useState(new Date().toISOString().split('T')[0]);

      const debounceTimer = React.useRef(null);

      // Search Perenual plants (with debounce)
      const searchPlants = async (query) => {
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }

        if (!query.trim()) {
          setPerenualResults([]);
          setShowPlantSearch(false);
          return;
        }

        setPlantSearchLoading(true);

        debounceTimer.current = setTimeout(async () => {
          try {
            const response = await fetch(
              `/api/plants-search?query=${encodeURIComponent(query)}`
            );
            const data = await response.json();
            console.log('Plant search results:', data.data?.length);
            if (data.data && data.data.length > 0) {
              setPerenualResults(data.data);
              setShowPlantSearch(true);
            } else {
              setPerenualResults([]);
            }
          } catch (error) {
            console.error('Plant search error:', error);
          } finally {
            setPlantSearchLoading(false);
          }
        }, 500); // Wait 500ms after user stops typing
      };

      // Search Unsplash photos - EXACTLY LIKE RECIPES
      const searchUnsplashPhotos = async (query) => {
        if (!query.trim()) {
          setUnsplashSearchResults([]);
          return;
        }
        try {
          const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${query}&per_page=12&client_id=${process.env.REACT_APP_UNSPLASH_ACCESS_KEY}`
          );
          const data = await response.json();
          console.log('Unsplash results:', data.results?.length);
          setUnsplashSearchResults(data.results || []);
        } catch (error) {
          console.error('Unsplash error:', error);
        }
      };

      // Fetch Perenual plant details (guides, watering, etc.)
      const fetchPlantDetails = async (perenualPlantId) => {
        try {
          const response = await fetch(
            `https://perenual.com/api/species/details/${perenualPlantId}`
          );
          const data = await response.json();
          console.log('Plant details:', data);
          setSelectedPlantDetails(data);
          return data;
        } catch (error) {
          console.error('Error fetching plant details:', error);
          setSelectedPlantDetails(null);
        }
      };

      // Save plant to Firebase
      const savePlant = async (e) => {
        e?.preventDefault();
      
        if (!newPlantName || !newPlantPhoto || !database || !currentUser) {
          alert('Plant name and photo are required');
          return;
        }

        const plantData = {
          id: editingPlantId || `plant_${Date.now()}`,
          name: newPlantName,
          type: newPlantType,
          location: newPlantLocation,
          photo: newPlantPhoto,
          wateringDays: parseInt(wateringDays) || 7,
          lastWatered,
          dateAdded: editingPlantId ? undefined : new Date().toISOString(),
          addedBy: currentUser.uid,
          details: selectedPlantDetails,
        };

        try {
          console.log('Saving plant:', plantData);
          await set(ref(database, `shared-data/default/plants/${plantData.id}`), plantData);
        
          if (editingPlantId) {
            setPlants(plants.map(p => p.id === editingPlantId ? plantData : p));
          } else {
            setPlants([...plants, plantData]);
          }
        
          console.log('Plant saved successfully');
          resetForm();
          setShowAddModal(false);
          setShowPlantDetail(false);
        } catch (error) {
          console.error('Error saving plant:', error);
          alert('Error saving plant: ' + error.message);
        }
      };

      // Delete plant
      const deletePlant = async (plantId) => {
        if (!database) {
          alert('Database not available');
          return;
        }
        try {
          console.log('Deleting plant:', plantId);
          await set(ref(database, `shared-data/default/plants/${plantId}`), null);
          setPlants(plants.filter(p => p.id !== plantId));
          setShowPlantDetail(false);
          console.log('Plant deleted successfully');
        } catch (error) {
          console.error('Error deleting plant:', error);
          alert('Error deleting plant: ' + error.message);
        }
      };

      // Log care
      const logCare = async (plantId, careType) => {
        if (!database || !currentUser) return;
        const logId = `log_${Date.now()}`;
        const careLog = {
          id: logId,
          plantId,
          careType,
          userId: currentUser.uid,
          userName: currentUser.displayName || 'Partner',
          timestamp: new Date().toISOString(),
        };

        try {
          await set(ref(database, `shared-data/careLogs/${logId}`), careLog);
          if (careType === 'water') {
            const today = new Date().toISOString().split('T')[0];
            await update(ref(database, `shared-data/default/plants/${plantId}`), { lastWatered: today });
          }
        } catch (error) {
          console.error('Care log error:', error);
        }
      };

      const resetForm = () => {
        setNewPlantName('');
        setNewPlantType('');
        setNewPlantLocation('');
        setNewPlantPhoto('');
        setWateringDays(7);
        setLastWatered(new Date().toISOString().split('T')[0]);
        setEditingPlantId(null);
        setSearchQuery('');
        setPerenualResults([]);
        setShowPlantSearch(false);
        setUnsplashSearchResults([]);
        setSelectedPlantDetails(null);
      };

      const openEditModal = (plant) => {
        setEditingPlantId(plant.id);
        setNewPlantName(plant.name);
        setNewPlantType(plant.type);
        setNewPlantLocation(plant.location);
        setNewPlantPhoto(plant.photo);
        setWateringDays(plant.wateringDays || 7);
        setLastWatered(plant.lastWatered || new Date().toISOString().split('T')[0]);
        setSelectedPlantDetails(plant.details || null);
        setShowPlantDetail(false);
        setShowAddModal(true);
      };

      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
          {/* HEADER */}
          <div style={{ padding: '0 20px', paddingTop: '20px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>Plants</h2>
            <button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
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

          {/* PLANTS GRID */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 20px' }}>
            {plants.length === 0 ? (
              <EmptyState icon={Leaf} title="No plants yet" subtitle="Add your first plant" />
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {plants.map(plant => (
                  <div
                    key={plant.id}
                    onClick={() => {
                      setSelectedPlant(plant);
                      setShowPlantDetail(true);
                    }}
                    style={{
                      backgroundImage: `url(${plant.photo})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: '16px',
                      minHeight: '240px',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: `0 0 0 1px rgba(18, 52, 255, 0.15)`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 0 1px rgba(18, 52, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 0 1px rgba(18, 52, 255, 0.15)';
                    }}
                  >
                    {/* Gradient overlay */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.9) 100%)',
                      pointerEvents: 'none',
                    }} />

                    {/* Plant info (bottom) */}
                    <div style={{
                      position: 'absolute',
                      bottom: '20px',
                      left: '20px',
                      right: '20px',
                      zIndex: 5,
                    }}>
                      <h3 style={{ fontSize: '22px', fontWeight: '700', margin: 0, color: '#fff' }}>{plant.name}</h3>
                      <p style={{ fontSize: '13px', color: '#ccc', margin: '6px 0 0' }}>{plant.location}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PLANT DETAIL MODAL */}
          {showPlantDetail && selectedPlant && (
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
                overflowY: 'auto',
              }}
              onClick={() => setShowPlantDetail(false)}
            >
              <div
                style={{
                  width: '100%',
                  background: BG_COLOR,
                  borderTop: `1px solid rgba(18, 52, 255, 0.2)`,
                  borderRadius: '24px 24px 0 0',
                  padding: '0',
                  maxHeight: '95vh',
                  overflowY: 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Plant Image Header */}
                <div
                  style={{
                    backgroundImage: `url(${selectedPlant.photo})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    height: '280px',
                    position: 'relative',
                  }}
                >
                  {/* Gradient overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)',
                  }} />

                  {/* Close button */}
                  <button
                    onClick={() => setShowPlantDetail(false)}
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      background: 'rgba(0, 0, 0, 0.5)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      cursor: 'pointer',
                      zIndex: 10,
                    }}
                  >
                    <X size={24} />
                  </button>

                  {/* Plant Title */}
                  <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '20px',
                    right: '20px',
                    zIndex: 5,
                  }}>
                    <h2 style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#fff' }}>{selectedPlant.name}</h2>
                  </div>
                </div>

                {/* Content Section */}
                <div style={{ padding: '24px', display: 'grid', gap: '24px' }}>
                  {/* Basic Info */}
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {selectedPlant.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <MapPin size={20} color={ACCENT_COLOR} />
                        <span style={{ fontSize: '16px', color: '#ccc' }}>{selectedPlant.location}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Droplet size={20} color={ACCENT_COLOR} />
                      <span style={{ fontSize: '16px', color: '#ccc' }}>Water every {selectedPlant.wateringDays} days</span>
                    </div>
                  </div>

                  {/* Plant Details from Perenual */}
                  {selectedPlant.details && (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#fff', margin: '8px 0 0' }}>Plant Information</h3>
                    
                      {selectedPlant.details.sunlight && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                          <Wind size={16} color={ACCENT_COLOR} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sunlight</div>
                            <div style={{ fontSize: '14px', color: '#ccc', fontWeight: '500' }}>
                              {Array.isArray(selectedPlant.details.sunlight) ? selectedPlant.details.sunlight.join(', ') : selectedPlant.details.sunlight}
                            </div>
                          </div>
                        </div>
                      )}

                      {selectedPlant.details.watering && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                          <Droplet size={16} color={ACCENT_COLOR} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Watering</div>
                            <div style={{ fontSize: '14px', color: '#ccc', fontWeight: '500' }}>{selectedPlant.details.watering}</div>
                          </div>
                        </div>
                      )}

                      {selectedPlant.details.maintenance && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                          <Briefcase size={16} color={ACCENT_COLOR} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Maintenance</div>
                            <div style={{ fontSize: '14px', color: '#ccc', fontWeight: '500' }}>{selectedPlant.details.maintenance}</div>
                          </div>
                        </div>
                      )}

                      {selectedPlant.details.growth_rate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                          <Leaf size={16} color={ACCENT_COLOR} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Growth Rate</div>
                            <div style={{ fontSize: '14px', color: '#ccc', fontWeight: '500' }}>{selectedPlant.details.growth_rate}</div>
                          </div>
                        </div>
                      )}

                      {selectedPlant.details.care_level && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                          <Heart size={16} color={ACCENT_COLOR} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Care Level</div>
                            <div style={{ fontSize: '14px', color: '#ccc', fontWeight: '500' }}>{selectedPlant.details.care_level}</div>
                          </div>
                        </div>
                      )}

                      {selectedPlant.details.pruning_month && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                          <Palmtree size={16} color={ACCENT_COLOR} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '11px', color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pruning Month</div>
                            <div style={{ fontSize: '14px', color: '#ccc', fontWeight: '500' }}>{selectedPlant.details.pruning_month}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Care History */}
                  {careLogs.filter(log => log.plantId === selectedPlant.id).length > 0 && (
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#fff' }}>Care History</h3>
                      <div style={{ display: 'grid', gap: '8px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                        {careLogs
                          .filter(log => log.plantId === selectedPlant.id)
                          .reverse()
                          .slice(0, 10)
                          .map(log => (
                            <div key={log.id} style={{ fontSize: '14px', color: '#ccc', display: 'flex', gap: '12px' }}>
                              <span style={{ color: ACCENT_COLOR }}>•</span>
                              <span>{log.careType === 'water' ? '💧' : '🌱'} {log.userName} • {new Date(log.timestamp).toLocaleDateString()}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <button
                      onClick={() => logCare(selectedPlant.id, 'water')}
                      style={{
                        background: '#00c7be',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '600',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                      <Droplet size={20} /> Water
                    </button>
                    <button
                      onClick={() => logCare(selectedPlant.id, 'fertilize')}
                      style={{
                        background: '#ff9500',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '600',
                        height: '48px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                      }}
                    >
                      <Leaf size={20} /> Fertilize
                    </button>
                  </div>

                  <button
                    onClick={() => openEditModal(selectedPlant)}
                    style={{
                      width: '100%',
                      background: ACCENT_COLOR,
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: '600',
                      height: '48px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <Edit2 size={20} /> Edit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ADD/EDIT MODAL */}
          {showAddModal && (
            <AddModal
              isOpen={showAddModal}
              title={editingPlantId ? 'Edit Plant' : 'Add Plant'}
              onClose={() => {
                resetForm();
                setShowAddModal(false);
              }}
            >
              {/* Search Plant Type */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Search Plant Type</label>
                <input
                  type="text"
                  placeholder="e.g. eucalyptus, monstera..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchPlants(e.target.value);
                  }}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(18, 52, 255, 0.2)',
                    borderRadius: '12px',
                    padding: '12px',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    marginBottom: '12px',
                  }}
                />

                {/* Search Loading */}
                {plantSearchLoading && (
                  <div style={{ padding: '12px', color: '#999', fontSize: '14px', textAlign: 'center' }}>
                    Searching plants...
                  </div>
                )}

                {/* Search Results */}
                {showPlantSearch && perenualResults.length > 0 && (
                  <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                    {perenualResults.slice(0, 5).map((result, idx) => (
                      <button
                        key={idx}
                        onClick={async () => {
                          setNewPlantType(result.common_name || result.scientific_name);
                          setNewPlantName(result.common_name || result.scientific_name);
                          await fetchPlantDetails(result.id);
                          setShowPlantSearch(false);
                        }}
                        style={{
                          width: '100%',
                          background: 'rgba(18, 52, 255, 0.1)',
                          border: '1px solid rgba(18, 52, 255, 0.2)',
                          borderRadius: '8px',
                          padding: '12px',
                          color: '#fff',
                          cursor: 'pointer',
                          marginBottom: '8px',
                          textAlign: 'left',
                          fontSize: '14px',
                        }}
                      >
                        {result.common_name || result.scientific_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Plant Name */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Plant Name</label>
                <input
                  type="text"
                  value={newPlantName}
                  onChange={(e) => setNewPlantName(e.target.value)}
                  placeholder="e.g., My Eucalyptus"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(18, 52, 255, 0.2)',
                    borderRadius: '12px',
                    padding: '12px',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Location */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Location</label>
                <input
                  type="text"
                  value={newPlantLocation}
                  onChange={(e) => setNewPlantLocation(e.target.value)}
                  placeholder="e.g., Living Room"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(18, 52, 255, 0.2)',
                    borderRadius: '12px',
                    padding: '12px',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Watering Frequency */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Watering Frequency (days)</label>
                <input
                  type="number"
                  value={wateringDays}
                  onChange={(e) => setWateringDays(e.target.value)}
                  min="1"
                  max="60"
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(18, 52, 255, 0.2)',
                    borderRadius: '12px',
                    padding: '12px',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Last Watered */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Last Watered</label>
                <input
                  type="date"
                  value={lastWatered}
                  onChange={(e) => setLastWatered(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(18, 52, 255, 0.2)',
                    borderRadius: '12px',
                    padding: '12px',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Photo Search - EXACTLY LIKE RECIPES */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ color: '#999', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Plant photo</label>
                <input
                  type="text"
                  placeholder="e.g. eucalyptus, green plant..."
                  onChange={(e) => searchUnsplashPhotos(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(18, 52, 255, 0.2)',
                    borderRadius: '12px',
                    padding: '12px',
                    color: '#fff',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    marginBottom: '12px',
                  }}
                />

                {/* Unsplash Results - 3 column grid like screenshot */}
                {unsplashSearchResults.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                    {unsplashSearchResults.slice(0, 9).map((photo) => (
                      <img
                        key={photo.id}
                        src={`${photo.urls.thumb}?w=120&h=120&fit=crop`}
                        alt=""
                        onClick={() => setNewPlantPhoto(photo.urls.regular)}
                        style={{
                          width: '100%',
                          height: '100px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          border: newPlantPhoto === photo.urls.regular ? `2px solid ${ACCENT_COLOR}` : '2px solid rgba(18, 52, 255, 0.2)',
                          transition: 'all 0.2s',
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Selected Photo Preview */}
                {newPlantPhoto && (
                  <div
                    style={{
                      backgroundImage: `url(${newPlantPhoto})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      height: '150px',
                      borderRadius: '8px',
                      marginBottom: '12px',
                    }}
                  />
                )}
              </div>

              {/* Save Button */}
              <button
                onClick={savePlant}
                style={{
                  width: '100%',
                  background: ACCENT_COLOR,
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px',
                  color: '#fff',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: editingPlantId ? '12px' : '0',
                }}
              >
                <Check size={20} /> Save
              </button>

              {/* Delete Button (if editing) */}
              {editingPlantId && (
                <button
                  onClick={() => {
                    if (window.confirm('Delete this plant?')) {
                      deletePlant(editingPlantId);
                      resetForm();
                      setShowAddModal(false);
                    }
                  }}
                  style={{
                    width: '100%',
                    background: '#ff3b30',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: '600',
                    height: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <X size={20} /> Delete
                </button>
              )}
            </AddModal>
          )}
        </div>
      );
    };








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
            border: `2px solid ${ACCENT_COLOR}`,
            cursor: 'pointer',
          }}
        />

        <img src={`/cojo_logo.svg?v=${Date.now()}`} alt="COJO" style={{ height: '32px' }} />

        <button
          onClick={() => setShowChat(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            padding: '8px',
            position: 'relative',
          }}
        >
          <MessageCircle size={24} />
        </button>
      </div>

      {/* Content Area with top padding for sticky header */}
      <div style={{ paddingTop: '80px', paddingBottom: '120px' }}>
        {/* HOME TAB */}
        {activeTab === 'home' && (
          <div style={{ padding: '20px' }}>
            {/* Title with button space alignment */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>Home</h2>
              <div style={{ width: '20px' }} />
            </div>

            <div style={{ display: 'grid', gap: '12px' }}>
              {/* Currently traveling card - Hero card */}
              {currentTraveler && (() => {
                const avatar = currentTraveler.userIds && currentTraveler.userIds[0] === user?.uid ? user?.photoURL : 
                               currentTraveler.userIds && currentTraveler.userIds[0] ? users.find(u => u.uid === currentTraveler.userIds[0])?.photoURL :
                               currentTraveler.userId === user?.uid ? user?.photoURL : users.find(u => u.uid === currentTraveler.userId)?.photoURL;
                
                return (
                  <div
                    style={{
                      background: `linear-gradient(135deg, rgba(100, 100, 100, 0.12) 0%, rgba(0, 0, 0, 0.6) 100%)`,
                      borderRadius: '16px',
                      padding: '16px',
                      border: `1px solid rgba(255, 255, 255, 0.08)`,
                      backdropFilter: 'blur(10px)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: `url(${avatar}) no-repeat center / cover`,
                        border: `1.5px solid ${ACCENT_COLOR}`,
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '12px', color: '#999' }}>
                        is currently in
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>
                        {currentTraveler.location}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Wellness Rings - Activity Style - 2 COLUMNS ONLY */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr',
                gap: '12px' 
              }}>
                {/* Plants Ring - CLICKABLE */}
                <div
                  onClick={() => setActiveTab('plants')}
                  style={{
                    background: `linear-gradient(135deg, rgba(52, 199, 89, 0.15) 0%, rgba(0, 0, 0, 0.8) 100%)`,
                    borderRadius: '16px',
                    padding: '16px 12px',
                    border: `1px solid rgba(52, 199, 89, 0.12)`,
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    minHeight: '160px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(52, 199, 89, 0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(52, 199, 89, 0.12)'}
                >
                  {(() => {
                    const healthyPlants = plants.filter(p => {
                      const status = getWateringStatus(p);
                      return status.status === 'Healthy';
                    }).length;
                    
                    return (
                      <>
                        <svg width="70" height="70" style={{ marginBottom: '10px' }}>
                          <circle cx="35" cy="35" r="30" fill="none" stroke="#333" strokeWidth="2.5" />
                          <circle
                            cx="35" cy="35" r="30" fill="none" stroke={healthyPlants === plants.length ? '#34c759' : '#ff9500'} strokeWidth="2.5"
                            strokeDasharray={`${plants.length > 0 ? (healthyPlants / plants.length) * 188.4 : 0} 188.4`}
                            style={{ transform: 'rotate(-90deg)', transformOrigin: '35px 35px', transition: 'stroke-dasharray 0.5s' }}
                          />
                        </svg>
                        <div style={{ fontSize: '16px', fontWeight: '600' }}>{healthyPlants}/{plants.length}</div>
                        <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>Plants Happy</div>
                      </>
                    );
                  })()}
                </div>

                {/* Budget Ring with Pie Chart - CLICKABLE */}
                <div
                  onClick={() => setActiveTab('budget')}
                  style={{
                    background: `linear-gradient(135deg, rgba(18, 52, 255, 0.15) 0%, rgba(0, 0, 0, 0.8) 100%)`,
                    borderRadius: '16px',
                    padding: '16px 12px',
                    border: `1px solid rgba(18, 52, 255, 0.12)`,
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    minHeight: '160px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(18, 52, 255, 0.3)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(18, 52, 255, 0.12)'}
                >
                  <div style={{ position: 'relative', width: '70px', height: '70px', marginBottom: '10px' }}>
                    <svg width="70" height="70" style={{ position: 'absolute' }}>
                      <circle cx="35" cy="35" r="30" fill="none" stroke="#333" strokeWidth="2.5" />
                      {(() => {
                        const monthExpenses = getExpensesForMonth(currentMonth);
                        const categoryTotals = {};
                        const colors = ['#1234ff', '#34c759', '#ff3b30', '#ff9500', '#ffc107', '#5ac8fa'];
                        
                        monthExpenses.forEach((expense, idx) => {
                          const cat = expense.category || 'Other';
                          categoryTotals[cat] = (categoryTotals[cat] || 0) + expense.amount;
                        });

                        const total = Object.values(categoryTotals).reduce((a, b) => a + b, 0) || 1;
                        let dashOffset = 0;
                        const arcs = [];
                        let colorIdx = 0;

                        Object.entries(categoryTotals).forEach(([cat, amount]) => {
                          const percentage = amount / total;
                          const arcLength = percentage * 188.4;
                          arcs.push(
                            <circle
                              key={cat}
                              cx="35" cy="35" r="30" fill="none" stroke={colors[colorIdx % colors.length]} strokeWidth="2.5"
                              strokeDasharray={`${arcLength} 188.4`}
                              strokeDashoffset={-dashOffset}
                              style={{ transform: 'rotate(-90deg)', transformOrigin: '35px 35px' }}
                            />
                          );
                          dashOffset += arcLength;
                          colorIdx++;
                        });

                        return arcs;
                      })()}
                    </svg>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: '600' }}>€{getExpensesForMonth(currentMonth).reduce((sum, e) => sum + e.amount, 0).toFixed(0)}</div>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '4px' }}>This Month</div>
                </div>
              </div>

              {/* Random Recipe Shuffle - Featured */}
              {meals.length > 0 && (() => {
                const randomMeal = meals[Math.floor(Math.random() * meals.length)];
                return (
                  <div
                    onClick={() => {
                      setSelectedRecipe(randomMeal);
                      setShowRecipeDetail(true);
                      setActiveTab('recipes');
                    }}
                    style={{
                      backgroundImage: `url(${randomMeal.photo}?w=600&h=300&fit=crop)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: '16px',
                      minHeight: '200px',
                      position: 'relative',
                      overflow: 'hidden',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.2))' }} />
                    
                    {/* Top Left - Time Label */}
                    {randomMeal.cookTime && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        zIndex: 10,
                        background: ACCENT_COLOR,
                        borderRadius: '20px',
                        padding: '6px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <Clock size={14} style={{ color: '#fff' }} />
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>{randomMeal.cookTime} min</span>
                      </div>
                    )}

                    {/* Top Right - Dietary Labels */}
                    {randomMeal.dietaryLabels && randomMeal.dietaryLabels.length > 0 && (
                      <div style={{ position: 'absolute', top: '12px', right: '12px', zIndex: 10, display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {randomMeal.dietaryLabels.map(label => {
                          const colors = {
                            'vegetarian': '#34c759',
                            'vegan': '#00c7be',
                            'gluten-free': '#ff9500',
                            'lactose-free': '#ff3b30',
                          };
                          return (
                            <div key={label} style={{
                              background: colors[label],
                              borderRadius: '20px',
                              padding: '6px 12px',
                              border: 'none',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: '#fff',
                            }}>
                              {label}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Bottom Content */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px', zIndex: 5 }}>
                      <div style={{ fontSize: '14px', color: '#ccc', marginBottom: '6px' }}>Today's Inspiration</div>
                      <div style={{ fontSize: '22px', fontWeight: '700', color: '#fff' }}>{randomMeal.name}</div>
                    </div>
                  </div>
                );
              })()}

              {/* This Week's Travels - Single Card or Multiple */}
              {(() => {
                const today = new Date();
                const weekStart = new Date(today);
                weekStart.setDate(today.getDate() - today.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);

                const thisWeekTravels = travels.filter(t => {
                  const start = new Date(t.startDate);
                  const end = new Date(t.endDate);
                  return (start <= weekEnd && end >= weekStart);
                });

                if (thisWeekTravels.length === 0) return null;

                if (thisWeekTravels.length === 1) {
                  const travel = thisWeekTravels[0];
                  return (
                    <div
                      onClick={() => setActiveTab('travel')}
                      style={{
                        background: `linear-gradient(135deg, rgba(255, 149, 0, 0.15) 0%, rgba(0, 0, 0, 0.8) 100%)`,
                        borderRadius: '16px',
                        padding: '20px',
                        border: `1px solid rgba(255, 149, 0, 0.12)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255, 149, 0, 0.3)'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 149, 0, 0.12)'}
                    >
                      <div>
                        <div style={{ fontSize: '14px', color: '#999', marginBottom: '6px' }}>This Week</div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: '#ff9500', marginBottom: '4px' }}>{travel.location}</div>
                        <div style={{ fontSize: '12px', color: '#999' }}>
                          {new Date(travel.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(travel.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                      <Plane size={40} color="#ff9500" />
                    </div>
                  );
                } else {
                  return (
                    <div
                      onClick={() => setActiveTab('travels')}
                      style={{
                        background: `linear-gradient(135deg, rgba(255, 149, 0, 0.15) 0%, rgba(0, 0, 0, 0.8) 100%)`,
                        borderRadius: '16px',
                        padding: '20px',
                        border: `1px solid rgba(255, 149, 0, 0.12)`,
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <div style={{ fontSize: '14px', color: '#999', marginBottom: '12px' }}>This Week</div>
                      <div style={{ display: 'grid', gap: '8px' }}>
                        {thisWeekTravels.map((travel, idx) => (
                          <div key={travel.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff9500' }} />
                            <span style={{ fontSize: '13px', fontWeight: '600' }}>{travel.location}</span>
                            <span style={{ fontSize: '11px', color: '#999', marginLeft: 'auto' }}>
                              {new Date(travel.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
              })()}

              {/* Days Together Counter */}
              {(() => {
                const now = new Date();
                const year = now.getFullYear();
                const month = now.getMonth();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                
                let daysTogether = daysInMonth;
                
                travels.forEach(travel => {
                  const start = new Date(travel.startDate);
                  const end = new Date(travel.endDate);
                  
                  if (start.getMonth() === month && start.getFullYear() === year) {
                    const travelUserIds = travel.userIds || [travel.userId];
                    // If only one user is traveling (not both), subtract those days
                    if (travelUserIds.length === 1) {
                      const travelDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                      daysTogether = Math.max(0, daysTogether - travelDays);
                    }
                  }
                });

                return (
                  <div
                    style={{
                      background: `linear-gradient(135deg, rgba(18, 52, 255, 0.15) 0%, rgba(0, 0, 0, 0.8) 100%)`,
                      borderRadius: '16px',
                      padding: '24px',
                      border: `1px solid rgba(18, 52, 255, 0.12)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '48px', fontWeight: '700', marginBottom: '4px' }}>
                        {daysTogether}
                      </div>
                      <div style={{ fontSize: '14px', color: '#999' }}>days together this month</div>
                    </div>
                    <Heart size={48} fill={ACCENT_COLOR} color={ACCENT_COLOR} style={{ animation: 'pulse 2s infinite' }} />
                  </div>
                );
              })()}
            </div>

            <style>{`
              @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
              }
              
              @media (max-width: 480px) {
                .home-container {
                  padding: 12px !important;
                }
              }
            `}</style>
          </div>
        )}

        {/* PLANTS TAB - PERENUAL API + RECIPE-STYLED */}
        {activeTab === 'plants' && (
          <PlantsTab plants={plants} setPlants={setPlants} careLogs={careLogs} weatherData={weatherData} database={database} user={user} />
        )}

        {/* MEALS TAB */}
        {activeTab === 'food' && (
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '28px', fontWeight: '700', margin: 0 }}>Recipes</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                {meals.length > 0 && (
                  <button
                    onClick={() => {
                      const randomMeal = meals[Math.floor(Math.random() * meals.length)];
                      setSelectedRecipe(randomMeal);
                      setShowRecipeDetail(true);
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '12px',
                      padding: '10px 12px',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                    }}
                  >
                    <Shuffle size={18} />
                  </button>
                )}
                <button
                  onClick={() => {
                    setModalType('meal');
                    setEditingId(null);
                    setShowAddModal(true);
                    setNewItemName('');
                    setNewItemRecipe('');
                    setNewItemPhoto(null);
                    setNewItemCookTime('');
                    setNewItemIngredients('');
                    setNewItemInstructions('');
                    setNewItemRecipeUrl('');
                    setNewItemDietaryLabels([]);
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

            {meals.length === 0 ? (
              <EmptyState icon={UtensilsCrossed} title="No recipes yet" subtitle="Add your favorite recipes" />
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {meals.map(meal => (
                  <div
                    key={meal.id}
                    onClick={() => {
                      setSelectedRecipe(meal);
                      setShowRecipeDetail(true);
                    }}
                    style={{
                      backgroundImage: `url(${meal.photo}?w=400&h=300&fit=crop)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderRadius: '16px',
                      minHeight: '240px',
                      position: 'relative',
                      overflow: 'hidden',
                      boxShadow: `0 0 0 1px rgba(18, 52, 255, 0.15)`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 0 1px rgba(18, 52, 255, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 0 0 1px rgba(18, 52, 255, 0.15)';
                    }}
                  >
                    {/* Gradient overlay */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.9) 100%)',
                      pointerEvents: 'none',
                    }} />
                    
                    {/* Cook Time Pill (top left) */}
                    {meal.cookTime && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        zIndex: 2,
                        background: ACCENT_COLOR,
                        borderRadius: '20px',
                        padding: '6px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}>
                        <Clock size={14} style={{ color: '#fff' }} />
                        <span style={{ fontSize: '12px', fontWeight: '600', color: '#fff' }}>{meal.cookTime} min</span>
                      </div>
                    )}

                    {/* Dietary Labels (top right) */}
                    {meal.dietaryLabels && meal.dietaryLabels.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        zIndex: 2,
                        display: 'flex',
                        gap: '6px',
                        flexWrap: 'wrap',
                        justifyContent: 'flex-end',
                      }}>
                        {meal.dietaryLabels.map(label => {
                          const colors = {
                            'vegetarian': '#34c759',
                            'vegan': '#00c7be',
                            'gluten-free': '#ff9500',
                            'lactose-free': '#ff3b30',
                          };
                          return (
                            <div key={label} style={{
                              background: colors[label],
                              borderRadius: '20px',
                              padding: '6px 12px',
                              border: 'none',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: '#fff',
                            }}>
                              {label}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Content (bottom) */}
                    <div style={{
                      position: 'relative',
                      zIndex: 1,
                      padding: '12px',
                      minHeight: '240px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      height: '100%',
                    }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#fff' }}>{meal.name}</h3>
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
                  
                  <div style={{ textAlign: 'center', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>
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

                <div style={{ marginTop: '24px', display: 'grid', gap: '12px' }}>
                  {TRAVEL_CATEGORIES.map(category => {
                    const categoryTravels = getTravelsForMonth(currentMonth).filter(t => t.category === category.name);
                    
                    if (categoryTravels.length === 0) return null;
                    
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
                            <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>{categoryTravels.length} trip{categoryTravels.length !== 1 ? 's' : ''}</p>
                          </div>
                          <ChevronDown size={20} color="#999" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }} />
                        </button>
                        
                        {isExpanded && (
                          <div style={{ background: 'transparent', borderRadius: '12px', padding: '12px 0 8px', display: 'grid', gap: '10px' }}>
                            {categoryTravels.map((travel) => {
                              const travelersNames = (travel.userIds || [travel.userId || '']).map(uid => {
                                if (uid === user?.uid) return getFirstName(user?.displayName);
                                const otherUser = users.find(u => u.uid === uid);
                                return getFirstName(otherUser?.displayName) || 'Guest';
                              }).join(' & ');
                              
                              return (
                                <div key={travel.id} style={{ background: `rgba(255, 255, 255, 0.04)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: '10px', border: `1px solid rgba(255, 255, 255, 0.06)`, transition: 'all 0.2s' }}
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
                                    <p style={{ fontSize: '13px', margin: 0, fontWeight: '500', color: '#fff' }}>{travel.location}</p>
                                    <p style={{ fontSize: '11px', color: '#999', margin: '3px 0 0' }}>
                                      {travel.startDate} → {travel.endDate}
                                    </p>
                                    <p style={{ fontSize: '11px', color: '#999', margin: '2px 0 0' }}>
                                      {travelersNames}
                                    </p>
                                  </div>
                                  <button onClick={() => openEditModal('travel', travel)} style={{ background: '#1234ff', border: 'none', borderRadius: '6px', padding: '5px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                    onMouseEnter={(e) => e.target.style.background = '#0020cc'}
                                    onMouseLeave={(e) => e.target.style.background = '#1234ff'}
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
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

      {/* Settings Modal */}
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

      {/* 🌱 Plant Library Modal - Perenual */}

      {/* Chat Modal */}
      {showChat && (
        <div
          style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: `rgba(0, 0, 0, 0.6)`,
            backdropFilter: 'blur(10px)',
            zIndex: 250,
            display: 'flex',
            alignItems: 'flex-end',
          }}
          onClick={() => setShowChat(false)}
        >
          <div
            style={{
              width: '100%',
              height: '90vh',
              background: BG_COLOR,
              borderTop: `1px solid rgba(18, 52, 255, 0.2)`,
              borderRadius: '20px 20px 0 0',
              padding: '0',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Chat Header */}
            <div style={{ padding: '16px 20px', borderBottom: `1px solid rgba(18, 52, 255, 0.1)`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Messages</h3>
              <button
                onClick={() => setShowChat(false)}
                style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '24px' }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Messages Container */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'grid', gap: '12px', alignContent: 'flex-start' }}>
              {chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#666', paddingTop: '40px' }}>
                  <p>No messages yet. Say something cute! 💕</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isOwnMessage = msg.userId === user?.uid;
                  return (
                    <div key={msg.id} style={{ display: 'flex', gap: '8px', justifyContent: isOwnMessage ? 'flex-end' : 'flex-start', alignItems: 'flex-end' }}>
                      {!isOwnMessage && (
                        <img
                          src={msg.avatar}
                          alt={msg.displayName}
                          style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0 }}
                        />
                      )}
                      
                      <div style={{ display: 'grid', gap: '4px', maxWidth: '70%' }}>
                        {/* Message Bubble */}
                        <div
                          style={{
                            background: isOwnMessage ? ACCENT_COLOR : 'rgba(255, 255, 255, 0.08)',
                            borderRadius: isOwnMessage ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                            padding: '10px 14px',
                            color: '#fff',
                            wordBreak: 'break-word',
                            fontSize: '14px',
                            lineHeight: '1.4',
                          }}
                        >
                          {msg.text}
                        </div>

                        {/* Link Previews */}
                        {msg.links && msg.links.length > 0 && (
                          <div style={{ display: 'grid', gap: '8px' }}>
                            {msg.links.map((link, idx) => {
                              const preview = msg.linkPreviews?.[link];
                              return (
                                <a
                                  key={idx}
                                  href={link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{
                                    display: 'block',
                                    textDecoration: 'none',
                                    color: 'inherit',
                                    background: 'rgba(18, 52, 255, 0.1)',
                                    border: `1px solid rgba(18, 52, 255, 0.3)`,
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                  }}
                                >
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    {preview?.image && (
                                      <img
                                        src={preview.image}
                                        alt=""
                                        style={{
                                          width: '80px',
                                          height: '80px',
                                          objectFit: 'cover',
                                          flexShrink: 0,
                                        }}
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                        }}
                                      />
                                    )}
                                    <div style={{ padding: '8px', flex: 1, minWidth: 0 }}>
                                      <p style={{ fontSize: '12px', fontWeight: '600', margin: '0 0 4px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {preview?.title || 'Link'}
                                      </p>
                                      {preview?.description && (
                                        <p style={{ fontSize: '11px', margin: '0 0 4px', color: '#ccc', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical' }}>
                                          {preview.description}
                                        </p>
                                      )}
                                      <p style={{ fontSize: '10px', margin: 0, color: ACCENT_COLOR }}>
                                        {new URL(link).hostname}
                                      </p>
                                    </div>
                                  </div>
                                </a>
                              );
                            })}
                          </div>
                        )}

                        {/* Timestamp */}
                        <p style={{ fontSize: '11px', color: '#666', margin: 0, textAlign: isOwnMessage ? 'right' : 'left' }}>
                          {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {isOwnMessage && (
                        <img
                          src={msg.avatar}
                          alt={msg.displayName}
                          style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0 }}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Bar */}
            <div style={{ padding: '12px 20px', borderTop: `1px solid rgba(18, 52, 255, 0.1)`, display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={newChatMessage}
                onChange={(e) => setNewChatMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    sendChatMessage();
                  }
                }}
                placeholder="Send a message..."
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid rgba(18, 52, 255, 0.2)`,
                  borderRadius: '20px',
                  padding: '10px 16px',
                  color: '#fff',
                  fontSize: '14px',
                }}
              />
              <button
                onClick={sendChatMessage}
                disabled={!newChatMessage.trim()}
                style={{
                  background: newChatMessage.trim() ? ACCENT_COLOR : 'rgba(18, 52, 255, 0.3)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  cursor: newChatMessage.trim() ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                }}
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Detail Page */}
      {showRecipeDetail && selectedRecipe && (
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
            overflowY: 'auto',
          }}
          onClick={() => setShowRecipeDetail(false)}
        >
          <div
            style={{
              width: '100%',
              background: BG_COLOR,
              borderTop: `1px solid rgba(18, 52, 255, 0.2)`,
              borderRadius: '24px 24px 0 0',
              padding: '0',
              maxHeight: '95vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Recipe Image Header */}
            <div
              style={{
                backgroundImage: `url(${selectedRecipe.photo}?w=600&h=400&fit=crop)`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                height: '280px',
                position: 'relative',
              }}
            >
              {/* Gradient overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 100%)',
              }} />

              {/* Close button */}
              <button
                onClick={() => setShowRecipeDetail(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(0, 0, 0, 0.5)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  cursor: 'pointer',
                  zIndex: 10,
                }}
              >
                <X size={24} />
              </button>

              {/* Recipe Title */}
              <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                right: '20px',
                zIndex: 5,
              }}>
                <h2 style={{ fontSize: '28px', fontWeight: '700', margin: 0, color: '#fff' }}>{selectedRecipe.name}</h2>
              </div>
            </div>

            {/* Content Section */}
            <div style={{ padding: '24px', display: 'grid', gap: '24px' }}>
              {/* Meta Info: Cook Time, Dietary Labels */}
              {(selectedRecipe.cookTime || (selectedRecipe.dietaryLabels && selectedRecipe.dietaryLabels.length > 0)) && (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {selectedRecipe.cookTime && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Clock size={20} color={ACCENT_COLOR} />
                      <span style={{ fontSize: '16px', color: '#ccc' }}>{selectedRecipe.cookTime} minutes</span>
                    </div>
                  )}
                  
                  {selectedRecipe.dietaryLabels && selectedRecipe.dietaryLabels.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {selectedRecipe.dietaryLabels.map(label => {
                        const colors = {
                          'vegetarian': '#34c759',
                          'vegan': '#00c7be',
                          'gluten-free': '#ff9500',
                          'lactose-free': '#ff3b30',
                        };
                        return (
                          <div key={label} style={{
                            background: colors[label],
                            borderRadius: '20px',
                            padding: '8px 14px',
                            border: 'none',
                            fontSize: '12px',
                            fontWeight: '600',
                            color: '#fff',
                          }}>
                            {label}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Ingredients (Shopping List) */}
              {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#fff' }}>Ingredients</h3>
                  <div style={{ display: 'grid', gap: '8px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    {selectedRecipe.ingredients.map((ingredient, idx) => (
                      <div key={idx} style={{ fontSize: '14px', color: '#ccc', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <span style={{ color: ACCENT_COLOR, flexShrink: 0 }}>•</span>
                        <span>{ingredient}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions */}
              {selectedRecipe.instructions && (
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: '#fff' }}>Instructions</h3>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255, 255, 255, 0.06)', lineHeight: '1.6', color: '#ccc', whiteSpace: 'pre-wrap', fontSize: '14px' }}>
                    {selectedRecipe.instructions}
                  </div>
                </div>
              )}

              {/* Recipe URL */}
              {selectedRecipe.recipeUrl && (
                <a
                  href={selectedRecipe.recipeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px',
                    background: `rgba(18, 52, 255, 0.08)`,
                    border: `1px solid ${ACCENT_COLOR}`,
                    borderRadius: '12px',
                    color: ACCENT_COLOR,
                    textDecoration: 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  View Full Recipe →
                </a>
              )}

              {/* Edit Button */}
              <button
                onClick={() => {
                  setShowRecipeDetail(false);
                  openEditModal('meal', selectedRecipe);
                }}
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Edit2 size={18} /> Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Modal (Old - keeping for backward compatibility) */}
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

      {/* Add Meal Modal */}
      <AddModal isOpen={showAddModal && modalType === 'meal'} title={editingId ? "Edit Recipe" : "Add Recipe"} onClose={resetModal}>
        <div style={{ display: 'grid', gap: '16px' }}>
          {/* Recipe Name */}
          <input type="text" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="Recipe name..." style={{ background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px' }} />
          
          {/* Cook Time */}
          <div>
            <label style={{ fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }}>Cook time (minutes)</label>
            <input type="number" value={newItemCookTime} onChange={(e) => setNewItemCookTime(e.target.value)} placeholder="30" style={{ width: '100%', background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px' }} />
          </div>

          {/* Ingredients */}
          <div>
            <label style={{ fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }}>Ingredients <span style={{ color: '#999', fontSize: '12px' }}>(one per line)</span></label>
            <textarea value={newItemIngredients} onChange={(e) => setNewItemIngredients(e.target.value)} placeholder="2 cups flour&#10;1 egg&#10;Salt to taste..." style={{ width: '100%', background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px', minHeight: '100px', fontFamily: 'inherit' }} />
          </div>

          {/* Instructions */}
          <div>
            <label style={{ fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }}>Instructions</label>
            <textarea value={newItemInstructions} onChange={(e) => setNewItemInstructions(e.target.value)} placeholder="Step-by-step cooking instructions..." style={{ width: '100%', background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px', minHeight: '80px', fontFamily: 'inherit' }} />
          </div>

          {/* Recipe URL */}
          <div>
            <label style={{ fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }}>Recipe URL <span style={{ color: '#999', fontSize: '12px' }}>(optional)</span></label>
            <input type="url" value={newItemRecipeUrl} onChange={(e) => setNewItemRecipeUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px' }} />
          </div>

          {/* Dietary Labels */}
          <div>
            <label style={{ fontSize: '14px', color: '#666', marginBottom: '12px', display: 'block' }}>Dietary labels</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {['vegetarian', 'vegan', 'gluten-free', 'lactose-free'].map(label => {
                const colors = {
                  'vegetarian': '#34c759',
                  'vegan': '#00c7be',
                  'gluten-free': '#ff9500',
                  'lactose-free': '#ff3b30',
                };
                const isSelected = newItemDietaryLabels.includes(label);
                return (
                  <button
                    key={label}
                    onClick={() => {
                      if (isSelected) {
                        setNewItemDietaryLabels(newItemDietaryLabels.filter(l => l !== label));
                      } else {
                        setNewItemDietaryLabels([...newItemDietaryLabels, label]);
                      }
                    }}
                    style={{
                      padding: '10px',
                      borderRadius: '12px',
                      border: `2px solid ${colors[label]}`,
                      background: isSelected ? `${colors[label]}20` : 'rgba(255, 255, 255, 0.02)',
                      color: colors[label],
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Photo Search */}
          <div>
            <label style={{ fontSize: '14px', color: '#666', marginBottom: '8px', display: 'block' }}>Recipe photo</label>
            <input type="text" placeholder="e.g. pasta, salad..." onChange={(e) => searchUnsplash(e.target.value)} style={{ width: '100%', background: `rgba(255, 255, 255, 0.05)`, border: `1px solid rgba(18, 52, 255, 0.2)`, borderRadius: '12px', padding: '12px', color: '#fff', fontSize: '16px', marginBottom: '12px' }} />
            {unsplashSearchResults.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {unsplashSearchResults.map((photo) => (
                  <img key={photo.id} src={`${photo.urls.thumb}?w=120&h=120&fit=crop`} alt="" onClick={() => setNewItemPhoto(photo.urls.regular)} style={{ width: '100%', height: '100px', borderRadius: '8px', cursor: 'pointer', border: newItemPhoto === photo.urls.regular ? `2px solid ${ACCENT_COLOR}` : 'none', transition: 'all 0.2s' }} />
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {editingId ? (
              <>
                <button onClick={addMeal} style={{ background: ACCENT_COLOR, border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', cursor: 'pointer', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Check size={20} /> Save
                </button>
                <button onClick={() => { deleteMeal(editingId); resetModal(); }} style={{ background: '#ff3b30', border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', cursor: 'pointer', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <X size={20} /> Delete
                </button>
              </>
            ) : (
              <button onClick={addMeal} style={{ background: ACCENT_COLOR, border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', cursor: 'pointer', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', gridColumn: '1 / -1' }}>
                <Check size={20} /> Save
              </button>
            )}
          </div>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {editingId ? (
              <>
                <button onClick={addExpense} style={{ background: ACCENT_COLOR, border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', cursor: 'pointer', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Check size={20} /> Save
                </button>
                <button onClick={() => { deleteExpense(editingId); resetModal(); }} style={{ background: '#ff3b30', border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', cursor: 'pointer', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <X size={20} /> Delete
                </button>
              </>
            ) : (
              <button onClick={addExpense} style={{ background: ACCENT_COLOR, border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', cursor: 'pointer', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', gridColumn: '1 / -1' }}>
                <Check size={20} /> Save
              </button>
            )}
          </div>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {editingId ? (
              <>
                <button onClick={addTravel} style={{ background: ACCENT_COLOR, border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', cursor: 'pointer', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <Check size={20} /> Save
                </button>
                <button onClick={() => { deleteTravel(editingId); resetModal(); }} style={{ background: '#ff3b30', border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', cursor: 'pointer', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <X size={20} /> Delete
                </button>
              </>
            ) : (
              <button onClick={addTravel} style={{ background: ACCENT_COLOR, border: 'none', borderRadius: '12px', padding: '14px', color: '#fff', cursor: 'pointer', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', gridColumn: '1 / -1' }}>
                <Check size={20} /> Save
              </button>
            )}
          </div>
        </div>
      </AddModal>
    </div>
  );
}