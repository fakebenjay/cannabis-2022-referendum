var active = Array.from(document.querySelectorAll('.py-2:not(.text-white) .text-right:nth-child(2n+1)')).map(d => parseInt(d.innerText.replaceAll(",", ''))).reduce((a, b) => {
  return a + b
})

var cast = Array.from(document.querySelectorAll('.py-2:not(.text-white) .text-right:nth-child(2n)')).map(d => parseInt(d.innerText.replaceAll(",", ''))).reduce((a, b) => {
  return a + b
})