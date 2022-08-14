import { useState, useEffect } from 'react'
// understand what Buffer does in more detail
import { Buffer } from 'buffer';
import axios from 'axios'
window.Buffer = Buffer;

const Display = ({ arr, index }) => {
  const countryObject = arr[index];
  const { capital, area, population, flags } = countryObject;
  const name = countryObject.name.common;
  const languages = countryObject.languages;
  // need to iterate through the languages object keys
  // some countries have more than one language they speak
  const languageObjectKeys = Object.keys(countryObject["languages"])
  const allLanguages = languageObjectKeys.map((language, index) => {
    return (
      <li key={index}>
        {languages[language]}
      </li>
    )
  });
  // console.log(countryObject);

  return (
    <article>
      <h1>{name}</h1>
      <p>
        {`capital ${capital}`}
        <br />
        {`area ${area}`}
        <br />
        {`population ${population}`}
      </p>
      <h3>languages: </h3>
      <ul>
        {allLanguages}
      </ul>
      <p>
        <img src={flags.png} alt="flag of the country" />
      </p>
    </article>
  )
}

const Button = ({ id, index, arr }) => {
  const [toggle, setToggle] = useState(false)

  return (
    <>
      <button id={id} onClick={() => {
        setToggle(!toggle)
      }}>
        {toggle ? "Hide" : "Show"}
      </button>

      {toggle && <Display arr={arr} index={index} />}
    </>
  )
};

const App = () => {
  const [input, setInput] = useState("");
  const [countries, setCountries] = useState([]);
  const [countryNames, setCountryNames] = useState([]);
  const [weather, setWeather] = useState([]);
  const [weatherWind, setWeatherWind] = useState([]);
  const [base64, setBase64] = useState();
  const [icon, setIcon] = useState([]);
  const [isLoadingIcon, setIsLoadingIcon] = useState(true)

  const api_key = process.env.REACT_APP_API_KEY;
  const filteredCountryNames = countryNames.filter(country => country.includes(input.toLowerCase()));
  const filteredCountryData = countries.filter(country => country.name.common.toLowerCase().includes(input.toLowerCase()));

  const handleOnChange = e => {
    setInput(e.target.value);
  }

  // grabs all of the country data
  useEffect(() => {
    axios
      .get('https://restcountries.com/v3.1/all')
      .then(response => {
        const countryData = response.data.map(country => country)
        const countryNames = response.data.map(countryName => countryName.name.common.toLowerCase())
        setCountries(countryData);
        setCountryNames(countryNames);
      })
  }, [])

  // grabs the weather data for one country
  useEffect(() => {
    if (filteredCountryData.length === 1) {
      const lat = filteredCountryData[0].latlng[0]
      const lon = filteredCountryData[0].latlng[1]
      axios
        .get(`
        https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${api_key}
        `)
        .then(response => {
          setWeather(response.data.main)
          setWeatherWind(response.data.wind)
          setIcon(response.data.weather[0])
        })
    }
  }, [api_key, filteredCountryData.length])

  // grabs the images for the weather data for one country
  useEffect(() => {
    // look into the BASE64 BUFFER DATA CHANGE FROM BINARY TO STRING
    // can learn a lot from that in how to stream data
    // also, only run the code when the url is complete so an error doesnt return in console
    if (filteredCountryData.length === 1 && icon.icon !== undefined) {
      const url = `https://openweathermap.org/img/wn/${icon.icon}@2x.png`
      axios
        .get(url, { responseType: "arraybuffer" })
        .then(response => setBase64(Buffer.from(response.data, "binary").toString("base64")))
        .catch(err => err)
    }
  }, [filteredCountryData.length, icon])

  // ATTEMPTING TO DO A DEBOUNCING INPUT
  // came up with this by myself... feels good!
  useEffect(() => {
    let timeout

    // if input and the name of the country is typed
    // after 1.00 seconds, the loading icon will 
    // display the weather and description

    // this also takes input of the country name not being
    // fully typed, so e.g. ---> can type chi and weather 
    // will load then can type china and it wont reload weather
    // since filteredcountrydata is length of one!!!

    // also, setisloadingicon is true since code is false
    // until one country and input is finished for 1.25 seconds 
    if (input && filteredCountryData.length === 1) {
      timeout = setTimeout(() => {
        setIsLoadingIcon(false)
      }, 1000);
    } else {
      setIsLoadingIcon(true)
    }

    return () => clearTimeout(timeout)
  }, [filteredCountryData.length, input])

  const convertKelvinToFahrenheit = num => {
    const celsius = num - 273
    const fahrenheit = (celsius * (9 / 5)) + 32
    return fahrenheit.toFixed(1);
  }

  const convertMeterSecondToMilesHour = num => {
    const mph = (num * 3600 * 3.28084) / 5280
    return Number(mph.toFixed(2))
  }

  const showCountry = () => {
    if (filteredCountryNames.length > 10) {
      return "Too many matches, specify another filter";

    } else if (filteredCountryNames.length > 1 && filteredCountryNames.length < 10) {
      // the Button component takes the information needed for each country and displays
      // the information when it is clicked
      // the logic is all in the component itself
      return filteredCountryNames.map((ele, index) => {
        return (
          <li key={index} style={{ listStyleType: 'none' }}>
            {ele}
            <Button
              id={index}
              arr={filteredCountryData}
              index={index}
            />
          </li>
        )
      })

      // note that countryObject returns a single object in an array
      // so index will always be 0
    } else if (filteredCountryNames.length === 1) {
      const capital = filteredCountryData[0].capital
      const temp = convertKelvinToFahrenheit(weather.temp)
      const tempFeelsLike = convertKelvinToFahrenheit(weather.feels_like)
      const windSpeed = convertMeterSecondToMilesHour(weatherWind.speed)
      const description = icon.description

      return (
        <>
          {isLoadingIcon ? <h1>Loading...</h1> :
            <>
              <Display arr={filteredCountryData} index={0} />
              <article>
                <h1>Weather in {capital}</h1>
                <p>temperature {temp} Fahrenheit</p>
                <p>currently feels like {tempFeelsLike} Fahrenheit</p>
                <img src={`data:image/jpeg;charset=utf-8;base64,${base64}`} alt="weather" />             {!isLoadingIcon && description}
                {/* if loadingicon is false then show the description with the image above */}
                <p>wind {windSpeed} mph</p>
              </article>
            </>
          }
        </>
      )
    }
  }

  return (
    <>
      <p>
        find countries
        <input
          type="text"
          onChange={handleOnChange} />
      </p>
      <section>
        {showCountry()}
      </section>
    </>
  )
}

export default App;
