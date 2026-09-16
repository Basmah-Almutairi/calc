function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

function multiply(a, b) {
  return a * b;
}

function divide(a, b) {
  // avoid crashing when dividing by zero
  if (b === 0) {
    return "Nice try! 😉";
  }
  return a / b;
}

function operate(operator, a, b) {
  const num1 = Number(a);
  const num2 = Number(b);

  switch (operator) {
    case "+":
      return add(num1, num2);
    case "-":
      return subtract(num1, num2);
    case "*":
      return multiply(num1, num2);
    case "/":
      return divide(num1, num2);
    default:
      return null;
  }
}

// track calculator state
let displayValue = "0";
let firstOperand = null;
let currentOperator = null;
let waitingForSecondOperand = false;

const display = document.getElementById("display");

// keep long decimals from overflowing the screen
function roundResult(value) {
  if (typeof value === "string") return value;
  return Math.round(value * 10000000) / 10000000;
}

function updateDisplay() {
  display.textContent = displayValue;
}

function inputNumber(digit) {
  if (waitingForSecondOperand) {
    displayValue = digit;
    waitingForSecondOperand = false;
  } else {
    displayValue = displayValue === "0" ? digit : displayValue + digit;
  }
  updateDisplay();
}

function inputDecimal() {
  if (waitingForSecondOperand) {
    displayValue = "0.";
    waitingForSecondOperand = false;
    updateDisplay();
    return;
  }
  // only allow one dot per number
  if (!displayValue.includes(".")) {
    displayValue += ".";
    updateDisplay();
  }
}

function handleOperator(nextOperator) {
  const inputValue = displayValue;

  // allow changing operator before typing second number
  if (currentOperator && waitingForSecondOperand) {
    currentOperator = nextOperator;
    return;
  }

  if (firstOperand === null && !isNaN(inputValue)) {
    firstOperand = inputValue;
  } else if (currentOperator) {
    const result = operate(currentOperator, firstOperand, inputValue);

    if (typeof result === "string") {
      displayValue = result;
      updateDisplay();
      resetCalculator();
      return;
    }

    displayValue = String(roundResult(result));
    firstOperand = displayValue;
    updateDisplay();
  }

  waitingForSecondOperand = true;
  currentOperator = nextOperator;
}

function handleEquals() {
  if (currentOperator === null || waitingForSecondOperand) {
    return;
  }

  const result = operate(currentOperator, firstOperand, displayValue);

  if (typeof result === "string") {
    displayValue = result;
    updateDisplay();
    resetCalculator();
    return;
  }

  displayValue = String(roundResult(result));
  firstOperand = null;
  currentOperator = null;
  waitingForSecondOperand = true;
  updateDisplay();
}

function resetCalculator() {
  displayValue = "0";
  firstOperand = null;
  currentOperator = null;
  waitingForSecondOperand = false;
}

function handleClear() {
  resetCalculator();
  updateDisplay();
}

function handleBackspace() {
  if (waitingForSecondOperand) return;
  if (displayValue.length > 1) {
    displayValue = displayValue.slice(0, -1);
  } else {
    displayValue = "0";
  }
  updateDisplay();
}

// button listeners
document.querySelectorAll(".btn.num").forEach((button) => {
  button.addEventListener("click", () => {
    inputNumber(button.getAttribute("data-num"));
  });
});

document.querySelectorAll(".btn.op").forEach((button) => {
  button.addEventListener("click", () => {
    handleOperator(button.getAttribute("data-op"));
  });
});

document.getElementById("decimal").addEventListener("click", inputDecimal);
document.getElementById("clear").addEventListener("click", handleClear);
document.getElementById("backspace").addEventListener("click", handleBackspace);
document.getElementById("equals").addEventListener("click", handleEquals);

// keyboard inputs
window.addEventListener("keydown", (e) => {
  if (e.key >= "0" && e.key <= "9") {
    inputNumber(e.key);
  } else if (e.key === ".") {
    inputDecimal();
  } else if (e.key === "=" || e.key === "Enter") {
    e.preventDefault();
    handleEquals();
  } else if (e.key === "Backspace") {
    handleBackspace();
  } else if (e.key === "Escape") {
    handleClear();
  } else if (["+", "-", "*", "/"].includes(e.key)) {
    handleOperator(e.key);
  }
});