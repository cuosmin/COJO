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

          // Extract care guides (detailed instructions)
          const careGuides = {};
          if (details.care_guides && details.care_guides.length > 0) {
            details.care_guides.forEach(guide => {
              careGuides[guide.type] = guide.description || guide.tips?.join('\n') || '';
            });
          }

          // Extract care tags (with lucide icon names for display)
          const careTags = [];
          if (details.care_tags && details.care_tags.length > 0) {
            details.care_tags.forEach(tag => {
              careTags.push({
                name: tag.name,
                // Map tag names to lucide icon names
                iconName: getLucideIconForTag(tag.name),
              });
            });
          }

          return {
            id: plant.id,
            name: plant.common_name || plant.scientific_name,
            scientific_name: details.scientific_name?.[0] || '',
            wateringDays,
            watering_description: watering,
            watering_guide: careGuides.watering || '', // Detailed watering guide
            sunlight: details.sunlight || ['indirect'],
            sunlight_guide: careGuides.sunlight || '', // Detailed sunlight guide
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
            care_guides: careGuides, // Full care guides object
            care_tags: careTags, // Tags with icons
            maintenance: details.maintenance || '',
            pruning_month: details.pruning_month || [],
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
            care_tags: [],
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

// Helper function to map care tag names to lucide icon names
function getLucideIconForTag(tagName) {
  const tagIcons = {
    'water': 'Droplet',
    'watering': 'Droplet',
    'sun': 'Sun',
    'sunlight': 'Sun',
    'bright': 'Sun',
    'indirect': 'Cloud',
    'shade': 'Moon',
    'flower': 'Flower',
    'blooms': 'Flower',
    'fragrant': 'Wind',
    'smell': 'Wind',
    'pet': 'Heart',
    'pets': 'Heart',
    'toxic': 'AlertTriangle',
    'poisonous': 'AlertTriangle',
    'indoor': 'Home',
    'outdoor': 'Leaf',
    'climbing': 'TrendingUp',
    'vine': 'TrendingUp',
    'bush': 'Trees',
    'tree': 'Trees',
    'succulent': 'Cactus',
    'cactus': 'Cactus',
    'annual': 'Calendar',
    'perennial': 'Repeat',
    'air purifying': 'Wind',
    'low maintenance': 'Zap',
    'beginner': 'Smile',
  };

  const normalizedTag = tagName.toLowerCase();
  for (const [key, iconName] of Object.entries(tagIcons)) {
    if (normalizedTag.includes(key)) {
      return iconName;
    }
  }
  return 'Sparkles'; // Default icon
}