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
          // Fetch species details
          const detailRes = await fetch(
            `https://perenual.com/api/species/details/${plant.id}?key=${PERENUAL_KEY}`
          );
          const details = await detailRes.json();

          // FETCH CARE GUIDES from correct endpoint
          let guideData = {};
          try {
            const guideRes = await fetch(
              `https://perenual.com/api/species-care-guide-list?species_id=${plant.id}&key=${PERENUAL_KEY}`
            );
            const guideResponse = await guideRes.json();
            
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

          // Extract temperature from xTemperatureTolence or other fields
          let tempMin = 15;
          let tempMax = 27;
          if (details.xTemperatureTolence && Array.isArray(details.xTemperatureTolence)) {
            // Try to parse temperature ranges from array
            const tempStr = details.xTemperatureTolence.join(' ');
            const matches = tempStr.match(/(\d+)\s*[-–]\s*(\d+)/);
            if (matches) {
              tempMin = parseInt(matches[1]);
              tempMax = parseInt(matches[2]);
            }
          }

          // Extract care guides from details.care_guides if it's a string
          const careGuides = {};
          if (details.care_guides && typeof details.care_guides === 'string') {
            // If it's a string, use it as general care guide
            careGuides.general = details.care_guides;
          }
          
          // Merge with fetched guides (API guides take priority)
          const finalGuides = {
            ...careGuides,
            ...guideData,
          };

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
          
          console.log(`Plant ${plant.id} (${plant.common_name}): ${careTags.length} tags, ${Object.keys(finalGuides).length} guides`);

          return {
            id: plant.id,
            name: plant.common_name || plant.scientific_name?.[0] || 'Unknown',
            scientific_name: details.scientific_name?.[0] || '',
            wateringDays,
            watering_description: watering,
            watering_guide: finalGuides.watering || '', 
            sunlight: details.sunlight || ['indirect'],
            sunlight_guide: finalGuides.sunlight || '',
            humidity: details.watering_general_benchmark?.value || 'medium',
            tempMin,
            tempMax,
            soil: details.soil || [],
            toxicity: details.poisonous_to_humans ? '⚠️ Toxic to humans' : '✓ Safe',
            toxicity_pets: details.poisonous_to_pets ? '⚠️ Toxic to pets' : '✓ Safe for pets',
            description: details.description || '',
            image_url: details.default_image?.medium_url || '',
            growth_rate: details.growth_rate || 'medium',
            hardiness: details.hardiness || {},
            care_guides: finalGuides,
            care_tags: careTags,
            maintenance: details.maintenance || '',
            pruning_month: details.pruning_month || [],
          };
        } catch (err) {
          console.warn(`Could not fetch details for ${plant.id}:`, err.message);
          return {
            id: plant.id,
            name: plant.common_name || plant.scientific_name?.[0] || 'Unknown',
            wateringDays: 7,
            humidity: 'medium',
            sunlight: ['indirect'],
            tempMin: 15,
            tempMax: 27,
            care_tags: [],
            care_guides: {},
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