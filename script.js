// CONSTANTS
const MAX_TRIES = 9;
const FLIP_ANIMATION_DURATION = 750
const DANCE_ANIMATION_DURATION = 500

const keyboard = document.querySelector("[data-keyboard]") // get the keyboard
const alertContainer = document.querySelector("[data-alert-container]") // get the empty div container for alerts
const guessGrid = document.querySelector("[data-guess-grid]") // get the grid of tiles
const header = document.querySelector("[header]")

const headerMessages = [ 
  "tahigna 1/10",
  "tahgina 2/10",
  "taghina 3/10",
  "tgahina 4/10",
  "gtahina 5/10",
  "gathina 6/10",
  "gathnia 7/10",
  "gathnia 8/10",
  "gatnhia 9/10",
  "gatinha 10/10",
]

const messages = [
  "Parabéns, mas ainda faltam 9 palavras!", // jogar (1)
  "Não desista, faltam 8!", // termo (2)
  "Faltam 7, agora as coisas vão ficar um pouco mais difíceis!", // legal (3)
  "Essa foi fácil!", // amor (4)
  "Parabéns! Só faltam 5!", // minha (5)
  "Ainda está fácil, mas as coisas vão ficar mais difíceis!", // vida (6)
  "Essa foi a última fácil, a próxima terá 6 letras!", // voce (7)
  "Parabéns! A próxima será um pouco mais difícil", // aceita (8)
  "Náo desista! Só falta uma!", // namorar (9)
  "Aguarde...", // comigo (10)
]

const levels = [ "jogar", "termo", "legal", "amor", "minha", "vida", "voce", "aceita", "namorar", "comigo" ]
let currentLevel = 0
let targetWord = ''

setup()

startInteraction()

function setup() {
  targetWord= levels[currentLevel]
  
  header.textContent = headerMessages[currentLevel];

  // reset keyboard
  keyboard.querySelectorAll("[data-key]").forEach(x => x.className = 'key')

  // reset guessGrid tiles
  document.documentElement.style.setProperty("--word-length", targetWord.length)
  document.documentElement.style.setProperty("--max-tries", MAX_TRIES)
  
  guessGrid.replaceChildren([])

  for (let i = 0; i < targetWord.length * MAX_TRIES; i++) {
    const tile = document.createElement("div")
    tile.className = "tile"
    guessGrid.appendChild(tile)
  }
}

function nextLevel() {
  currentLevel++

  if (currentLevel == levels.length) {
    showEnding()
    return
  }

  setup()
  startInteraction()
}

function reset() {
  currentLevel = 0
  setup()
  startInteraction()
}

function startInteraction() { // start listening for clicks and keypresses
  document.addEventListener("click", handleMouseClick) 
  document.addEventListener("keydown", handleKeyPress)
}

function stopInteraction() { // remove the event listeners for clicks and keypresses, effectively making the user unable to interact or type anything
  document.removeEventListener("click", handleMouseClick)
  document.removeEventListener("keydown", handleKeyPress)
}

function handleMouseClick(e) {
  if (e.target.matches("[data-key")) { // if event target is a key, press that key
    pressKey(e.target.dataset.key)
    return
  }

  if (e.target.matches("[data-enter]")) { // if user clicks enter, submit the guess
    submitGuess()
    return
  }

  if (e.target.matches("[data-delete]")) { // if user clicks delete, remove that key
    deleteKey()
    return
  }
}

function handleKeyPress(e) {
  if (e.key === "Enter") { // if the key is enter, submit guess
    submitGuess()
    return
  }
  
  if (e.key === "Backspace" || e.key === "Delete") { // if user presses backspace or delete, delete key
    deleteKey()
  }

  if (e.key.match(/^[a-z]$/)) { // regex for one single letter between a and z
    pressKey(e.key)
    return
  }
}

function pressKey(key) { // add key to first tile in grid
  const activeTiles = getActiveTiles() // get array of active tiles
  if (activeTiles.length >= targetWord.length) return // make sure that user cannot keep typing after 5 letters
  const nextTile = guessGrid.querySelector(":not([data-letter])") // returns the first tile that doesn't have a value
  nextTile.dataset.letter = key.toLowerCase() // add the letter to the tile's dataset
  nextTile.textContent = key // make the html the key
  nextTile.dataset.state = "active" // set it to active
}

function deleteKey() { 
  const activeTiles = getActiveTiles() // get array of active tiles
  if (activeTiles.length == 0) return 
  const lastTile = activeTiles[activeTiles.length - 1] // get the last active tile
  if (lastTile === null) return // if that tile doesn't have any content, return
  lastTile.textContent = "" // set the text content to an empty string
  delete lastTile.dataset.state // delete active state
  delete lastTile.dataset.letter // delete letter dataset
}

function getActiveTiles() {
  return guessGrid.querySelectorAll('[data-state="active"]')
    // return all the tiles that have the state of active
}

function submitGuess() {
  const activeTiles = [...getActiveTiles()] // get the array of active tiles
  if (activeTiles.length !== targetWord.length) { // if the guess isn't long enough, can't submit it!
    showAlert(`Só palavras com ${targetWord.length} letras`)
    shakeTiles(activeTiles)
    return
  }

  const guess = activeTiles.reduce((word, tile) => { // sum the array of individual letters into a string
    return word + tile.dataset.letter
  }, "") // returns a string
  
  if (!dictionary.includes(guess)) { // when the guess isn't a real word
    showAlert("Essa palavra não é aceita")
    shakeTiles(activeTiles)
    return
  }

  stopInteraction()
  activeTiles.forEach((...params) => flipTile(...params, guess)) // flip tile animation
}

function flipTile(tile, index, array, guess) {
  const letter = tile.dataset.letter
  const key = keyboard.querySelector(`[data-key="${letter}"i]`) // get each key - the i makes it case insensitive
  setTimeout(() => {
    tile.classList.add("flip")
  }, index * FLIP_ANIMATION_DURATION / 2)

  tile.addEventListener("transitionend", () => {
    tile.classList.remove("flip") // remvoe flip class for animation
    if (targetWord[index] === letter) {
      tile.dataset.state = "correct"
      key.classList.add("correct") // while flipping, if it's the right location and right letter, add correct class
    } else if (targetWord.includes(letter)) { // otherwise if word includes letter, add wrong location class
      tile.dataset.state = "wrong-location"
      key.classList.add("wrong-location")
    } else { // else add wrong class
      tile.dataset.state = "wrong" 
      key.classList.add("wrong")
    }

    if (index === array.length - 1) { // if last tile, user can start interacting again
      tile.addEventListener("transitionend", () => {
        startInteraction()
        checkWinLose(guess, array)
      }, { once: true})
    }
  }, { once: true })
}

function showAlert(message, duration = 1000) {
  const alert = document.createElement("div") // get the empty alert div
  alert.textContent = message // add message
  alert.classList.add("alert") // add alert class
  alertContainer.prepend(alert) 
  if (duration == null) return
  setTimeout(() => {
    alert.classList.add("hide")
    alert.addEventListener("transitionend", () => {
      alert.remove()
    })
  }, duration)
}

function shakeTiles(tiles) {
  tiles.forEach(tile => {
    tile.classList.add("shake")
    tile.addEventListener("animationend", () => {
      tile.classList.remove("shake")
    }, { once: true })
  })
}

function checkWinLose(guess, tiles) {
  if (guess === targetWord) {
    showAlert(messages[currentLevel], 2000)
    danceTiles(tiles)
    stopInteraction()
    setTimeout(() => nextLevel(), 2000)
    return
  }

  const remainingTiles = guessGrid.querySelectorAll(":not([data-letter])") // get all empty tiles

  if (remainingTiles.length === 0) { // if no more remaining tiles
    showAlert("Você perdeu! Tente novamente", 2000)
    stopInteraction()
    setTimeout(() => reset(), 2000)
  }
}

function danceTiles(tiles) {
  tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add("dance")
      tile.addEventListener(
        "animationend",
        () => {
          tile.classList.remove("dance")
        },
        { once: true }
      )
    }, (index * DANCE_ANIMATION_DURATION) / 5)
  })
}

function showEnding() {
  keyboard.style.display = "none"
  document.documentElement.style.setProperty("--word-length", 7)
  document.documentElement.style.setProperty("--max-tries", 7)
  guessGrid.replaceChildren([])
  
  appendLetter("a")
  appendLetter("m")
  appendLetter("o")
  appendLetter("r")
  appendLetter("")
  appendLetter("d")
  appendLetter("a")
  
  appendLetter("")
  appendLetter("m")
  appendLetter("i")
  appendLetter("n")
  appendLetter("h")
  appendLetter("a")
  appendLetter("")

  appendLetter("")
  appendLetter("v")
  appendLetter("i")
  appendLetter("d")
  appendLetter("a")
  appendLetter("")
  appendLetter("")

  appendLetter("")
  appendLetter("v")
  appendLetter("o")
  appendLetter("c")
  appendLetter("e")
  appendLetter("")
  appendLetter("")

  appendLetter("a")
  appendLetter("c")
  appendLetter("e")
  appendLetter("i")
  appendLetter("t")
  appendLetter("a")
  appendLetter("")

  appendLetter("n")
  appendLetter("a")
  appendLetter("m")
  appendLetter("o")
  appendLetter("r")
  appendLetter("a")
  appendLetter("r")

  appendLetter("c")
  appendLetter("o")
  appendLetter("m")
  appendLetter("i")
  appendLetter("g")
  appendLetter("o")
  appendLetter("?")

  flipEnding()
}

function appendLetter(letter) {
  const tile = document.createElement("div")
  tile.className = "tile"

  if (letter != "") {
    tile.dataset.letter = letter
  }
  
  guessGrid.appendChild(tile)
}

function flipEnding() {

  guessGrid.querySelectorAll('*').forEach((tile, index) => {
  const letter = tile.dataset.letter
  
  setTimeout(() => {
    tile.classList.add("flip")
  }, index * FLIP_ANIMATION_DURATION / 4)

  tile.addEventListener("transitionend", () => {
    tile.classList.remove("flip") // remvoe flip class for animation
    if (letter) {
      tile.textContent = letter
      tile.dataset.state = "correct"
    }
  }, { once: true })
  })
}