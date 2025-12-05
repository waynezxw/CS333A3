const histWidth = 800;
const histHeight = 160;
const histMargin = { top: 20, right: 20, bottom: 40, left: 40 };

const histSvg = d3.select("#histogram")
  .append("svg")
  .attr("width", histWidth)
  .attr("height", histHeight);

let allQuakesHist = [];
let histX, histY;

window.addEventListener("data-loaded", () => {
  allQuakesHist = window.allQuakes;
  buildHistogram(allQuakesHist);
});

function buildHistogram(data) {

  histSvg.selectAll("*").remove();

  histX = d3.scaleLinear()
    .domain([4, 8])
    .range([histMargin.left, histWidth - histMargin.right]);

  const bins = d3.bin()
    .domain(histX.domain())
    .thresholds(20)
    (data.map(d => d.Magnitude));

  histY = d3.scaleLinear()
    .domain([0, d3.max(bins, d => d.length)])
    .range([histHeight - histMargin.bottom, histMargin.top]);

  histSvg.selectAll(".bar")
    .data(bins)
    .join("rect")
    .attr("class", "bar")
    .attr("x", d => histX(d.x0))
    .attr("y", d => histY(d.length))
    .attr("width", d => histX(d.x1) - histX(d.x0) - 1)
    .attr("height", d => histHeight - histMargin.bottom - histY(d.length))
    .attr("fill", "#69b3a2")
    .attr("opacity", 0.45);


  histSvg.append("g")
    .attr("transform", `translate(0,${histHeight - histMargin.bottom})`)
    .call(d3.axisBottom(histX).ticks(10));


  window.histBrush = d3.brushX()
    .extent([[histMargin.left, histMargin.top],
             [histWidth - histMargin.right, histHeight - histMargin.bottom]])
    .on("brush end", brushed);

  window.histBrushG = histSvg.append("g")
    .attr("class", "hist-brush")
    .call(window.histBrush)

  histSvg.on("click", function (event) {
    if (event.target === this) {
      window.histBrushG.call(window.histBrush.move, null);
      window.magRange = histX.domain();
      window.dispatchEvent(new Event("magnitude-updated"));
    }
  });

  window.magRange = histX.domain();
}


function brushed(event) {
  if (!event.selection) {
    window.magRange = histX.domain();
  } else {
    window.magRange = event.selection.map(histX.invert);
  }

  window.dispatchEvent(new Event("magnitude-updated"));
}
