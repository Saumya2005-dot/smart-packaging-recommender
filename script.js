const inputMethod = document.getElementById('inputMethod');
const manualForm = document.getElementById('manualInputForm');
const cameraSection = document.getElementById('cameraSection');
const resultDiv = document.getElementById('result');
const boxGrid = document.getElementById('boxGrid');

// Box type metadata (same as backend)
const boxTypes = [
  { name: 'Small Box', size: '15 x 10 x 8', image: 'images/small.png' },
  { name: 'Compact Box', size: '20 x 15 x 10', image: 'images/compact.png' },
  { name: 'Medium Box', size: '25 x 20 x 15', image: 'images/medium.png' },
  { name: 'Standard Box', size: '30 x 25 x 20', image: 'images/standard.png' },
  { name: 'Large Box', size: '40 x 35 x 30', image: 'images/large.png' },
  { name: 'Bulk Box', size: '40 x 35 x 30', image: 'images/bulk.png' },
  { name: 'Heavy Duty Box', size: '50 x 45 x 40', image: 'images/heavy.png' },
  { name: 'Jumbo Box', size: '60 x 50 x 45', image: 'images/jumbo.png' }
];

// Create box cards on home page
boxTypes.forEach(box => {
  const div = document.createElement('div');
  div.className = 'col';
  div.innerHTML = `
    <div class="box-card" id="${box.name.replace(/\\s+/g, '-')}">
      <img src="${box.image}" alt="${box.name}">
      <strong>${box.name}</strong><br>
      <small>${box.size} cm</small>
    </div>`;
  boxGrid.appendChild(div);
});

function highlightBox(boxName) {
  document.querySelectorAll('.box-card').forEach(card => {
    card.style.border = '1px solid #ddd';
    card.style.background = '#fff';
  });
  const target = document.getElementById(boxName.replace(/\\s+/g, '-'));
  if (target) {
    target.style.border = '2px solid #007bff';
    target.style.background = '#e6f0ff';
    target.scrollIntoView({ behavior: 'smooth' });
  }
}

inputMethod.addEventListener('change', () => {
  const method = inputMethod.value;
  if (method === 'manual') {
    manualForm.style.display = 'block';
    cameraSection.style.display = 'none';
  } else {
    manualForm.style.display = 'none';
    cameraSection.style.display = 'block';
  }
  resultDiv.classList.add('d-none');
});

manualForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const length = +document.getElementById('length').value;
  const width = +document.getElementById('width').value;
  const height = +document.getElementById('height').value;

  const res = await fetch('/get-box-size', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ length, width, height })
  });
  const data = await res.json();
  resultDiv.innerText = `Recommended: ${data.name} (${data.size})`;
  resultDiv.classList.remove('d-none');
  highlightBox(data.name);
});

async function startObjectDetection() {
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    resultDiv.classList.add('d-none');
  
    // Show camera and canvas
    video.style.display = 'block';
    canvas.style.display = 'block';
  
    // Load model
    const model = await cocoSsd.load();
    console.log("✅ Model loaded");
  
    // Access webcam
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    await new Promise(resolve => video.onloadedmetadata = resolve);
  
    // Wait 2 seconds for user to place object
    setTimeout(async () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const predictions = await model.detect(video);
  
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
      if (predictions.length > 0) {
        predictions.forEach(pred => {
          const [x, y, width, height] = pred.bbox;
          ctx.strokeStyle = '#00FF00';
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, width, height);
          ctx.fillStyle = '#00FF00';
          ctx.fillText(pred.class, x, y > 10 ? y - 5 : 10);
        });
  
        // Pick largest object
        const largest = predictions.reduce((a, b) => (a.bbox[2] * a.bbox[3]) > (b.bbox[2] * b.bbox[3]) ? a : b);
        const approxVolume = (largest.bbox[2] * largest.bbox[3] * 50) / 1000;
  
        let suggestedBox;
        for (let box of boxTypes) {
          if (approxVolume <= box.volume) {
            suggestedBox = box;
            break;
          }
        }
        if (!suggestedBox) suggestedBox = boxTypes[boxTypes.length - 1];
  
        resultDiv.innerHTML = `Detected object: <strong>${largest.class}</strong><br>
          Estimated volume: ${Math.round(approxVolume)} cm³<br>
          Suggested: <strong>${suggestedBox.name}</strong> (${suggestedBox.size})`;
        resultDiv.classList.remove('d-none');
        highlightBox(suggestedBox.name);
      } else {
        resultDiv.innerText = 'No object detected.';
        resultDiv.classList.remove('d-none');
      }
  
      // Stop webcam after one scan
      stream.getTracks().forEach(track => track.stop());
  
    }, 6000); // delay for user to show object
  }
  
