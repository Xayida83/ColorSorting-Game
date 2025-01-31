# Sorting Game

## Description
Sorting Game is a modular game where the player sorts items based on name. The game starts with several stacks of mixed items and two empty stacks. The goal is to group all items of the same name into a single stack. The game follows mobile-first principles and is built using JavaScript, HTML5, and CSS.

## Features
- **Dynamic number of items**: The developer can choose how many different items to play with.
- **Moves and scoring**: The developer can decide whether there should be a maximum number of moves, how many points a move deducts, and how many points you get from a completed stack.
- **Win condition**: The player wins when all items of the same name are grouped in their respective stacks.
- **Lose condition**: The game ends if no valid moves remain or the maximum number of moves has been reached.

## Game Rules
1. A maximum of four items can be stacked in a single stack.
2. Only items of the same name can be stacked together.
3. An empty stack can start with any item.
4. The game always starts with two empty stacks.
5. The player can only move the item that is at the top
6. The player can move one item at a time.
7. The game is won when all stacks are correctly sorted by name.
8. The player loses when no valid moves remain or the maximum number of moves has been reached.

## Code Functionality

### `checkWinCondition`
This function checks if the player has won:
- Iterates through all stacks to check if a stack contains four items of the same name.
- If a stack meets the criteria and has not been counted before:
  - Updates the score.
  - The stack is "locked" (no further changes allowed).
- If all stacks are complete (matching the total number of items), a win message is displayed.

### `checkLoseCondition`
This function checks if the player has lost:
- Verifies if valid moves remain by:
  - Comparing each stack with all others.
  - Checking if it is valid to move an item to another stack.
- If no valid moves are available or if a move limit has been exceeded (if enabled), a game-over message is displayed.
- The function exits if the game has already been won.

### Helper Functions
#### `isValidMove`
Checks if an item can be moved to a target stack:
- The target stack is empty, or
- The top item in the target stack is of the same name.

#### `lockStack`
Locks a stack that is full and correctly sorted, preventing further moves.

#### `displayNotification`
Displays messages for win or loss conditions and other.

## Configuration Settings
The configuration can be customized to adjust the gameplay experience:
- `numberOfItems`: Number of items to play with.
- `config.limitMoves`: Limit the maximum number of moves (true/false).
- `config.maxMoves`: Maximum number of moves allowed before the game ends.
- `startPoints`: Set the start of score counting.
- `sackPoints`: Set the points for a finished stack.
- `movePoints`: Set the points to reduce when making a move.

## Suggestions for Improvement
- Add more animations for an enhanced gameplay experience.
- Implement an "undo" function to revert the last move.
- Allow players to select different themes or color schemes.

## CSS
These variables are used to easily modify the appearance throughout the document. They are defined in :root and can be adjusted to change colors, backgrounds, typography, and more.

### Background
- --background-image: Change the URL of the background image.
- --body-view-height: Adjust the height of the body (e.g., 112vh or 100%).
### Colors
- --primary-color: Change the primary theme color.
- --secondary-color: Change the secondary theme color.
- --third-color: Change the additional accent color.
- --font-color: Adjust the default text color.
- --font-color-secondary: Change the secondary text color.
- --locked-opacity: Adjust the opacity for locked elements.
### Buttons
- --restart-btn-bg-color: Background color for the restart button.
- --restart-btn-border-color: Border color for the restart button.
- --button-bg-color: Background color for other buttons.
### Typography
- --font-size: Adjust the default font size.
- --font-family: Change the font family.
- --font-weight: Adjust the font weight (default: 700).
### Borders and Shadows
- --border-radius: Adjust the corner radius of elements.
- --border-width: Change the width of borders.
- --shadow: Set the shadow effect for elements.
### Stacks
- --stack-background-img: Background image for stacks.
- --stack-width: Set the width of each stack.
- --stack-filter: Apply a filter to the stacks.
- --stack-gap: Define the spacing between items in the stack.
### Items
- --item-width: Adjust the width of each item.
- --item-border-color: Change the border color of items.
- --item-border-width: Set the border width for items.
- --item-border-style: Adjust the border style (solid, dotted, etc.).
- --transform: Define transformation effects (e.g., scale(1.1)).
### Spacing
- --padding: Set the standard padding for elements.


