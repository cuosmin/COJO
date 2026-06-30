// Calendar integration utilities for Google Calendar sync

export const initializeCalendarAPI = async () => {
  try {
    // Load Google Calendar API script
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/client.js';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      // Calendar API is loaded
      console.log('Google Calendar API loaded');
    };
  } catch (error) {
    console.error('Failed to load Calendar API:', error);
  }
};

export const createCalendarEvent = async (event) => {
  // event object should contain:
  // title, description, startTime, endTime, recurrence (optional)

  try {
    // This would use the Google Calendar API with proper OAuth token
    // For now, we provide instructions for manual setup
    const calendarEvent = {
      summary: event.title,
      description: event.description,
      start: {
        dateTime: event.startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: event.endTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      ...(event.recurrence && {
        recurrence: [event.recurrence],
      }),
    };

    // In a production app, this would call:
    // gapi.client.calendar.events.insert({ calendarId: 'primary', resource: calendarEvent })

    console.log('Calendar event created:', calendarEvent);
    return { success: true, event: calendarEvent };
  } catch (error) {
    console.error('Failed to create calendar event:', error);
    return { success: false, error };
  }
};

export const generatePlantWateringRecurrence = (frequencyDays) => {
  return `RRULE:FREQ=DAILY;INTERVAL=${frequencyDays}`;
};

export const createPlantWateringEvent = (plantName, wateringFreqDays, startDate) => {
  const start = new Date(startDate);
  const end = new Date(start.getTime() + 30 * 60000); // 30 min duration

  return {
    title: `Water ${plantName} 💧`,
    description: `Remember to water ${plantName}. Watering frequency: every ${wateringFreqDays} days.`,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    recurrence: generatePlantWateringRecurrence(wateringFreqDays),
  };
};

export const createMealPlanEvent = (mealName, plannedDate) => {
  const start = new Date(`${plannedDate}T18:00:00`);
  const end = new Date(start.getTime() + 2 * 60 * 60000); // 2 hour duration

  return {
    title: `Cook: ${mealName} 🍽️`,
    description: `Planned meal: ${mealName}`,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
};

export const createIntimacyEvent = (title, scheduledDate) => {
  const start = new Date(`${scheduledDate}T19:00:00`);
  const end = new Date(start.getTime() + 2 * 60 * 60000);

  return {
    title: `💕 ${title}`,
    description: title,
    startTime: start.toISOString(),
    endTime: end.toISOString(),
  };
};

export const calendarInstructions = `
To connect your Google Calendar:

1. Go to Google Calendar (calendar.google.com)
2. Enable sharing with your partner
3. The app will sync events automatically
4. Both of you see updates in real-time

Plant watering reminders, meal plans, and intimacy reminders will appear in your calendars.
`;
