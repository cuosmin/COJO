// Photo journal utilities for tracking plant progress

export const initializePhotoStorage = () => {
  // Initialize IndexedDB for efficient local photo storage
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SharedLifePhotos', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('photos')) {
        const store = db.createObjectStore('photos', { keyPath: 'id', autoIncrement: true });
        store.createIndex('plantId', 'plantId', { unique: false });
        store.createIndex('date', 'date', { unique: false });
      }
    };
  });
};

export const savePhotoToStorage = async (plantId, photoData, date = new Date()) => {
  try {
    const db = await initializePhotoStorage();
    const transaction = db.transaction(['photos'], 'readwrite');
    const store = transaction.objectStore('photos');

    const photo = {
      plantId,
      data: photoData, // Base64 encoded
      date: date.toISOString(),
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const request = store.add(photo);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  } catch (error) {
    console.error('Failed to save photo:', error);
    return null;
  }
};

export const getPlantPhotos = async (plantId) => {
  try {
    const db = await initializePhotoStorage();
    const transaction = db.transaction(['photos'], 'readonly');
    const store = transaction.objectStore('photos');
    const index = store.index('plantId');

    return new Promise((resolve, reject) => {
      const request = index.getAll(plantId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const photos = request.result.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        resolve(photos);
      };
    });
  } catch (error) {
    console.error('Failed to get photos:', error);
    return [];
  }
};

export const deletePhotoFromStorage = async (photoId) => {
  try {
    const db = await initializePhotoStorage();
    const transaction = db.transaction(['photos'], 'readwrite');
    const store = transaction.objectStore('photos');

    return new Promise((resolve, reject) => {
      const request = store.delete(photoId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(true);
    });
  } catch (error) {
    console.error('Failed to delete photo:', error);
    return false;
  }
};

export const capturePhotoFromCamera = async () => {
  return new Promise((resolve, reject) => {
    // Use HTML5 File API for photo capture
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use rear camera on mobile

    input.onchange = (event) => {
      const file = event.target.files[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    };

    input.click();
  });
};

export const uploadPhotoFromDevice = async () => {
  return capturePhotoFromCamera();
};

export const compressImage = async (imageData, maxWidth = 1024) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxWidth / img.width, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = imageData;
  });
};

export const generatePhotoTimeline = (photos) => {
  // Group photos by month
  const timeline = {};

  photos.forEach((photo) => {
    const date = new Date(photo.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!timeline[monthKey]) {
      timeline[monthKey] = [];
    }
    timeline[monthKey].push(photo);
  });

  return timeline;
};

export const analyzePhotoSeries = (photos) => {
  // Analyze if plant is growing based on photo sequence
  // This is a simplified analysis - in production, use ML/CV

  if (photos.length < 2) {
    return {
      trend: 'Not enough photos',
      message: 'Take more photos to track progress',
    };
  }

  // Check if photos are taken over time
  const timeSpan = new Date(photos[0].date) - new Date(photos[photos.length - 1].date);
  const days = Math.floor(timeSpan / (1000 * 60 * 60 * 24));

  if (days < 7) {
    return {
      trend: 'Growing',
      message: `${photos.length} photos in ${days} days`,
    };
  }

  return {
    trend: 'Stable',
    message: `${photos.length} photos tracking your plant's journey`,
  };
};
