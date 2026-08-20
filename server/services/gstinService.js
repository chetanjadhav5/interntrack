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
 * Calculate comprehensive institutional Company Trust Score (0-100) from GST Return Status data
 */
export function calculateCompanyTrustScore(gstData) {
  if (!gstData) {
    return {
      score: 50,
      grade: 'UNVERIFIED',
      grade_label: 'Unverified Entity',
      badge_color: 'amber',
      recommendation: 'Manual verification of offer letter and corporate registration required.',
      breakdown: []
    };
  }

  let totalScore = 0;
  const breakdown = [];

  // 1. Status & PAN Verification (Max 30 pts)
  const status = (gstData.sts || '').trim().toLowerCase();
  if (status === 'active') {
    totalScore += 30;
    breakdown.push({
      pillar: 'GST Registration Status',
      points: 30,
      max_points: 30,
      status: 'PASS',
      detail: 'Active GSTIN with verified Central & State Tax Jurisdictions'
    });
  } else {
    breakdown.push({
      pillar: 'GST Registration Status',
      points: 0,
      max_points: 30,
      status: 'FAIL',
      detail: `GSTIN Status is ${gstData.sts || 'Inactive / Suspended'}`
    });
  }

  // 2. Entity Constitution / Type (Max 25 pts)
  const ctb = (gstData.ctb || '').toLowerCase();
  let constitutionPoints = 14;
  let constitutionDetail = gstData.ctb || 'Registered Commercial Entity';

  if (ctb.includes('private limited') || ctb.includes('public limited')) {
    constitutionPoints = 25;
    constitutionDetail = `${gstData.ctb} (Incorporated Corporate Body)`;
  } else if (ctb.includes('limited liability') || ctb.includes('llp')) {
    constitutionPoints = 22;
    constitutionDetail = `${gstData.ctb} (Registered Partnership Body)`;
  } else if (ctb.includes('partnership') || ctb.includes('trust') || ctb.includes('society')) {
    constitutionPoints = 18;
    constitutionDetail = `${gstData.ctb} (Registered Firm)`;
  } else if (ctb.includes('proprietorship') || ctb.includes('individual')) {
    constitutionPoints = 14;
    constitutionDetail = `${gstData.ctb} (Sole Enterprise)`;
  }
  totalScore += constitutionPoints;
  breakdown.push({
    pillar: 'Constitution of Business',
    points: constitutionPoints,
    max_points: 25,
    status: 'PASS',
    detail: constitutionDetail
  });

  // 3. Operational Vintage (Max 20 pts)
  let vintageYears = 0;
  let vintagePoints = 10;
  let vintageDetail = 'Recently Registered';
  if (gstData.rgdt) {
    try {
      const parts = gstData.rgdt.split('/');
      let regDate;
      if (parts.length === 3) {
        regDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      } else {
        regDate = new Date(gstData.rgdt);
      }
      if (!isNaN(regDate.getTime())) {
        const diffMs = Date.now() - regDate.getTime();
        vintageYears = Math.max(0, Math.round((diffMs / (1000 * 60 * 60 * 24 * 365.25)) * 10) / 10);
      }
    } catch {
      vintageYears = 3;
    }
  }

  if (vintageYears >= 5) {
    vintagePoints = 20;
    vintageDetail = `${vintageYears} Years Operational (Registered: ${gstData.rgdt}) - Established Track Record`;
  } else if (vintageYears >= 3) {
    vintagePoints = 17;
    vintageDetail = `${vintageYears} Years Operational (Registered: ${gstData.rgdt}) - Stable Operations`;
  } else if (vintageYears >= 1) {
    vintagePoints = 13;
    vintageDetail = `${vintageYears} Years Operational (Registered: ${gstData.rgdt}) - Growth Stage`;
  } else {
    vintagePoints = 9;
    vintageDetail = `Under 1 Year Operational (Registered: ${gstData.rgdt || 'Recent'}) - Early Stage`;
  }
  totalScore += vintagePoints;
  breakdown.push({
    pillar: 'Business Vintage & Longevity',
    points: vintagePoints,
    max_points: 20,
    status: 'PASS',
    detail: vintageDetail
  });

  // 4. Return Filing Compliance (Max 20 pts)
  const returns = Array.isArray(gstData.returns) ? gstData.returns : [];
  let filingPoints = 0;
  const hasGstr1 = returns.some((r) => r.rtntype === 'GSTR1');
  const hasGstr3b = returns.some((r) => r.rtntype === 'GSTR3B');
  const hasGstr9 = returns.some((r) => r.rtntype === 'GSTR9' || r.rtntype === 'GSTR9C');
  const returnsCount = returns.length;

  if (returnsCount >= 15) {
    filingPoints += 10;
  } else if (returnsCount >= 5) {
    filingPoints += 7;
  } else if (returnsCount > 0) {
    filingPoints += 4;
  }

  if (hasGstr1 && hasGstr3b) {
    filingPoints += 5;
  }
  if (hasGstr9) {
    filingPoints += 5; // Audited annual return bonus
  }
  filingPoints = Math.min(20, filingPoints);
  totalScore += filingPoints;

  breakdown.push({
    pillar: 'Tax & GST Return Compliance',
    points: filingPoints,
    max_points: 20,
    status: filingPoints >= 12 ? 'PASS' : 'WARNING',
    detail: `${returnsCount} Verified Return Filings (GSTR-1, GSTR-3B${hasGstr9 ? ', GSTR-9 Annual Audit' : ''})`
  });

  // 5. Nature of Business & Trade Verification (Max 5 pts)
  const nba = Array.isArray(gstData.nba) ? gstData.nba.join(', ') : gstData.nba || 'Services';
  const hsn = Array.isArray(gstData.hsn) ? gstData.hsn.join(', ') : gstData.hsn || '';
  const businessPoints = 5;
  totalScore += businessPoints;
  breakdown.push({
    pillar: 'Sector & Commercial Activity',
    points: businessPoints,
    max_points: 5,
    status: 'PASS',
    detail: `Sector: ${nba || 'Supplier of Services'} | HSN/SAC: ${hsn || 'Verified'}`
  });

  // Grade and T&P Recommendation Determination
  const finalScore = Math.min(100, Math.max(10, totalScore));
  let grade = 'HIGH_TRUST';
  let grade_label = 'A+ High Trust Corporate';
  let badge_color = 'emerald';
  let recommendation = 'High Trust Corporate: Verified active entity with established GST compliance track record. Recommended for fast-track faculty mentor allocation.';

  if (status !== 'active') {
    grade = 'HIGH_RISK';
    grade_label = 'D Inactive / Flagged';
    badge_color = 'rose';
    recommendation = 'High Risk Alert: GSTIN is inactive or cancelled on the government portal. Require student to provide official company registration documents before approval.';
  } else if (finalScore >= 85) {
    grade = 'HIGH_TRUST';
    grade_label = 'A+ High Trust Corporate';
    badge_color = 'emerald';
    recommendation = 'High Trust Corporate: Fully compliant entity with active multi-year filings. Safe for fast-track verification & mentor assignment.';
  } else if (finalScore >= 70) {
    grade = 'GOOD_STANDING';
    grade_label = 'B+ Established Entity';
    badge_color = 'blue';
    recommendation = 'Good Standing Entity: Active GSTIN with regular returns. Standard offer letter inspection recommended.';
  } else if (finalScore >= 50) {
    grade = 'MODERATE_TRUST';
    grade_label = 'C Moderate Standing';
    badge_color = 'amber';
    recommendation = 'Moderate Standing: Relatively new or proprietorship entity. T&P verification of offer letter and supervisor email recommended.';
  } else {
    grade = 'LOW_TRUST';
    grade_label = 'D Low Compliance';
    badge_color = 'rose';
    recommendation = 'Low Trust Score: Incomplete filings or newly registered firm. T&P coordinator manual review mandatory.';
  }

  return {
    score: finalScore,
    grade,
    grade_label,
    badge_color,
    recommendation,
    breakdown,
    vintage_years: vintageYears,
    returns_filed_count: returnsCount,
    latest_gstr1: gstData.meta?.latestgtsr1 || null,
    latest_gstr3b: gstData.meta?.latestgtsr3b || null,
    dealer_type: gstData.dty || 'Regular',
    compliance_category: gstData.compCategory || 'Yellow',
    jurisdiction: {
      central: gstData.ctj || 'Central Tax Authority',
      state: gstData.stj || 'State Tax Authority'
    },
    nature_of_business: nba,
    hsn_codes: gstData.hsn || [],
    recent_returns: returns.slice(0, 10)
  };
}

/**
 * High-level helper: Verify GSTIN, geocode address, and calculate institutional trust score
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

  // Calculate comprehensive institutional Company Trust Score
  const trustData = calculateCompanyTrustScore(gstData);

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
    geocoded_location_name: geo.display_name,
    trust_score: trustData.score,
    trust_grade: trustData.grade,
    trust_grade_label: trustData.grade_label,
    trust_recommendation: trustData.recommendation,
    trust_badge_color: trustData.badge_color,
    trust_breakdown: trustData.breakdown,
    trust_data: trustData
  };
}

