const width = window.innerWidth * 0.92;
const height = window.innerHeight * 0.75;


const svg = d3.select("#map")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

const tooltip = d3.select("#tooltip");

const projection = d3.geoMercator()
  .scale(width / 6.5)
  .translate([width / 2, height / 1.55]);

const path = d3.geoPath().projection(projection);


const color = d3.scaleSequential(d3.interpolateTurbo).domain([700, 0]);

function quakeSymbol(d) {
  if (d.Magnitude >= 7.0) return 2;  
  if (d.Magnitude >= 6.0) return 1;   
  return 0;                           
}

const shapeScale = d3.scaleOrdinal()
  .domain([0, 1, 2])
  .range([d3.symbolTriangle, d3.symbolSquare, d3.symbolCircle]);


const baseSize = d3.scaleOrdinal()
  .domain([0, 1, 2])
  .range([60, 120, 240]); 



const mapLayer = svg.append("g").attr("class", "map-layer");     
const quakeLayer = svg.append("g").attr("class", "quake-layer"); 


const zoom = d3.zoom()
  .scaleExtent([1, 9])
  .on("zoom", zoomed);

svg.call(zoom);
function zoomed(event) {
  const t = event.transform;
  const k = t.k;

  mapLayer.attr("transform", t);
  quakeLayer.attr("transform", t);

  quakeLayer.selectAll("path.quake")
    .attr("transform", d => {
      const [x, y] = projection([d.Longitude, d.Latitude]);

      const scaleFactor = 1 / Math.pow(k,1);

      return `translate(${x},${y}) scale(${scaleFactor})`;
    });
}



Promise.all([
  d3.json("data/world-110m.json"),
  d3.csv("data/earthquakes_2011_2016_clean.csv")
]).then(([world, quakes]) => {


  quakes.forEach(d => {
    d.datetime = new Date(d.datetime);
    d.Latitude = +d.Latitude;
    d.Longitude = +d.Longitude;
    d.Depth = +d.Depth;
    d.Magnitude = +d.Magnitude;
  });


  const countries = topojson.feature(world, world.objects.countries).features;

  function findCountry(lat, lon) {
    for (const c of countries) {
      if (d3.geoContains(c, [lon, lat])) {
        return c.properties.name;
      }
    }
    return "Unknown";
  }

  quakes.forEach(d => {
    d.Country = findCountry(d.Latitude, d.Longitude);
  });


  console.log("Country test:", quakes[0].Country);

  window.allQuakes = quakes;
  window.currentQuakes = quakes;

  drawCountries(world);
  drawQuakes(quakes);
  drawLegend();

  window.dispatchEvent(new Event("data-loaded"));
});




function drawCountries(world) {
  mapLayer.selectAll("path.country")
    .data(topojson.feature(world, world.objects.countries).features)
    .enter()
    .append("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("fill", "#e6e6e6")
      .attr("stroke", "#999")
      .attr("stroke-width", 0.6);
}



function drawQuakes(data) {

  const fmt = d3.timeFormat("%Y-%m-%d %H:%M");

  quakeLayer.selectAll("path.quake")
    .data(data, d => d.datetime + "_" + d.Latitude)
    .join(
      enter => enter.append("path").attr("class", "quake"),
      update => update,
      exit => exit.remove()
    )

    .attr("d", d => {
      const typeIndex = quakeSymbol(d);
      return d3.symbol()
        .type(shapeScale(typeIndex))
        .size(baseSize(typeIndex))();
    })

 
    .attr("transform", d => {
      const [x, y] = projection([d.Longitude, d.Latitude]);
      return `translate(${x}, ${y})`;
    })


    .attr("fill", d => color(d.Depth))
    .attr("opacity", 0.85)
    .style("stroke", "white")
    .style("stroke-width", 0.6)


    .on("mouseover", (event, d) => {
      tooltip.style("opacity", 1).html(`
        <strong>${fmt(d.datetime)}</strong><br>
        Magnitude: ${d.Magnitude}<br>
        Depth: ${d.Depth} km<br>
        Lat: ${d.Latitude.toFixed(2)}<br>
        Lng: ${d.Longitude.toFixed(2)}
      `);
    })
    .on("mousemove", event => {
      tooltip.style("left", event.pageX + 12 + "px")
             .style("top", event.pageY - 12 + "px");
    })
    .on("mouseout", () => tooltip.style("opacity", 0));
}




window.addEventListener("timeline-updated", applyFilters);
window.addEventListener("magnitude-updated", applyFilters);
function applyFilters() {
  const [start, end] = window.timelineFilter;
  const [minM, maxM] = window.magRange;

const filtered = window.currentQuakes.filter(d =>
  d.datetime >= start &&
  d.datetime <= end &&
  d.Magnitude >= minM &&
  d.Magnitude <= maxM
);

  drawQuakes(filtered);
}



function drawLegend() {
  const legend = d3.select("#legend");
  legend.html("");

  legend.append("div")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("Legend");


  legend.append("div")
    .style("margin-top", "6px")
    .text("Depth (km)");

  const depthSvg = legend.append("svg")
    .attr("width", 230)
    .attr("height", 35);

  const defs = depthSvg.append("defs");
  const gradient = defs.append("linearGradient")
    .attr("id", "depth-gradient")
    .attr("x1", "0%").attr("x2", "100%");

const stops = [
    {offset: "0%",  value: 0},
    {offset: "25%", value: 200},
    {offset: "50%", value: 350},
    {offset: "75%", value: 500},
    {offset: "100%", value: 700}
  ];

  stops.forEach(s => {
    gradient.append("stop")
      .attr("offset", s.offset)
      .attr("stop-color", color(s.value));
  });
  depthSvg.append("rect")
    .attr("x", 0)
    .attr("y", 8)
    .attr("width", 220)
    .attr("height", 15)
    .style("fill", "url(#depth-gradient)");

  const depthLabels = [0, 70, 300, 700];
  const labelX = [0, 60, 140, 210];

  depthLabels.forEach((d, i) => {
    depthSvg.append("text")
      .attr("x", labelX[i])
      .attr("y", 35)
      .attr("font-size", 11)
      .text(d);
  });


  legend.append("div")
    .style("margin-top", "12px")
    .text("Magnitude (Shape)");

  const magSvg = legend.append("svg")
    .attr("width", 140)
    .attr("height", 80);

  const items = [
    {label: "M 5.0 – 5.9", shape: d3.symbolTriangle},
    {label: "M 6.0 – 6.9", shape: d3.symbolSquare},
    {label: "M 7.0+",      shape: d3.symbolCircle}
  ];

  items.forEach((item, i) => {
    magSvg.append("path")
      .attr("transform", `translate(12, ${15 + i * 28})`)
      .attr("d", d3.symbol().type(item.shape).size(100)())
      .attr("fill", "#444");

    magSvg.append("text")
      .attr("x", 35)
      .attr("y", 22 + i * 28)
      .attr("font-size", 12)
      .text(item.label);
  });
}



d3.select("#zoom-in").on("click", () =>
  svg.transition().duration(300).call(zoom.scaleBy, 1.35)
);

d3.select("#zoom-out").on("click", () =>
  svg.transition().duration(300).call(zoom.scaleBy, 0.73)
);


d3.select("#reset").on("click", () => {

  console.log("Resetting visualization...");

  svg.transition().duration(300)
    .call(zoom.transform, d3.zoomIdentity);

  window.timelineFilter = [
    new Date("2011-01-01"),
    new Date("2016-12-31")
  ];
  d3.select("#timeline").select("svg").select("text")
  .text("Selected Range: (none)");

  window.magRange = [5.0, 10.0];


  if (window.timelineBrushG) {
  window.timelineBrushG.transition().duration(0)
    .call(window.timelineBrush.move, null);
}


if (window.histBrushG) {
   window.histBrushG.transition().duration(0)
    .call(window.histBrush.move, null);
}
  window.currentQuakes = window.allQuakes;
  applyFilters();
  d3.select("#search-box").property("value", "");

  console.log("Reset complete.");
});



function zoomToQuakes(quakes) {
  if (quakes.length === 0) return;

  const xs = quakes.map(d => projection([d.Longitude, d.Latitude])[0]);
  const ys = quakes.map(d => projection([d.Longitude, d.Latitude])[1]);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const padding = 40;
  const newScale = Math.min(
    width / (maxX - minX + padding),
    height / (maxY - minY + padding)
  );

  svg.transition().duration(800).call(
    zoom.transform,
    d3.zoomIdentity
      .translate(width / 2 - ((minX + maxX) / 2) * newScale,
                 height / 2 - ((minY + maxY) / 2) * newScale)
      .scale(newScale)
  );
}

function searchEarthquakes(keyword) {
  keyword = keyword.trim().toLowerCase();

  if (keyword === "") {
    window.currentQuakes = window.allQuakes;
    applyFilters();
    return;
  }

  const results = window.allQuakes.filter(d =>
    (d.Location && d.Location.toLowerCase().includes(keyword)) ||
    (d.Country && d.Country.toLowerCase().includes(keyword))
  );

  window.currentQuakes = results;

  applyFilters();
  zoomToQuakes(results);

  if (results.length === 0) {
    alert("No earthquakes found for: " + keyword);
     d3.select("#search-box").property("value", "");
      window.currentQuakes = window.allQuakes;
      applyFilters();
      svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);;

  }
}






d3.select("#search-box").on("keydown", (event) => {
  if (event.key === "Enter") {
    console.log("enter pressed");
    const text = d3.select("#search-box").property("value");
    searchEarthquakes(text);
  }
});

d3.select("#search-btn").on("click", () => {
  console.log("search clicked");
  const text = d3.select("#search-box").property("value");
  searchEarthquakes(text);
});



d3.select("#clear-search-btn").on("click", () => {
  console.log("clear clicked");
  d3.select("#search-box").property("value", "");
  window.currentQuakes = window.allQuakes;
  applyFilters();
  svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
});


