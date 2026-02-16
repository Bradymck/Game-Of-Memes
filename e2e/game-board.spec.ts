import { test, expect } from "@playwright/test";

test.describe("Game Board", () => {
  test("should render game board on page load", async ({ page }) => {
    await page.goto("/");

    // Wait for the game board to be visible
    const gameBoard = page.getByTestId("game-board");
    await expect(gameBoard).toBeVisible();
  });

  test("should show ghost cards when no wallet connected", async ({ page }) => {
    await page.goto("/");

    // Ghost cards should be visible (default state without Privy auth)
    // The player hand should be present
    const playerHand = page.getByTestId("player-hand");
    await expect(playerHand).toBeVisible();
  });

  test("should display end turn button", async ({ page }) => {
    await page.goto("/");

    // End Turn button should be visible
    const endTurnButton = page.getByTestId("end-turn-button");
    await expect(endTurnButton).toBeVisible();

    // Should show "End Turn" text when it's player's turn
    await expect(endTurnButton).toContainText(/End Turn|Enemy Turn/);
  });

  test("should display player and opponent health", async ({ page }) => {
    await page.goto("/");

    // Player health should be visible
    const playerHealth = page.getByTestId("player-health");
    await expect(playerHealth).toBeVisible();

    // Opponent health should be visible
    const opponentHealth = page.getByTestId("opponent-health");
    await expect(opponentHealth).toBeVisible();
  });

  test("should display player mana", async ({ page }) => {
    await page.goto("/");

    // Player mana should be visible
    const playerMana = page.getByTestId("player-mana");
    await expect(playerMana).toBeVisible();
  });

  test("should display player and opponent fields", async ({ page }) => {
    await page.goto("/");

    // Player field should be visible
    const playerField = page.getByTestId("player-field");
    await expect(playerField).toBeVisible();

    // Opponent field should be visible
    const opponentField = page.getByTestId("opponent-field");
    await expect(opponentField).toBeVisible();
  });

  test("should have difficulty selector with 3 buttons", async ({ page }) => {
    await page.goto("/");

    // Difficulty selector should be visible
    const difficultySelector = page.getByTestId("difficulty-selector");
    await expect(difficultySelector).toBeVisible();

    // Should have 3 difficulty buttons
    const easyButton = difficultySelector.getByRole("button", {
      name: /easy/i,
    });
    const normalButton = difficultySelector.getByRole("button", {
      name: /normal/i,
    });
    const hardButton = difficultySelector.getByRole("button", {
      name: /hard/i,
    });

    await expect(easyButton).toBeVisible();
    await expect(normalButton).toBeVisible();
    await expect(hardButton).toBeVisible();
  });

  test("should change active difficulty when clicking difficulty buttons", async ({
    page,
  }) => {
    await page.goto("/");

    const difficultySelector = page.getByTestId("difficulty-selector");
    const easyButton = difficultySelector.getByRole("button", {
      name: /easy/i,
    });
    const normalButton = difficultySelector.getByRole("button", {
      name: /normal/i,
    });
    const hardButton = difficultySelector.getByRole("button", {
      name: /hard/i,
    });

    // Initially, normal should be active (checking for scale-105 class which indicates active state)
    await expect(normalButton).toHaveClass(/scale-105/);

    // Click Easy button
    await easyButton.click();
    await expect(easyButton).toHaveClass(/scale-105/);

    // Click Hard button
    await hardButton.click();
    await expect(hardButton).toHaveClass(/scale-105/);

    // Click Normal button again
    await normalButton.click();
    await expect(normalButton).toHaveClass(/scale-105/);
  });
});
