class Menu {
	names = {
		input_width: '#width',
		input_height: '#height',
		input_mines: '#mines',
		button_start: '#start-btn',
		button_resume: '#resume-btn',
		button_new: '#new-btn',
		message: '.message',
		resume: '.menu__resume',
		state_visible: 'visible',
	}
	constructor(settings, startFn) {
		if (!settings) return console.error('Error on recieving settings')
		this.settings = settings
		let props = ['width', 'height', 'mines']
		this.inputs = {}
		for (let key of props) {
			this.inputs[key] = document.querySelector(this.names['input_' + key])
			this.inputs[key].value = settings[key]
			this.inputs[key].addEventListener('input', this.handleInputChange.bind(this))
		}

		this.startButton = document.querySelector(this.names.button_start)
		this.resumeButton = document.querySelector(this.names.button_resume)
		this.newButton = document.querySelector(this.names.button_new)
		this.messageEl = document.querySelector(this.names.message)

		this.resumeEl = document.querySelector(this.names.resume)
		if (settings.field) this.resumeEl.classList.add(this.names.state_visible)

		this.startGame = function() {
			if (!this.checkOptions()) return;
			this.resetSettings()
			startFn()
		}.bind(this)
		this.resumeGame = function() {
			startFn()
		}

		// Events
		this.startButton.addEventListener('click', this.startGame)
		this.resumeButton.addEventListener('click', this.resumeGame)
		this.newButton.addEventListener('click', this.goToNewGame.bind(this))

		this.resumeButton.addEventListener('click', this.closeResumeMenu.bind(this))
		this.newButton.addEventListener('click', this.closeResumeMenu.bind(this))
	}
	checkOptions() {
		const maxWidthHeight = 99
		let ok = true
		this.messageEl.textContent = ''

		let {width, height, mines} = this.settings
		if (  width <= 0
			|| width > maxWidthHeight
			|| height <= 0
			|| height > maxWidthHeight
			|| mines <= 0
			|| mines > (width * height - 1)
		) {
			this.messageEl.textContent = 'Incorrect values'
			ok = false
		}
		return ok
	}
	resetSettings() {
		this.settings.updateField(null)
		this.settings.updateTimer(0)
		this.settings.updateMineCount(this.settings.mines)
	}
	goToNewGame() {
		this.resetSettings()
	}
	closeResumeMenu() {
		this.resumeEl.classList.remove(this.names.state_visible)
	}
	handleInputChange(e) {
		if (!e) return;
		let name = e.target.id
		let value = Number(e.target.value)
		this.settings.updateOption(name, value)
	}
}
