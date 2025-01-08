const gameTitle = "Sorting game"; // Change for game title
const numberOfItems = 4 ;// Adjust this to select number of items
let startPoints = 200; // Adjust this to set starting score
let stackPoints = 50; // Adjust this to set points for each completed stack
let movePoints = 10; // Adjust this to set points for each move

// Configuration options
const config = {
  limitMoves: true, // Customer can toggle this (true/false)
  maxMoves: 3 // Default maximum moves
};

let moveCount = 0;
let currentDraggedElement;
let completedStacks = 0;
let countedStacks = new Set();


// Uppdatera innehållet i <h1>-elementet
document.getElementById('game-title').textContent = gameTitle;

async function renderGame() {
  const gameContainer = document.getElementById("game-container");

   // Kontrollera om vi är på en touch-enhet
   const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  try {
      // Hämta JSON-data
      const response = await fetch("items.json");
      const items = await response.json();

      // Limit to selected number of colors
      const selectedItems = items.slice(0, numberOfItems);

      // Skapa dynamiska staplar
      const stacks = generateShuffledStacks(selectedItems);

      // Rendera staplar
      stacks.forEach((stack, stackIndex) => {
          const stackDiv = document.createElement("div");
          stackDiv.className = "stack";
          stackDiv.dataset.stackId = stackIndex; // Identifiera stacken

          stack.forEach((item, index) => {
              const itemImg = document.createElement("img");
              itemImg.src = item.image;
              itemImg.alt = item.name;
              itemImg.classList.add("item-piece", `color-${item.name}`);
              itemImg.dataset.name = item.name; // Lägg till namn för validering
              itemImg.dataset.index = index; // Spara index i stacken
              stackDiv.appendChild(itemImg);

            // Lägg till händelser baserat på enhet
            if (isTouchDevice) {
              addTouchEvents(itemImg);
            } else {
              addDragEvents(itemImg);
            }
          });

          gameContainer.appendChild(stackDiv);
          // Lägg till drop-event till stacken
          addDropEvents(stackDiv);
      });

      // Lägg till tomma platser
      for (let i = 0; i < 2; i++) {
          const emptySlot = document.createElement("div");
          emptySlot.className = "stack";
          emptySlot.dataset.stackId = stacks.length + i; // Identifiera stacken

          gameContainer.appendChild(emptySlot);
          addDropEvents(emptySlot); // Lägg till drop-event-hanterare
      }
  } catch (error) {
      console.error("Failed to load JSON data:", error);
      displayNotification("Failed to load game data. Please try again later.");
  }

  await enableClickToMove(); // Aktivera klick-funktionaliteten
  await enableDragAndDrop(); // Aktivera drag-and-drop
  updateDraggableStates();   // Uppdatera draggable
}

// Generera blandade staplar från färgerna
function generateShuffledStacks(items) {
  const allItems = [];
  items.forEach(item => {
      for (let i = 0; i < 4; i++) {
          allItems.push(item);
      }
  });

  // Blanda färger
  allItems.sort(() => Math.random() - 0.5);

  // Dela upp i staplar
  const stacks = [];
  const columnCount = Math.ceil(allItems.length / 4);

  // Initiera tomma kolumner
  for (let i = 0; i < columnCount; i++) {
    stacks.push([]);
  }

  // Fördela items utan att få fyra av samma i en stapel
  while (allItems.length > 0) {
    const item = allItems.pop();

    // Leta efter en kolumn som inte redan har 4 av samma item
    let placed = false;
    for (let i = 0; i < columnCount; i++) {
        const currentStack = stacks[i];
        const itemCount = currentStack.filter(stackItem => stackItem === item).length;

        if (itemCount < 3 && currentStack.length < 4) {
            currentStack.push(item);
            placed = true;
            break;
        }
    }

    // Om ingen kolumn uppfyller kraven, placera i första tillgängliga
    if (!placed) {
        for (let i = 0; i < columnCount; i++) {
            if (stacks[i].length < 4) {
                stacks[i].push(item);
                break;
            }
        }
    }
  }
  return stacks;
}



//*'___________Move objekt to stack___________'
function moveItemToStack(item, targetStack) {
  if (!item || !targetStack) return;

  const itemsInTarget = targetStack.querySelectorAll('.item-piece');

  // Check if move is valid
  if (isValidMove(targetStack, item, itemsInTarget)) {
    const currentStack = item.parentNode;
    // Move the item to the top of the stack
    if (itemsInTarget.length > 0) {
      targetStack.insertBefore(item, itemsInTarget[0]);
    } else {
      targetStack.appendChild(item);
    }

    moveCount++;
    updateMoveCount();
    // Check if move limit is activated
    if (config.limitMoves && moveCount >= config.maxMoves) {
      checkLoseCondition(); 
      return;
    }

    //Check game status
    checkWinCondition();
    checkLoseCondition();
    updatePoints();
    updateDraggableStates(); // Uppdatera draggable-attributen  
  } 
}

//*'___________Control if move is valid___________'
function isValidMove(targetStack, draggedElement, itemsInTarget) {
  const maxItems = 4;

  if (itemsInTarget.length >= maxItems) {
      //* Stack is full
      return false;
  }

  if (itemsInTarget.length === 0) {
      //* Empty stack always valid
      return true;
  }

  // Kontrollera om namn matchar det första objektet i stacken
  const firstItemName = itemsInTarget[0].dataset.name;
  if (firstItemName === draggedElement.dataset.name) {
      return true;
  } else {
      //*Wrong color 
      return false;
  }
}

//**___________Move object on click___________'
function enableClickToMove() {
  let selectedItem = null; // Håller reda på markerat objekt

  document.addEventListener('click', function (e) {
    const clickedStack = e.target.closest('.stack'); // Hitta stacken
   
    if (clickedStack) {
      if (selectedItem) {
        // Kontrollera om objektet redan är i stacken
        if (selectedItem.parentNode === clickedStack) {
          console.log("Objektet är redan i denna stack, inget move räknas.");
        } else {
          moveItemToStack(selectedItem, clickedStack);
        }
        selectedItem.classList.remove('selected-item'); // Ta bort markeringsklassen
        selectedItem = null; // Nollställ det markerade objektet
      } else {
        const firstItem = clickedStack.querySelector('.item-piece');
        if (firstItem) {
          document.querySelectorAll('.item-piece').forEach(item => item.classList.remove('selected-item'));
          firstItem.classList.add('selected-item');
          selectedItem = firstItem;
        }
      }
    }
  });
}

//*'___________Drag and Drop computer___________'
function enableDragAndDrop() {
  document.addEventListener('dragstart', function (e) {
    const draggedItem = e.target;
    draggedItem.classList.add('dragging');
  });

  document.addEventListener('dragover', function (e) {
    e.preventDefault(); // Tillåt droppa
  });

  document.addEventListener('drop', function (e) {
    const targetStack = e.target.closest('.stack');
    const draggedItem = document.querySelector('.dragging');

    console.log("Drop event triggered", { targetStack, draggedItem });
  
    if (targetStack && draggedItem) {
        moveItemToStack(draggedItem, targetStack);
        draggedItem.classList.remove('dragging');
    }
  });

  document.addEventListener('dragend', function (e) {
    e.target.classList.remove('dragging');
  });
}

function addDragEvents(item) {
  item.addEventListener("dragstart", (e) => {
    const parentStack = item.parentNode;
    const firstChild = parentStack.querySelector(".item-piece");
    if (item === firstChild) {
      item.classList.add("dragging");
      e.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          name: item.dataset.name,
          index: item.dataset.index,
          stackId: parentStack.dataset.stackId,
        })
      );
      currentDraggedElement = item;
    } else {
      e.preventDefault();
    }
  });

  item.addEventListener("dragend", () => {
    item.classList.remove("dragging"); // Ta bort styling när drag avslutas
  });
}

function addDropEvents(stack) {
  stack.addEventListener("dragover", (e) => {
    e.preventDefault(); // Möjliggör drop
  });
}

//**__________Update Draggable States__________ */
function updateDraggableStates() {
  const stacks = document.querySelectorAll(".stack");
  stacks.forEach(stack => {
      const items = stack.querySelectorAll(".item-piece");
      items.forEach((item, index) => {
          item.draggable = index === 0; // Endast första objektet är draggable
      });
  });
}

//**__________Touch Events__________ */
function addTouchEvents(item) {
  let initialX = 0, initialY = 0;

  item.addEventListener("touchstart", (e) => {
    const parentStack = item.parentNode;
    const firstChild = parentStack.querySelector(".item-piece");

    if (item === firstChild) {
      currentDraggedElement = item;
      item.classList.add("dragging");

      // Spara startpositionen
      const touch = e.touches[0];
      initialX = touch.clientX;
      initialY = touch.clientY;

      e.preventDefault();
    }
  });

  item.addEventListener("touchmove", (e) => {
    if (!currentDraggedElement) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - initialX;
    const deltaY = touch.clientY - initialY;

    // Use transform to move the element
    currentDraggedElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

    e.preventDefault();
  });

  item.addEventListener("touchend", (e) => {
    if (!currentDraggedElement) return;

    //Temporarily reset transform to get correct element
    currentDraggedElement.style.transform = "";

    const touch = e.changedTouches[0];
    const targetStack = document.elementFromPoint(touch.clientX, touch.clientY);

    if (targetStack && targetStack.classList.contains("stack")) {
        moveItemToStack(currentDraggedElement, targetStack);
    }
    
    currentDraggedElement.classList.remove("dragging");
    currentDraggedElement.style.transform = "";
    currentDraggedElement = null;

  });
}


//**__________Reset Game__________ */
function resetGame() {
  const gameContainer = document.getElementById("game-container");
  gameContainer.innerHTML = ""; 
  moveCount = 0; 
  completedStacks = 0; 
  points = startPoints;
  countedStacks.clear();
  updateMoveCount();
  updatePoints();
  renderGame(); 
}

document.getElementById("restart-btn").addEventListener("click", resetGame);

//**__________Check Win Condition__________ */
function checkWinCondition() {
  const stacks = document.querySelectorAll(".stack");

  stacks.forEach(stack => {
      const items = stack.querySelectorAll(".item-piece");
      const stackId = stack.dataset.stackId; // Hämtar stackens unika ID

      if (items.length === 4) {
          //Check if all objects in the stack have the same name
          const firstItemName = items[0].dataset.name;
          const isUniform = Array.from(items).every(item => item.dataset.name === firstItemName);

          if (isUniform && !countedStacks.has(stackId)) {
              countedStacks.add(stackId); 
              completedStacks++; 
              updatePoints(); 

              lockStack(stack); 
          }
      }
  });

  // Kontrollera om alla staplar är färdiga
  if (completedStacks === numberOfItems) {
    setTimeout(() => {
      displayNotification(`Congratulations! You won! Total score is ${points}`);
    }, 300);
  }
}

//**__________Lock Stack__________ */
function lockStack(stack) {
  stack.classList.add("locked"); // Lägg till en klass för styling som indikerar låst tillstånd
  const items = stack.querySelectorAll(".item-piece");

  items.forEach(item => {
    item.draggable = false; // Gör objekt i stapeln ej flyttbara
  });

  stack.addEventListener("dragover", (e) => e.preventDefault()); // Förhindra dropp
}


//**__________Check Lose Condition__________ */
function checkLoseCondition() {
  const stacks = document.querySelectorAll(".stack");
  let hasValidMove = false;

  // Iterate through all stacks and objects to find valid moves
  stacks.forEach(stack => {
      const items = stack.querySelectorAll(".item-piece");
      if (items.length > 0) {
          const firstItem = items[0];

          //Check all other stacks to see if it is valid to move to them
          stacks.forEach(targetStack => {
              if (stack !== targetStack) {
                  const targetItems = targetStack.querySelectorAll(".item-piece");
                  if (isValidMove(targetStack, firstItem, targetItems)) {
                      hasValidMove = true; // Giltigt drag hittat
                  }
              }
          });
      }
  });

  if (!hasValidMove || (config.limitMoves && moveCount >= config.maxMoves)) {
     setTimeout(() => {
      displayNotification("Game Over! No more valid moves.")
    }, 300); 

  }
}

// // Funktion för att inaktivera alla dragbara objekt vid förlust
// function disableGameInteractions() {
//   const allItems = document.querySelectorAll('.item-piece');
//   allItems.forEach(item => {
//     item.setAttribute('draggable', 'false');
//   });

//   const stacks = document.querySelectorAll('.stack');
//   stacks.forEach(stack => {
//     stack.classList.add('disabled');
//   });
// }

//**________Count Moves_________ */
function updateMoveCount() {
  const movesElement = document.querySelector('.moves');
  if (movesElement) {
    movesElement.textContent = `${moveCount} / ${config.limitMoves ? config.maxMoves : "∞"}`;
  }
}

//*'__________Count Points___________'
function updatePoints() {
  points = startPoints + (completedStacks * stackPoints) - (moveCount * movePoints);

  // Visa poäng, men inte negativa
  const pointsToShow = points < 0 ? 0 : points;

  const pointsElement = document.querySelector('.points');
  if (pointsElement) {
    pointsElement.textContent = `${pointsToShow}`;
  }
  console.log("Points:", pointsToShow);
}


//*'__________Display Notification__________'	
function displayNotification(message) {
  // Hitta containern
  const gameContainer = document.getElementById("game-container");

  // Rensa innehållet i containern
  gameContainer.innerHTML = "";

  // Skapa en ny div för notifikationen
  const notification = document.createElement("div");
  notification.className = "notification";

  // Lägg till meddelandet
  const messageElement = document.createElement("p");
  messageElement.textContent = message;
  notification.appendChild(messageElement);

  // Skapa knappen för att spela igen
  const playAgainButton = document.createElement("button");
  playAgainButton.textContent = "Play Again";
  playAgainButton.className = "btn play-again";
  playAgainButton.addEventListener("click", () => {
    resetGame(); // Återställ spelet
  });
  notification.appendChild(playAgainButton);

  // Skapa knappen för att gå vidare
  const proceedButton = document.createElement("button");
  proceedButton.textContent = "Proceed";
  proceedButton.className = "btn proceed";
  proceedButton.addEventListener("click", () => {
    // Lägg till din logik för att gå vidare
    alert("Funktion för att gå vidare implementeras här!");
  });
  notification.appendChild(proceedButton);

  // Lägg till notifikationen i containern
  gameContainer.appendChild(notification);
}



renderGame();