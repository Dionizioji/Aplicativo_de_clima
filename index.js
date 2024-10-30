// APIs
const weatherUrl = "https://api.open-meteo.com/v1/forecast"
const geocodingUrl = "https://geocoding-api.open-meteo.com/v1/search"

// Formatar a data em DD/MM
const formatDate = (date) => {
    const parsedDate = new Date(date);
    const day = String(parsedDate.getDate()).padStart(2, '0')
    const month = String(parsedDate.getMonth() +1).padStart(2, '0')
    return `${day}/${month}`
}

// Determinar o ícone do clima
const getWeatherIcon = (condition) => {
    switch (condition) {
        case "Tempestuoso":
            return "images/stormy.png"
        case "Chuvoso":
            return "images/rainy.png"
        case "Nublado":
        case "Parcialmente Nublado":
            return "images/partlyCloudy.png"
        default:
            return "images/sunny.png"
    }
}

// Condição do clima
const getWeatherCondition = (precipitationProbability, humidity, windspeed) => {
    if (precipitationProbability > 80) {
        if (windspeed > 30) return "Tempestuoso"
        return "Chuvoso"
    } else if (precipitationProbability > 50) {
        return "Chuvoso"
    } else if (humidity > 85 && precipitationProbability < 20) {
        return "Neblina"
    } else if (humidity > 70) {
        return "Nublado"
    } else if (humidity > 40) {
        return "Parcialmente Nublado"
    } else {
        return "Ensolarado"
    }
}

// Coordenadas da cidade
const fetchCityCoordinates = async (city) => {
    try {
        const response = await fetch(`${geocodingUrl}?name=${city}`)
        const data = await response.json()

        if (data.results && data.results.length > 0) {
            const { latitude, longitude, name } = data.results[0]
            return { latitude, longitude, name }
        } else {
            throw new Error("Cidade não encontrada.")
        }
    } catch (error) {
        throw new Error("Erro ao buscar coordenadas: " + error.message)
    }
}

// Buscar dados climáticos
const fetchWeatherData = async (latitude, longitude) => {
    const params = {
        latitude,
        longitude,
        daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_mean,windspeed_10m_max",
        timezone: "America/Sao_Paulo"
    };
    const queryString = new URLSearchParams(params).toString()
    const response = await fetch(`${weatherUrl}?${queryString}`)
    
    if (!response.ok) {
        throw new Error("Erro ao buscar dados do clima")
    }
    
    return await response.json()
}

// Renderizar os dados do dia atual
const renderTodayWeather = (todayData, cityName) => {
    const todayDetails = document.getElementById("today-details")
    const todayIcon = document.getElementById("today-icon")

    const condition = getWeatherCondition(todayData.precipitationProbability, 60)
    todayIcon.src = getWeatherIcon(condition)
    
    todayDetails.innerHTML = `
        <h3>${cityName}</h3>
        <p>Temperatura: ${todayData.temperature}°C</p>
        <p>Chuva: ${todayData.precipitationProbability}%</p>
        <p>Vento: ${todayData.windspeed.toFixed(1)} km/h</p>
        <p>Condição: ${condition}</p>
    `
}

// Previsão semanal com atualização dos ícones
const renderWeekWeather = (weekData) => {
    const weekWeather = document.getElementById("week-weather")
    weekWeather.innerHTML = weekData.map(day => `
        <div class="day-forecast">
            <h4>${formatDate(day.date)}</h4>
            <img src="${getWeatherIcon(day.condition)}" alt="${day.condition}">
            <p>${day.temperature}°C</p>
            <p>${day.precipitationProbability}% chuva</p>
        </div>
    `).join('')
}

// Renderizar os parâmetros principais
const renderGraphics = (data) => {
    const windGraphic = document.querySelector(".windy-graphic")
    const tempGraphic = document.querySelector(".temperature-graphic")
    const rainGraphic = document.querySelector(".rain-graphic")

    windGraphic.innerHTML = `Velocidade média: ${data.windspeed.toFixed(1)} km/h`
    tempGraphic.innerHTML = `Temperatura média: ${data.temperature}°C`
    rainGraphic.innerHTML = `Probabilidade de chuva: ${data.precipitationProbability}%`
}

// Processar os dados climáticos
const processWeatherData = async (city) => {
    const searchBar = document.getElementById("app-search-bar")
    try {
        const { latitude, longitude, name } = await fetchCityCoordinates(city)
        const data = await fetchWeatherData(latitude, longitude)
        
        const today = {
            temperature: ((data.daily.temperature_2m_max[0] + data.daily.temperature_2m_min[0]) / 2).toFixed(1),
            precipitationProbability: data.daily.precipitation_probability_mean[0],
            windspeed: data.daily.windspeed_10m_max[0]
        }

        const weekForecast = data.daily.time.slice(1, 7).map((date, i) => ({
            date,
            temperature: ((data.daily.temperature_2m_max[i+1] + data.daily.temperature_2m_min[i+1]) / 2).toFixed(1),
            precipitationProbability: data.daily.precipitation_probability_mean[i+1],
            condition: getWeatherCondition(data.daily.precipitation_probability_mean[i+1], 60)
        }))

        renderTodayWeather(today, name)
        renderWeekWeather(weekForecast)
        renderGraphics(today)
        
        searchBar.value = name
    } catch (error) {
        searchBar.value = error.message
        console.error("Erro:", error)
    }
}

// Listeners 
document.getElementById("app-search-bar").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        const city = event.target.value.trim()
        if (city) {
            processWeatherData(city)
        } else {
            event.target.value = "Digite uma cidade válida."
        }
    }
})

document.getElementById("switch-mode-btn").addEventListener('click', () => {
    const root = document.documentElement
    const button = document.getElementById("switch-mode-btn")
    
    if (button.dataset.toggle === 'regular') {
        root.style.setProperty('--primary-color', '#fae9e5')
        root.style.setProperty('--secondary-color', '#730000')
        button.dataset.toggle = 'dark'
    } else {
        root.style.setProperty('--primary-color', '#730000')
        root.style.setProperty('--secondary-color', '#fae9e5')
        button.dataset.toggle = 'regular'
    }
})

document.getElementById("clean-app-btn").addEventListener('click', () => {
    document.getElementById("app-search-bar").value = ""
    document.getElementById("today-details").innerHTML = ""
    document.getElementById("week-weather").innerHTML = ""
    document.getElementById("today-icon").src = "images/sunny.png"
    document.querySelector(".windy-graphic").innerHTML = ""
    document.querySelector(".temperature-graphic").innerHTML = ""
    document.querySelector(".rain-graphic").innerHTML = ""
})

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', () => {
    const defaultCity = "Ouro Preto"
    processWeatherData(defaultCity)
})
