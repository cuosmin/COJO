// Save this as: /api/plants-search.js in your COJO project root
// This proxies Perenual requests so your API key stays secret

export default async function handler(req, res) {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query required' });
  }

  const PERENUAL_KEY = process.env.PERENUAL_API_KEY;

  try {
    // Search species list
    const searchRes = await fetch(
      `https://perenual.com/api/species-list?q=${encodeURIComponent(query)}&key=${PERENUAL_KEY}`
    );
    const searchData = await searchRes.json();

    if (!searchData.data || searchData.data.length === 0) {
      return res.status(200).json({ data: [] });
    }

    // Fetch detailed info for each plant (up to 20)
    const results = await Promise.all(
      searchData.data.slice(0, 20).map(async (plant) => {
        try {
          const detailRes = await fetch(
            `https://perenual.com/api/species/details/${plant.id}?key=${PERENUAL_KEY}`
          );
          const details = await detailRes.json();

          // Extract care info
          const watering = details.watering || 'regularly';
          const wateringDays = watering.includes('daily')
            ? 1
            : watering.includes('week')
            ? 7
            : watering.includes('month')
            ? 30
            : 7;

          return {
            id: plant.id,
            name: plant.common_name || plant.scientific_name,
            scientific_name: details.scientific_name?.[0] || '',
            wateringDays,
            watering_description: watering,
            sunlight: details.sunlight || ['indirect'],
            humidity: details.humidity || 'medium',
            tempMin: details.min_temp || 15,
            tempMax: details.max_temp || 27,
            soil: details.soil || [],
            toxicity: details.poisonous_to_humans ? '⚠️ Toxic to humans' : '✓ Safe',
            toxicity_pets: details.poisonous_to_pets ? '⚠️ Toxic to pets' : '✓ Safe for pets',
            description: details.description || '',
            image_url: details.default_image?.medium_url || '',
            growth_rate: details.growth_rate || 'medium',
            hardiness: details.hardiness || [],
          };
        } catch (err) {
          console.warn(`Could not fetch details for ${plant.id}:`, err);
          return {
            id: plant.id,
            name: plant.common_name || plant.scientific_name,
            wateringDays: 7,
            humidity: 'medium',
            sunlight: ['indirect'],
            tempMin: 15,
            tempMax: 27,
          };
        }
      })
    );

    return res.status(200).json({ data: results });
  } catch (error) {
    console.error('Perenual error:', error);
    return res.status(500).json({ error: 'Failed to fetch plant data' });
  }
}
