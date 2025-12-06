# CS333A3
Visualizationo for global earthquake explor (2011-2016)

# Group Member:
Xinwei Zhang

## Project Structure：
- index.html
- writeup.pdf
- js/map.js
- js/histogram.js
- js/timeline.js
- data/world-110m.json
- data/earthquakes_2011_2016_clean.csv

## How to Run the Application:
open with a local live server (like http://localhost:8000/)

## How to Use the Visualization:

**Pan:** Click and drag the map in any direction 


**Timeline:**
**How to use it:**:
- Click + drag to select a time interval
- Map updates to show only events in this date range
- A date label shows the selected start & end dates
- Click outside the timeline bars of the Timeline area → Clears selection

**Magnitude Histogram:**
**How to use it:**:
- Click + drag across bars → Select a magnitude range
- Map updates instantly to show only earthquakes within that range
- Click outside the histogram bars of the Magnitude Histogram area→ Clears selection

**Search by Country full name:**:
**How to use it:**:
- Enter a full country name (e.g., "Japan", "Chile")
- Press Enter or click Search
- Map zooms to that country and shows only its earthquakes
- Timeline + Histogram filters still apply on top of search results
- When finish searching click clear to remove text in the search box

**Reset Button:**
- Reset every filter and shows the origin map.

**Zoom Controls:**
**How to use it:**:
- Buttons:
- Zoom In (+)
- Zoom Out (-)
- These buttons supplement scroll-zoom and provide more controlled navigation.

**Notes:**
- The visualization is optimized for modern desktop browsers. (Google chrome performs better when test) 
- The map uses a Mercator projection and may visually enlarge high-latitude regions.
- Country detection may not be perfect for earthquakes near borders or in open ocean.
