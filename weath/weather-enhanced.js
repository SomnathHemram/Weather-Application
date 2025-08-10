const WEATHER_API_KEY = '08f57d3efd70f24d5b4e920a2b449c6b';

const locationInput = document.getElementById('location-input');
const searchBtn = document.getElementById('search-btn');
const locationBtn = document.getElementById('location-btn');
const celsiusBtn = document.getElementById('celsius-btn');
const fahrenheitBtn = document.getElementById('fahrenheit-btn');
const locationElement = document.getElementById('location');
const dateElement = document.getElementById('date');
const conditionElement = document.getElementById('condition');
const weatherIcon = document.getElementById('weather-icon');
const temperatureElement = document.getElementById('temperature');
const humidityElement = document.getElementById('humidity');
const windElement = document.getElementById('wind');
const pressureElement = document.getElementById('pressure');
const feelsLikeElement = document.getElementById('feels-like');
const mapImage = document.getElementById('map-image');
const hourlyContainer = document.getElementById('hourly-container');
const forecastContainer = document.getElementById('forecast-container');

const favoritesContainer = document.getElementById('favorites-container');


const particleConfigs = {
  snow: {
    particles: {
      number: { value: 100 },
      size: { value: 4 },
      color: { value: "#ffffff" },
      move: { direction: "bottom", speed: 1 },
      opacity: { value: 0.8 },
      shape: { type: "circle" }
    }
  },
  rain: {
    particles: {
      number: { value: 200 },
      size: { value: 2 },
      color: { value: "#9ecfff" },
      move: { direction: "bottom", speed: 5 },
      opacity: { value: 0.4 },
      shape: { type: "edge" }
    }
  },
  clear: {
    particles: {
      number: { value: 0 }
    }
  }
};
 

let currentUnit = 'celsius';
let currentWeatherData = null;
let currentForecast = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

function setWeatherBackground(condition) {
  const body = document.body;
  body.classList.remove('sunny', 'cloudy', 'rainy', 'snowy', 'stormy');

  const conditionLower = condition.toLowerCase();

  if (conditionLower.includes('sun')) {
    body.classList.add('sunny');
  } else if (conditionLower.includes('cloud')) {
    body.classList.add('cloudy');
  } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
    body.classList.add('rainy');
  } else if (conditionLower.includes('snow')) {
    body.classList.add('snowy');
  } else if (conditionLower.includes('storm') || conditionLower.includes('thunder')) {
    body.classList.add('stormy');
  } else {
    body.classList.add('cloudy'); // fallback
  }
}

function loadParticlesForWeather(description) {
  let type = 'clear';
  const desc = description.toLowerCase();

  if (desc.includes('snow')) type = 'snow';
  else if (desc.includes('rain') || desc.includes('drizzle')) type = 'rain';
  else if (desc.includes('clear') || desc.includes('sun')) type = 'sunny';
  else if (desc.includes('cloud')) type = 'cloudy';
  else type = 'clear';

  // Reset particles.js
  if (window.pJSDom && window.pJSDom.length > 0) {
    window.pJSDom[0].pJS.fn.vendors.destroypJS();
    window.pJSDom = [];
  }

  particlesJS("particles-js", particleConfigs[type]);
}


document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem("darkMode");
  if (savedTheme === "enabled") {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
  }

  const darkToggle = document.getElementById("dark-toggle");

  if (darkToggle) {
    darkToggle.addEventListener("click", () => {
      const isDark = document.body.classList.toggle("dark");
      localStorage.setItem("darkMode", isDark ? "enabled" : "disabled");
    });
  }

  // Load weather
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => getWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
      () => getWeatherByCity('London')
    );
  } else {
    getWeatherByCity('London');
  }

  // Event listeners
  searchBtn.addEventListener('click', () => {
    const city = locationInput.value.trim();
    if (city) getWeatherByCity(city);
  });

  locationInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') {
      const city = locationInput.value.trim();
      if (city) getWeatherByCity(city);
    }
  });

  locationBtn.addEventListener('click', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => getWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
      () => {
        alert('Location access denied.');
        getWeatherByCity('London');
      }
    );
  }
});


  celsiusBtn.addEventListener('click', () => {
    currentUnit = 'celsius';
    celsiusBtn.classList.add('active');
    fahrenheitBtn.classList.remove('active');
    updateTemperatureDisplay();
    updateForecastDisplay(currentForecast);
  });

  fahrenheitBtn.addEventListener('click', () => {
    currentUnit = 'fahrenheit';
    fahrenheitBtn.classList.add('active');
    celsiusBtn.classList.remove('active');
    updateTemperatureDisplay();
    updateForecastDisplay(currentForecast);
  });

  searchBtn.addEventListener('dblclick', () => {
    const city = locationInput.value.trim();
    if (city && !favorites.includes(city)) {
      favorites.push(city);
      localStorage.setItem('favorites', JSON.stringify(favorites));
      updateFavoritesUI();
    }
  });

  updateFavoritesUI();
});

// === Favorites UI ===
function updateFavoritesUI() {
  favoritesContainer.innerHTML = '';
  favorites.forEach(city => {
    const btn = document.createElement('button');
    btn.className = 'bg-white/20 dark:bg-white/10 px-3 py-1 rounded-lg';
    btn.textContent = city;
    btn.onclick = () => getWeatherByCity(city);
    favoritesContainer.appendChild(btn);
  });
}

// === Fetch Functions ===
async function getWeatherByCity(city) {
  const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`);
  const data = await res.json();
  if (data.cod !== 200) return alert(data.message);
  currentWeatherData = data;
  updateWeatherDisplay();
  getForecastByCoords(data.coord.lat, data.coord.lon);
  updateMap(data.coord.lat, data.coord.lon);
  getAlerts(data.coord.lat, data.coord.lon);
}

async function getWeatherByCoords(lat, lon) {
  const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`);
  const data = await res.json();
  if (data.cod !== 200) return alert(data.message);
  currentWeatherData = data;
  updateWeatherDisplay();
  getForecastByCoords(lat, lon);
  updateMap(lat, lon);
  getAlerts(lat, lon);
}

async function getForecastByCoords(lat, lon) {
  const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`);
  const data = await res.json();
  currentForecast = data.list.filter(item => item.dt_txt.includes("12:00:00")).slice(0, 10);

  updateForecastDisplay(currentForecast);
  updateHourlyDisplay(data.list.slice(0, 12));
}

// === Map & Alert ===


async function getAlerts(lat, lon) {
  const res = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`);
  const data = await res.json();
  const alertBox = document.getElementById("alert-box");
  if (data.alerts && data.alerts.length > 0) {
    document.getElementById("alert-title").textContent = data.alerts[0].event;
    document.getElementById("alert-desc").textContent = data.alerts[0].description;
    alertBox.classList.remove("hidden");
  } else {
    alertBox.classList.add("hidden");
  }
}

// === Display Updates ===
function updateWeatherDisplay() {
  const data = currentWeatherData;
  locationElement.textContent = `${data.name}, ${data.sys.country}`;
  dateElement.textContent = new Date().toLocaleDateString();
  conditionElement.textContent = data.weather[0].description;
    setWeatherBackground(data.weather[0].description);
    updateWeatherAnimation(data.weather[0].description);

    


  updateWeatherIcon(data.weather[0].icon);
  humidityElement.textContent = `${data.main.humidity}%`;
  windElement.textContent = `${(data.wind.speed * 3.6).toFixed(1)} km/h`;
  pressureElement.textContent = `${data.main.pressure} hPa`;
  updateTemperatureDisplay();
  updateExtendedInfo(data);
  locationInput.value = '';
}

function updateTemperatureDisplay() {
  const t = currentWeatherData.main;
  if (currentUnit === 'celsius') {
    temperatureElement.textContent = `${Math.round(t.temp)}°C`;
    feelsLikeElement.textContent = `${Math.round(t.feels_like)}°C`;
  } else {
    const toF = c => Math.round((c * 9) / 5 + 32);
    temperatureElement.textContent = `${toF(t.temp)}°F`;
    feelsLikeElement.textContent = `${toF(t.feels_like)}°F`;
  }
}

function updateWeatherIcon(code) {
  weatherIcon.innerHTML = `<img src="https://openweathermap.org/img/wn/${code}@2x.png" class="w-12 h-12 mx-auto">`;
}

function updateForecastDisplay(forecasts) {
  forecastContainer.innerHTML = '';
  forecasts.forEach(f => {
    const date = new Date(f.dt_txt);
    const icon = f.weather[0].icon;
    const desc = f.weather[0].description;
    const temp = currentUnit === 'celsius'
      ? `${Math.round(f.main.temp)}°C`
      : `${Math.round((f.main.temp * 9) / 5 + 32)}°F`;
    const card = document.createElement('div');
    card.className = 'bg-white/10 dark:bg-white/5 p-4 rounded-xl text-center';
    card.innerHTML = `
      <p>${date.toLocaleDateString(undefined, { weekday: 'short' })}</p>
      <img src="https://openweathermap.org/img/wn/${icon}@2x.png" class="w-12 mx-auto" />
      <p class="text-lg font-bold">${temp}</p>
      <p class="text-sm text-white/70">${desc}</p>
    `;
    forecastContainer.appendChild(card);
  });
  updateTempChart(forecasts);
}

function updateWeatherAnimation(description) {
  const animContainer = document.getElementById("weather-animation");
  animContainer.className = ""; // reset any previous class

  const desc = description.toLowerCase();

  if (desc.includes("rain") || desc.includes("drizzle")) {
    animContainer.classList.add("rain");
  } else if (desc.includes("snow")) {
    animContainer.classList.add("snow");
  } else if (desc.includes("clear") || desc.includes("sun")) {
    animContainer.classList.add("sunny");
  } else if (desc.includes("storm") || desc.includes("thunder")) {
    animContainer.classList.add("stormy", "flash");
  } else if (desc.includes("cloud")) {
    animContainer.classList.add("cloudy");
  }
}





function updateHourlyDisplay(hourly) {
  hourlyContainer.innerHTML = '';
  hourly.forEach(hour => {
    const date = new Date(hour.dt_txt);
    const icon = hour.weather[0].icon;
    const temp = currentUnit === 'celsius'
      ? `${Math.round(hour.main.temp)}°C`
      : `${Math.round((hour.main.temp * 9) / 5 + 32)}°F`;
    const div = document.createElement('div');
    div.className = 'min-w-[80px] text-center bg-white/10 dark:bg-white/5 rounded-lg p-2';
    div.innerHTML = `
      <p class="text-sm">${date.getHours()}:00</p>
      <img src="https://openweathermap.org/img/wn/${icon}.png" class="w-8 mx-auto" />
      <p class="text-md font-bold">${temp}</p>
    `;
    hourlyContainer.appendChild(div);
  });
}

let tempChart;
function updateTempChart(forecasts) {
  const ctx = document.getElementById('temp-chart').getContext('2d');

// Example data (replace with your real data)
const labels = forecasts.map(f => new Date(f.dt_txt).toLocaleDateString(undefined, { weekday: 'short' }));
const temperatures = forecasts.map(f => currentUnit === 'celsius'
  ? Math.round(f.main.temp)
  : Math.round((f.main.temp * 9) / 5 + 32));
const precipitation = forecasts.map(f => f.pop ? Math.round(f.pop * 100) : 0);

if (tempChart) tempChart.destroy();
tempChart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: labels,
    datasets: [
      {
        type: 'line',
        label: 'Temperature (°C)',
        data: temperatures,
        borderColor: 'orange',
        backgroundColor: 'orange',
        yAxisID: 'y',
        tension: 0.3,
        fill: false
      },
      {
        type: 'bar',
        label: 'Precipitation (mm)',
        data: precipitation,
        backgroundColor: 'rgba(0, 123, 255, 0.5)',
        yAxisID: 'y1'
      }
    ]
  },
  options: {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false
    },
    scales: {
      y: {
        type: 'linear',
        position: 'left',
        title: {
          display: true,
          text: 'Temperature (°C)'
        },
        ticks: {
          color: '#fff'
        }
      },
      y1: {
        type: 'linear',
        position: 'right',
        grid: {
          drawOnChartArea: false
        },
        title: {
          display: true,
          text: 'Precipitation (mm)'
        },
        ticks: {
          color: '#fff'
        }
      },
      x: {
        ticks: {
          color: '#fff'
        }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: '#fff'
        }
      }
    }
  }
});

}

function updateExtendedInfo(data) {
  document.getElementById('real-feel').textContent = `${Math.round(data.main.feels_like)}°`;

  const sunrise = new Date(data.sys.sunrise * 1000);
  document.getElementById('sunrise').textContent = sunrise.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const sunset = new Date(data.sys.sunset * 1000);
  document.getElementById('sunset').textContent = sunset.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  document.getElementById('pressure2').textContent = `${data.main.pressure} hPa`;

  getUVIndex(data.coord.lat, data.coord.lon);
  getAQI(data.coord.lat, data.coord.lon);
}


async function getUVIndex(lat, lon) {
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly,daily,alerts&appid=${WEATHER_API_KEY}&units=metric`);
    const data = await res.json();

    if (data.current && typeof data.current.uvi !== "undefined") {
      const uvValue = data.current.uvi;
      document.getElementById('uv-index').textContent = `${uvValue} (${getUVLevel(uvValue)})`;
    } else {
      console.error("UV data missing:", data);
      document.getElementById('uv-index').textContent = 'N/A';
    }
  } catch (err) {
    console.error("Error fetching UV Index:", err);
    document.getElementById('uv-index').textContent = 'N/A';
  }
}

function getUVLevel(value) {
  if (value < 3) return 'Low';
  if (value < 6) return 'Moderate';
  if (value < 8) return 'High';
  if (value < 11) return 'Very High';
  return 'Extreme';
}



async function getAQI(lat, lon) {
  const res = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}`);
  const data = await res.json();
  const level = ["Good", "Fair", "Moderate", "Poor", "Very Poor"];
  document.getElementById('aqi').textContent = level[data.list[0].main.aqi - 1];
}
