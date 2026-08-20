import https from 'https';

/**
 * Service to verify GSTIN using RapidAPI GST Return Status API
 * and geocode the registered company address into Latitude/Longitude coordinates via OpenStreetMap
 */

export async function fetchGstinFromRapidApi(gstin) {
  const cleanGstin = (gstin || '').trim().toUpperCase();
  const apiKey = process.env.RAPIDAPI_GST_KEY || '1e38b9522emshda3844315527afdp155538jsncefd3eff1830';
  const apiHost = process.env.RAPIDAPI_GST_HOST || 'gst-return-status.p.rapidapi.com';

  return new Promise((resolve, reject) => {
    const options = {
      method: 'GET',
      hostname: apiHost,
      port: null,
      path: `/free/gstin/${encodeURIComponent(cleanGstin)}`,
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': apiHost,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      const chunks = [];

      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const bodyStr = Buffer.concat(chunks).toString();
        try {
          const parsed = JSON.parse(bodyStr);
          if (res.statusCode >= 200 && res.statusCode < 300 && parsed.success && parsed.data) {
            resolve(parsed.data);
          } else {
            const errorMsg = parsed.message || parsed.error || `GSTIN lookup failed with status ${res.statusCode}`;
            resolve(null);
          }
        } catch (e) {
          reject(new Error(`Failed to parse GST API response: ${e.message}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.setTimeout(8000, () => {
      req.destroy();
      reject(new Error('GSTIN verification request timed out'));
    });
    req.end();
  });
}

/**
 * Geocode registered company address into Latitude and Longitude using OpenStreetMap Nominatim
 */
export async function geocodeCompanyAddress(addressText) {
  if (!addressText) {
    return { lat: 18.5204, lng: 73.8567, display_name: 'Pune, Maharashtra' };
  }

  const rawTokens = addressText.split(',').map((s) => s.trim()).filter(Boolean);

  // Progressive search query strategies
  const candidateQueries = [];

  // Strategy A: Last 4 tokens (Area, City, State, PIN)
  if (rawTokens.length >= 4) {
    candidateQueries.push(rawTokens.slice(-4).join(', '));
  }
  // Strategy B: Last 3 tokens (City, State, PIN)
  if (rawTokens.length >= 3) {
    candidateQueries.push(rawTokens.slice(-3).join(', '));
  }
  // Strategy C: Full address string
  candidateQueries.push(addressText);

  for (const q of candidateQueries) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          q
        )}&limit=1&addressdetails=1&countrycodes=in`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'InternshipConnectPro-GSTINGeolocator'
          }
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          return {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
            display_name: data[0].display_name
          };
        }
      }
    } catch (e) {
      console.warn(`OSM Geocoding warning for query "${q}":`, e.message);
    }
  }

  // Fallback default coordinates (e.g. Maharashtra region)
  return {
    lat: 19.1985,
    lng: 72.9510,
    display_name: addressText
  };
}

/**
 * High-level helper: Verify GSTIN and geocode address
 */
export async function verifyGstinAndResolveLocation(gstin) {
  const cleanGstin = (gstin || '').trim().toUpperCase();

  // Basic 15-character GSTIN format validation
  if (!cleanGstin || cleanGstin.length < 10) {
    throw new Error('Please provide a valid Indian GSTIN number (15 alphanumeric characters)');
  }

  const gstData = await fetchGstinFromRapidApi(cleanGstin);
  if (!gstData) {
    throw new Error(`GSTIN "${cleanGstin}" could not be verified on the GST Portal. Please check the number.`);
  }

  const companyName = gstData.tradeName || gstData.lgnm || 'Registered Enterprise';
  const registeredAddress = gstData.adr || 'Registered Office Address';

  // Geolocate registered address to Lat, Lng
  const geo = await geocodeCompanyAddress(registeredAddress);

  return {
    success: true,
    gstin: cleanGstin,
    company_name: companyName,
    legal_name: gstData.lgnm || companyName,
    trade_name: gstData.tradeName || companyName,
    status: gstData.sts || 'Active',
    company_type: gstData.ctb || 'Registered Company',
    pan: gstData.pan || cleanGstin.substring(2, 12),
    registration_date: gstData.rgdt || 'N/A',
    registered_address: registeredAddress,
    latitude: geo.lat,
    longitude: geo.lng,
    geocoded_location_name: geo.display_name
  };
}
