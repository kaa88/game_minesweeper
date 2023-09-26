@@include('menu.js')
@@include('game.js')
@@include('timer.js')

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
