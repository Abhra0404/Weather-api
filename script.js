// CRITICAL: Replace 'YOUR_API_KEY_HERE' with your actual OpenWeatherMap API key.
        // You can get one for free at https://openweathermap.org/api
        const API_KEY = 'edfb553d06088616fc94fec529213956';
        const BASE_URL = 'https://api.openweathermap.org/data/2.5/';

        const cityInput = document.getElementById('cityInput');
        const searchButton = document.getElementById('searchButton');
        const backButton = document.getElementById('backButton');
        const buttonText = document.getElementById('buttonText');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const weatherDisplay = document.getElementById('weatherDisplay');
        const messageDisplay = document.getElementById('messageDisplay');
        const forecastDisplay = document.getElementById('forecastDisplay');
        const forecastContainer = document.getElementById('forecastContainer');
        const dashboardContainer = document.getElementById('dashboardContainer');
        const recentSearchesContainer = document.getElementById('recentSearchesContainer');
        const recentSearchesSection = document.getElementById('recentSearches');
        const stylizedBackground = document.getElementById('stylized-background');
        const unitToggle = document.getElementById('unitToggle');
        const themeToggle = document.getElementById('themeToggle');
        const locationButton = document.getElementById('locationButton');

        const cityNameEl = document.getElementById('cityName');
        const currentDateEl = document.getElementById('currentDate');
        const weatherIconEl = document.getElementById('weatherIcon');
        const temperatureEl = document.getElementById('temperature');
        const weatherConditionEl = document.getElementById('weatherCondition');
        const humidityEl = document.getElementById('humidity');
        const windSpeedEl = document.getElementById('windSpeed');
        const feelsLikeEl = document.getElementById('feelsLike');
        const sunriseTimeEl = document.getElementById('sunriseTime');
        const sunsetTimeEl = document.getElementById('sunsetTime');

        let isCelsius = true;
        let isDarkMode = false;
        let lastCurrentWeather = null;
        let lastForecastData = null;

        const sunIcon = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21.75 12a9.75 9.75 0 11-9.75-9.75c.578 0 1.144.059 1.705.17A8.25 8.25 0 0021.75 12z" />
            </svg>
        `;
        const moonIcon = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.846 6.646a.75.75 0 01.105 1.054l-1.06 1.06a.75.75 0 11-1.054-1.053l1.06-1.06a.75.75 0 011.054-.106zM12 18a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V18a.75.75 0 01.75-.75zM6.154 6.646a.75.75 0 011.054-.105l1.06 1.06a.75.75 0 01-1.053 1.053l-1.06-1.06a.75.75 0 01-.106-1.054zM2.25 12a.75.75 0 01.75-.75h2.25a.75.75 0 010 1.5H3a.75.75 0 01-.75-.75zM18.846 17.354a.75.75 0 01-.105-1.054l1.06-1.06a.75.75 0 111.054 1.053l-1.06 1.06a.75.75 0 01-1.054.106zM17.354 18.846a.75.75 0 01-1.054.105l-1.06-1.06a.75.75 0 111.053-1.053l1.06 1.06a.75.75 0 01.106 1.054zM7.354 18.846a.75.75 0 01-1.054-1.054l1.06-1.06a.75.75 0 011.054 1.053l-1.06 1.06z" />
            </svg>
        `;

        searchButton.addEventListener('click', () => searchWeather(cityInput.value.trim()));
        backButton.addEventListener('click', () => {
            clearWeatherDisplay();
            updateDashboardBackground('default');
        });
        cityInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                searchWeather(cityInput.value.trim());
            }
        });
        unitToggle.addEventListener('click', () => {
            isCelsius = !isCelsius;
            unitToggle.textContent = `Switch to °${isCelsius ? 'F' : 'C'}`;
            if (lastCurrentWeather && lastForecastData) {
                displayWeather(lastCurrentWeather);
                displayForecast(lastForecastData);
            }
        });

        themeToggle.addEventListener('click', () => {
            isDarkMode = !isDarkMode;
            document.body.classList.toggle('dark-mode', isDarkMode);
            document.body.classList.toggle('light-mode', !isDarkMode);
            
            themeToggle.innerHTML = isDarkMode ? moonIcon : sunIcon;

            updateDashboardBackground(lastCurrentWeather ? lastCurrentWeather.weather[0].main : 'default');
        });

        locationButton.addEventListener('click', () => {
            if (navigator.geolocation) {
                setLoadingState(true);
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const { latitude, longitude } = position.coords;
                        searchWeatherByCoords(latitude, longitude);
                    },
                    (error) => {
                        console.error('Geolocation error:', error);
                        setLoadingState(false);
                        displayMessage('Unable to retrieve your location. Please enter a city manually.');
                    }
                );
            } else {
                displayMessage('Geolocation is not supported by your browser.');
            }
        });
        
        // Load recent searches on page load
        document.addEventListener('DOMContentLoaded', () => {
            loadRecentSearches();
        });

        async function searchWeather(city) {
            if (city === '') {
                displayMessage('Please enter a city name.');
                return;
            }

            if (API_KEY === 'YOUR_API_KEY_HERE') {
                displayMessage('Please replace the placeholder API key in the code to get started.');
                console.error("API key is not set. Please replace 'YOUR_API_KEY_HERE' in the script.");
                return;
            }
            
            setLoadingState(true);
            try {
                const [currentWeather, forecastData] = await Promise.all([
                    fetchWeather(`weather?q=${city}`),
                    fetchWeather(`forecast?q=${city}`)
                ]);

                if (currentWeather.cod !== 200) {
                    throw new Error(currentWeather.message || 'City not found.');
                }
                if (forecastData.cod !== '200') {
                    throw new Error(forecastData.message || 'Forecast not available.');
                }
                
                // Store fetched data globally for unit conversion
                lastCurrentWeather = currentWeather;
                lastForecastData = forecastData;

                updateDashboardBackground(lastCurrentWeather.weather[0].main);
                displayWeather(lastCurrentWeather);
                displayForecast(lastForecastData);
                saveSearch(currentWeather.name); // Save the city after a successful search
                loadRecentSearches(); // Update the recent searches list

            } catch (error) {
                console.error('Error fetching weather data:', error);
                displayMessage(`Error: ${error.message}`);
                clearWeatherDisplay();
                updateDashboardBackground('default');
            } finally {
                setLoadingState(false);
            }
        }

        async function searchWeatherByCoords(lat, lon) {
            if (API_KEY === 'YOUR_API_KEY_HERE') {
                displayMessage('Please replace the placeholder API key in the code to get started.');
                console.error("API key is not set. Please replace 'YOUR_API_KEY_HERE' in the script.");
                setLoadingState(false);
                return;
            }

            setLoadingState(true);
            try {
                const [currentWeather, forecastData] = await Promise.all([
                    fetchWeather(`weather?lat=${lat}&lon=${lon}`),
                    fetchWeather(`forecast?lat=${lat}&lon=${lon}`)
                ]);

                if (currentWeather.cod !== 200) {
                    throw new Error(currentWeather.message || 'Location not found.');
                }
                if (forecastData.cod !== '200') {
                    throw new Error(forecastData.message || 'Forecast not available.');
                }

                lastCurrentWeather = currentWeather;
                lastForecastData = forecastData;

                updateDashboardBackground(lastCurrentWeather.weather[0].main);
                displayWeather(lastCurrentWeather);
                displayForecast(lastForecastData);
                saveSearch(currentWeather.name);
                loadRecentSearches();

            } catch (error) {
                console.error('Error fetching weather data:', error);
                displayMessage(`Error: ${error.message}`);
                clearWeatherDisplay();
                updateDashboardBackground('default');
            } finally {
                setLoadingState(false);
            }
        }

        async function fetchWeather(endpoint) {
            const url = `${BASE_URL}${endpoint}&units=metric&appid=${API_KEY}`;
            const response = await fetch(url);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Network response was not ok');
            }
            return response.json();
        }

        // Helper functions for unit conversion
        function celsiusToFahrenheit(celsius) {
            return (celsius * 9/5) + 32;
        }

        function displayWeather(data) {
            const { name, main, weather, wind, sys } = data;
            const weatherIconCode = weather[0].icon;
            const weatherIconUrl = `https://openweathermap.org/img/wn/${weatherIconCode}@2x.png`;
            const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

            // Convert temperatures if not in Celsius
            const currentTemp = isCelsius ? main.temp : celsiusToFahrenheit(main.temp);
            const feelsLikeTemp = isCelsius ? main.feels_like : celsiusToFahrenheit(main.feels_like);
            const unit = isCelsius ? 'C' : 'F';

            // Convert sunrise and sunset Unix timestamps to HH:MM format
            const sunrise = new Date(sys.sunrise * 1000);
            const sunset = new Date(sys.sunset * 1000);
            const sunriseString = sunrise.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            const sunsetString = sunset.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            cityNameEl.textContent = name;
            currentDateEl.textContent = date;
            weatherIconEl.src = weatherIconUrl;
            weatherIconEl.alt = weather[0].description;
            temperatureEl.textContent = `${Math.round(currentTemp)}°${unit}`;
            weatherConditionEl.textContent = weather[0].description;
            humidityEl.textContent = `${main.humidity}%`;
            windSpeedEl.textContent = `${Math.round(wind.speed)} m/s`;
            feelsLikeEl.textContent = `${Math.round(feelsLikeTemp)}°${unit}`;
            sunriseTimeEl.textContent = sunriseString;
            sunsetTimeEl.textContent = sunsetString;

            weatherDisplay.classList.remove('hidden');
            messageDisplay.classList.add('hidden');
            
            // Add fade-in class to the new display content
            weatherDisplay.classList.add('fade-in');
        }

        function displayForecast(data) {
            forecastContainer.innerHTML = '';
            const forecastList = data.list;
            const today = new Date().toDateString();

            const dailyForecast = {};
            forecastList.forEach(item => {
                const date = new Date(item.dt_txt).toLocaleDateString();
                const day = new Date(item.dt_txt).toDateString();
                if (day === today) return;

                if (!dailyForecast[date]) {
                    dailyForecast[date] = {
                        date: new Date(item.dt_txt),
                        temp: [],
                        icon: item.weather[0].icon,
                        description: item.weather[0].description
                    };
                }
                dailyForecast[date].temp.push(item.main.temp);
            });

            const sortedDays = Object.values(dailyForecast).sort((a, b) => a.date - b.date);
            const threeDayForecast = sortedDays.slice(0, 3);
            
            if (threeDayForecast.length === 0) {
                 displayMessage('3-day forecast not available for this location.');
                 forecastDisplay.classList.add('hidden');
                 return;
            }

            threeDayForecast.forEach(day => {
                const avgTempC = day.temp.reduce((sum, t) => sum + t, 0) / day.temp.length;
                const minTempC = Math.min(...day.temp);
                const maxTempC = Math.max(...day.temp);
                const unit = isCelsius ? 'C' : 'F';

                const avgTemp = isCelsius ? avgTempC : celsiusToFahrenheit(avgTempC);
                const minTemp = isCelsius ? minTempC : celsiusToFahrenheit(minTempC);
                const maxTemp = isCelsius ? maxTempC : celsiusToFahrenheit(maxTempC);

                const forecastItem = document.createElement('div');
                forecastItem.className = 'glass-effect rounded-xl shadow-lg p-4 text-center transition-transform duration-300 transform hover:scale-105';
                forecastItem.innerHTML = `
                    <h4 class="font-bold text-lg">${day.date.toLocaleDateString('en-US', { weekday: 'short' })}</h4>
                    <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="Weather Icon" class="w-16 h-16 mx-auto icon-shadow">
                    <p class="text-sm capitalize mt-1 opacity-90">${day.description}</p>
                    <p class="text-lg font-semibold mt-2">${Math.round(avgTemp)}°${unit}</p>
                    <p class="text-xs opacity-70">Low: ${Math.round(minTemp)}°${unit} | High: ${Math.round(maxTemp)}°${unit}</p>
                `;
                forecastContainer.appendChild(forecastItem);
            });

            forecastDisplay.classList.remove('hidden');
            // Add fade-in class to the new display content
            forecastDisplay.classList.add('fade-in');
        }

        function setLoadingState(isLoading) {
            searchButton.disabled = isLoading;
            buttonText.classList.toggle('hidden', isLoading);
            loadingSpinner.classList.toggle('hidden', !isLoading);
            cityInput.disabled = isLoading;
            cityInput.focus();
        }

        function displayMessage(msg) {
            messageDisplay.textContent = msg;
            messageDisplay.classList.remove('hidden');
            weatherDisplay.classList.add('hidden');
            forecastDisplay.classList.add('hidden');
        }

        function clearWeatherDisplay() {
            weatherDisplay.classList.add('hidden');
            forecastDisplay.classList.add('hidden');
            messageDisplay.classList.remove('hidden');
            cityInput.value = '';
            lastCurrentWeather = null;
            lastForecastData = null;
            isCelsius = true;
            unitToggle.textContent = 'Switch to °F';
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
            
            // Set the sun icon back
            themeToggle.innerHTML = sunIcon;
            isDarkMode = false;
            updateDashboardBackground('default');
        }
        
        function updateDashboardBackground(weatherCondition) {
            const body = document.body;
            body.className = body.className.split(' ').filter(c => !c.startsWith('bg-gradient-')).join(' ');

            stylizedBackground.style.display = 'none';

            let gradientClass = '';
            switch (weatherCondition.toLowerCase()) {
                case 'clear':
                    gradientClass = `bg-gradient-clear`;
                    break;
                case 'clouds':
                    gradientClass = `bg-gradient-clouds`;
                    break;
                case 'rain':
                case 'drizzle':
                    gradientClass = `bg-gradient-rain`;
                    break;
                case 'thunderstorm':
                    gradientClass = `bg-gradient-thunderstorm`;
                    break;
                case 'snow':
                    gradientClass = `bg-gradient-snow`;
                    break;
                default:
                    body.classList.add('bg-gradient-default');
                    stylizedBackground.style.display = 'block';
                    return;
            }
            body.classList.add(gradientClass);
        }

        // Saves a city to localStorage
        function saveSearch(city) {
            try {
                let searches = JSON.parse(localStorage.getItem('weatherSearches') || '[]');
                // Remove existing city to avoid duplicates
                searches = searches.filter(s => s.toLowerCase() !== city.toLowerCase());
                // Add new city to the beginning and limit to 5 searches
                searches.unshift(city);
                if (searches.length > 5) {
                    searches = searches.slice(0, 5);
                }
                localStorage.setItem('weatherSearches', JSON.stringify(searches));
            } catch (e) {
                console.error('Could not save to localStorage:', e);
            }
        }

        // Loads and displays recent searches from localStorage
        function loadRecentSearches() {
            try {
                const searches = JSON.parse(localStorage.getItem('weatherSearches') || '[]');
                recentSearchesContainer.innerHTML = '';
                if (searches.length > 0) {
                    searches.forEach(city => {
                        const button = document.createElement('button');
                        button.textContent = city;
                        button.className = 'px-4 py-2 rounded-full theme-button hover:bg-white/40 transition duration-300 ease-in-out';
                        button.addEventListener('click', () => {
                            cityInput.value = city;
                            searchWeather(city);
                        });
                        recentSearchesContainer.appendChild(button);
                    });
                    recentSearchesSection.classList.remove('hidden');
                } else {
                    recentSearchesSection.classList.add('hidden');
                }
            } catch (e) {
                console.error('Could not load from localStorage:', e);
                recentSearchesSection.classList.add('hidden');
            }
        }

        displayMessage('Enter a city name above to get the weather forecast.');

