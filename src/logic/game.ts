
export type Choice = 'rock' | 'paper' | 'scissors';
export type Difficulty = 'easy' | 'medium' | 'hard';

export const CHOICES: Choice[] = ['rock', 'paper', 'scissors'];

export const WIN_MAP: Record<Choice, Choice> = {
  rock: 'scissors',
  paper: 'rock',
  scissors: 'paper',
};

export const getResult = (player: Choice, opponent: Choice): 'win' | 'lose' | 'draw' => {
  if (player === opponent) return 'draw';
  return WIN_MAP[player] === opponent ? 'win' : 'lose';
};

export const getCounter = (choice: Choice): Choice => {
  if (choice === 'rock') return 'paper';
  if (choice === 'paper') return 'scissors';
  return 'rock';
};

export class SmartAI {
  private history: Choice[] = [];

  recordMove(choice: Choice) {
    this.history.push(choice);
    if (this.history.length > 50) this.history.shift();
  }

  predictNextMove(difficulty: Difficulty): Choice {
    if (difficulty === 'easy') {
      return CHOICES[Math.floor(Math.random() * CHOICES.length)];
    }

    if (difficulty === 'medium') {
      // 50% chance of random, 50% chance of predicting based on most frequent move
      if (Math.random() > 0.5) {
        return CHOICES[Math.floor(Math.random() * CHOICES.length)];
      }
    }

    // Hard or Medium (50% chance)
    if (this.history.length < 3) {
      return CHOICES[Math.floor(Math.random() * CHOICES.length)];
    }

    // Simple Pattern Matching (Markov-like)
    // Look for the most common move after the current last move
    const lastMove = this.history[this.history.length - 1];
    const transitions: Record<Choice, number> = { rock: 0, paper: 0, scissors: 0 };
    
    for (let i = 0; i < this.history.length - 1; i++) {
      if (this.history[i] === lastMove) {
        transitions[this.history[i + 1]]++;
      }
    }

    let predicted: Choice = 'rock';
    let maxCount = -1;
    for (const choice of CHOICES) {
      if (transitions[choice] > maxCount) {
        maxCount = transitions[choice];
        predicted = choice;
      }
    }

    // If no pattern found, fallback to most frequent overall
    if (maxCount === 0) {
      const counts: Record<Choice, number> = { rock: 0, paper: 0, scissors: 0 };
      this.history.forEach(m => counts[m]++);
      for (const choice of CHOICES) {
        if (counts[choice] > maxCount) {
          maxCount = counts[choice];
          predicted = choice;
        }
      }
    }

    // The AI should pick the move that BEATS the predicted player move
    return getCounter(predicted);
  }
}
