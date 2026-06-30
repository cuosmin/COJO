// Email digest utilities for weekly summaries

export const generateWeeklyEmailHTML = (
  plants,
  expenses,
  intimacy,
  meals,
  weekStart
) => {
  const plantHealth = calculatePlantHealth(plants);
  const spending = calculateSpendingTrends(expenses, 7);
  const intimacyStats = calculateIntimacyInsights(intimacy);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f7;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #007aff 0%, #0a66d2 100%);
            color: white;
            padding: 40px 20px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
          }
          .header p {
            margin: 8px 0 0;
            opacity: 0.9;
            font-size: 14px;
          }
          .content {
            padding: 40px 20px;
          }
          .section {
            margin-bottom: 32px;
          }
          .section-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .stat {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e5e5e7;
          }
          .stat:last-child {
            border-bottom: none;
          }
          .stat-label {
            color: #666;
            font-size: 14px;
          }
          .stat-value {
            font-size: 18px;
            font-weight: 600;
            color: #007aff;
          }
          .highlight {
            background: #f5f5f7;
            border-left: 4px solid #007aff;
            padding: 12px 16px;
            border-radius: 8px;
            margin-top: 16px;
            font-size: 14px;
            line-height: 1.6;
          }
          .button {
            display: inline-block;
            background: #007aff;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 500;
            margin-top: 16px;
          }
          .footer {
            background: #f5f5f7;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #888;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Our Shared Life 💕</h1>
            <p>Weekly Summary • ${formatDate(weekStart)}</p>
          </div>

          <div class="content">
            <div class="section">
              <div class="section-title">🌿 Plant Health</div>
              <div class="stat">
                <span class="stat-label">Total Plants</span>
                <span class="stat-value">${plantHealth.total}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Healthy</span>
                <span class="stat-value">${plantHealth.healthy}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Average Health</span>
                <span class="stat-value">${plantHealth.healthPercentage}%</span>
              </div>
              ${
                plantHealth.needsAttention > 0
                  ? `<div class="highlight">
                  ⚠️ ${plantHealth.needsAttention} plant${plantHealth.needsAttention !== 1 ? 's' : ''} need${plantHealth.needsAttention !== 1 ? '' : 's'} attention
                </div>`
                  : ''
              }
            </div>

            <div class="section">
              <div class="section-title">💰 Spending</div>
              <div class="stat">
                <span class="stat-label">This Week</span>
                <span class="stat-value">€${spending.total.toFixed(2)}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Average Transaction</span>
                <span class="stat-value">€${spending.average.toFixed(2)}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Transactions</span>
                <span class="stat-value">${spending.count}</span>
              </div>
              ${
                Object.keys(spending.byCategory).length > 0
                  ? `<div class="highlight">
                  Top spending: ${Object.entries(spending.byCategory)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 1)
                    .map(
                      ([cat, amt]) =>
                        `${capitalize(cat)} (€${amt.toFixed(2)})`
                    )
                    .join(', ')}
                </div>`
                  : ''
              }
            </div>

            <div class="section">
              <div class="section-title">💕 Intimacy</div>
              <div class="stat">
                <span class="stat-label">This Week</span>
                <span class="stat-value">${intimacyStats.thisWeek}</span>
              </div>
              <div class="stat">
                <span class="stat-label">This Month</span>
                <span class="stat-value">${intimacyStats.thisMonth}</span>
              </div>
              ${
                Object.keys(intimacyStats.moodBreakdown).length > 0
                  ? `<div class="highlight">
                  Average mood: ${getEmojiForMood(intimacyStats.averageMood)} ${intimacyStats.averageMood}/5
                </div>`
                  : ''
              }
            </div>

            <div class="section">
              <div class="section-title">🍽️ Meals</div>
              <div class="stat">
                <span class="stat-label">Planned</span>
                <span class="stat-value">${meals.length}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Needs Shopping</span>
                <span class="stat-value">${meals.filter((m) => m.shoppingNeeded).length}</span>
              </div>
            </div>

            <div style="text-align: center; margin-top: 32px;">
              <a href="https://shared-life-dashboard.vercel.app" class="button">
                Update on Dashboard
              </a>
            </div>
          </div>

          <div class="footer">
            <p>💌 A weekly digest of your shared life. Sent every Sunday.</p>
            <p style="margin-top: 8px;">
              <a href="#" style="color: #007aff; text-decoration: none;">
                Unsubscribe
              </a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const formatDate = (date) => {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

const getEmojiForMood = (score) => {
  if (score >= 4.5) return '🤩';
  if (score >= 4) return '😍';
  if (score >= 3) return '😊';
  if (score >= 2) return '😐';
  return '😔';
};

const calculatePlantHealth = (plants) => {
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
  };
};

const calculateSpendingTrends = (expenses, days = 7) => {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const filteredExpenses = expenses.filter((e) => {
    const expenseDate = new Date(e.date);
    return expenseDate >= startDate && expenseDate <= now;
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
    byCategory: spendingByCategory,
    count: filteredExpenses.length,
  };
};

const calculateIntimacyInsights = (intimacy) => {
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

  const moodValues = { amazing: 5, great: 4, good: 3, neutral: 2, low: 1 };
  let totalScore = 0;
  let totalCount = 0;
  Object.entries(moods).forEach(([mood, count]) => {
    totalScore += (moodValues[mood] || 0) * count;
    totalCount += count;
  });
  const averageMood = totalCount > 0 ? (totalScore / totalCount).toFixed(1) : 0;

  return {
    total: completed.length,
    thisMonth: thisMonth.length,
    thisWeek: thisWeek.length,
    moodBreakdown: moods,
    averageMood,
  };
};

export const sendWeeklyEmail = async (userEmail, emailHTML) => {
  // This would integrate with an email service like Sendgrid, Mailgun, or Resend
  // For now, we provide a manual setup guide

  console.log('Weekly email generated for:', userEmail);
  console.log('Email content:', emailHTML);

  return {
    success: true,
    message: 'Email digest generated. Integrate with an email service to auto-send.',
  };
};

export const setupEmailInstructions = `
To enable automatic weekly emails:

1. Sign up for Resend, Mailgun, or SendGrid
2. Get your API key
3. Add it to the app Settings
4. Weekly digests will email both of you every Sunday

Or manually generate and share the digest PDF with your partner.
`;
