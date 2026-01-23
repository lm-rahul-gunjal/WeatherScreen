import { useState, useEffect } from 'react'
import './App.css'
import cloudy from './assets/sun.png'
import humidityIcon from './assets/humidity.png'
import uvIcon from './assets/uv-index.png'
import visibilityIcon from './assets/visibility.png'
import windIcon from './assets/weather.png'

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

function hourItem({ time, desc, icon, temp, active = false }) {
  return (
    <div className={`hour-item ${active ? "active" : ""}`}>
      <div className="time">{time}</div>
      <div className="desc">{desc}</div>
      <div className="icon">{icon}</div>
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
      { time: "12:00", desc: "Snow", icon: "🌨️", temp: 16, active: false },
      { time: "14:00", desc: "Rain", icon: "⛈️", temp: 11, active: true },
      { time: "16:00", desc: "Cloudy", icon: "☁️", temp: 22, active: false }
    ]
  });

  const [loading, setLoading] = useState(false);
  // const [error, setError] = useState(null);

  const fetchWeatherData = async (latitude, longitude) => {
    setLoading(true);
    // setError(null);
    
    try {
      const apiUrl = `YOUR_API_ENDPOINT?lat=${latitude}&lon=${longitude}`;
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',

        }
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      
      setWeatherData(prevState => ({
        ...prevState,
        location: data.location || prevState.location,
        condition: data.condition || prevState.condition,
        temperature: data.temperature || prevState.temperature,
        windSpeed: { ...prevState.windSpeed, value: data.windSpeed || prevState.windSpeed.value },
        humidity: { ...prevState.humidity, value: data.humidity || prevState.humidity.value },
        uvIndex: { ...prevState.uvIndex, value: data.uvIndex || prevState.uvIndex.value },
        visibility: { ...prevState.visibility, value: data.visibility || prevState.visibility.value },
        hourlyForecast: data.hourlyForecast || prevState.hourlyForecast
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
          {weatherData.hourlyForecast[0] && hourItem(weatherData.hourlyForecast[0])}
          {weatherData.hourlyForecast[1] && hourItem(weatherData.hourlyForecast[1])}
          {weatherData.hourlyForecast[2] && hourItem(weatherData.hourlyForecast[2])}
        </div>

        {loading && <div className="loading">Loading weather data...</div>}
        {/* {error && <div className="error">Error: {error}</div>} */}
      </div>
    </>
  )
}

export default App
