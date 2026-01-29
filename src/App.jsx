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

function saveLocation(latitude, longitude,city,country) {
  localStorage.setItem("user_location", JSON.stringify({ latitude, longitude, city, country,timestamp: Date.now() }));
}

function getSavedLocation() {
  const locationData = localStorage.getItem("user_location");
  if (locationData) {
    return JSON.parse(locationData);
  }
  return null;
}
function hourItem({ time, desc, icon, temp, active}) {
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

  const [coords, setCoords] = useState(null);
 
  const getLocationName = async (latitude, longitude) => {
    try {
const geoUrl = `/geo/reverse?format=json&lat=${latitude}&lon=${longitude}`;
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
        saveLocation(latitude, longitude, city, country);
        console.log('Location saved to localStorage.');
        return result;
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
    }
    return `${latitude}, ${longitude}`;
  };

  const fetchWeatherData = async (latitude, longitude) => {
   
    try {
   
      const API_KEY = '4PE33W2L5YY3MDFM54GARMNVD';
      const apiUrl = `/api/VisualCrossingWebServices/rest/services/timeline/${latitude},${longitude}?unitGroup=metric&key=${API_KEY}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();

      const current = data.currentConditions || {};
      const today = Array.isArray(data.days) && data.days.length ? data.days[0] : null;
      const hours = (today && Array.isArray(today.hours)) ? today.hours : [];

      const now = new Date();
      const currentHour = now.getHours();
      let currentHourIndex = hours.findIndex(h => {
        const hTime = h.datetime ? parseInt(h.datetime.split(':')[0]) : -1;
        return hTime === currentHour;
      });
      
      if (currentHourIndex < 0) {
        currentHourIndex = Math.min(currentHour, Math.max(0, hours.length - 3));
      }

      const formatTime12 = (datetime24) => {
        if (!datetime24) return '--:-- --';
        const [hour, minute] = datetime24.split(':');
        const h = parseInt(hour);
        const m = minute || '00';
        const ampm = h >= 12 ? 'pm' : 'am';
        const hour12 = h % 12 === 0 ? 12 : h % 12;
        return `${hour12}:${m} ${ampm}`;
      };

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

      let locationName = data.resolvedAddress;

      const savedLocation = getSavedLocation();
      console.log('Saved location from localStorage:', savedLocation);


      if(savedLocation !== null ){
        console.log(`Using saved location: ${savedLocation.city}, ${savedLocation.country}`);
        // setWeatherData(prevState => ({
        //   ...prevState,
        //   location: `${savedLocation.city}, ${savedLocation.country}`
        // }));

        locationName = `${savedLocation.city}, ${savedLocation.country}`;
      }else{

        locationName = await getLocationName(latitude, longitude);
      }

      

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
      console.error('Error fetching weather data:', err);
    } 
  };

  useEffect(() => {

    const savedLocation = getSavedLocation();
    console.log('Saved location from localStorage:', savedLocation);

    if (savedLocation !== null) {
      const { latitude, longitude } = savedLocation;
      console.log('Using saved location:', latitude, longitude);
      setCoords({ latitude, longitude });
      fetchWeatherData(latitude, longitude);
    }
      else  if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          console.log('User coordinates:', latitude, longitude);
          setCoords({ latitude, longitude });
          fetchWeatherData(latitude, longitude);
        },
        (err) => {
          console.error('Geolocation error:', err);
        }
      );
    
  }
  }, []);

  useEffect(() => {
    if (!coords) return;

    const interval = setInterval(() => {
      console.log('Auto-fetching weather data...');
      fetchWeatherData(coords.latitude, coords.longitude);
    }, 15 * 60 * 1000); 

    return () => clearInterval(interval);
  }, [coords]);


  

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

       
      </div>
     
    </>
  )
}

export default App
