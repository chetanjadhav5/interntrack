async function testGeocode() {
  const address = 'PLOT NO. A-417, MADRECHA HEIGHTS, L3, ROAD NO 28, Emco Ltd, Wagle Estate MIDC, Thane, Thane, Maharashtra, 400604';
  console.log('Original Address:', address);

  // Strategy 1: Clean and query OpenStreetMap
  const queries = [
    'Wagle Estate MIDC, Thane, Maharashtra, 400604',
    'Wagle Estate, Thane, Maharashtra',
    'Thane, Maharashtra, 400604',
    address
  ];

  for (const q of queries) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1&addressdetails=1&countrycodes=in`, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'InternshipConnectPro-Test'
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          console.log(`✅ Matched query "${q}":`);
          console.log('   Lat:', data[0].lat, 'Lng:', data[0].lon);
          console.log('   Display Name:', data[0].display_name);
          return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
}

testGeocode();
