const gameTitle = "Sorting game"; // Change for game title
const numberOfItems = 4;// Adjust this to select number of items
let startPoints = 200; // Adjust this to set starting score
let stackPoints = 50; // Adjust this to set points for each completed stack
let movePoints = 10; // Adjust this to set points for each move

// Configuration options
const config = {
  limitMoves: true, // Customer can toggle this (true/false)
  maxMoves: 15 // Default maximum moves
};

let moveCount = 0;
let currentDraggedElement;
let completedStacks = 0;
let countedStacks = new Set();

const restartBtn = document.getElementById('restart-btn');

restartBtn.addEventListener("click", resetGame);

// Uppdatera innehållet i <h1>-elementet
document.getElementById('game-title').textContent = gameTitle;

function renderStatusContainer() {
  const statusContainer = document.getElementById('status-container');
  statusContainer.innerHTML = `
    <div>
      <p>Moves: </p>
      <p class="count moves">${config.limitMoves ? `${moveCount}/${config.maxMoves}` : moveCount}</p>
    </div>
    <div>
      <p>Score: </p>
      <p class="count points">${startPoints}</p>
    </div>
  `;
}

async function renderGame() {
  renderStatusContainer();
  
  const gameContainer = document.getElementById("game-container");

    // Check if we are on a touch device
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  try {
      //* Hämta JSON-data
      const response = await fetch("items.json");
      const items = await response.json();

      // Limit to selected number of items
      const selectedItems = items.slice(0, numberOfItems);

      const stacks = generateShuffledStacks(selectedItems);

      // Render stacks
      stacks.forEach((stack, stackIndex) => {
          const stackDiv = document.createElement("div");
          stackDiv.className = "stack";
          stackDiv.dataset.stackId = stackIndex; // Identifiera stacken

          stack.forEach((item, index) => {
              const itemImg = document.createElement("img");
              itemImg.src = item.image;
              itemImg.alt = item.name;
              itemImg.classList.add("item-piece", `${item.name}`);
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
      // Add two empty stacks
      for (let i = 0; i < 2; i++) {
          const emptySlot = document.createElement("div");
          emptySlot.className = "stack";
          emptySlot.dataset.stackId = stacks.length + i; 

          gameContainer.appendChild(emptySlot);
          addDropEvents(emptySlot); 
      }
  } catch (error) {
      console.error("Failed to load JSON data:", error);
      displayNotification("Failed to load game data. Please try again later.");
  }

  await enableClickToMove(); 
  await enableDragAndDrop(); 
  updateDraggableStates();   
}

// Generates shuffled stacks
function generateShuffledStacks(items) {
  const allItems = [];
  items.forEach(item => {
      for (let i = 0; i < 4; i++) {
          allItems.push(item);
      }
  });

  //Mix items
  allItems.sort(() => Math.random() - 0.5);

  const stacks = [];
  const columnCount = Math.ceil(allItems.length / 4);

  for (let i = 0; i < columnCount; i++) {
    stacks.push([]);
  }
  // look for a column that does not already have 4 of the same item
  while (allItems.length > 0) {
    const item = allItems.pop();
    // Looke for a column that does not already have 4 of the same item
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
    // If no column meets the requirements, place in first available
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
    
    //Check game status
    checkWinCondition();
    checkLoseCondition();
    updatePoints();
    updateDraggableStates(); 
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

  // Check if the first item in the target stack has the same color
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
        // Check if the object is already in the stack
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
    item.classList.remove("dragging");
  });
}

function addDropEvents(stack) {
  stack.addEventListener("dragover", (e) => {
    e.preventDefault(); 
  });
}

//**__________Update Draggable States__________ */
function updateDraggableStates() {
  const stacks = document.querySelectorAll(".stack");
  stacks.forEach(stack => {
      const items = stack.querySelectorAll(".item-piece");
      items.forEach((item, index) => {
          item.draggable = index === 0; // Only first item in stack is draggable
          if (item.draggable) {
            item.classList.add("moveable");
          } else {
            item.classList.remove("moveable");
          }          
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
  restartBtn.style.display = 'block';
  renderGame(); 
}


//**__________Check Win Condition__________ */
function checkWinCondition() {
  const stacks = document.querySelectorAll(".stack");

  stacks.forEach(stack => {
      const items = stack.querySelectorAll(".item-piece");
      const stackId = stack.dataset.stackId; // Get stack ID

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

  // check if all stacks are completed
  if (completedStacks === numberOfItems) {
    setTimeout(() => {
      displayNotification(`Congratulations! You won! Total score is ${points}`);
    }, 300);
    return;
  }
}

//**__________Lock Stack__________ */
function lockStack(stack) {
  stack.classList.add("locked"); 
  const items = stack.querySelectorAll(".item-piece");

  items.forEach(item => {
    item.draggable = false; 
  });

  stack.addEventListener("dragover", (e) => e.preventDefault()); 
}


//**__________Check Lose Condition__________ */
function checkLoseCondition() {
  if (completedStacks === numberOfItems) {
    return; 
  }

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

//**________Count Moves_________ */
function updateMoveCount() {
  const movesElement = document.querySelector('.moves');
  if (movesElement) {
    movesElement.textContent = config.limitMoves ? `${moveCount}/${config.maxMoves}` : moveCount;
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
  if (restartBtn) {
      restartBtn.style.display = 'none';
  }

  const gameContainer = document.getElementById("game-container");

  gameContainer.innerHTML = "";

  const notification = document.createElement("div");
  notification.className = "notification";

  const messageElement = document.createElement("p");
  messageElement.textContent = message;
  notification.appendChild(messageElement);

  const playAgainButton = document.createElement("button");
  playAgainButton.textContent = "Play Again";
  playAgainButton.className = "btn play-again";
  playAgainButton.addEventListener("click", () => {
    resetGame(); 
  });
  notification.appendChild(playAgainButton);

  const proceedButton = document.createElement("button");
  proceedButton.textContent = "Proceed";
  proceedButton.className = "btn proceed";
  proceedButton.addEventListener("click", () => {
    // Lägg till din logik för att gå vidare
    alert("Funktion för att gå vidare implementeras här!");
  });
  notification.appendChild(proceedButton);

  gameContainer.appendChild(notification);
}



renderGame();