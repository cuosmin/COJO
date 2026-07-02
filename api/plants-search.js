// Save this as: /api/plants-search.js in your COJO project root
// This proxies Perenual requests so your API key stays secret
//
// TWO MODES (keeps Perenual's 100 req/day free quota safe):
//   1. ?query=lavender  → 1 API call, fast list of matches
//   2. ?id=123          → 2 API calls, full details + care guides for ONE plant

export default async function handler(req, res) {
  const { query, id } = req.query;
  const PERENUAL_KEY = process.env.PERENUAL_API_KEY;

  // ============ MODE 2: DETAILS FOR ONE PLANT ============
  if (id) {
    try {
      console.log(`[API] Fetching details for plant ${id}`);
      
      const detailRes = await fetch(
        `https://perenual.com/api/v2/species/details/${id}?key=${PERENUAL_KEY}`
      );
      
      if (!detailRes.ok) {
        const errText = await detailRes.text();
        console.error(`[API] Details failed: ${detailRes.status}`, errText);
        return res.status(detailRes.status).json({ 
          error: detailRes.status === 429 
            ? 'Perenual daily limit reached (100/day on free tier). Try again tomorrow.' 
            : `Details fetch failed: ${detailRes.status}` 
        });
      }
      
      const details = await detailRes.json();

      // Fetch care guides (1 extra call)
      let guideData = {};
      try {
        const guideRes = await fetch(
          `https://perenual.com/api/species-care-guide-list?species_id=${id}&key=${PERENUAL_KEY}`
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
        console.warn(`[API] Guides failed for ${id}:`, err.message);
      }

      // Watering interval
      const watering = details.watering || '';
      let wateringDays = 7;
      const w = watering.toLowerCase();
      if (w.includes('frequent')) wateringDays = 3;
      else if (w.includes('average')) wateringDays = 7;
      else if (w.includes('minimum')) wateringDays = 14;
      else if (w.includes('none')) wateringDays = 30;

      const result = {
        id: details.id,
        name: details.common_name || 'Unknown',
        scientific_name: Array.isArray(details.scientific_name)
          ? details.scientific_name[0]
          : details.scientific_name || '',
        wateringDays,
        
        // The 6 Quick Info fields
        sunlight: details.sunlight || [],
        watering: details.watering || '',
        maintenance: details.maintenance || '',
        growth_rate: details.growth_rate || '',
        care_level: details.care_level || '',
        cycle: details.cycle || '',
        
        // Guides
        watering_guide: guideData.watering || '',
        sunlight_guide: guideData.sunlight || '',
        pruning_guide: guideData.pruning || '',
        care_guides: guideData,
        
        // Extras
        description: details.description || '',
        image_url: details.default_image?.medium_url || '',
        toxicity: details.poisonous_to_humans ? '⚠️ Toxic to humans' : '✓ Safe',
        toxicity_pets: details.poisonous_to_pets ? '⚠️ Toxic to pets' : '✓ Safe for pets',
        care_tags: (details.care_tags || []).map(tag => ({
          name: tag.name,
          iconName: getLucideIconForTag(tag.name),
        })),
      };

      console.log(`[API] Details OK for ${id}: cycle=${result.cycle}, care_level=${result.care_level}, guides=${Object.keys(guideData).join(',')}`);
      return res.status(200).json({ data: result });
    } catch (error) {
      console.error('[API] Details fatal error:', error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  // ============ MODE 1: FAST SEARCH (1 call only) ============
  if (!query) {
    return res.status(400).json({ error: 'Query or id required' });
  }

  try {
    console.log(`[API] Searching: ${query}`);
    
    const searchRes = await fetch(
      `https://perenual.com/api/v2/species-list?q=${encodeURIComponent(query)}&key=${PERENUAL_KEY}`
    );
    
    if (!searchRes.ok) {
      const errText = await searchRes.text();
      console.error(`[API] Search failed: ${searchRes.status}`, errText);
      return res.status(searchRes.status).json({ 
        error: searchRes.status === 429 
          ? 'Perenual daily limit reached (100/day on free tier). Try again tomorrow.' 
          : `Search failed: ${searchRes.status}` 
      });
    }
    
    const searchData = await searchRes.json();
    console.log(`[API] Found ${searchData.data?.length || 0} results`);

    if (!searchData.data || searchData.data.length === 0) {
      return res.status(200).json({ data: [] });
    }

    // Return lightweight list - NO extra API calls
    const results = searchData.data.slice(0, 10).map(plant => ({
      id: plant.id,
      name: plant.common_name || 'Unknown',
      scientific_name: Array.isArray(plant.scientific_name)
        ? plant.scientific_name[0]
        : plant.scientific_name || '',
      image_url: plant.default_image?.thumbnail || plant.default_image?.medium_url || '',
    }));

    return res.status(200).json({ data: results });
  } catch (error) {
    console.error('[API] Search fatal error:', error.message);
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