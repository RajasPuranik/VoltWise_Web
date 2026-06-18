const TARIFF_DICTIONARY = {
    'Mumbai': { min: 5.00, max: 13.00, avg: 8.50, tiers: [{ limit: 100, rate: 5.00 }, { limit: 300, rate: 7.00 }, { limit: 500, rate: 10.00 }, { limit: Infinity, rate: 13.00 }] },
    'Delhi': { min: 3.00, max: 8.00, avg: 5.50, tiers: [{ limit: 200, rate: 3.00 }, { limit: 400, rate: 4.50 }, { limit: 800, rate: 6.50 }, { limit: Infinity, rate: 8.00 }] },
    'Bengaluru': { min: 5.90, max: 9.00, avg: 7.45, tiers: [{ limit: 100, rate: 5.90 }, { limit: 200, rate: 7.00 }, { limit: Infinity, rate: 9.00 }] },
    'Bangalore': { min: 5.90, max: 9.00, avg: 7.45, tiers: [{ limit: 100, rate: 5.90 }, { limit: 200, rate: 7.00 }, { limit: Infinity, rate: 9.00 }] },
    'Chennai': { min: 4.50, max: 11.00, avg: 7.75, tiers: [{ limit: 100, rate: 4.50 }, { limit: 200, rate: 6.00 }, { limit: 500, rate: 8.00 }, { limit: Infinity, rate: 11.00 }] },
    'Hyderabad': { min: 1.45, max: 6.50, avg: 3.97, tiers: [{ limit: 100, rate: 1.45 }, { limit: 200, rate: 2.60 }, { limit: Infinity, rate: 6.50 }] },
    'Indore': { min: 3.34, max: 6.70, avg: 5.02, tiers: [{ limit: 50, rate: 3.34 }, { limit: 100, rate: 4.38 }, { limit: 300, rate: 5.65 }, { limit: Infinity, rate: 6.70 }] },
    'DEFAULT': { min: 3.00, max: 8.00, avg: 5.50, tiers: [{ limit: 100, rate: 3.00 }, { limit: 200, rate: 4.50 }, { limit: 400, rate: 6.50 }, { limit: Infinity, rate: 8.00 }] }
};

let currentCity = 'Unknown';
let currentTariff = TARIFF_DICTIONARY['DEFAULT'];

// Fetch location using browser prompt
function fetchLocation() {
    if (navigator.geolocation) {
        document.getElementById('location-display').innerText = `📍 Asking for location access...`;
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            try {
                const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
                const data = await response.json();
                if (data.city || data.locality) {
                    currentCity = data.city || data.locality;
                    if (TARIFF_DICTIONARY[currentCity]) {
                        currentTariff = TARIFF_DICTIONARY[currentCity];
                        document.getElementById('location-display').innerText = `📍 ${currentCity} | Live Tariff Applied`;
                    } else {
                        // Dynamically create an average if missing to simulate "live" fallback
                        currentTariff = TARIFF_DICTIONARY['DEFAULT'];
                        document.getElementById('location-display').innerText = `📍 ${currentCity} | Estimated National Tariff`;
                    }
                } else {
                    document.getElementById('location-display').innerText = `📍 Location Unknown | National Tariff Applied`;
                }
                updateTariffDisplay();
                updateCalculations();
            } catch (e) {
                document.getElementById('location-display').innerText = `📍 Offline Mode | National Tariff Applied`;
            }
        }, async (error) => {
            // Fallback to IP if they deny or it fails
            try {
                const response = await fetch('https://ipapi.co/json/');
                const data = await response.json();
                if (data.city) {
                    currentCity = data.city;
                    document.getElementById('location-display').innerText = `📍 ${currentCity} (IP) | ${TARIFF_DICTIONARY[currentCity] ? 'Live' : 'National'} Tariff`;
                    if (TARIFF_DICTIONARY[currentCity]) currentTariff = TARIFF_DICTIONARY[currentCity];
                }
            } catch(e) {
                document.getElementById('location-display').innerText = `📍 Location Denied | National Tariff Applied`;
            }
            updateTariffDisplay();
            updateCalculations();
        });
    } else {
        document.getElementById('location-display').innerText = `📍 Geolocation Not Supported | National Tariff Applied`;
    }
}

function updateTariffDisplay() {
    document.getElementById('tariff-min').innerText = `Min: ₹${currentTariff.min.toFixed(2)}`;
    document.getElementById('tariff-avg').innerText = `Avg: ₹${currentTariff.avg.toFixed(2)}`;
    document.getElementById('tariff-max').innerText = `Max: ₹${currentTariff.max.toFixed(2)}`;
}

const appliancesConfig = [
    {
        id: 'ac', name: 'Air Conditioner', subtitle: 'Cooling', icon: 'ac_unit',
        defaultQty: 0, type: 'ac_complex',
        starWattages: { 5: 1100, 4: 1300, 3: 1500, 2: 1700, 1: 1900 },
        defaultStar: 3, defaultHours: 8, canAlwaysOn: false,
        tonOptions: [{l: '1.0 Ton', v: 0.7}, {l: '1.5 Ton', v: 1.0}, {l: '2.0 Ton', v: 1.3}],
        defaultTon: 1.0, defaultTemp: 24
    },
    {
        id: 'fridge', name: 'Refrigerator', subtitle: 'Avg Running Power', icon: 'kitchen',
        defaultQty: 0, type: 'star',
        starWattages: { 5: 15, 4: 18, 3: 22, 2: 28, 1: 35 },
        defaultStar: 4, defaultHours: 24, isAlwaysOn: true, canAlwaysOn: true
    },
    {
        id: 'fan', name: 'Ceiling Fan', subtitle: 'Room Cooling', icon: 'air', // Changed icon to 'air' which centers better
        defaultQty: 0, type: 'complex_fan',
        fanMode: 'unknown', // 'unknown', 'dc', 'bldc', 'both'
        bldcCount: 0, dcCount: 0,
        defaultHours: 12, canAlwaysOn: true
    },
    {
        id: 'geyser', name: 'Water Heater', subtitle: 'Geyser', icon: 'hot_tub',
        defaultQty: 0, type: 'slider', sliderMin: 1000, sliderMax: 3000, defaultWattage: 2000, defaultHours: 0.5, canAlwaysOn: false
    },
    {
        id: 'tv', name: 'Television', subtitle: 'Entertainment', icon: 'tv',
        defaultQty: 0, type: 'slider', sliderMin: 50, sliderMax: 300, defaultWattage: 100, defaultHours: 4, canAlwaysOn: true
    },
    {
        id: 'washing', name: 'Washing Machine', subtitle: 'Laundry', icon: 'local_laundry_service',
        defaultQty: 0, type: 'slider', sliderMin: 200, sliderMax: 1000, defaultWattage: 500, defaultHours: 0.5, canAlwaysOn: false
    },
    {
        id: 'iron', name: 'Iron', subtitle: 'Clothes', icon: 'iron',
        defaultQty: 0, type: 'slider', sliderMin: 500, sliderMax: 2000, defaultWattage: 1000, defaultHours: 0.25, canAlwaysOn: false
    },
    {
        id: 'microwave', name: 'Microwave', subtitle: 'Heating/Baking', icon: 'microwave',
        defaultQty: 0, type: 'star',
        starWattages: { 5: 800, 4: 900, 3: 1000, 2: 1100, 1: 1200 },
        defaultStar: 3, defaultHours: 0.25, canAlwaysOn: false
    },
    {
        id: 'led', name: 'LED Bulbs', subtitle: 'Lighting', icon: 'lightbulb',
        defaultQty: 0, type: 'slider', sliderMin: 5, sliderMax: 40, defaultWattage: 10, defaultHours: 6, canAlwaysOn: true
    },
    {
        id: 'airfryer', name: 'Air Fryer', subtitle: 'Cooking', icon: 'fastfood',
        defaultQty: 0, type: 'slider', sliderMin: 800, sliderMax: 2000, defaultWattage: 1500, defaultHours: 0.25, canAlwaysOn: false
    },
    {
        id: 'desktop', name: 'Desktop PC', subtitle: 'Computer', icon: 'computer',
        defaultQty: 0, type: 'slider', sliderMin: 100, sliderMax: 800, defaultWattage: 250, defaultHours: 4, canAlwaysOn: true
    }
];

let state = appliancesConfig.map(app => ({
    ...app,
    qty: app.defaultQty,
    star: app.defaultStar || null,
    wattage: app.defaultWattage || 0,
    hours: app.defaultHours,
    alwaysOn: app.isAlwaysOn || false,
    tonMultiplier: app.defaultTon || 1.0,
    temperature: app.defaultTemp || 24,
    fanMode: app.fanMode || null,
    bldcCount: app.bldcCount || 0,
    dcCount: app.dcCount || 0
}));

function calculateCost(monthlyKwh) {
    let cost = 0;
    let remaining = monthlyKwh;
    let prevLimit = 0;

    for (let tier of currentTariff.tiers) {
        let tierRange = tier.limit - prevLimit;
        if (remaining > tierRange) {
            cost += tierRange * tier.rate;
            remaining -= tierRange;
        } else {
            cost += remaining * tier.rate;
            break;
        }
        prevLimit = tier.limit;
    }
    return cost;
}

function updateCalculations() {
    let dailyKwh = 0;
    let acKwh = 0;
    let fridgeStars = 5;
    let hasFridge = false;
    let hasNormalFan = false;

    state.forEach(app => {
        if (app.qty > 0) {
            let watts = app.wattage;
            
            if (app.type === 'star') {
                watts = app.starWattages[app.star];
            } else if (app.type === 'ac_complex') {
                let baseWatts = app.starWattages[app.star] * app.tonMultiplier;
                let tempDiff = 24 - app.temperature; 
                let tempMultiplier = 1.0 + (tempDiff * 0.06);
                watts = baseWatts * tempMultiplier;
            } else if (app.type === 'complex_fan') {
                if (app.fanMode === 'unknown') {
                    watts = 60;
                } else if (app.fanMode === 'dc') {
                    watts = 75;
                    hasNormalFan = true;
                } else if (app.fanMode === 'bldc') {
                    watts = 30;
                } else if (app.fanMode === 'both') {
                    let bldc = app.bldcCount;
                    let dc = app.dcCount;
                    // If sum exceeds qty, limit it for math
                    if(bldc + dc > 0) {
                        watts = ((bldc * 30) + (dc * 75)) / (bldc + dc); 
                    } else {
                        watts = 60; // fallback if both are 0
                    }
                    if (dc > 0) hasNormalFan = true;
                }
            }

            let hrs = app.alwaysOn ? 24 : app.hours;
            let kwh = (app.qty * watts * hrs) / 1000;
            dailyKwh += kwh;

            if (app.id === 'ac') acKwh += kwh;
            if (app.id === 'fridge') {
                hasFridge = true;
                fridgeStars = app.star;
            }
        }
    });

    const monthlyKwh = dailyKwh * 30;
    const yearlyKwh = dailyKwh * 365;
    const monthlyCost = calculateCost(monthlyKwh);

    document.getElementById('total-cost').innerText = monthlyCost.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    document.getElementById('daily-kwh').innerText = dailyKwh.toFixed(1) + ' kWh';
    document.getElementById('monthly-kwh').innerText = monthlyKwh.toFixed(1) + ' kWh';
    document.getElementById('yearly-kwh').innerText = yearlyKwh.toFixed(1) + ' kWh';

    generateInsights(dailyKwh, acKwh, hasFridge, fridgeStars, hasNormalFan);
}

function generateInsights(totalDailyKwh, acDailyKwh, hasFridge, fridgeStars, hasNormalFan) {
    const insightBox = document.getElementById('insight-box');
    const insightText = document.getElementById('insight-text');

    if (totalDailyKwh === 0) {
        insightBox.classList.add('hidden');
        return;
    }

    insightBox.classList.remove('hidden');

    if (acDailyKwh > (totalDailyKwh * 0.3) && acDailyKwh > 0) {
        insightText.innerText = "Tip: Your AC is consuming a lot. Setting it to 24°C can save roughly 6% per degree compared to lower temperatures.";
    } else if (hasNormalFan) {
        insightText.innerText = "Tip: Switching to BLDC fans can reduce your fan electricity costs by over 50%.";
    } else if (hasFridge && fridgeStars <= 3) {
        insightText.innerText = "Tip: Consider upgrading to a 4 or 5-star refrigerator for long-term continuous savings.";
    } else {
        insightText.innerText = "Great job! Keep appliances turned off when not in use to save more.";
    }
}

function renderCards() {
    const container = document.getElementById('appliances-container');
    container.innerHTML = '';

    state.forEach((app, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        card.id = `card-${index}`;

        let qtyHtml = '';
        if (app.type === 'complex_fan') {
            qtyHtml = `
                <label class="switch" style="margin-left:auto;">
                    <input type="checkbox" ${app.qty > 0 ? 'checked' : ''} onchange="toggleFanState(${index}, this.checked)">
                    <span class="slider round"></span>
                </label>
            `;
        } else {
            qtyHtml = `
                <div class="qty-control">
                    <button class="qty-btn" onclick="updateQty(${index}, -1)">-</button>
                    <div class="qty-display">${app.qty}</div>
                    <button class="qty-btn" onclick="updateQty(${index}, 1)">+</button>
                </div>
            `;
        }

        let headerHtml = `
            <div class="card-header">
                <div class="card-icon"><span class="material-icons-round" style="display:flex; justify-content:center; align-items:center; width:100%; height:100%;">${app.icon}</span></div>
                <div class="card-title">
                    <h3>${app.name}</h3>
                    <p>${app.subtitle}</p>
                </div>
                ${qtyHtml}
            </div>
        `;

        let controlsHtml = `<div class="control-group">`;

        if (app.type === 'ac_complex') {
            let optionsHtml = app.tonOptions.map(opt => `<option value="${opt.v}" ${app.tonMultiplier == opt.v ? 'selected' : ''}>${opt.l}</option>`).join('');
            controlsHtml += `
                <div class="control-label"><span>Capacity</span></div>
                <select onchange="updateTon(${index}, this.value)">${optionsHtml}</select>
            `;
            
            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                starsHtml += `<span class="material-icons-round star ${i <= app.star ? 'active' : ''}" onclick="updateStar(${index}, ${i})">star</span>`;
            }
            controlsHtml += `
                <div class="control-label" style="margin-top:10px;"><span>Efficiency Rating</span></div>
                <div class="star-rating">${starsHtml}</div>
            `;

            controlsHtml += `
                <div style="margin-top:10px;">
                    <div class="control-label"><span>Temperature</span> <span class="val" id="val-temp-${index}">${app.temperature}°C</span></div>
                    <input type="range" min="18" max="30" value="${app.temperature}" oninput="document.getElementById('val-temp-${index}').innerText = this.value + '°C'; updateStateLive(${index}, 'temperature', this.value)">
                </div>
            `;

        } else if (app.type === 'complex_fan') {
            if (app.qty > 0) {
                let isUnknown = app.fanMode === 'unknown';
                let isDC = app.fanMode === 'dc' || app.fanMode === 'both';
                let isBLDC = app.fanMode === 'bldc' || app.fanMode === 'both';

                controlsHtml += `
                    <div class="control-label"><span>Fan Type</span></div>
                    <div style="display:flex; flex-direction:column; gap:5px; font-size:0.85rem;">
                        <label style="display:flex; align-items:center; gap:5px; cursor:pointer;">
                            <input type="radio" name="fanMode" ${isUnknown ? 'checked' : ''} onchange="setFanMode('unknown')"> Don't Know
                        </label>
                        <div style="display:flex; gap:15px; margin-top:5px;">
                            <label style="display:flex; align-items:center; gap:5px; cursor:pointer;">
                                <input type="checkbox" id="fan-dc" ${isDC && !isUnknown ? 'checked' : ''} onchange="updateFanCheckboxes()"> DC Fan
                            </label>
                            <label style="display:flex; align-items:center; gap:5px; cursor:pointer;">
                                <input type="checkbox" id="fan-bldc" ${isBLDC && !isUnknown ? 'checked' : ''} onchange="updateFanCheckboxes()"> BLDC Fan
                            </label>
                        </div>
                    </div>
                `;

                if (isUnknown) {
                    controlsHtml += `<div style="font-size:0.75rem; color:var(--warning); margin-top:5px;">⚠️ Using 60W average. Check fan for exact wattage.</div>`;
                }

                if (app.fanMode === 'both') {
                    controlsHtml += `
                        <div style="margin-top:10px;">
                            <div class="control-label"><span>How many DC fans?</span> <span class="val" id="val-dc-${index}">${app.dcCount}</span></div>
                            <input type="range" min="0" max="15" value="${app.dcCount}" oninput="document.getElementById('val-dc-${index}').innerText = this.value; updateStateLive(${index}, 'dcCount', this.value)">
                        </div>
                        <div style="margin-top:10px;">
                            <div class="control-label"><span>How many BLDC fans?</span> <span class="val" id="val-bldc-${index}">${app.bldcCount}</span></div>
                            <input type="range" min="0" max="15" value="${app.bldcCount}" oninput="document.getElementById('val-bldc-${index}').innerText = this.value; updateStateLive(${index}, 'bldcCount', this.value)">
                        </div>
                    `;
                } else if (app.fanMode === 'dc') {
                    controlsHtml += `
                        <div style="margin-top:10px;">
                            <div class="control-label"><span>How many DC fans?</span> <span class="val" id="val-qty-${index}">${app.qty}</span></div>
                            <input type="range" min="1" max="15" value="${app.qty}" oninput="document.getElementById('val-qty-${index}').innerText = this.value; updateStateLive(${index}, 'qty', this.value)">
                        </div>
                    `;
                } else if (app.fanMode === 'bldc') {
                    controlsHtml += `
                        <div style="margin-top:10px;">
                            <div class="control-label"><span>How many BLDC fans?</span> <span class="val" id="val-qty-${index}">${app.qty}</span></div>
                            <input type="range" min="1" max="15" value="${app.qty}" oninput="document.getElementById('val-qty-${index}').innerText = this.value; updateStateLive(${index}, 'qty', this.value)">
                        </div>
                    `;
                } else {
                    // Unknown
                    controlsHtml += `
                        <div style="margin-top:10px;">
                            <div class="control-label"><span>How many fans?</span> <span class="val" id="val-qty-${index}">${app.qty}</span></div>
                            <input type="range" min="1" max="15" value="${app.qty}" oninput="document.getElementById('val-qty-${index}').innerText = this.value; updateStateLive(${index}, 'qty', this.value)">
                        </div>
                    `;
                }
            }
        } else if (app.type === 'star') {
            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                starsHtml += `<span class="material-icons-round star ${i <= app.star ? 'active' : ''}" onclick="updateStar(${index}, ${i})">star</span>`;
            }
            controlsHtml += `
                <div class="control-label"><span>Efficiency Rating</span></div>
                <div class="star-rating">${starsHtml}</div>
            `;
        } else if (app.type === 'slider') {
            controlsHtml += `
                <div class="control-label"><span>Wattage</span> <span class="val" id="val-watt-${index}">${app.wattage}W</span></div>
                <input type="range" min="${app.sliderMin}" max="${app.sliderMax}" step="10" value="${app.wattage}" oninput="document.getElementById('val-watt-${index}').innerText = this.value + 'W'; updateStateLive(${index}, 'wattage', this.value)">
            `;
        }

        // Always On Toggle
        if (app.canAlwaysOn) {
            controlsHtml += `
                <div class="toggle-row" style="margin-top:10px;">
                    <span class="control-label">Always On (24h)</span>
                    <label class="switch">
                        <input type="checkbox" ${app.alwaysOn ? 'checked' : ''} onchange="toggleAlwaysOn(${index}, this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
            `;
        }

        // Hours Slider
        if (!app.alwaysOn) {
            let h = app.hours;
            let displayHours = h >= 1 ? h + 'h' : (h * 60) + 'm';
            controlsHtml += `
                <div style="margin-top:10px;">
                    <div class="control-label"><span>Time Used/Day</span> <span class="val" id="val-hours-${index}">${displayHours}</span></div>
                    <input type="range" min="0" max="24" step="0.25" value="${app.hours}" oninput="let hv=parseFloat(this.value); document.getElementById('val-hours-${index}').innerText = hv>=1 ? hv+'h' : (hv*60)+'m'; updateStateLive(${index}, 'hours', this.value)">
                </div>
            `;
        }

        controlsHtml += `</div>`;
        card.innerHTML = headerHtml + controlsHtml;
        container.appendChild(card);
    });
}

window.updateStateLive = (index, key, val) => {
    state[index][key] = parseFloat(val);
    
    // Auto-adjust total qty when individual sliders change
    if (state[index].type === 'complex_fan' && state[index].fanMode === 'both') {
        if (key === 'bldcCount' || key === 'dcCount') {
            state[index].qty = state[index].bldcCount + state[index].dcCount;
        }
    }
    
    updateCalculations();
};

window.updateQty = (index, delta) => {
    let newVal = state[index].qty + delta;
    if (newVal >= 0) {
        state[index].qty = newVal;
        if (state[index].type === 'complex_fan') {
            state[index].bldcCount = Math.floor(newVal / 2);
            state[index].dcCount = newVal - state[index].bldcCount;
        }
        renderCards();
        updateCalculations();
    }
};

window.updateStar = (index, star) => {
    state[index].star = star;
    renderCards();
    updateCalculations();
};

window.toggleFanState = (index, isChecked) => {
    if (isChecked) {
        state[index].qty = 1; // Default to 1 fan when turned on
        if (state[index].fanMode === 'both') {
            state[index].qty = 2; // Need at least 2 if both are selected
            state[index].dcCount = 1;
            state[index].bldcCount = 1;
        }
    } else {
        state[index].qty = 0;
        state[index].dcCount = 0;
        state[index].bldcCount = 0;
    }
    renderCards();
    updateCalculations();
};

window.toggleAlwaysOn = (index, isChecked) => {
    state[index].alwaysOn = isChecked;
    renderCards();
    updateCalculations();
};

window.updateTon = (index, val) => {
    state[index].tonMultiplier = parseFloat(val);
    renderCards();
    updateCalculations();
};

window.setFanMode = (mode) => {
    let fanIndex = state.findIndex(a => a.id === 'fan');
    if (fanIndex > -1) {
        state[fanIndex].fanMode = mode;
        renderCards();
        updateCalculations();
    }
};

window.updateFanCheckboxes = () => {
    let fanIndex = state.findIndex(a => a.id === 'fan');
    if (fanIndex > -1) {
        let dcChecked = document.getElementById('fan-dc').checked;
        let bldcChecked = document.getElementById('fan-bldc').checked;
        
        if (dcChecked && bldcChecked) {
            state[fanIndex].fanMode = 'both';
            if (state[fanIndex].qty < 2 && state[fanIndex].qty > 0) {
                state[fanIndex].qty = 2;
                state[fanIndex].bldcCount = 1;
                state[fanIndex].dcCount = 1;
            } else {
                state[fanIndex].bldcCount = Math.floor(state[fanIndex].qty / 2);
                state[fanIndex].dcCount = state[fanIndex].qty - state[fanIndex].bldcCount;
            }
        } else if (dcChecked) {
            state[fanIndex].fanMode = 'dc';
        } else if (bldcChecked) {
            state[fanIndex].fanMode = 'bldc';
        } else {
            state[fanIndex].fanMode = 'unknown';
        }
        renderCards();
        updateCalculations();
    }
};

fetchLocation();
renderCards();
updateTariffDisplay();
