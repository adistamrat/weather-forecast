# Atmos – Weather App

Open `index.html` in a browser (no build step, no API key).
Data: Open-Meteo (forecast, geocoding, air quality). Map: Windy embed.

## Suggestions for next steps
- Split `app.js` into modules (`api.js`, `render.js`, `ui.js`) as it grows.
- Add °C/°F and km/h/mph unit toggle, saved in localStorage.
- Remember the last searched city and restore it on load.
- Cache API responses for ~10 minutes to avoid refetching.
- Replace emoji with SVG weather icons to match the mockup's illustrations.
- Use a real sunset photo as the hero image (add it to an `assets/` folder).
- Add skeleton loaders instead of "--" while data loads.
- Debounce + abort stale search requests with `AbortController`.
- Add a service worker so the last forecast works offline.
- Convert to React (components: SearchBar, Hero, MetricCard, ForecastRow, PrecipChart).
- Add keyboard navigation (arrow keys) to the search results list.
- Write small unit tests for the delta and chart-path functions.

## Air Quality page suggestions
- Add an AQI colour legend (Good / Moderate / Unhealthy...) under the gauge.
- Show a 24-hour AQI trend line from the same API.
- Make the city pill a dropdown of recently searched cities.
- Notify the user when AQI crosses 100.
