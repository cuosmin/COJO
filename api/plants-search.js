// Save this as: /api/plants-search.js in your COJO project root
// This proxies Perenual requests so your API key stays secret

export default async function handler(req, res) {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query required' });
  }

  const PERENUAL_KEY = process.env.PERENUAL_API_KEY;

  try {
    console.log(`[API] Searching for: ${query}`);
    
    // Search species list
    const searchRes = await fetch(
      `https://perenual.com/api/v2/species-list?q=${encodeURIComponent(query)}&key=${PERENUAL_KEY}`
    );
    
    if (!searchRes.ok) {
      console.error(`[API] Search failed: ${searchRes.status}`);
      return res.status(searchRes.status).json({ error: 'Search failed' });
    }
    
    const searchData = await searchRes.json();
    console.log(`[API] Found ${searchData.data?.length || 0} results`);

    if (!searchData.data || searchData.data.length === 0) {
      return res.status(200).json({ data: [] });
    }

    // Fetch detailed info for each plant (up to 20)
    const results = await Promise.all(
      searchData.data.slice(0, 20).map(async (plant) => {
        try {
          console.log(`[API] Fetching details for ${plant.id}...`);
          
          // Fetch species details
          const detailRes = await fetch(
            `https://perenual.com/api/v2/species/details/${plant.id}?key=${PERENUAL_KEY}`
          );
          
          if (!detailRes.ok) {
            console.warn(`[API] Details failed for ${plant.id}: ${detailRes.status}`);
            return null;
          }
          
          const details = await detailRes.json();
          console.log(`[API] Details for ${plant.id}:`, {
            cycle: details.cycle,
            hardiness: details.hardiness,
            sunlight: details.sunlight,
            watering: details.watering,
            maintenance: details.maintenance,
            growth_rate: details.growth_rate,
            care_level: details.care_level,
          });

          // Fetch care guides
          let guideData = {};
          try {
            const guideRes = await fetch(
              `https://perenual.com/api/species-care-guide-list?species_id=${plant.id}&key=${PERENUAL_KEY}`
            );
            
            if (guideRes.ok) {
              const guideResponse = await guideRes.json();
              if (guideResponse.data && Array.isArray(guideResponse.data)) {
                guideResponse.data.forEach(guide => {
                  if (guide.section && Array.isArray(guide.section)) {
                    guide.section.forEach(section => {
                      guideData[section.type?.toLowerCase()] = section.description || '';
                    });
                  }
                });
              }
            }
          } catch (err) {
            console.warn(`[API] Guides failed for ${plant.id}`);
          }

          // Calculate watering days from watering description
          const watering = details.watering || 'regularly';
          let wateringDays = 7;
          if (watering.toLowerCase().includes('daily')) wateringDays = 1;
          else if (watering.toLowerCase().includes('weekly')) wateringDays = 7;
          else if (watering.toLowerCase().includes('biweekly')) wateringDays = 14;
          else if (watering.toLowerCase().includes('monthly')) wateringDays = 30;

          // Map care tags
          const careTags = [];
          if (details.care_tags && Array.isArray(details.care_tags)) {
            details.care_tags.forEach(tag => {
              careTags.push({
                name: tag.name,
                iconName: getLucideIconForTag(tag.name),
              });
            });
          }

          const result = {
            // Basic info
            id: plant.id,
            name: plant.common_name || 'Unknown',
            scientific_name: Array.isArray(details.scientific_name) 
              ? details.scientific_name[0] 
              : details.scientific_name || '',
            
            // Watering
            wateringDays,
            watering: details.watering || '',
            watering_guide: guideData.watering || '',
            
            // Sunlight
            sunlight: details.sunlight || 'indirect',
            sunlight_guide: guideData.sunlight || '',
            
            // EXACT data from Perenual - Home growing relevant
            cycle: details.cycle || '',
            hardiness: details.hardiness || {},
            sun: details.sun || '',
            maintenance: details.maintenance || '',
            care_level: details.care_level || '',
            growth_rate: details.growth_rate || '',
            flowers: details.flowers === 1,
            flowering_season: details.flowering_season || '',
            fruits: details.fruits === 1,
            leaf: details.leaf === 1,
            
            // Tolerances
            drought_tolerant: details.drought_tolerant === 1,
            salt_tolerant: details.salt_tolerant === 1,
            
            // Safety
            toxicity: details.poisonous_to_humans ? '⚠️ Toxic to humans' : '✓ Safe',
            toxicity_pets: details.poisonous_to_pets ? '⚠️ Toxic to pets' : '✓ Safe for pets',
            
            // Other
            soil: details.soil || [],
            description: details.description || '',
            image_url: details.default_image?.medium_url || '',
            
            // Guides & tags
            care_guides: guideData,
            care_tags: careTags,
          };

          console.log(`[API] Returning plant ${plant.id} with data:`, result);
          return result;
        } catch (err) {
          console.error(`[API] Error processing ${plant.id}:`, err.message);
          return null;
        }
      })
    );

    // Filter out null results
    const validResults = results.filter(r => r !== null);
    console.log(`[API] Returning ${validResults.length} valid plants`);
    
    return res.status(200).json({ data: validResults });
  } catch (error) {
    console.error('[API] Fatal error:', error.message);
    return res.status(500).json({ error: error.message });
  }
}

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
  return 'sparkles';
}