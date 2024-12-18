let currentDraggedElement;
let moveCount = 0;
const numberOfItems = 7;// Adjust this to select number of colors

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
              itemImg.draggable = index === 0; // Endast första objektet är draggable
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
      updateDraggableStates();
  } catch (error) {
      console.error("Failed to load JSON data:", error);
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
  for (let i = 0; i < allItems.length; i += 4) {
      stacks.push(allItems.slice(i, i + 4));
  }
  return stacks;
}


function moveItemToStack(item, targetStack) {
  if (!item || !targetStack) return;

  const itemsInTarget = targetStack.querySelectorAll('.item-piece');

  // Kontrollera om flytten är giltig
  if (isValidMove(targetStack, item, itemsInTarget)) {
    // Flytta objektet till toppen av stacken
    if (itemsInTarget.length > 0) {
      targetStack.insertBefore(item, itemsInTarget[0]);
    } else {
      targetStack.appendChild(item);
    }

    // Öka drag-räknaren och uppdatera status
    moveCount++;
    updateMoveCount();

    // Kontrollera spelets status
    checkWinCondition();
    checkLoseCondition();
  } else {
    console.log("Ogiltigt drag, inget move räknas.");
  }
}



function enableClickToMove() {
  let selectedItem = null; // Håller reda på markerat objekt

  document.addEventListener('click', function (e) {
    const clickedStack = e.target.closest('.stack'); // Hitta stacken
    const clickedItem = e.target.closest('.item-piece'); // Hitta objektet som klickades
  
    if (clickedStack) {
      if (selectedItem) {
        const itemsInTarget = clickedStack.querySelectorAll('.item-piece');
  
        // Kontrollera om flytten är giltig
        if (isValidMove(clickedStack, selectedItem, itemsInTarget)) {
          moveItemToStack(selectedItem, clickedStack);
        } else {
          console.log("Ogiltigt drag, inget move räknas.");
        }
  
        selectedItem.classList.remove('selected-item'); // Ta bort markeringsklassen
        selectedItem = null; // Nollställ det markerade objektet
        updateDraggableStates(); // Uppdatera vilka objekt som är draggable
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


function enableDragAndDrop() {
  document.addEventListener('dragstart', function (e) {
    const draggedItem = e.target;
    draggedItem.classList.add('being-dragged');
  });

  document.addEventListener('dragover', function (e) {
    e.preventDefault(); // Tillåt droppa
  });

  document.addEventListener('drop', function (e) {
    const targetStack = e.target.closest('.stack');
    const draggedItem = document.querySelector('.being-dragged');

    if (targetStack && draggedItem) {
      moveItemToStack(draggedItem, targetStack);
      draggedItem.classList.remove('being-dragged');
    }
  });

  document.addEventListener('dragend', function (e) {
    e.target.classList.remove('being-dragged');
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

//Lägg till touch-events för mobiler
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

    // Använd transform för att flytta elementet
    currentDraggedElement.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

    e.preventDefault();
  });

  item.addEventListener("touchend", (e) => {
    if (!currentDraggedElement) return;

    // Återställ tillfälligt transform för att få korrekt element
    currentDraggedElement.style.transform = "";

    const touch = e.changedTouches[0];
    const targetStack = document.elementFromPoint(touch.clientX, touch.clientY);

    if (targetStack && targetStack.classList.contains("stack")) {
      const itemsInTarget = targetStack.querySelectorAll(".item-piece");

      if (isValidMove(targetStack, currentDraggedElement, itemsInTarget)) {
        targetStack.insertBefore(currentDraggedElement, targetStack.firstChild);

        // Öka moveCount och uppdatera
        moveCount++;
        updateMoveCount();

        // Uppdatera vinstkontrollen
        updateDraggableStates();
        checkWinCondition();
        checkLoseCondition();
      }
      else {
        console.log("Ogiltigt drag, inget move räknas.");
      }
    }

    // Återställ stil och position
    currentDraggedElement.classList.remove("dragging");
    currentDraggedElement.style.transform = "";
    currentDraggedElement = null;

    e.preventDefault();
  });
}


function addDropEvents(stack) {
  stack.addEventListener("dragover", (e) => {
    e.preventDefault(); // Möjliggör drop
  });

  stack.addEventListener("drop", (e) => {
    e.preventDefault();

    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
    const draggedElement = document.querySelector(
      `.stack[data-stack-id='${data.stackId}'] .item-piece[data-index='${data.index}']`
    );
    const itemsInTarget = stack.querySelectorAll(".item-piece");

    // Validera regler
    if (draggedElement && isValidMove(stack, draggedElement, itemsInTarget)) {
      // Flytta det dragna elementet till toppen av stacken
      if (itemsInTarget.length > 0) {
        stack.insertBefore(draggedElement, itemsInTarget[0]); // Sätt överst
      } else {
        stack.appendChild(draggedElement); // Om stacken är tom
      }

      // Uppdatera draggable-attributen
      updateDraggableStates();
    }
  });
}


// Validera regler
function isValidMove(targetStack, draggedElement, itemsInTarget) {
  // const itemsInTarget = targetStack.querySelectorAll(".item-piece");
  const maxItems = 4;

  if (itemsInTarget.length >= maxItems) {
      //*"Stacken är full
      return false;
  }

  if (itemsInTarget.length === 0) {
      // Tom stack: alltid tillåtet
      return true;
  }

  // Kontrollera om namn matchar det första objektet i stacken
  const firstItemName = itemsInTarget[0].dataset.name;
  if (firstItemName === draggedElement.dataset.name) {
      return true;
  } else {
      //*Fel färg för denna stack
      return false;
  }
}

// Uppdatera draggable-attributen
function updateDraggableStates() {
  const stacks = document.querySelectorAll(".stack");
  stacks.forEach(stack => {
      const items = stack.querySelectorAll(".item-piece");
      items.forEach((item, index) => {
          item.draggable = index === 0; // Endast första objektet är draggable
      });
  });
}

//* Funktion för att återställa spelet
function resetGame() {
  const gameContainer = document.getElementById("game-container");
  gameContainer.innerHTML = ""; // Rensa nuvarande spel
  moveCount = 0; // Återställ drag-räknaren
  updateMoveCount(); // Uppdatera visningen
  renderGame(); // Rendera ett nytt spel
}

// Lägg till event-lyssnare till knappen
document.getElementById("restart-btn").addEventListener("click", resetGame);

//* Kolla om en stack är klar
function checkWinCondition() {
  const stacks = document.querySelectorAll(".stack");
  let completedStacks = 0;

  stacks.forEach(stack => {
      const items = stack.querySelectorAll(".item-piece");

      if (items.length === 4) {
          // Kontrollera om alla objekt i stacken har samma namn
          const firstItemName = items[0].dataset.name;
          const isUniform = Array.from(items).every(item => item.dataset.name === firstItemName);

          if (isUniform) {
              completedStacks++;
          }
      }
  });
  //Om alla items är sorterade
  if (completedStacks === numberOfItems) {
    setTimeout(() => {
      alert("Congratulations! You won!");
    }, 300); // 300ms fördröjning
      // Du kan också lägga till andra åtgärder som att inaktivera vidare drag
  }
}
 //* Kolla om det finns fler valid moves
function checkLoseCondition() {
  const stacks = document.querySelectorAll(".stack");
  let hasValidMove = false;

  // Iterera genom alla stackar och objekt för att hitta giltiga drag
  stacks.forEach(stack => {
      const items = stack.querySelectorAll(".item-piece");
      if (items.length > 0) {
          const firstItem = items[0];

          // Kontrollera alla andra stackar om det är giltigt att flytta till dem
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

  if (!hasValidMove) {
     // Fördröj meddelandet så att användaren ser flytten
     setTimeout(() => {
      alert("Game Over! No more valid moves.");
    }, 300); // 300ms fördröjning
  }
}


//**___________Moves___________ */

function updateMoveCount() {
  const movesElement = document.querySelector('.moves');
  if (movesElement) {
    movesElement.textContent = `Moves: ${moveCount}`;
  }
}





renderGame();