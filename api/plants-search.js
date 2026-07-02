// Save this as: /api/plants-search.js in your COJO project root
// This proxies Perenual requests so your API key stays secret

export default async function handler(req, res) {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query required' });
  }

  const PERENUAL_KEY = process.env.PERENUAL_API_KEY;

  try {
    // Search species list - use v2 endpoint
    const searchRes = await fetch(
      `https://perenual.com/api/v2/species-list?q=${encodeURIComponent(query)}&key=${PERENUAL_KEY}`
    );
    const searchData = await searchRes.json();

    if (!searchData.data || searchData.data.length === 0) {
      return res.status(200).json({ data: [] });
    }

    // Fetch detailed info for each plant (up to 20)
    const results = await Promise.all(
      searchData.data.slice(0, 20).map(async (plant) => {
        try {
          // Fetch species details - use v2 endpoint
          const detailRes = await fetch(
            `https://perenual.com/api/v2/species/details/${plant.id}?key=${PERENUAL_KEY}`
          );
          const details = await detailRes.json();

          // FETCH CARE GUIDES - try the correct endpoint
          let guideData = {};
          try {
            const guideRes = await fetch(
              `https://perenual.com/api/species-care-guide-list?species_id=${plant.id}&key=${PERENUAL_KEY}`
            );
            const guideResponse = await guideRes.json();
            
            console.log(`Guide response for ${plant.id}:`, guideResponse);
            
            // Extract guides by type from the correct structure
            if (guideResponse.data && Array.isArray(guideResponse.data)) {
              guideResponse.data.forEach(guide => {
                if (guide.section && Array.isArray(guide.section)) {
                  guide.section.forEach(section => {
                    guideData[section.type?.toLowerCase()] = section.description || '';
                  });
                }
              });
            }
          } catch (err) {
            console.warn(`Could not fetch guides for ${plant.id}:`, err.message);
          }

          // Extract care info
          const watering = details.watering || 'regularly';
          const wateringDays = watering.includes('daily')
            ? 1
            : watering.includes('week')
            ? 7
            : watering.includes('month')
            ? 30
            : 7;

          // Extract all relevant home-growing details
          const careGuides = guideData;

          // Extract care tags (with lucide icon names for display)
          const careTags = [];
          if (details.care_tags && details.care_tags.length > 0) {
            details.care_tags.forEach(tag => {
              careTags.push({
                name: tag.name,
                iconName: getLucideIconForTag(tag.name),
              });
            });
          }

          console.log(`Plant ${plant.id} (${plant.common_name}):`, {
            guides: Object.keys(careGuides),
            tags: careTags.length,
            sunlight: details.sunlight,
            cycle: details.cycle,
            maintenance: details.maintenance,
          });

          return {
            id: plant.id,
            name: plant.common_name || plant.scientific_name?.[0] || 'Unknown',
            scientific_name: (Array.isArray(details.scientific_name) ? details.scientific_name[0] : details.scientific_name) || '',
            wateringDays,
            watering_description: watering,
            watering_guide: careGuides.watering || '',
            sunlight: details.sunlight || ['indirect'],
            sunlight_guide: careGuides.sunlight || '',
            pruning_guide: careGuides.pruning || '',
            
            // Home-growing relevant details
            cycle: details.cycle || '',
            maintenance: details.maintenance || '',
            care_level: details.care_level || '',
            growth_rate: details.growth_rate || '',
            drought_tolerant: details.drought_tolerant === 1,
            salt_tolerant: details.salt_tolerant === 1,
            indoor: details.indoor === 1,
            flowers: details.flowers === 1,
            flowering_season: details.flowering_season || '',
            
            // Hardiness
            hardiness: details.hardiness || {},
            
            // Soil info
            soil: details.soil || [],
            
            // Safety
            toxicity: details.poisonous_to_humans ? '⚠️ Toxic to humans' : '✓ Safe',
            toxicity_pets: details.poisonous_to_pets ? '⚠️ Toxic to pets' : '✓ Safe for pets',
            
            // Description
            description: details.description || '',
            image_url: details.default_image?.medium_url || '',
            
            // All guides
            care_guides: careGuides,
            care_tags: careTags,
          };
        } catch (err) {
          console.error(`Error fetching details for ${plant.id}:`, err.message);
          return {
            id: plant.id,
            name: plant.common_name || 'Unknown',
            wateringDays: 7,
            sunlight: ['indirect'],
            care_tags: [],
            care_guides: {},
          };
        }
      })
    );

    return res.status(200).json({ data: results });
  } catch (error) {
    console.error('Perenual API error:', error);
    return res.status(500).json({ error: 'Failed to fetch plant data' });
  }
}

// Helper function to map care tag names to lucide icon names
function getLucideIconForTag(tagName) {
  const tagIcons = {
    'water': 'droplet',
    'watering': 'droplet',
    'sun': 'sun',
    'sunlight': 'sun',
    'bright': 'sun',
    'indirect': 'cloud',
    'shade': 'moon',
    'flower': 'flower',
    'blooms': 'flower',
    'fragrant': 'wind',
    'smell': 'wind',
    'pet': 'heart',
    'pets': 'heart',
    'toxic': 'alert-triangle',
    'poisonous': 'alert-triangle',
    'indoor': 'home',
    'outdoor': 'leaf',
    'climbing': 'leaf',
    'vine': 'leaf',
    'bush': 'leaf',
    'tree': 'leaf',
    'succulent': 'leaf',
    'cactus': 'leaf',
    'annual': 'calendar',
    'perennial': 'repeat',
    'air purifying': 'wind',
    'low maintenance': 'zap',
    'beginner': 'smile',
  };

  const normalizedTag = tagName.toLowerCase();
  for (const [key, iconName] of Object.entries(tagIcons)) {
    if (normalizedTag.includes(key)) {
      return iconName;
    }
  }
  return 'sparkles'; // Default icon
}