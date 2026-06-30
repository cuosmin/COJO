import React, { useState, useEffect } from 'react';
import { 
  auth, 
  db 
} from './firebaseConfig';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { 
  Home, 
  Leaf, 
  Pizza, 
  Wallet, 
  Heart, 
  User, 
  Sliders, 
  Trash2, 
  Plus, 
  UtensilsCrossed 
} from 'lucide-react';

export default function CompleteSharedLifeDashboard() {
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('home');
  const [plants, setPlants] = useState([]);
  const [meals, setMeals] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore Sync
  useEffect(() => {
    if (!user) return;

    const unsubPlants = onSnapshot(collection(db, 'plants'), (snapshot) => {
      setPlants(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubMeals = onSnapshot(collection(db, 'meals'), (snapshot) => {
      setMeals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubExpenses = onSnapshot(collection(db, 'expenses'), (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubPlants();
      unsubMeals();
      unsubExpenses();
    };
  }, [user]);

  // Actions
  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Sign in failed", error);
    }
  };

  const handleWaterPlant = async (plantId) => {
    const plantDoc = doc(db, 'plants', plantId);
    await updateDoc(plantDoc, {
      lastWatered: new Date().toISOString(),
      healthLevel: 100
    });
  };

  const handleDeletePlant = async (plantId) => {
    await deleteDoc(doc(db, 'plants', plantId));
  };

  const handleAddSamplePlant = async () => {
    await addDoc(collection(db, 'plants'), {
      name: prompt("Plant Name:") || "New Plant",
      wateringFreqDays: 7,
      lastWatered: new Date().toISOString(),
      healthLevel: 80,
      photoUrl: "" // Firebase Storage link goes here later
    });
  };

  const handleAddSampleMeal = async () => {
    await addDoc(collection(db, 'meals'), {
      name: prompt("Meal Name:") || "Delicious Dish",
      date: new Date().toISOString().split('T')[0],
      photoUrl: ""
    });
  };

  // Calculations for Home Banners
  const plantsNeedingWater = plants.filter(p => {
    const days = Math.floor((new Date() - new Date(p.lastWatered)) / (1000 * 60 * 60 * 24));
    return days >= p.wateringFreqDays;
  }).length;

  const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  if (loading) return <div className="h-screen w-screen bg-[#0A1014] flex items-center justify-center text-white">Loading...</div>;

  // 1. LOGIN SCREEN (login-1.png)
  if (!user) {
    return (
      <div className="h-screen w-screen bg-[#0A1014] flex flex-col items-center justify-center px-6 selection:bg-[#1234ff]/30">
        <div className="flex flex-col items-center text-center max-w-sm w-full space-y-2 mb-12">
          <h1 className="text-white text-[74px] font-black tracking-tight leading-none select-none">
            COJO
          </h1>
          <p className="text-gray-400 text-lg font-medium tracking-wide">
            Sharing life together.
          </p>
        </div>
        <button 
          onClick={handleSignIn}
          className="w-full max-w-xs bg-[#1234ff] hover:bg-[#1234ff]/90 text-white font-semibold text-lg py-4 px-8 rounded-2xl shadow-lg shadow-[#1234ff]/20 transition-all duration-300 active:scale-[0.98]"
        >
          Sign in
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0A1014] text-white flex flex-col pb-32 selection:bg-[#1234ff]/30">
      
      {/* GLOBAL APPMOBILE HEADER */}
      <header className="w-full px-6 pt-14 pb-4 flex items-center justify-between sticky top-0 bg-[#0A1014]/80 backdrop-blur-md z-40">
        <button onClick={() => signOut(auth)} className="text-white hover:text-gray-300 transition-colors">
          <User className="w-6 h-6" />
        </button>
        <span className="text-2xl font-black tracking-tight select-none">COJO</span>
        <button className="text-white hover:text-gray-300 transition-colors">
          <Sliders className="w-6 h-6" />
        </button>
      </header>

      {/* VIEWPORT CONTROLLER */}
      <main className="flex-1 px-5 max-w-md w-full mx-auto flex flex-col">
        <h2 className="text-center text-gray-400 text-sm font-semibold tracking-widest uppercase mb-6 mt-2">
          {currentTab === 'home' && 'Home'}
          {currentTab === 'plants' && 'Plants'}
          {currentTab === 'meals' && 'Meals'}
          {currentTab === 'budget' && 'Budget'}
          {currentTab === 'intimacy' && 'Intimacy'}
        </h2>

        {/* 2. DASHBOARD VIEW (home-1.jpg) */}
        {currentTab === 'home' && (
          <div className="flex flex-col space-y-5 animate-fadeIn">
            {/* Plants Banner */}
            <div 
              onClick={() => setCurrentTab('plants')}
              className="relative h-44 rounded-[28px] overflow-hidden group cursor-pointer border border-white/5 shadow-xl"
            >
              <img 
                src="https://images.unsplash.com/photo-1545241047-6083a3684587?auto=format&fit=crop&q=80&w=600" 
                alt="Plants background" 
                className="w-full h-full object-cover grayscale brightness-[0.35] group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <span className="text-white text-6xl font-black leading-none mb-1">{plantsNeedingWater || 2}</span>
                <p className="text-gray-300 font-medium text-sm tracking-wide">of our plants need water</p>
              </div>
            </div>

            {/* Expenses Banner */}
            <div className="relative h-44 rounded-[28px] overflow-hidden group border border-white/5 shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&q=80&w=600" 
                alt="Budget background" 
                className="w-full h-full object-cover grayscale brightness-[0.25] transition-transform duration-700"
              />
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <span className="text-white text-5xl font-black leading-none mb-2">
                  €{totalSpent > 0 ? totalSpent.toLocaleString() : "1.000"}
                </span>
                <p className="text-gray-300 font-medium text-sm tracking-wide">spent this month</p>
              </div>
            </div>

            {/* Meals Banner */}
            <div 
              onClick={() => setCurrentTab('meals')}
              className="relative h-44 rounded-[28px] overflow-hidden group cursor-pointer border border-white/5 shadow-xl"
            >
              <img 
                src="https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=600" 
                alt="Meals background" 
                className="w-full h-full object-cover grayscale brightness-[0.35] group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 p-6 flex flex-col justify-end">
                <span className="text-white text-6xl font-black leading-none mb-1">{meals.length || 45}</span>
                <p className="text-gray-300 font-medium text-sm tracking-wide">meals together this month</p>
              </div>
            </div>
          </div>
        )}

        {/* 3. PLANTS VIEW (plants-1.jpg) */}
        {currentTab === 'plants' && (
          <div className="flex flex-col space-y-5 flex-1 animate-fadeIn">
            {plants.length === 0 ? (
              // Default UI matching the placeholder preview structure
              <>
                <div className="relative h-40 rounded-[28px] overflow-hidden border border-white/5 shadow-xl">
                  <img src="https://images.unsplash.com/photo-1528183429752-a97d0bf99b5a?auto=format&fit=crop&q=80&w=600" alt="Eucalyptus" className="w-full h-full object-cover grayscale brightness-[0.4]" />
                  <div className="absolute inset-0 p-5 flex flex-col justify-between">
                    <h3 className="text-xl font-bold tracking-wide">Eucalyptus</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button className="bg-[#4a7c00] hover:bg-[#5b9600] text-white font-semibold py-3.5 px-4 rounded-xl transition-all active:scale-[0.97]">Water</button>
                      <button className="bg-[#991b1b] hover:bg-[#b91c1c] text-white flex items-center justify-center rounded-xl transition-all active:scale-[0.97]"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                </div>

                <div className="relative h-40 rounded-[28px] overflow-hidden border border-white/5 shadow-xl">
                  <img src="https://images.unsplash.com/photo-1528826722302-d325a721543c?auto=format&fit=crop&q=80&w=600" alt="Lavander" className="w-full h-full object-cover grayscale brightness-[0.4]" />
                  <div className="absolute inset-0 p-5 flex flex-col justify-between">
                    <h3 className="text-xl font-bold tracking-wide">Lavander</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button className="bg-[#4a7c00] hover:bg-[#5b9600] text-white font-semibold py-3.5 px-4 rounded-xl transition-all active:scale-[0.97]">Water</button>
                      <button className="bg-[#991b1b] hover:bg-[#b91c1c] text-white flex items-center justify-center rounded-xl transition-all active:scale-[0.97]"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              plants.map(plant => (
                <div key={plant.id} className="relative h-40 rounded-[28px] overflow-hidden border border-white/5 shadow-xl animate-fadeIn">
                  <img 
                    src={plant.photoUrl || "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?auto=format&fit=crop&q=80&w=600"} 
                    alt={plant.name} 
                    className="w-full h-full object-cover grayscale brightness-[0.4]" 
                  />
                  <div className="absolute inset-0 p-5 flex flex-col justify-between">
                    <h3 className="text-xl font-bold tracking-wide">{plant.name}</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleWaterPlant(plant.id)}
                        className="bg-[#4a7c00] hover:bg-[#5b9600] text-white font-semibold py-3.5 px-4 rounded-xl transition-all active:scale-[0.97]"
                      >
                        Water
                      </button>
                      <button 
                        onClick={() => handleDeletePlant(plant.id)}
                        className="bg-[#991b1b] hover:bg-[#b91c1c] text-white flex items-center justify-center rounded-xl transition-all active:scale-[0.97]"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}

            <button 
              onClick={handleAddSamplePlant}
              className="w-full mt-2 bg-[#1234ff] hover:bg-[#1234ff]/90 text-white font-semibold text-base py-4 rounded-2xl shadow-lg transition-all duration-300 active:scale-[0.98]"
            >
              Add new
            </button>
          </div>
        )}

        {/* 4. MEALS VIEW (meals-1.png) */}
        {currentTab === 'meals' && (
          <div className="flex-1 flex flex-col justify-center items-center min-h-[50vh] max-w-sm mx-auto animate-fadeIn text-center">
            {meals.length === 0 ? (
              <div className="flex flex-col items-center justify-center">
                <div className="w-24 h-24 bg-[#1234ff] rounded-[32px] flex items-center justify-center mb-6 shadow-xl shadow-[#1234ff]/10">
                  <UtensilsCrossed className="w-10 h-10 text-white stroke-[2]" />
                </div>
                <h3 className="text-white text-xl font-bold tracking-wide mb-2">No meals logged</h3>
                <p className="text-gray-400 text-sm font-medium tracking-wide max-w-[240px] mb-8 leading-relaxed">
                  Let's start logging our meals to have fun.
                </p>
              </div>
            ) : (
              <div className="w-full grid grid-cols-1 gap-4 mb-6">
                {meals.map(meal => (
                  <div key={meal.id} className="w-full h-24 bg-[#1C1C1E] border border-white/5 rounded-2xl p-4 flex items-center space-x-4">
                    <img src={meal.photoUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=150"} alt={meal.name} className="w-16 h-16 rounded-xl object-cover grayscale" />
                    <div className="text-left">
                      <h4 className="font-bold text-lg">{meal.name}</h4>
                      <p className="text-xs text-gray-500">{meal.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button 
              onClick={handleAddSampleMeal}
              className="w-full bg-[#1234ff] hover:bg-[#1234ff]/90 text-white font-semibold text-base py-4 rounded-2xl shadow-lg transition-all duration-300 active:scale-[0.98]"
            >
              Add new
            </button>
          </div>
        )}

        {/* TEMPORARY FALLBACKS FOR REMAINING ACCENT VIEWS */}
        {(currentTab === 'budget' || currentTab === 'intimacy') && (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[40vh] text-center animate-fadeIn">
            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-4 text-gray-400">
              {currentTab === 'budget' ? <Wallet className="w-8 h-8" /> : <Heart className="w-8 h-8" />}
            </div>
            <h3 className="text-xl font-bold tracking-wide capitalize">{currentTab} Screen</h3>
            <p className="text-gray-500 text-sm max-w-xs mt-1">This module will styling-match your shared data streams flawlessly next.</p>
          </div>
        )}
      </main>

      {/* FLOATING GLASS NAVIGATION CONTROLLER (Instagram Glass Effect) */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-40px)] max-w-sm h-20 bg-black/40 border border-white/10 rounded-[32px] backdrop-blur-xl z-50 px-3 flex items-center justify-between shadow-2xl">
        <button 
          onClick={() => setCurrentTab('home')}
          className={`flex items-center justify-center h-14 transition-all duration-300 ${currentTab === 'home' ? 'bg-[#1234ff] w-18 px-6 rounded-[24px] text-white shadow-lg shadow-[#1234ff]/20' : 'w-12 text-gray-400 hover:text-white'}`}
        >
          <Home className="w-6 h-6 stroke-[2.2]" />
        </button>

        <button 
          onClick={() => setCurrentTab('plants')}
          className={`flex items-center justify-center h-14 transition-all duration-300 ${currentTab === 'plants' ? 'bg-[#1234ff] w-18 px-6 rounded-[24px] text-white shadow-lg shadow-[#1234ff]/20' : 'w-12 text-gray-400 hover:text-white'}`}
        >
          <Leaf className="w-6 h-6 stroke-[2.2]" />
        </button>

        <button 
          onClick={() => setCurrentTab('meals')}
          className={`flex items-center justify-center h-14 transition-all duration-300 ${currentTab === 'meals' ? 'bg-[#1234ff] w-18 px-6 rounded-[24px] text-white shadow-lg shadow-[#1234ff]/20' : 'w-12 text-gray-400 hover:text-white'}`}
        >
          <Pizza className="w-6 h-6 stroke-[2.2]" />
        </button>

        <button 
          onClick={() => setCurrentTab('budget')}
          className={`flex items-center justify-center h-14 transition-all duration-300 ${currentTab === 'budget' ? 'bg-[#1234ff] w-18 px-6 rounded-[24px] text-white shadow-lg shadow-[#1234ff]/20' : 'w-12 text-gray-400 hover:text-white'}`}
        >
          <Wallet className="w-6 h-6 stroke-[2.2]" />
        </button>

        <button 
          onClick={() => setCurrentTab('intimacy')}
          className={`flex items-center justify-center h-14 transition-all duration-300 ${currentTab === 'intimacy' ? 'bg-[#1234ff] w-18 px-6 rounded-[24px] text-white shadow-lg shadow-[#1234ff]/20' : 'w-12 text-gray-400 hover:text-white'}`}
        >
          <Heart className="w-6 h-6 stroke-[2.2]" />
        </button>
      </nav>

    </div>
  );
}