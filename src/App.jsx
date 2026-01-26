import { useState, useEffect } from 'react'
import './App.css'
import cloudy from './assets/sun.png'
import humidityIcon from './assets/humidity.png'
import uvIcon from './assets/uv-index.png'
import visibilityIcon from './assets/visibility.png'
import windIcon from './assets/wind-socket.png'
import cloudyIcon from './assets/partly-cloudy.png'
import snowyIcon from './assets/snowy.png'
import stormIcon from './assets/thunder.png'
import rain from './assets/rain.png'
import fog from './assets/fog.png'
import loadingIcon from './assets/loading.png'
import sunIcon from './assets/partly-sunny-day.png'

function infoBox({ title, icon, value, unit }) {
  return (
    <div className="info-box">
      <div className="info-icon">
        <img src={icon} alt={title} />
      </div>
      <div className="info-text">
        <div className="info-title">{title}</div>
        <div className="info-value">
          {value}
          <span className="info-unit">{unit}</span>
        </div>
      </div>
    </div>
  )
}

function hourItem({ time, desc, icon, temp, active}) {
  // derive display icon from description when icon not provided
  const descLower = (desc || '').toLowerCase();
  const derivedIcon =  icon ||
    (descLower.includes('snow') ? snowyIcon :
     descLower.includes('rain') ? rain :
     (descLower.includes('storm') || descLower.includes('thunder')) ? stormIcon :
     descLower.includes('cloud') ? cloudyIcon :
     (descLower.includes('fog') || descLower.includes('mist')) ? fog :
     (descLower.includes('clear') ?  sunIcon:
     loadingIcon)
    );

  // // temperature template: add context emoji for very cold / very hot
  // const tempLabel = (() => {
  //   if (typeof temp !== 'number') return `${temp}°`;
  //   if (temp <= 0) return `❄️ ${temp}°`;
  //   if (temp >= 30) return `🔥 ${temp}°`;
  //   return `${temp}°`;
  // })();

  return (
    <div className={`hour-item ${active ? "active" : ""}`}>
      <div className="time">{time}</div>
      <div className="desc">{desc}</div>
      <img src={derivedIcon} className='icon' style={{width: "clamp(2.2rem, 3vw, 3rem)",
  height: "clamp(2.2rem, 3vw, 3rem)"}} alt={loadingIcon} />
      <div className="temp">{temp}°</div>
    </div>
  );
}

function App() {
  const [weatherData, setWeatherData] = useState({
    day: "Today",
    location: "Mumbai, India",
    weatherIcon: cloudy,
    condition: "Clear sky",
    temperature: 23,
    
    windSpeed: {
      title: "Wind Speed",
      icon: windIcon,
      value: 15,
      unit: " km/h"
    },
    humidity: {
      title: "Humidity",
      icon: humidityIcon,
      value: 78,
      unit: " %"
    },
    uvIndex: {
      title: "UV Index",
      icon: uvIcon,
      value: 5,
      unit: ""
    },
    visibility: {
      title: "Visibility",
      icon: visibilityIcon,
      value: 10,
      unit: " km"
    },
    
    hourlyForecast: [
      { time: "12:00", desc: "Snow", icon: snowyIcon, temp: 16, active: false },
      { time: "14:00", desc: "Rain", icon: rain, temp: 11, active: true },
      { time: "16:00", desc: "Cloudy", icon: cloudyIcon, temp: 22, active: false }
    ]
  });

  const [loading, setLoading] = useState(false);
  // const [error, setError] = useState(null);

  // Function to get city and country from coordinates via reverse geocoding
  const getLocationName = async (latitude, longitude) => {
    try {
      const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
      const response = await fetch(geoUrl, {
        headers: {
          'User-Agent': 'weatherscreen-app'
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Geocoding response:', data);
        const city = data.address?.city || data.address?.town || data.address?.municipality || data.address?.village || 'Unknown City';
        const country = data.address?.country || 'Unknown Country';
        const result = `${city}, ${country}`;
        console.log('Formatted location:', result);
        return result;
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
    }
    return `${latitude}, ${longitude}`;
  };

  const fetchWeatherData = async (latitude, longitude) => {
    setLoading(true);
    // setError(null);
    
    try {
      // VisualCrossing Timeline API
      // Paste your API key below (or replace with env var)
      const API_KEY = '4PE33W2L5YY3MDFM54GARMNVD';
      const apiUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${latitude},${longitude}?unitGroup=metric&key=${API_KEY}`;
      // https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/19.0896,72.8656?key=4PE33W2L5YY3MDFM54GARMNVD

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      // Map VisualCrossing response to our state shape
      const current = data.currentConditions || {};
      const today = Array.isArray(data.days) && data.days.length ? data.days[0] : null;
      const hours = (today && Array.isArray(today.hours)) ? today.hours : [];

      // Find current hour index based on current time
      const now = new Date();
      const currentHour = now.getHours();
      let currentHourIndex = hours.findIndex(h => {
        const hTime = h.datetime ? parseInt(h.datetime.split(':')[0]) : -1;
        return hTime === currentHour;
      });
      
      // If exact hour not found, default to 0; adjust if past most hours
      if (currentHourIndex < 0) {
        currentHourIndex = Math.min(currentHour, Math.max(0, hours.length - 3));
      }

      // Helper function to format time as 12-hour with AM/PM
      const formatTime12 = (datetime24) => {
        if (!datetime24) return '--:-- --';
        const [hour, minute] = datetime24.split(':');
        const h = parseInt(hour);
        const m = minute || '00';
        const ampm = h >= 12 ? 'pm' : 'am';
        const hour12 = h % 12 === 0 ? 12 : h % 12;
        return `${hour12}:${m} ${ampm}`;
      };

      // Map next 3 hours from current time
      const mappedHourly = [0, 1, 2].map(offset => {
        const h = hours[currentHourIndex + offset+1] || {};
        return {
          time: formatTime12(h.datetime),
          desc: h.conditions || h.icon || h.description || 'N/A',
          icon: null,
          temp: typeof h.temp === 'number' ? Math.round(h.temp) : (h.temp || 0),
          active: offset === 1
        };
      });

      // Get location name from coordinates if API doesn't provide it
      let locationName = data.resolvedAddress;
      // if (!locationName) {
        locationName = await getLocationName(latitude, longitude);
      // }

      setWeatherData(prevState => ({
        ...prevState,
        location: locationName || prevState.location,
        condition: current.conditions || prevState.condition,
        temperature: typeof current.temp === 'number' ? Math.round(current.temp) : prevState.temperature,
        windSpeed: { ...prevState.windSpeed, value: current.windspeed || prevState.windSpeed.value },
        humidity: { ...prevState.humidity, value: current.humidity || prevState.humidity.value },
        uvIndex: { ...prevState.uvIndex, value: current.uvindex || prevState.uvIndex.value },
        visibility: { ...prevState.visibility, value: current.visibility || prevState.visibility.value },
        hourlyForecast: mappedHourly.length ? mappedHourly : prevState.hourlyForecast
      }));
    } catch (err) {
      // setError(err.message);
      console.error('Error fetching weather data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherData(latitude, longitude);
        },
        (err) => {
          console.error('Geolocation error:', err);
        }
      );
    }
  }, []);

  return (
    <>
      <div>
        <div className="temperature">
          <div className="temp-left">
            <div className="day day-box">{weatherData.day}</div>
            <div className="location-row">
              <div className="location">{weatherData.location}</div>
              <img className="weather-icon" src={weatherData.weatherIcon} alt="weather" />
            </div>
            <div className="condition">{weatherData.condition}</div>
          </div>
          <div className="temp-right">
            {weatherData.temperature}°C
          </div>
        </div>

        <div className="info-boxes">
          {infoBox(weatherData.windSpeed)}
          {infoBox(weatherData.humidity)}
          {infoBox(weatherData.uvIndex)}
          {infoBox(weatherData.visibility)}
        </div>

        <div className="hourly-card">
          {weatherData.hourlyForecast[0] && hourItem(weatherData.hourlyForecast[0], false)}
          {weatherData.hourlyForecast[1] && hourItem(weatherData.hourlyForecast[1], false)}
          {weatherData.hourlyForecast[2] && hourItem(weatherData.hourlyForecast[2], false)}
        </div>

        {loading && <div className="loading">Loading weather data...</div>}
        {/* {error && <div className="error">Error: {error}</div>} */}
      </div>
    </>
  )
}

export default App
