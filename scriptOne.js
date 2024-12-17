// Ladda JSON-data och rendera spelet
async function renderGame() {
  const gameContainer = document.getElementById("game-container");
  const numberOfItems = 4; // Adjust this to select number of colors

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
              addDragEvents(itemImg); // Lägg till drag-event-hanterare
              stackDiv.appendChild(itemImg);
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
          addDropEvents(emptySlot); // Lägg till drop-event-hanterare
          gameContainer.appendChild(emptySlot);
      }
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

// Lägg till event-hanterare för drag
function addDragEvents(item) {
  item.addEventListener("dragstart", (e) => {
      const parentStack = item.parentNode;
      const firstChild = parentStack.querySelector(".item-piece");

      // Kontrollera att endast första barnet kan dras
      if (item === firstChild) {
          e.dataTransfer.setData("text/plain", JSON.stringify({
              name: item.dataset.name,
              index: item.dataset.index,
              stackId: parentStack.dataset.stackId
          }));
      } else {
          e.preventDefault(); // Blockera drag för andra element
      }
  });
}

// Lägg till event-hanterare för drop
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

// // Återställ stilar och variabler efter drag
// function resetDraggedItem() {
//     draggedItem.style.position = "";
//     draggedItem.style.zIndex = "";
//     draggedItem.style.left = "";
//     draggedItem.style.top = "";

//     draggedItem = null; // Släpp objektet
//     originalParent = null; // Återställ ursprung
// }

renderGame().then(addDragEvents());