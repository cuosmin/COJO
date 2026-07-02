// Save this as: src/notifications.js
// Browser notification system for COJO
// Note: These fire while the app is open (in a tab, even in background).
// True push notifications with app fully closed require Firebase Cloud Messaging - can add later.

// ============ CORE HELPERS ============

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('[Notif] Browser does not support notifications');
    return false;
  }
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
};

export const sendNotification = (title, body, tag) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      tag, // Prevents duplicate stacking
      icon: '/cojo_icon.png',
      badge: '/cojo_icon.png',
    });
    console.log(`[Notif] Sent: ${title} - ${body}`);
  } catch (err) {
    console.error('[Notif] Failed:', err);
  }
};

// Dedupe: only notify once per key per day (stored in localStorage)
const wasNotified = (key) => {
  return localStorage.getItem(`cojo-notif-${key}`) !== null;
};

const markNotified = (key) => {
  localStorage.setItem(`cojo-notif-${key}`, new Date().toISOString());
};

// Clean up old notification keys (older than 60 days)
export const cleanupOldNotifications = () => {
  const cutoff = Date.now() - 60 * 24 * 60 * 60 * 1000;
  Object.keys(localStorage)
    .filter(k => k.startsWith('cojo-notif-'))
    .forEach(k => {
      const date = new Date(localStorage.getItem(k)).getTime();
      if (isNaN(date) || date < cutoff) localStorage.removeItem(k);
    });
};

const todayStr = () => new Date().toISOString().split('T')[0];

// ============ PLANTS ============

// 1. Watering reminders (grouped)
export const checkPlantWatering = (plants) => {
  const today = todayStr();
  const key = `water-${today}`;
  if (wasNotified(key)) return;

  const needWatering = plants.filter(plant => {
    if (!plant.lastWatered || !plant.wateringDays) return false;
    const daysSince = Math.floor(
      (new Date() - new Date(plant.lastWatered)) / (1000 * 60 * 60 * 24)
    );
    return daysSince >= plant.wateringDays;
  });

  if (needWatering.length === 0) return;

  const names = needWatering.map(p => p.displayName || p.name);
  let nameList;
  if (names.length === 1) {
    nameList = names[0];
  } else if (names.length === 2) {
    nameList = `${names[0]} and ${names[1]}`;
  } else {
    nameList = `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  }

  const verb = names.length === 1 ? 'needs' : 'need';
  sendNotification('🌿 Watering time', `${nameList} ${verb} watering today!`, key);
  markNotified(key);
};

// 2. High temperature alert for Paris (uses free Open-Meteo API, no key needed)
export const checkParisTemperature = async (plants) => {
  if (plants.length === 0) return;
  
  const today = todayStr();
  const key = `heat-${today}`;
  if (wasNotified(key)) return;

  try {
    const res = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=48.8566&longitude=2.3522&daily=temperature_2m_max&timezone=Europe%2FParis&forecast_days=1'
    );
    const data = await res.json();
    const maxTemp = data.daily?.temperature_2m_max?.[0];

    if (maxTemp === undefined) return;

    // 30°C+ is stressful for most home plants (especially on a balcony)
    if (maxTemp >= 30) {
      const outdoorPlants = plants.filter(p => 
        p.location?.toLowerCase().includes('balcon') || 
        p.location?.toLowerCase().includes('terrace') ||
        p.location?.toLowerCase().includes('outdoor') ||
        p.location?.toLowerCase().includes('garden')
      );
      
      const plantNames = (outdoorPlants.length > 0 ? outdoorPlants : plants)
        .map(p => p.displayName || p.name)
        .join(', ');
      
      sendNotification(
        '🌡️ Heat alert',
        `It's ${Math.round(maxTemp)}°C in Paris today — too hot for ${plantNames}. Move them to shade & check water!`,
        key
      );
      markNotified(key);
    }
  } catch (err) {
    console.warn('[Notif] Weather check failed:', err.message);
  }
};

// ============ BUDGET ============

// 3. Monthly summary on the 1st of each month
export const checkMonthlyBudgetSummary = (expenses) => {
  const now = new Date();
  if (now.getDate() !== 1) return; // Only on the 1st

  const key = `budget-${now.getFullYear()}-${now.getMonth()}`;
  if (wasNotified(key)) return;

  // Last month range
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const lastMonthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d >= lastMonth && d <= lastMonthEnd;
  });

  if (lastMonthExpenses.length === 0) return;

  const total = lastMonthExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

  // Top category
  const byCategory = {};
  lastMonthExpenses.forEach(e => {
    byCategory[e.category] = (byCategory[e.category] || 0) + (parseFloat(e.amount) || 0);
  });
  const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

  const monthName = lastMonth.toLocaleDateString('en-US', { month: 'long' });
  sendNotification(
    `💰 ${monthName} summary`,
    `You spent €${total.toFixed(0)} in ${monthName} across ${lastMonthExpenses.length} expenses. Biggest category: ${topCategory[0]} (€${topCategory[1].toFixed(0)}).`,
    key
  );
  markNotified(key);
};

// ============ TRAVEL ============

// 4-7. Travel notifications
export const checkTravelNotifications = (travels, currentUserUid, users, getFirstName) => {
  // CRITICAL: wait until users are loaded from Firebase.
  // If we can't resolve names yet, skip entirely — dedupe keys are NOT set,
  // so the check retries on the next cycle with proper names.
  if (!users || users.length === 0) {
    console.log('[Notif] Users not loaded yet, skipping travel checks');
    return;
  }

  const now = new Date();
  const today = todayStr();
  const hour = now.getHours();

  travels.forEach(travel => {
    const userIds = travel.userIds || [travel.userId].filter(Boolean);
    
    // Couple travel = BOTH assigned (2+ people including me)
    const isCouple = userIds.length >= 2 && userIds.includes(currentUserUid);
    // Partner solo = exactly 1 person assigned, and it's NOT me
    const isPartnerOnly = userIds.length === 1 && userIds[0] !== currentUserUid;
    const isBusiness = travel.category === 'Business';

    const startsToday = travel.startDate === today;
    const endsToday = travel.endDate === today;

    // --- Partner solo business travel ---
    if (isPartnerOnly && isBusiness && (startsToday || endsToday)) {
      // Resolve the ASSIGNED person's name from the travel entry
      const partnerUid = userIds[0];
      const partnerUser = users.find(u => u.uid === partnerUid);
      
      // If we can't resolve their real name, skip (retry next cycle) — never say "You"
      if (!partnerUser?.displayName) {
        console.warn(`[Notif] Cannot resolve name for uid ${partnerUid}, skipping travel ${travel.id}`);
        return;
      }
      const partnerName = getFirstName(partnerUser.displayName);

      // Departure at 9:00
      if (startsToday && hour >= 9) {
        const key = `travel-start-${travel.id}-${today}`;
        if (!wasNotified(key)) {
          sendNotification(
            '✈️ Business trip',
            `${partnerName} is out for ${travel.location} today!`,
            key
          );
          markNotified(key);
        }
      }

      // Return at 15:00
      if (endsToday && hour >= 15) {
        const key = `travel-end-${travel.id}-${today}`;
        if (!wasNotified(key)) {
          sendNotification(
            '🏠 Coming home',
            `${partnerName} is coming back today from ${travel.location}!`,
            key
          );
          markNotified(key);
        }
      }
    }

    // --- Couple travel (both of us assigned) ---
    if (isCouple && startsToday) {
      const key = `couple-start-${travel.id}-${today}`;
      if (!wasNotified(key)) {
        sendNotification(
          '🧳 Trip time!',
          `Today you're going on a couple ${(travel.category || 'holiday').toLowerCase()} in ${travel.location}. Have fun!`,
          key
        );
        markNotified(key);
      }
    }

    if (isCouple && endsToday) {
      const key = `couple-end-${travel.id}-${today}`;
      if (!wasNotified(key)) {
        sendNotification(
          '😢 Back to reality',
          `Oh no, your couple ${(travel.category || 'holiday').toLowerCase()} is over :( Don't be so sad, you'll always have your memories!`,
          key
        );
        markNotified(key);
      }
    }
  });
};

// ============ MASTER CHECK ============

export const runAllNotificationChecks = async ({ plants, expenses, travels, currentUserUid, users, getFirstName }) => {
  console.log('[Notif] Running checks...');
  checkPlantWatering(plants);
  await checkParisTemperature(plants);
  checkMonthlyBudgetSummary(expenses);
  checkTravelNotifications(travels, currentUserUid, users, getFirstName);
};