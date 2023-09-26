class Timer {
	names = {
		timer: '.gamebar__timer'
	}
	constructor(time = 0) {
		this.timerEl = document.querySelector(this.names.timer)
		if (!this.timerEl) return console.error(`Timer element not found. Check selector "${this.names.timer}"`)

		this.time = typeof time === 'number' ? time : 0
		this.renderTimer()
	}
	start() {
		let startTime = Date.now() - this.time * 1000
		this.timerID = setInterval(function () {
			this.time = Math.floor((Date.now() - startTime) / 1000)
			this.renderTimer()
		}.bind(this), 100)
	}
	stop() {
		clearInterval(this.timerID)
	}
	reset() {
		this.time = 0
		this.renderTimer()
	}
	renderTimer() {
		if (!this.timerEl) return;
		const secondsInMinute = 60
		let min = Math.floor(this.time / secondsInMinute)
		let sec = this.time - (secondsInMinute * min)
		this.timerEl.textContent = `${this.addZero(min)}:${this.addZero(sec)}`
	}
	addZero(value = 0) {
		let str = value.toString()
		return str.length > 1 ? str : '0' + str
	}
}
