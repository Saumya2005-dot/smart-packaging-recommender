const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, '/')));
app.use(express.json());

// 10 Detailed Box Types (Volume in cm³)
const boxTypes = [
  { name: 'Small Box', size: '15 x 10 x 8', volume: 1200, image: 'images/small.png' },
  { name: 'Compact Box', size: '20 x 15 x 10', volume: 3000, image: 'images/compact.png' },
  { name: 'Medium Box', size: '25 x 20 x 15', volume: 7500, image: 'images/medium.png' },
  { name: 'Standard Box', size: '30 x 25 x 20', volume: 15000, image: 'images/standard.png' },
  { name: 'Large Box', size: '40 x 35 x 30', volume: 26250, image: 'images/large.png' },
  { name: 'Bulk Box', size: '40 x 35 x 30', volume: 42000, image: 'images/bulk.png' },
  { name: 'Heavy Duty Box', size: '50 x 45 x 40', volume: 90000, image: 'images/heavy.png' },
  { name: 'Jumbo Box', size: '60 x 50 x 45', volume: 135000, image: 'images/jumbo.png' }
];

// Suggest the smallest box that fits the volume
function findBox(length, width, height) {
  const itemVolume = length * width * height;
  for (let box of boxTypes) {
    if (itemVolume <= box.volume) return box;
  }
  return boxTypes[boxTypes.length - 1]; // fallback to largest
}

app.post('/get-box-size', (req, res) => {
  const { length, width, height } = req.body;
  if (!length || !width || !height) {
    return res.status(400).json({ error: 'Invalid dimensions.' });
  }

  const box = findBox(length, width, height);

  res.json({
    name: box.name,
    size: box.size,
    image: box.image,
    volume: length * width * height
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});
