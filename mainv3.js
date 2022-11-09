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
    var live = values.pctIn == 0 ? `Polls close at ${values.pollsClose} p.m. EST` : `<div><strong>Yes</strong>: ${numeral(values.yesVotes/(parseFloat(values.yesVotes)+parseFloat(values.noVotes))).format('0[.]0%')} (${numeral(values.yesVotes).format('0,0')} votes)</div><div><strong>No</strong>: ${numeral(values.noVotes/(parseFloat(values.yesVotes)+parseFloat(values.noVotes))).format('0[.]0%')} (${numeral(values.noVotes).format('0,0')} votes)</div><div>${values.pctIn}% <strong>reporting</strong></div><div><strong>Last updated</strong>: ${values.lastUpdated} EST</div>`
    return `<h1 style="padding:0px;margin:0px;"><strong>${values.state}</strong></h1>` + `<br/><strong class="tt-subhed">Live results${values.result}</strong><div>${live}</div>` + values.detail
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
d3.csv("https://raw.githubusercontent.com/fakebenjay/cannabis-2022-referendum/master/datav3.csv")
  .then(function(data) {
    d3.json("https://assets.law360news.com/1545000/1545182/us-states.json")
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

        return json
      })
      .then((rawData) => {

        var data = rawData.features.filter((d) => {
          if (typeof d !== 'string' && !!d.properties.value.lat) {
            return d
          }
        })

        var radCoeff = d3.scaleLinear()
          .domain([200, 640])
          .range([2, 12])
          .clamp(true)

        var color = d3.scaleOrdinal()
          .domain(['no', 'yes'])
          .range(['#d3d3d3', '#6ba292'])

        function radius(datum) {
          return radCoeff(rawWidth) * (Math.sqrt(datum) / document.querySelector('#article-body').offsetWidth)
        }

        var anglePI = (45) * (Math.PI / 180);
        var angleCoeff = 55
        var angleCoords = {
          'x1': Math.round(angleCoeff + Math.sin(anglePI) * angleCoeff) + '%',
          'y1': Math.round(angleCoeff + Math.cos(anglePI) * angleCoeff) + '%',
          'x2': Math.round(angleCoeff + Math.sin(anglePI + Math.PI) * angleCoeff) + '%',
          'y2': Math.round(angleCoeff + Math.cos(anglePI + Math.PI) * angleCoeff) + '%',
        }

        let pieShop = svg.append('g')
          .attr('class', 'pie-shop')

        let rad = rawWidth / 16
        let arc = d3.arc()
          .outerRadius(rad / 2.5)
          .innerRadius(0);

        let pie = d3.pie()
          .value(function(d) {
            return d.pct;
          })
          .sort((b, a) => {
            return b.name > a.name
          });

        data.forEach((d) => {
          let slices = [{
              'state': d.properties.value.state,
              'name': 'yes',
              'val': d.properties.value.yesVotes,
              'pct': (d.properties.value.yesVotes + d.properties.value.noVotes) == 0 ? 0 : d.properties.value.yesVotes / (parseFloat(d.properties.value.yesVotes) + parseFloat(d.properties.value.noVotes)),
              'lat': d.properties.value.lat,
              'lng': d.properties.value.lng,
              'pollsClose': d.properties.value.pollsClose,
              'result': d.properties.value.result,
              'lastUpdated': d.properties.value.result,
              'pctIn': d.properties.value.pctIn
            },
            {
              'state': d.properties.value.state,
              'name': 'no',
              'val': d.properties.value.noVotes,
              'pct': (d.properties.value.yesVotes + d.properties.value.noVotes) == 0 ? 1 : d.properties.value.noVotes / (parseFloat(d.properties.value.yesVotes) + parseFloat(d.properties.value.noVotes)),
              'lat': d.properties.value.lat,
              'lng': d.properties.value.lng,
              'pollsClose': d.properties.value.pollsClose,
              'result': d.properties.value.result,
              'lastUpdated': d.properties.value.result,
              'pctIn': d.properties.value.pctIn
            }
          ]

          let emptyPies = pieShop.selectAll("pie")
            .data(pie(slices))
            .enter()
            .append("g")
            .attr('stroke', d => d.data.state === 'Colorado' ? 'black' : 'black')
            .attr('stroke-width', 1)
            .attr("class", (d) => {
              return `arc ${d.data.name} ${d.data.state.toLowerCase().replaceAll(' ','-')}`
            })
            .attr('transform', (d) => {
              return `translate(${projection([d.data.lng, d.data.lat])[0]},${projection([d.data.lng, d.data.lat])[1]})`
            })

          emptyPies.append("path")
            .attr("d", arc)
            .style("fill", d => d.data.state === 'Colorado' && d.data.name === 'yes' ? '#654f6f' : color(d.data.name))

          emptyPies.append("rect")
            .attr("x", -radCoeff(rawWidth))
            .attr("y", radCoeff(rawWidth) * 1.5)
            .attr('height', '8px')
            .attr('width', d => (2 * radCoeff(rawWidth)) * (parseFloat(d.data.pctIn) / 100) + 'px')
            .attr('fill', 'green')

          emptyPies.append("rect")
            .attr('x', d => -radCoeff(rawWidth) + (2 * radCoeff(rawWidth)) * (parseFloat(d.data.pctIn) / 100) + 'px')
            .attr("y", radCoeff(rawWidth) * 1.5)
            .attr('height', '8px')
            .attr('width', d => 2 * radCoeff(rawWidth) * ((100 - parseFloat(d.data.pctIn)) / 100) + 'px')
            .attr('fill', 'white')

          emptyPies.append('text')
            .text(function(d) {
              if (d.data.val == 0) {
                return `${d.data.pollsClose} p.m. EST`
              } else {
                return numeral(d.data.pct).format('0[.]0%') + ' ' + d.data.result
              }
            })
            .style('font-weight', 'normal')
            .style('font-size', '10pt')
            .attr("x", function(d) {
              if (d.data.state.includes('Dakota') || d.data.state === 'Arkansas' || d.data.state === 'Missouri') {
                var coeff = d.data.state.includes('Dakota') ? 3.7 : 3
                return radCoeff(rawWidth) * coeff
              } else if (d.data.state === 'Colorado') {
                return -radCoeff(rawWidth) * 3.1
              } else {
                return -radCoeff(rawWidth) * 0
              }
            })
            .attr("y", function(d) {
              if (d.data.state.includes('Dakota') || d.data.state === 'Arkansas' || d.data.state === 'Colorado' || d.data.state === 'Missouri') {
                return -radCoeff(rawWidth) * 0
              } else {
                return -radCoeff(rawWidth) * 2
              }
            })
            .style('display', function(d) {
              return Array.from(this.parentElement.classList).includes('no') ? 'none' : 'block'
            })
            .style('text-anchor', d => d.data.state === 'Maryland' ? 'middle' : d.data.state === 'Colorado' ? 'end' : 'start')
            .style('color', 'black')

          // emptyPies.append('rect')
          //   .attr("x", function(d) {
          //     var text = this.parentElement.querySelector('text')
          //     var w = (text.getBoundingClientRect().width * 1.1) / 2
          //
          //     if (d.data.state === 'South Dakota' || d.data.state === 'Arkansas') {
          //       return -radCoeff(rawWidth) * 2 - (this.getBoundingClientRect().width / 2) - w
          //     } else {
          //       return -radCoeff(rawWidth) * 0 - w
          //     }
          //   })
          //   .attr("y", function(d) {
          //     var text = this.parentElement.querySelector('text')
          //     var h = (text.getBoundingClientRect().width * 1.1) / 2
          //
          //     if (d.data.state === 'South Dakota' || d.data.state === 'Arkansas') {
          //       return -radCoeff(rawWidth) * 0 - h + 16
          //     } else {
          //       return -radCoeff(rawWidth) * 2 - h + 16
          //     }
          //   })
          //   .attr('width', function(d) {
          //     var text = this.parentElement.querySelector('text')
          //     return text.getBoundingClientRect().width * 1.1
          //   })
          //   .attr('height', function(d) {
          //     var text = this.parentElement.querySelector('text')
          //     return text.getBoundingClientRect().height * 1.1
          //   })
          //   .style('fill', 'grey')

          data.forEach((d) => {
            pieShop.selectAll(`.arc.${d.properties.name.toLowerCase().replaceAll(' ','-')}`)
              .datum(d)
              .on("mouseover", mouseover)
              .on('mousemove', mousemove)
              .on("mouseout", mouseout);
          })

        })
      });
  });