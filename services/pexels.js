const DEFAULT_IMAGES = [
  "assets/placeholder-1.svg",
  "assets/placeholder-2.svg",
  "assets/placeholder-3.svg",
];

const getPexelsImage = async (query) => {
  if (!process.env.PEXELS_API_KEY) return null;
  const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`, {
    headers: { Authorization: process.env.PEXELS_API_KEY },
  });
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  if (!data.photos || !data.photos.length) return null;
  return data.photos[0].src.landscape || data.photos[0].src.original;
};

const getImagesForNews = async (newsItems) => {
  const images = [];
  for (let i = 0; i < newsItems.length; i += 1) {
    const imageUrl = await getPexelsImage(newsItems[i]);
    images.push(imageUrl || DEFAULT_IMAGES[i % DEFAULT_IMAGES.length]);
  }
  return images;
};

module.exports = {
  getImagesForNews,
};
