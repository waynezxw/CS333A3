const tMargin = {top: 60, right: 30, bottom: 30, left: 50};
const tWidth = 1200 - tMargin.left - tMargin.right;
const tHeight = 140 - tMargin.top - tMargin.bottom;

const svgT = d3.select("#timeline")
  .append("svg")
  .attr("width", tWidth + tMargin.left + tMargin.right)
  .attr("height", tHeight + tMargin.top + tMargin.bottom);


const dateLabel = svgT.append("text")
  .attr("x", tMargin.left + tWidth / 2)
  .attr("y", 25)
  .attr("text-anchor", "middle")
  .attr("font-size", "18px")
  .attr("font-weight", "bold")
  .attr("fill", "#333")
  .text("Selected Range: (none)");

const g = svgT.append("g")
  .attr("transform", `translate(${tMargin.left},${tMargin.top})`);

d3.csv("data/earthquakes_2011_2016_clean.csv").then(data => {

  data.forEach(d => d.datetime = new Date(d.datetime));


  const dailyCounts = d3.rollups(
    data,
    v => v.length,
    d => d3.timeDay(d.datetime)
  ).map(([date, count]) => ({date, count}));

  dailyCounts.sort((a,b) => a.date - b.date);

  const x = d3.scaleTime()
    .domain(d3.extent(dailyCounts, d => d.date))
    .range([0, tWidth]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(dailyCounts, d => d.count)])
    .range([tHeight, 0]);


  window.timelineFullRange = x.domain();
  window.timelineFilter = [...window.timelineFullRange];

  g.selectAll("rect")
    .data(dailyCounts)
    .enter().append("rect")
      .attr("x", d => x(d.date))
      .attr("y", d => y(d.count))
      .attr("width", 2)
      .attr("height", d => tHeight - y(d.count))
      .attr("fill", "#69b3a2");


  g.append("g")
    .attr("transform", `translate(0,${tHeight})`)
    .call(d3.axisBottom(x).ticks(d3.timeYear.every(1)));


  window.timelineBrush = d3.brushX()
    .extent([[0,0],[tWidth, tHeight]])
    .handleSize(15)
    .on("brush end", brushed);

  window.timelineBrushG = g.append("g")
    .attr("class", "timeline-brush")
    .call(window.timelineBrush);


  svgT.on("click", function(event) {
    if (event.target === this) {

      window.timelineBrushG.call(window.timelineBrush.move, null);

      window.timelineFilter = [...window.timelineFullRange];

      dateLabel.text("Selected Range: (none)");

      window.dispatchEvent(new Event("timeline-updated"));
    }
  });


  function brushed({selection}) {
    if (!selection) return; 

    const [x0, x1] = selection.map(x.invert);
    const fmt = d3.timeFormat("%Y-%m-%d");

    dateLabel.text(`Selected Range: ${fmt(x0)} → ${fmt(x1)}`);

    window.timelineFilter = [x0, x1];

    window.dispatchEvent(new CustomEvent("timeline-updated"));
  }
});
