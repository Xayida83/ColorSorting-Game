// Ladda JSON-data och rendera spelet
async function renderGame() {
  const gameContainer = document.getElementById("game-container");

  try {
      // Hämta JSON-data
      const response = await fetch("items.json");
      const items = await response.json();
      console.log(items);

      // Skapa dynamiska staplar
      const stacks = generateShuffledStacks(items);

      // Rendera staplar
      stacks.forEach(stack => {
          const stackDiv = document.createElement("div");
          stackDiv.className = "stack";

          stack.forEach(item => {
              const itemImg = document.createElement("img");
              itemImg.src = item.image;
              itemImg.alt = item.name;
              itemImg.className = "item-piece";
              stackDiv.appendChild(itemImg);
          });

          gameContainer.appendChild(stackDiv);
      });

      // Lägg till tomma platser
      for (let i = 0; i < 2; i++) {
          const emptySlot = document.createElement("div");
          emptySlot.className = "empty-slot";
          gameContainer.appendChild(emptySlot);
      }
  } catch (error) {
      console.error("Kunde inte ladda JSON-data:", error);
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

// Kör spelet
renderGame();
