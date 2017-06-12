Turbolinks.start()

function savepic() {
	// html2canvas(document.body).then(function(canvas) {
	// 		document.body.appendChild(canvas);
	// });	
		// if (document.all.a1 == null) {  
		// 		objIframe = document.createElement("IFRAME");  
		// 		document.body.insertBefore(objIframe);  
		// 		objIframe.outerHTML = "<iframe name=a1 style='width:400px;hieght:300px' src=" + imageName.href + "></iframe>";  
		// 		re = setTimeout("savepic()", 1)  
		// }  
		// else {  
		// 		clearTimeout(re)  
		// 		pic = window.open(imageName.href, "a1")  
		// 		pic.document.execCommand("SaveAs")  
		// 		document.all.a1.removeNode(true)  
		// }  
} 

function blockedModal() {
	let elm = document.getElementById('clients-modal')
	if(elm.className == 'modal') {
		elm.className = 'modal is-active'
	} else {
		elm.className = 'modal'
	}
}

function modalClose() {
	let elm = document.getElementById('clients-modal')
	if(elm) {
		elm.className = 'modal'
	}
	return true
}

document.addEventListener("turbolinks:load", function() {
	let elm = document.getElementById('active-clients') 
	if(elm) { 
		elm.addEventListener('click', blockedModal, false)
	}
	let closes = document.getElementsByClassName('cm-close')
	for(let x of closes) {
		x.addEventListener('click', modalClose, false)
	}

})

document.addEventListener("turbolinks:load", function() {
	if(window.innerWidth > 900) {
		document.getElementById('questions').height = 80
	}	
	
	if(window.mainchart) {
		window.mainchart.destroy()
	} 
	window.mainchart = new Chart('questions', {
			type: 'bar',
			data: {
					labels: window.aggs.labels,
					datasets: [{
							label: '# 抓取到数量',
							data: window.aggs.data,
							backgroundColor: [
									'rgba(255, 99, 132, 0.2)',
									'rgba(54, 162, 235, 0.2)',
									'rgba(255, 206, 86, 0.2)',
									'rgba(75, 192, 192, 0.2)',
									'rgba(153, 102, 255, 0.2)',
									'rgba(255, 159, 64, 0.2)'
							],
							borderColor: [
									'rgba(255,99,132,1)',
									'rgba(54, 162, 235, 1)',
									'rgba(255, 206, 86, 1)',
									'rgba(75, 192, 192, 1)',
									'rgba(153, 102, 255, 1)',
									'rgba(255, 159, 64, 1)'
							],
							borderWidth: 1
					}]
			},
			options: {
					scales: {
							yAxes: [{
									ticks: {
											beginAtZero:true
									}
							}]
					}
			}
	})	
})

