// Push notification utilities using browser Notification API

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  return false;
};

export const notifyPlantWatering = (plantName) => {
  if (Notification.permission === 'granted') {
    new Notification('Time to Water! 💧', {
      body: `${plantName} needs watering today`,
      icon: '🌿',
      badge: '🌿',
      tag: `plant-${plantName}`,
      requireInteraction: false,
    });
  }
};

export const notifyMealPlanned = (mealName, date) => {
  if (Notification.permission === 'granted') {
    new Notification('Meal Planned! 🍽️', {
      body: `${mealName} is planned for ${date}`,
      icon: '🍽️',
      badge: '🍽️',
      tag: `meal-${mealName}`,
    });
  }
};

export const notifyIntimacyReminder = (title) => {
  if (Notification.permission === 'granted') {
    new Notification('Special Time Reminder 💕', {
      body: title,
      icon: '💕',
      badge: '💕',
      tag: 'intimacy-reminder',
      requireInteraction: true,
    });
  }
};

export const notifyExpenseLogged = (description, amount) => {
  if (Notification.permission === 'granted') {
    new Notification('Expense Tracked', {
      body: `${description}: €${amount.toFixed(2)}`,
      icon: '💰',
      badge: '💰',
      tag: 'expense',
    });
  }
};

export const notifyTravelMealSynced = (mealName) => {
  if (Notification.permission === 'granted') {
    new Notification('Travel Meal Synced! ✈️', {
      body: `Recipe for ${mealName} has been synced`,
      icon: '✈️',
      badge: '✈️',
      tag: `travel-${mealName}`,
    });
  }
};

export const setupNotificationScheduler = (plants, expenses, intimacy) => {
  // Check plant watering every hour
  setInterval(() => {
    plants.forEach((plant) => {
      const lastWatered = new Date(plant.lastWatered);
      const now = new Date();
      const daysSince = Math.floor((now - lastWatered) / (1000 * 60 * 60 * 24));

      if (daysSince >= plant.wateringFreqDays - 1) {
        // Send notification only once per day
        const lastNotifKey = `notif-${plant.id}`;
        const lastNotifDate = localStorage.getItem(lastNotifKey);
        const today = new Date().toISOString().split('T')[0];

        if (lastNotifDate !== today) {
          notifyPlantWatering(plant.name);
          localStorage.setItem(lastNotifKey, today);
        }
      }
    });
  }, 60 * 60 * 1000); // Every hour

  // Check intimacy reminders daily
  setInterval(() => {
    intimacy.forEach((event) => {
      if (!event.completed) {
        const eventDate = new Date(event.scheduledDate);
        const today = new Date();

        if (
          eventDate.toDateString() === today.toDateString() &&
          Notification.permission === 'granted'
        ) {
          // Send at 9 AM only once
          const hour = today.getHours();
          if (hour === 9) {
            const lastNotifKey = `intimacy-notif-${event.id}`;
            const lastNotifTime = localStorage.getItem(lastNotifKey);
            const now = Date.now();

            if (!lastNotifTime || now - parseInt(lastNotifTime) > 24 * 60 * 60 * 1000) {
              notifyIntimacyReminder(event.title);
              localStorage.setItem(lastNotifKey, now.toString());
            }
          }
        }
      }
    });
  }, 60 * 60 * 1000); // Every hour
};

export const notificationInstructions = `
Browser Notifications Setup:

1. When you see the prompt, click "Allow"
2. Notifications will alert you for:
   - 💧 Plants needing water
   - 🍽️ Meal plans coming up
   - 💕 Intimacy reminders
   - 💰 Shared expenses

You can disable anytime in browser settings.
`;
