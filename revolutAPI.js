// Revolut API integration for automatic expense tracking

const REVOLUT_API_BASE = 'https://api.revolut.com/1.0';

export class RevolutAPI {
  constructor(apiToken) {
    this.token = apiToken;
  }

  async getTransactions(from = null, to = null) {
    try {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const response = await fetch(
        `${REVOLUT_API_BASE}/transactions?${params}`,
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Revolut API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch Revolut transactions:', error);
      return null;
    }
  }

  async getAccounts() {
    try {
      const response = await fetch(`${REVOLUT_API_BASE}/accounts`, {
        headers: {
          Authorization: `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Revolut API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch Revolut accounts:', error);
      return null;
    }
  }
}

export const categorizeExpense = (description, amount) => {
  const lowerDesc = description.toLowerCase();

  if (
    lowerDesc.includes('supermarket') ||
    lowerDesc.includes('grocery') ||
    lowerDesc.includes('whole foods') ||
    lowerDesc.includes('trader joe') ||
    lowerDesc.includes('carrefour') ||
    lowerDesc.includes('aldi')
  ) {
    return 'food';
  }

  if (
    lowerDesc.includes('restaurant') ||
    lowerDesc.includes('cafe') ||
    lowerDesc.includes('pizza') ||
    lowerDesc.includes('burger') ||
    lowerDesc.includes('sushi')
  ) {
    return 'dining';
  }

  if (
    lowerDesc.includes('plant') ||
    lowerDesc.includes('garden') ||
    lowerDesc.includes('seed')
  ) {
    return 'plants';
  }

  if (lowerDesc.includes('streaming') || lowerDesc.includes('netflix')) {
    return 'entertainment';
  }

  if (
    lowerDesc.includes('pharmacy') ||
    lowerDesc.includes('beauty') ||
    lowerDesc.includes('wellness')
  ) {
    return 'health';
  }

  return 'other';
};

export const syncRevolutTransactions = async (
  revolut,
  lastSyncDate,
  onTransaction
) => {
  try {
    const transactions = await revolut.getTransactions(
      lastSyncDate ? new Date(lastSyncDate).toISOString() : null
    );

    if (!transactions || !transactions.data) {
      return { success: false, message: 'No transactions found' };
    }

    let categorized = 0;
    transactions.data.forEach((tx) => {
      const category = categorizeExpense(
        tx.description || tx.merchant?.name || '',
        Math.abs(tx.amount)
      );

      if (tx.state === 'COMPLETED' && tx.amount < 0) {
        // Only track expenses (negative amounts)
        onTransaction({
          id: tx.id,
          description: tx.description || tx.merchant?.name || 'Unknown',
          category,
          amount: Math.abs(tx.amount),
          date: tx.completed_at?.split('T')[0] || new Date().toISOString().split('T')[0],
          currency: tx.currency,
          original: tx,
        });
        categorized++;
      }
    });

    return {
      success: true,
      message: `Synced ${categorized} transactions`,
      count: categorized,
    };
  } catch (error) {
    console.error('Revolut sync error:', error);
    return { success: false, message: error.message };
  }
};

export const setupRevolutInstructions = `
To connect Revolut to auto-sync expenses:

1. Go to Revolut App → Settings → API
2. Create a Business API Token
3. Paste it in the app Settings
4. Your expenses will sync automatically

We automatically categorize:
- Supermarkets → Food
- Restaurants → Dining
- Pharmacies → Health
- And more...

You can also manually log expenses anytime.
`;
