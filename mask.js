var rawWidth = document.getElementById('article').offsetWidth
var w = rawWidth;
var h = rawWidth * (2 / 3.5);
//Define map projection
var projection = d3.geoAlbersUsaTerritories()
  .translate([w / 2, h / 2])
  .scale([rawWidth * 1.15]);
//Define path generator
var path = d3.geoPath()
  .projection(projection);
//Create SVG element
var svg = d3.select(".chart")
  .append("svg")
  // .attr("width", w)
  // .attr("height", h)
  .attr('viewBox', `0 0 ${w} ${h}`)
  .attr('preserveAspectRatio', `xMidYMid meet`)

var tooltip = d3.select("#usa-map")
  .append('div')
  .style('visibility', 'hidden')
  .attr('id', 'tooltip')

var dcTexture = textures.lines()
  .orientation("diagonal")
  .size(25)
  .strokeWidth(10)
  .stroke("#6BA292")
  .background("#F4F4F4");
svg.call(dcTexture);

function tooltipText(values) {
  if (!!values.detail) {
    return `<h1 style="padding:0px;margin:0px;"><strong>${values.state}</strong></h1>` + values.detail
  } else {
    if (values.state === 'Washington D.C.') {
      return "Cannabis is <strong>decriminalized</strong> and legal for <strong style='background-color:#6ba292;color:white;'>&nbsp;recreational&nbsp;</strong> purposes in <strong>" + values.state + "</strong>.<br/><br/>However, Congress controls the District's budget, and as of the 2022 federal budget, has refused to allow the establishment of a regulated market."
    } else if (values.legalPsych === 'x') {
      return "<span style='background-color:#654f6f;color:white;'>&nbsp;Psychedelic mushrooms are <strong>decriminalized</strong>&nbsp;</span> and cannabis is legal for <strong style='background-color:#6ba292;color:white;'>&nbsp;recreational&nbsp;</strong> purposes in <strong>" + values.state + '</strong>.'
    } else if (values.legalRec === 'x') {
      return (values.decriminalized === 'x' ? "Cannabis is <strong>decriminalized</strong> and legal for <strong style='background-color:#6ba292;color:white;'>&nbsp;recreational&nbsp;</strong> purposes in <strong>" + values.state : "Cannabis is legal for <strong style='background-color:#6ba292;color:white;'>&nbsp;recreational&nbsp;</strong> purposes in <strong>" + values.state) + '</strong>.'
    } else if (values.legalMed === 'x') {
      return (values.decriminalized === 'x' ? "Cannabis is <strong>decriminalized</strong> and legal for <strong style='background-color:#ed6a5a;color:white;'>&nbsp;medical&nbsp;</strong> purposes in <strong>" + values.state : "Cannabis is legal for <strong style='background-color:#ed6a5a;color:white;'>&nbsp;medical&nbsp;</strong> purposes in <strong>" + values.state) + '</strong>.'
    } else {
      return (values.decriminalized === 'x' ? "Cannabis is <strong>decriminalized</strong> in <strong>" + values.state : "Cannabis is not legal in <strong>" + values.state) + '</strong>.'
    }
  }
}

function color(d) {
  //Get data value
  var values = d.properties.value;
  if (d.properties.name == 'Washington D.C.') {
    return dcTexture.url()
  }
  if ((values.referendumPsych === 'x' || values.legalPsych === 'x')) {
    return "#654f6f";
  } else if ((values.referendumRec === 'x' || values.legalRec === 'x')) {
    return "#6ba292";
  } else if ((values.referendumMed === 'x' || values.legalMed === 'x')) {
    return "#ed6a5a";
  } else {
    return "#F4F4F4"
  }
}

function mouseover(d) {
  var values = d.properties
  var html = tooltipText(values.value)

  d3.select('#tooltip')
    .html(html)
    .attr('display', 'block')
    .style("visibility", "visible")
    .style('top', topTT)
    .style('left', leftTT)

  d3.selectAll('text')
    .raise()
}

function mousemove() {
  tooltip.style("visibility", "visible")
    .style("left", leftTT)
    .style("top", topTT);
}

function mouseout(d) {
  d3.select('#tooltip')
    .html("")
    .attr('display', 'none')
    .style("visibility", "hidden")
    .style("left", null)
    .style("top", null);
}

function topTT() {
  var offsetParent = document.querySelector('.chart').offsetParent
  var offY = offsetParent.offsetTop
  var cursorY = 15

  var windowWidth = window.innerWidth
  var ch = document.querySelector('#tooltip').clientHeight
  var cy = d3.event.pageY - offY
  var windowHeight = window.innerHeight
  if (windowWidth > 767) {
    if (ch + cy >= windowHeight) {
      return cy - (ch / 2) + "px"
    } else {
      return cy - 28 + "px"
    }
  }
}

function leftTT() {
  var offsetParent = document.querySelector('.chart').offsetParent
  var offX = offsetParent.offsetLeft
  var cursorX = 15

  var windowWidth = window.innerWidth
  var cw = document.querySelector('#tooltip').clientWidth
  var cx = d3.event.pageX - offX
  var bodyWidth = document.querySelector('.chart').clientWidth

  if (windowWidth > 767) {
    if (cw + cx >= bodyWidth) {
      document.querySelector('#tooltip').className = 'box-shadow-left'
      return cx - cw - cursorX + "px"
    } else {
      document.querySelector('#tooltip').className = 'box-shadow-right'
      return cx + cursorX + "px"
    }
  }
}

//Load in GeoJSON data
d3.csv("data.csv")
  .then(function(data) {
    d3.json("us-states.json")
      .then(function(json) {
        //Merge the referendum data and GeoJSON
        //Loop through once for each data value
        for (var i = 0; i < data.length; i++) {
          //Grab state name
          var dataState = data[i].state;
          //Grab legal/referendum status
          var dataObj = data[i]
          //Find the corresponding state inside the GeoJSON
          for (var j = 0; j < json.features.length; j++) {
            var jsonState = json.features[j].properties.name;
            if (dataState === jsonState) {
              //Copy the data value into the JSON
              json.features[j].properties.value = dataObj;
              //Stop looking through the JSON
              break;
            }
          }
        }
        //Put referendum states last so that their border strokes will remain thick
        json.features.sort(function(d) {
          if (d.properties.value.referendumRec === 'x') {
            return 1
          } else if (d.properties.value.referendumMed === 'x') {
            return 1
          } else if (d.properties.value.referendumPsych === 'x') {
            return 1
          } else {
            return -1
          }
        })

        json.features.unshift("dummy state")

        //Bind data and create one path per GeoJSON feature
        svg.selectAll("path")
          .data(json.features)
          .enter()
          .append("path")
          .attr("d", path)
          .attr('class', (d) => {
            return `state state-${d.properties.name.toLowerCase().replace('washington ', '').replaceAll(' ', '-').replaceAll('.', '')}`
          })
          .style("fill", color)
          .style('opacity', d => !d.properties.value.detail ? .3 : 1)

          .style("stroke", function(d) {
            //Get data value
            var values = d.properties.value;
            //Dark border if referendum
            if (!!values.detail) {
              return "#000";
              //Light border if referendum
            } else {
              return "#999";
            }
          })
          .style("stroke-width", function(d) {
            //Get data value
            var values = d.properties.value;
            //thick border if referendum
            if (!!values.detail) {
              return "2";
              //thin border if no referendum
            } else {
              return "1";
            }
          })
          .on("mouseover", mouseover)
          .on('mousemove', mousemove)
          .on("mouseout", mouseout);

        var labelW = (w / 15)
        var labelH = (h / 15)
        var rectCounter = 0
        var labelCounter = 0
        var rectTerrCounter = 1
        var labelTerrCounter = 1

        var smallStates = {
          'Massachusetts': 'MA',
          'Rhode Island': 'RI',
          'Connecticut': 'CT',
          'New Jersey': 'NJ',
          'Delaware': 'DE',
          'Maryland': 'MD',
          'Washington D.C.': 'DC',
        }

        var smallTerr = {
          'Puerto Rico': 'PR',
          'U.S. Virgin Islands': 'VI',
          'Guam': 'GU',
          'American Samoa': 'AS',
          'Northern Mariana Islands': 'MP'
        }

        svg.selectAll('rect')
          .data(json.features)
          .enter()
          .append('rect')
          .attr("class", (d) => {
            if (Object.keys(smallStates).includes(d.properties.name) || Object.keys(smallTerr).includes(d.properties.name)) {
              return `state state-${d.properties.name.replace('Washington ', '').replaceAll(' ', '-').replaceAll('.', '').toLowerCase()}`
            } else {
              return 'invisible'
            }
          })
          .attr('fill', color)
          .attr('y', (d) => {
            if (typeof d === 'string') {
              return 0
            } else if (Object.keys(smallStates).includes(d.properties.name)) {
              rectCounter += 1
              return (h / 4) + (rectCounter * labelH)
            } else if (Object.keys(smallTerr).includes(d.properties.name)) {
              rectTerrCounter += 1
              return (h / 4) + (rectTerrCounter * labelH)
            }
          })
          .attr('x', (d) => {
            var rectOffset = Object.keys(smallTerr).includes(d.properties.name) ? 1 : 0
            return w - (labelW * 1.5) - (labelW * rectOffset) + (w / 35)
          })
          .attr('width', labelW)
          .attr('height', labelH)
          .style('opacity', d => !d.properties.value.detail ? .3 : 1)
          .style("stroke", function(d) {
            //Get data value
            var values = d.properties.value;
            //Dark border if referendum
            if (!!values.detail) {
              return "#000";
              //Light border if referendum
            } else {
              return "#999";
            }
          })
          .style("stroke-width", function(d) {
            //Get data value
            var values = d.properties.value;
            //thick border if referendum
            if (!!values.detail) {
              return "2";
              //thin border if no referendum
            } else {
              return "1";
            }
          })

        svg.selectAll('text')
          .data(json.features)
          .enter()
          .append('text')
          .text((d) => {
            if (typeof d === 'string') {
              return ''
            } else if (Object.keys(smallStates).includes(d.properties.name)) {
              return smallStates[d.properties.name]
            } else if (Object.keys(smallTerr).includes(d.properties.name)) {
              return smallTerr[d.properties.name]
            }
          })
          .attr("text-anchor", "middle")
          .attr("class", (d) => {
            if (typeof d === 'string') {
              return 'invisible'
            } else if (Object.keys(smallStates).includes(d.properties.name) || Object.keys(smallTerr).includes(d.properties.name)) {
              return `small-label state`
            } else {
              return 'invisible'
            }
          })
          .attr("pointer-events", "none")
          .attr('x', (d) => {
            var labelOffset = typeof d !== 'string' && Object.keys(smallTerr).includes(d.properties.name) ? 1 : 0
            return w - (labelW) - (labelW * labelOffset) + (w / 35)
          })
          .attr('y', (d) => {
            if (typeof d === 'string') {
              return 0
            } else if (Object.keys(smallStates).includes(d.properties.name)) {
              labelCounter += 1
              return (h / 4) + (labelH / 1.5) + (labelCounter * labelH)
            } else if (Object.keys(smallTerr).includes(d.properties.name)) {
              labelTerrCounter += 1
              return (h / 4) + (labelH / 1.5) + (labelTerrCounter * labelH)
            }
          })
          .attr('width', labelW)
          .attr('height', labelH)
          .attr("font-family", "sans-serif")
          .attr('fill', (d) => {
            return typeof d !== 'string' && d.properties.name === 'Maryland' ? '#000' : '#000'
          })

        svg.selectAll('.state')
          .on("mouseover", mouseover)
          .on('mousemove', mousemove)
          .on("mouseout", mouseout);

      });
  });