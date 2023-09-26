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

class Game {
	names = {
		game: 'game',
		minecount: 'gamebar__minecount',
		actions: 'header__actions',
		field: 'field',
		field_disabled: 'field--disabled',
		game_finished: 'field--finished',
		game_win: 'field--win',
		game_lose: 'field--lose',
		cell: 'cell',
		mine: 'mine',
		state_active: 'active',
		state_hidden: 'hidden',
		state_visible: 'visible',
		state_marked: 'marked',
		state_boom: 'boom',

		menu: 'header-buttons',
		gamebar: 'gamebar',
		reset_button: 'header-buttons__reset-btn',
		menu_button: 'header-buttons__menu-btn',
		mark_button: 'gamebar__mark-btn',
	}
	EMPTY_VALUE = 0
	MINE_VALUE = 9
	// 1-8 - digits
	STATE_HIDDEN_VALUE = 0
	STATE_VISIBLE_VALUE = 1
	STATE_MARKED_VALUE = 2

	timer = null
	_mineCount = 0
	get mineCount() {
		return this._mineCount
	}
	set mineCount(value) {
		if (typeof value === 'number') {
			this._mineCount = value
			if (this.mineCountEl) this.mineCountEl.textContent = value
		}
	}
	markButtonIsActive = false
	isRunning = false
	isWin = false

	constructor(settings) {
		this.settings = settings
		this.gameEl = document.querySelector('.' + this.names.game)
		if (!this.gameEl) return console.error(`Game element not found. Check selector ".${this.names.game}"`)
		this.fieldEl = document.querySelector('.' + this.names.field)
		if (!this.fieldEl) return console.error(`Field element not found. Check selector ".${this.names.field}"`)
		this.mineCountEl = document.querySelector('.' + this.names.minecount)
		if (!this.mineCountEl) return console.error(`Minecount element not found. Check selector ".${this.names.minecount}"`)

		document.addEventListener('contextmenu', this.handleRightClick.bind(this))
		document.addEventListener('click', this.handleLeftClick.bind(this))

		this.resetButtonEl = document.querySelector('.' + this.names.reset_button)
		this.resetButtonEl.addEventListener('click', this.restart.bind(this))

		this.menuButtonEl = document.querySelector('.' + this.names.menu_button)
		this.menuButtonEl.addEventListener('click', this.goToMenu.bind(this))

		this.markButtonEl = document.querySelector('.' + this.names.mark_button)
		this.markButtonEl.addEventListener('click', this.toggleMarkButton.bind(this))
	}

	handleLeftClick(e) {
		if (!e.target.classList.contains(this.names.cell)) return;
		if (this.markButtonIsActive) return this.handleRightClick(e)
		let {id, value} = e.target.dataset
		id = Number(id)
		value = Number(value)
		if (!e.target.classList.contains(this.names.state_visible)
			&& !e.target.classList.contains(this.names.state_marked)
		) {
			if (value === this.MINE_VALUE) return this.finish(e.target)
			if (value === this.EMPTY_VALUE) {
				this.cleanEmptyNeighbours(id)
				this.renderField(this.settings.field)
			}
			this.setVisibleState(e.target)
			if (this.checkWin()) {
				this.isWin = true
				this.finish(e.target)
			}
		}
	}
	handleRightClick(e) {
		e.preventDefault()
		if (!e.target.classList.contains(this.names.cell)) return;
		this.setMarkedState(e.target)
		if (this.checkWin()) {
			this.isWin = true
			this.finish()
		}
}

	setVisibleState(el) {
		if (!el) return console.error('Element not found')
		if (!el.classList.contains(this.names.state_visible)) {
			el.classList.add(this.names.state_visible)
			this.save(el.dataset.id, el.dataset.value, this.STATE_VISIBLE_VALUE)
		}
	}
	setMarkedState(el) {
		if (!el) return console.error('Element not found')
		if (el.classList.contains(this.names.cell) && !el.classList.contains(this.names.state_visible)) {
			let state;
			if (el.classList.contains(this.names.state_marked)) {
				el.classList.remove(this.names.state_marked)
				state = this.STATE_HIDDEN_VALUE
				this.mineCount = this.mineCount + 1
			}
			else {
				el.classList.add(this.names.state_marked)
				state = this.STATE_MARKED_VALUE
				this.mineCount = this.mineCount - 1
			}
			this.save(el.dataset.id, el.dataset.value, state)
		}
	}

	toggleMarkButton() {
		if (this.markButtonIsActive) {
			this.markButtonIsActive = false
			this.markButtonEl.classList.remove(this.names.state_active)
		}
		else {
			this.markButtonIsActive = true
			this.markButtonEl.classList.add(this.names.state_active)
		}
	}

	getUniqueRandomID(cells) {
		let num = getRandomNumber(0, cells.length - 1)
		if (cells[num]) num = this.getUniqueRandomID(cells)
		return num
	}
	createField() {
		const numberOfCells = this.settings.width * this.settings.height
		const numberOfMines = this.settings.mines

		const cells = new Array(numberOfCells)
		cells.fill(0)
	
		// add mines:
		for (let i = 0; i < numberOfMines; i++) {
			cells[this.getUniqueRandomID(cells)] = this.MINE_VALUE
		}
	
		// add digits:
		for (let i = 0; i < numberOfCells; i++) {
			const mineValue = this.MINE_VALUE
			if (cells[i] !== mineValue) continue;
			const targets = [
				'upLeft', 'up', 'upRight',
				'left', 'right',
				'downLeft', 'down', 'downRight',
			]
			const callback = function(targetCellID) {
				if (cells[targetCellID] !== mineValue) cells[targetCellID]++
			}
			this.updateTargetCellsByCondition(i, targets, callback)
		}
		return cells.map(cell => [cell, this.STATE_HIDDEN_VALUE])
	}

	cleanEmptyNeighbours(currentCellID) {
		if (typeof currentCellID !== 'number') return;
		// const targets = [ 'up', 'left', 'right', 'down' ]
		const targets = [
			'upLeft', 'up', 'upRight',
			'left', 'right',
			'downLeft', 'down', 'downRight',
		]
		const callback = function(targetCellID) {
			const [value, state] = this.settings.field[targetCellID]
			if (state === this.STATE_HIDDEN_VALUE) {
				this.settings.updateCell(targetCellID, [value, this.STATE_VISIBLE_VALUE])
				if (value === this.EMPTY_VALUE) {
					this.updateTargetCellsByCondition(targetCellID, targets, callback)
				}
			}
		}.bind(this)
		this.updateTargetCellsByCondition(currentCellID, targets, callback)
	}

	updateTargetCellsByCondition(currentCellID, targets, callback) {
		const fieldWidth = this.settings.width
		const fieldHeight = this.settings.height
		const y = Math.floor(currentCellID / fieldWidth)
		const x = currentCellID - (y * fieldWidth)
		const currentCellCoords = [x,y]
		targets.forEach(function(t) {
			let [x,y] = getTargetCellCoords(t, currentCellCoords)
			let targetID = y * fieldWidth + x
			let isExist = checkCellExistance(t, [x,y], fieldWidth - 1, fieldHeight - 1)
			if (isExist) callback(targetID)
		}.bind(this))
	}

	renderField(cells) {
		let newTableEl = document.createElement('table')
	
		for (let i = 0; i < this.settings.height; i++) {
			let newRowEl = document.createElement('tr')
			for (let j = 0; j < this.settings.width; j++) {
				let newCellEl = document.createElement('td')
				newCellEl.classList.add(this.names.cell)
	
				let cellID = i * this.settings.width + j
				let [value, state] = cells[cellID]
				newCellEl.dataset.value = value
				newCellEl.dataset.id = cellID
				if (state === this.STATE_VISIBLE_VALUE) newCellEl.classList.add(this.names.state_visible)
				if (state === this.STATE_MARKED_VALUE) newCellEl.classList.add(this.names.state_marked)
				newRowEl.appendChild(newCellEl)
			}
			newTableEl.appendChild(newRowEl)
		}
		this.fieldEl.innerHTML = ''
		this.fieldEl.appendChild(newTableEl)
	}

	start() {
		if (!this.settings) return console.error('Error on recieving settings. Game start failed')
		if (!this.settings.field) {
			let field = this.createField()
			this.settings.updateField(field)
		}
		this.renderField(this.settings.field)

		this.timer = new Timer(this.settings.timer)
		if (this.timer) this.timer.start()
		if (this.mineCountEl) this.mineCount = this.settings.minesLeft

		this.autoSaveTimerID = setInterval(function() {
			this.runAutoSave()
		}.bind(this), 5000)

		this.gameEl.classList.add(this.names.state_active)
		this.isRunning = true
	}
	finish(cellEl) {
		this.fieldEl.classList.add(this.names.game_finished)
		if (this.isWin) {
			this.fieldEl.classList.add(this.names.game_win)
			if (cellEl) cellEl.classList.add(this.names.state_visible)
		}
		else {
			this.fieldEl.classList.add(this.names.game_lose)
			if (cellEl) cellEl.classList.add(this.names.state_boom)
		}
		this.settings.updateField(null)
		if (this.timer) this.timer.stop()
		clearInterval(this.autoSaveTimerID)
		this.isRunning = false
	}
	save(id, value, state) {
		id = Number(id)
		value = Number(value)
		state = Number(state)
		this.settings.updateCell(id, [value, state])
		this.settings.updateTimer(this.timer.time)
		this.settings.updateMineCount(this.mineCount)
	}
	runAutoSave() {
		this.settings.updateTimer(this.timer.time)
	}
	restart() {
		let confirm = this.isRunning ? window.confirm('CONFIRM RESTART') : true
		if (!confirm) return;
		this.resetDefaultGameState()
		this.start()
	}
	goToMenu() {
		let confirm = this.isRunning ? window.confirm('CONFIRM EXIT') : true
		if (!confirm) return;
		this.finish()
		this.resetDefaultGameState()
		this.gameEl.classList.remove(this.names.state_active)
	}
	resetDefaultGameState() {
		this.settings.updateField(null)
		this.timer.stop()
		this.timer.reset()
		this.settings.updateTimer(0)
		this.settings.updateMineCount(this.settings.mines)
		this.fieldEl.classList.remove(
			this.names.field_disabled,
			this.names.game_finished,
			this.names.game_win,
			this.names.game_lose
		)
		if (this.markButtonIsActive) this.toggleMarkButton()
		this.isRunning = this.isWin = false
	}
	checkWin() {
		let visible = this.STATE_VISIBLE_VALUE
		let visibleCellsCount = this.settings.field.reduce((sum, [value, state]) => 
			state === visible ? sum + 1 : sum
		, 0)
		let {width, height, mines} = this.settings
		if (visibleCellsCount === (width * height - mines)
			&& this.settings.minesLeft === 0
		) return true
		else return false
	}
}

function getRandomNumber(min = 0, max = 99) {
	return Math.floor(Math.random() * (max - min + 1)) + min
}

const cellRelativeCoords = {
	upLeft: [-1,-1],		up: [0,-1],		upRight: [1,-1],
	left: [-1,0],								right: [1,0],
	downLeft: [-1,1],		down: [0,1],	downRight: [1,1],
}
function getTargetCellCoords(target, [x,y]) {
	const [relX, relY] = cellRelativeCoords[target]
	return [x + relX, y + relY]
}

const cellBasicCheckConditions = {
	upLeft:		(x,y,maxX,maxY) => !!(x >= 0 && y >= 0),
	up:			(x,y,maxX,maxY) => !!(y >= 0),
	upRight:		(x,y,maxX,maxY) => !!(x <= maxX && y >= 0),
	left:			(x,y,maxX,maxY) => !!(x >= 0),
	// center
	right:		(x,y,maxX,maxY) => !!(x <= maxX),
	downLeft:	(x,y,maxX,maxY) => !!(x >= 0 && y <= maxY),
	down:			(x,y,maxX,maxY) => !!(y <= maxY),
	downRight:	(x,y,maxX,maxY) => !!(x <= maxX && y <= maxY),
}
function checkCellExistance(target, [x,y], maxX, maxY) {
	return cellBasicCheckConditions[target](x, y, maxX, maxY)
}

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


const STORAGE_NAME = 'minesweeper_game_save'

function saveGame(value) {
	localStorage.setItem(STORAGE_NAME, JSON.stringify(value))
}
function getSavedGame() {
	return JSON.parse(localStorage.getItem(STORAGE_NAME))
}

class Settings {
	defaults = {
		width: 10,
		height: 15,
		mines: 20,
		minesLeft: 20,
		timer: 0,
		field: null
	}
	constructor(settingsObj) {
		let error = false
		if (settingsObj) {
			for (let key in this.defaults) {
				this[key] = settingsObj[key]
				if (this[key] === undefined) {
					error = true
					console.error('Saved game settings are incorrect! Loaded default settings.')
					break
				}
			}
		} else {
			error = true
			console.warn('Saved game settings not found! Loaded default settings.')
		}
		if (error) { // apply defaults
			for (let key in this.defaults) {
				this[key] = this.defaults[key]
			}
		}
	}
	updateCell(cellID, value) {
		if (typeof cellID !== 'number' || !value) return console.error('Missing arguments')
		if (!Array.isArray(value)) return console.error('Cell value must be an array')
		this.field[cellID] = value
		this._save()
	}
	updateField(field) {
		if (!Array.isArray(field) && field !== null) return console.error('Field must be an array or null')
		this.field = field
		this._save()
	}
	updateTimer(timer) {
		if (typeof timer !== 'number') return console.error('Timer must be a number')
		this.timer = timer
		this._save()
	}
	updateMineCount(num) {
		if (typeof num !== 'number') return console.error('Mine count must be a number')
		this.minesLeft = num
		this._save()
	}
	updateOption(name, value) {
		if (!name || typeof value === undefined) return console.error('Option update fail. Missing "name" or "value"')
		this[name] = value
		this._save()
	}
	_save() {
		let settings = {}
		for (let key in this.defaults) {
			settings[key] = this[key]
		}
		saveGame(settings)
	}
}
let saved = getSavedGame()
let settings = new Settings(saved)
const game = new Game(settings)
const menu = new Menu(settings, game.start.bind(game))
