const gameTitle = "Sorting game"; // Change for game title
const numberOfItems = 4;// Adjust this to select number of items
let startPoints = 500; // Adjust this to set starting score
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

const items = [
  { "name": "HotDog", "image": "assets/hotDog.png" },
  { "name": "ChocolateBar", "image": "assets/chockolateBar.png" },
  { "name": "IceCream", "image": "assets/iceCream.png" },
  { "name": "SodaCan", "image": "assets/sodaCan.png" },
  { "name": "Red", "image": "red.png" },
  { "name": "Blue", "image": "blue.png" }
];

const restartBtn = document.getElementById('restart-btn');

restartBtn.addEventListener("click", resetGame);

// Uppdatera innehållet i <h1>-elementet
document.getElementById('game-title').textContent = gameTitle;

function renderStatusContainer() {
  const movesElement = document.querySelector('.count.moves');
  const pointsElement = document.querySelector('.count.points');

  if (movesElement) {
    movesElement.textContent = config.limitMoves ? `${moveCount}/${config.maxMoves}` : moveCount;
  }

  if (pointsElement) {
    pointsElement.textContent = startPoints;
  }
}

async function renderGame() {
  renderStatusContainer();

  const gameContainer = document.getElementById("game-container");

  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  try {
    const selectedItems = items.slice(0, numberOfItems);
    const stacks = generateShuffledStacks(selectedItems);

    renderStacks(stacks);

    // Lägg till två tomma stackar
    for (let i = 0; i < 2; i++) {
      const emptySlot = document.createElement("div");
      emptySlot.className = "stack";
      emptySlot.dataset.stackId = stacks.length + i;
      gameContainer.appendChild(emptySlot);
      addDropEvents(emptySlot);
    }

    // Lägg till touch- eller drag-händelser
    const allItems = document.querySelectorAll(".item-piece");
    allItems.forEach(item => {
      if (isTouchDevice) {
        addTouchEvents(item);
      } else {
        addDragEvents(item);
      }
    });

  } catch (error) {
    console.error("Error rendering game:", error);
    displayNotification("Failed to load game data. Please try again later.");
  }

  enableClickToMove();
  enableDragAndDrop();
  updateDraggableStates();
}


function renderStacks(stacks) {
  const gameContainer = document.getElementById("game-container");
   // Check if we are on a touch device
   const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;


  stacks.forEach((stack, stackIndex) => {
    const stackDiv = document.createElement("div");
    stackDiv.className = "stack";
    stackDiv.dataset.stackId = stackIndex; // Identifiera stacken

    stack.forEach((item, index) => {
      renderItem(item, index, stackDiv, isTouchDevice);
    });

    gameContainer.appendChild(stackDiv);
  });
}
function renderItem(item, index, stackDiv, isTouchDevice) {
  const itemDiv = document.createElement("div");
  itemDiv.className = "item-piece";
  itemDiv.dataset.name = item.name; // Lägg till namn för validering
  itemDiv.dataset.index = index; // Spara index i stacken

  const itemImg = document.createElement("img");
  itemImg.src = item.image;
  itemImg.alt = item.name;
  itemImg.classList.add("item-img", `${item.name}`);
  itemImg.dataset.name = item.name; // Lägg till namn för validering
  // itemImg.dataset.index = index; // Spara index i stacken
  itemDiv.appendChild(itemImg);
  stackDiv.appendChild(itemDiv);

  // Lägg till händelser baserat på enhet
  if (isTouchDevice) {
    addTouchEvents(itemDiv);
  } else {
    addDragEvents(itemDiv);
  }
}

// Generates shuffled stacks
function generateShuffledStacks(items) {
  const allItems = [];
  
  // Duplicera varje item fyra gånger
  items.forEach(item => {
    for (let i = 0; i < 4; i++) {
      allItems.push(item);
    }
  });

  // Blanda alla items
  allItems.sort(() => Math.random() - 0.5);

  const stacks = [];
  const columnCount = Math.ceil(allItems.length / 4);

  // Skapa tomma stackar
  for (let i = 0; i < columnCount; i++) {
    stacks.push([]);
  }

  // Fyll stackarna med regler för att förhindra fyra lika i en stack
  while (allItems.length > 0) {
    const item = allItems.pop();
    let placed = false;

    // Försök att placera i en stack som inte redan har fyra av samma item
    for (let i = 0; i < columnCount; i++) {
      const currentStack = stacks[i];
      const itemCount = currentStack.filter(stackItem => stackItem === item).length;

      if (itemCount < 3 && currentStack.length < 4) {
        currentStack.push(item);
        placed = true;
        break;
      }
    }

    // Om ingen stack passar, placera slumpmässigt men håll reglerna
    if (!placed) {
      let randomIndex = Math.floor(Math.random() * columnCount);
      while (stacks[randomIndex].length >= 4) {
        randomIndex = Math.floor(Math.random() * columnCount);
      }
      stacks[randomIndex].push(item);
    }
  }

  // Säkerställ att inga stackar har fyra likadana items
  for (let i = 0; i < stacks.length; i++) {
    const currentStack = stacks[i];
    const uniqueItems = [...new Set(currentStack)];

    if (uniqueItems.length === 1 && currentStack.length === 4) {
      console.error(`Error: Stack ${i} has four identical items:`, currentStack);
    }
  }

  return stacks;
}




//*'___________Move objekt to stack___________'
function moveItemToStack(item, targetStack) {
  if (!item || !targetStack) return;

  const itemsInTarget = targetStack.querySelectorAll('.item-piece');

  // Kontrollera om flytten är giltig
  if (isValidMove(targetStack, item, itemsInTarget)) {
    const originStack = document.querySelector(`[data-stack-id="${item.dataset.originStackId}"]`);

    // Kontrollera om målstack är samma som ursprungsstack
    if (originStack === targetStack) {
      console.log("Move ignored: Same stack.");
      return; // Flytten ignoreras om det är samma stack
    }

    // Flytta objektet till toppen av målstacken
    targetStack.insertBefore(item, targetStack.firstChild);

    // Uppdatera indexen i målstacken
    updateStackIndexes(targetStack);
    // Uppdatera indexen i ursprungsstacken
    updateStackIndexes(originStack);

    moveCount++;
    updateMoveCount();

    // Kontrollera spelets status
    checkWinCondition();
    checkLoseCondition();
    updatePoints();
    updateDraggableStates();
  } else {
    // Om flytten inte är giltig, återställ till ursprungsstacken
    const originStack = document.querySelector(`[data-stack-id="${item.dataset.originStackId}"]`);
    if (originStack) {
      originStack.appendChild(item);
      updateStackIndexes(originStack); // Uppdatera indexen i ursprungsstacken
    }
  }
}


function updateStackIndexes(stack) {
  const items = stack.querySelectorAll('.item-piece');
  items.forEach((item, index) => {
    item.dataset.index = index; // Uppdatera index
  });
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
    const targetStack = e.target.closest('.stack'); // Stacken där item droppas
    const draggedItem = document.querySelector('.dragging'); // Det dragna itemet
    
    if (targetStack && draggedItem) {
      const originStack = draggedItem.parentNode; // Ursprungliga stacken
  
      if (targetStack === originStack) {
        // Släpptes tillbaka till samma stack, ignorera detta drag
        console.log("Move ignored.");
      } else {
        // Validera flytt och räkna draget
        moveItemToStack(draggedItem, targetStack);
        updateMoveCount(); // Uppdatera antalet drag
      }
  
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
  let initialX = 0, initialY = 0; // Ursprunglig touch-koordinat
  let currentX = 0, currentY = 0; // Aktuell position
  let offsetX = 0, offsetY = 0; // Justering för elementets position
  let originStack = null; // Ursprunglig stack

  item.addEventListener("touchstart", (e) => {
    const parentStack = item.parentNode;
    const firstChild = parentStack.querySelector(".item-piece");
  
    if (item === firstChild) {
      currentDraggedElement = item;
      originStack = parentStack;
  
      // Spara ursprungsstackens ID
      item.dataset.originStackId = parentStack.dataset.stackId;
  
      const rect = item.getBoundingClientRect();
      const touch = e.touches[0];
  
      offsetX = touch.clientX - rect.left;
      offsetY = touch.clientY - rect.top;
  
      // Flytta elementet till body
      document.body.appendChild(currentDraggedElement);
  
      currentDraggedElement.style.position = "fixed";
      currentDraggedElement.style.top = `${rect.top}px`;
      currentDraggedElement.style.left = `${rect.left}px`;
      currentDraggedElement.classList.add("dragging");
  
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

    // Uppdatera absolut position
    currentX += deltaX;
    currentY += deltaY;

    currentDraggedElement.style.left = `${currentX}px`;
    currentDraggedElement.style.top = `${currentY}px`;
    currentDraggedElement.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(1.3)`;

    // Uppdatera startkoordinater för nästa dragning
    initialX = touch.clientX;
    initialY = touch.clientY;

    e.preventDefault();
  });

  item.addEventListener("touchend", (e) => {
    if (!currentDraggedElement) return;
  
    const touch = e.changedTouches[0];
    const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
  
    // Hitta målstack
    const targetStack = targetElement.closest(".stack");
  
    if (targetStack) {
      const originStack = document.querySelector(`[data-stack-id="${currentDraggedElement.dataset.originStackId}"]`);
  
      // Om målstack är samma som ursprungsstack, ignorera flytten
      if (targetStack === originStack) {
        console.log("Move ignored: Same stack.");
        originStack.appendChild(currentDraggedElement);
        updateStackIndexes(originStack);
      } else {
        moveItemToStack(currentDraggedElement, targetStack);
      }
    } else {
      // Återställ till ursprungsstack om ingen målstack hittades
      const originStack = document.querySelector(`[data-stack-id="${currentDraggedElement.dataset.originStackId}"]`);
      if (originStack) {
        originStack.appendChild(currentDraggedElement);
        updateStackIndexes(originStack);
      }
    }
  
    // Återställ stilar och variabler
    currentDraggedElement.style.position = "";
    currentDraggedElement.style.top = "";
    currentDraggedElement.style.left = "";
    currentDraggedElement.style.transform = "";
    currentDraggedElement.classList.remove("dragging");
  
    currentDraggedElement = null;
    originStack = null;
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
    // Dölj notifikationen
    const notification = document.getElementById("notification");
    if (notification) {
      notification.style.display = 'none';
    }
  
    // Visa spelcontainern
    if (gameContainer) {
      gameContainer.style.display = 'flex'; // Eller 'block', beroende på din layout
    }
  
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
// function displayNotification(message) {  
//   if (restartBtn) {
//       restartBtn.style.display = 'none';
//   }

//   const gameContainer = document.getElementById("game-container");

//   gameContainer.innerHTML = "";

//   const notification = document.createElement("div");
//   notification.className = "notification";

//   const messageElement = document.createElement("p");
//   messageElement.textContent = message;
//   notification.appendChild(messageElement);

//   const playAgainButton = document.createElement("button");
//   playAgainButton.textContent = "Play Again";
//   playAgainButton.className = "btn play-again";
//   playAgainButton.addEventListener("click", () => {
//     resetGame(); 
//   });
//   notification.appendChild(playAgainButton);

//   const proceedButton = document.createElement("button");
//   proceedButton.textContent = "Proceed";
//   proceedButton.className = "btn proceed";
//   proceedButton.addEventListener("click", () => {
//     // Lägg till din logik för att gå vidare
//     alert("Funktion för att gå vidare implementeras här!");
//   });
//   notification.appendChild(proceedButton);

//   gameContainer.appendChild(notification);
// }

function displayNotification(message) {  
  if (restartBtn) {
      restartBtn.style.display = 'none';
  }

  const gameContainer = document.getElementById("game-container");
  gameContainer.innerHTML = "";

  const notification = document.getElementById("notification");
  const messageElement = document.getElementById("notification-message");

  if (messageElement) {
    messageElement.textContent = message;
  }

  if (notification) {
    notification.style.display = 'block';
    gameContainer.style.display = 'none';
  }
}

function proceed() {
  // Lägg till din logik för att gå vidare
  alert("Funktion för att gå vidare implementeras här!");
}


renderGame();