// Analytics utilities for insights and trends

export const calculateSpendingTrends = (expenses, days = 30) => {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const filteredExpenses = expenses.filter((e) => {
    const expenseDate = new Date(e.date);
    return expenseDate >= startDate && expenseDate <= now;
  });

  const dailySpending = {};
  filteredExpenses.forEach((e) => {
    const date = e.date;
    dailySpending[date] = (dailySpending[date] || 0) + (e.amount || 0);
  });

  const spendingByCategory = {};
  filteredExpenses.forEach((e) => {
    const category = e.category || 'other';
    spendingByCategory[category] = (spendingByCategory[category] || 0) + (e.amount || 0);
  });

  return {
    total: filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
    average: filteredExpenses.length > 0
      ? filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0) / filteredExpenses.length
      : 0,
    daily: dailySpending,
    byCategory: spendingByCategory,
    count: filteredExpenses.length,
  };
};

export const calculateIntimacyInsights = (intimacy) => {
  const completed = intimacy.filter((i) => i.completed);
  const thisMonth = completed.filter((i) => {
    const eventDate = new Date(i.scheduledDate);
    const now = new Date();
    return (
      eventDate.getMonth() === now.getMonth() &&
      eventDate.getFullYear() === now.getFullYear()
    );
  });

  const thisWeek = completed.filter((i) => {
    const eventDate = new Date(i.scheduledDate);
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return eventDate >= weekAgo && eventDate <= now;
  });

  const moods = {};
  completed.forEach((i) => {
    const mood = i.mood || 'neutral';
    moods[mood] = (moods[mood] || 0) + 1;
  });

  const frequency = thisMonth.length > 0 ? thisMonth.length : 'Not tracked yet';

  return {
    total: completed.length,
    thisMonth: thisMonth.length,
    thisWeek: thisWeek.length,
    frequency,
    moodBreakdown: moods,
    averageMood: calculateAverageMood(moods),
  };
};

const calculateAverageMood = (moods) => {
  const moodValues = { amazing: 5, great: 4, good: 3, neutral: 2, low: 1 };
  let totalScore = 0;
  let totalCount = 0;

  Object.entries(moods).forEach(([mood, count]) => {
    totalScore += (moodValues[mood] || 0) * count;
    totalCount += count;
  });

  return totalCount > 0 ? (totalScore / totalCount).toFixed(1) : 0;
};

export const calculatePlantHealth = (plants) => {
  const healthyPlants = plants.filter((p) => p.healthLevel > 75).length;
  const needsAttention = plants.filter((p) => p.healthLevel <= 50).length;

  return {
    total: plants.length,
    healthy: healthyPlants,
    needsAttention,
    healthPercentage:
      plants.length > 0
        ? Math.round(
          plants.reduce((sum, p) => sum + p.healthLevel, 0) / plants.length
        )
        : 0,
    plants: plants.map((p) => ({
      name: p.name,
      health: p.healthLevel,
      daysWatered: getDaysSinceWatered(p.lastWatered),
      status:
        p.healthLevel > 75
          ? 'Thriving'
          : p.healthLevel > 50
          ? 'Good'
          : 'Needs care',
    })),
  };
};

export const getDaysSinceWatered = (lastWatered) => {
  const last = new Date(lastWatered);
  const now = new Date();
  return Math.floor((now - last) / (1000 * 60 * 60 * 24));
};

export const generateWeeklyInsight = (plants, expenses, intimacy, meals) => {
  const plantHealth = calculatePlantHealth(plants);
  const spending = calculateSpendingTrends(expenses, 7);
  const intimacyStats = calculateIntimacyInsights(intimacy);

  return {
    title: '📊 This Week\'s Snapshot',
    sections: [
      {
        icon: '🌿',
        title: 'Plant Health',
        message:
          plantHealth.healthy === plantHealth.total
            ? `All ${plantHealth.total} plants are thriving! 🎉`
            : `${plantHealth.needsAttention} plant${plantHealth.needsAttention !== 1 ? 's' : ''} need care`,
        metric: `${plantHealth.healthPercentage}% average health`,
      },
      {
        icon: '💰',
        title: 'Spending',
        message: `You spent €${spending.total.toFixed(2)} this week`,
        metric: `€${spending.average.toFixed(2)} per transaction`,
      },
      {
        icon: '💕',
        title: 'Intimacy',
        message:
          intimacyStats.thisWeek > 0
            ? `${intimacyStats.thisWeek} quality moments this week 💕`
            : 'Schedule some time together this week',
        metric:
          intimacyStats.thisMonth > 0
            ? `${intimacyStats.thisMonth}x this month`
            : 'Not tracked yet',
      },
      {
        icon: '🍽️',
        title: 'Meals',
        message: `${meals.length} meals planned`,
        metric: `${meals.filter((m) => m.shoppingNeeded).length} need shopping`,
      },
    ],
  };
};

export const generateMoodTrend = (intimacy) => {
  const last30Days = intimacy
    .filter((i) => {
      const eventDate = new Date(i.scheduledDate);
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return eventDate >= thirtyDaysAgo && eventDate <= now;
    })
    .sort((a, b) => new Date(a.scheduledDate) - new Date(b.scheduledDate));

  return last30Days.map((i) => ({
    date: i.scheduledDate,
    mood: i.mood || 'neutral',
    title: i.title,
  }));
};
