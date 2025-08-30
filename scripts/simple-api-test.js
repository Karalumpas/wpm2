console.log('Testing basic connection...');

setTimeout(async () => {
  try {
    console.log('Making request to health endpoint...');
    const response = await fetch('http://localhost:3000/api/health');
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', data);
    } else {
      console.log('Response not ok');
    }
  } catch (error) {
    console.log('Error:', error);
  }
}, 2000);
