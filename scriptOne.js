let currentDraggedElement;
const numberOfItems = 3;// Adjust this to select number of colors

async function renderGame() {
  const gameContainer = document.getElementById("game-container");

  try {
      // Hämta JSON-data
      const response = await fetch("items.json");
      const items = await response.json();
      console.log("all items: ", items);

      // Limit to selected number of colors
      const selectedItems = items.slice(0, numberOfItems);
      console.log("Valda items:", selectedItems);

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

              addDragEvents(itemImg); // Lägg till drag-event-hanterare
              addTouchEvents(itemImg); // Lägg till touch events
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

// Lägg till touch-events för mobiler
function addTouchEvents(item) {
  item.addEventListener("touchstart", (e) => {
    const parentStack = item.parentNode;
    const firstChild = parentStack.querySelector(".item-piece");

    if (item === firstChild) {
      currentDraggedElement = item;
      item.classList.add("dragging"); // Lägg till styling
      e.preventDefault(); // Förhindra scroll
    }
  });

  item.addEventListener("touchmove", (e) => {
    if (!currentDraggedElement) return;
    currentDraggedElement.classList.add("dragging");

    const touch = e.touches[0];
    currentDraggedElement.style.position = "absolute";
    currentDraggedElement.style.zIndex = "2000"; // Flytta objektet över andra element
    currentDraggedElement.style.left = `${touch.clientX - 2}px`;
    currentDraggedElement.style.top = `${touch.clientY - 2}px`;
    e.preventDefault();
  });

  item.addEventListener("touchend", (e) => {
    if (!currentDraggedElement) return;

    // Hitta den stack som användaren släppte objektet över
    const touch = e.changedTouches[0];
    const targetStack = document.elementFromPoint(touch.clientX, touch.clientY);

    if (targetStack && targetStack.classList.contains("stack")) {
      const itemsInTarget = targetStack.querySelectorAll(".item-piece");
      if (isValidMove(targetStack, currentDraggedElement, itemsInTarget)) {
        targetStack.insertBefore(currentDraggedElement, targetStack.firstChild);
        updateDraggableStates();
      }
    }

    // Återställ objektets stil
    currentDraggedElement.classList.remove("dragging");
    currentDraggedElement.style.position = "";
    currentDraggedElement.style.left = "";
    currentDraggedElement.style.top = "";
    currentDraggedElement.style.zIndex = "";
    currentDraggedElement = null;

    e.preventDefault();
  });
}

// Lägg till event-hanterare för drop
function addDropEvents(stack) {
  stack.addEventListener("dragover", (e) => {
    e.preventDefault(); // Möjliggör drop
  });
// Lägg till drop-events för desktop
function addDropEvents(stack) {
  stack.addEventListener("dragover", (e) => e.preventDefault());
  stack.addEventListener("drop", (e) => {
    e.preventDefault();

    const data = JSON.parse(e.dataTransfer.getData("text/plain"));
    const draggedElement = document.querySelector(
      `.stack[data-stack-id='${data.stackId}'] .item-piece[data-index='${data.index}']`
    );
    const itemsInTarget = stack.querySelectorAll(".item-piece");

    if (draggedElement && isValidMove(stack, draggedElement, itemsInTarget)) {
      stack.insertBefore(draggedElement, stack.firstChild);
      updateDraggableStates();
    }
  });
}

// Validera regler
function isValidMove(targetStack, draggedElement, itemsInTarget) {
  const maxItems = 4;

  if (itemsInTarget.length >= maxItems) {
    console.warn("Stacken är full.");
    return false;
  }

  if (itemsInTarget.length === 0) return true;

  const firstItemName = itemsInTarget[0].dataset.name;
  if (firstItemName === draggedElement.dataset.name) return true;

  console.warn("Fel färg för denna stack.");
  return false;
}

// Uppdatera draggable-attributen
function updateDraggableStates() {
  const stacks = document.querySelectorAll(".stack");
  stacks.forEach((stack) => {
    const items = stack.querySelectorAll(".item-piece");
    items.forEach((item, index) => {
      item.draggable = index === 0;
    });
  });
}

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
      console.warn("Stacken är full.");
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
      console.warn("Fel färg för denna stack.");
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


renderGame();
// renderGame().then(addDragEvents());