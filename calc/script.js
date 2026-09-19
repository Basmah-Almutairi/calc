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

const display = document.getElementById("display");
const equationDisplay = document.getElementById("equation") || document.getElementById("previous-operand");

let displayValue = "0";
let firstOperand = null;
let currentOperator = null;
let waitingForSecondOperand = false;
let equationValue = "";
let isEvaluated = false;

function roundResult(value) {
  if (typeof value === "string") return value;
  return Math.round(value * 1000000) / 1000000;
}

function updateDisplay() {
  display.textContent = displayValue;
  if (equationDisplay) {
    equationDisplay.textContent = equationValue;
  }
}

function inputNumber(digit) {
  if (isEvaluated) {
    resetCalculator();
  }

  if (waitingForSecondOperand) {
    displayValue = digit;
    waitingForSecondOperand = false;
  } else {
    if (displayValue.includes(".")) {
      const parts = displayValue.split(".");
      if (parts[1] && parts[1].length >= 6) {
        return;
      }
    }
    displayValue = displayValue === "0" ? digit : displayValue + digit;
  }
  updateDisplay();
}

function inputDecimal() {
  if (isEvaluated) {
    resetCalculator();
  }

  if (waitingForSecondOperand) {
    displayValue = "0.";
    waitingForSecondOperand = false;
    updateDisplay();
    return;
  }

  if (!displayValue.includes(".")) {
    displayValue += ".";
    updateDisplay();
  }
}

function handleOperator(nextOperator) {
  const displaySymbol = nextOperator === "*" ? "×" : nextOperator;

  if (isEvaluated) {
    isEvaluated = false;
    equationValue = displayValue + displaySymbol;
    firstOperand = displayValue;
    currentOperator = nextOperator;
    waitingForSecondOperand = true;
    updateDisplay();
    return;
  }

  if (currentOperator && waitingForSecondOperand) {
    currentOperator = nextOperator;
    equationValue = equationValue.slice(0, -1) + displaySymbol;
    updateDisplay();
    return;
  }

  if (firstOperand === null && !isNaN(displayValue)) {
    firstOperand = displayValue;
    equationValue = displayValue + displaySymbol;
  } else if (currentOperator) {
    const result = operate(currentOperator, firstOperand, displayValue);

    if (typeof result === "string") {
      displayValue = result;
      equationValue = "";
      updateDisplay();
      resetCalculator();
      return;
    }

    displayValue = String(roundResult(result));
    firstOperand = displayValue;
    equationValue += displayValue + displaySymbol;
  }

  waitingForSecondOperand = true;
  currentOperator = nextOperator;
  updateDisplay();
}

function handleEquals() {
  if (currentOperator === null || waitingForSecondOperand || isEvaluated) {
    return;
  }

  const result = operate(currentOperator, firstOperand, displayValue);

  equationValue += displayValue + "=";

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
  isEvaluated = true;
  updateDisplay();
}

function resetCalculator() {
  displayValue = "0";
  firstOperand = null;
  currentOperator = null;
  waitingForSecondOperand = false;
  equationValue = "";
  isEvaluated = false;
}

function handleClear() {
  resetCalculator();
  updateDisplay();
}

function handleBackspace() {
  if (waitingForSecondOperand || isEvaluated) return;
  if (displayValue.length > 1) {
    displayValue = displayValue.slice(0, -1);
  } else {
    displayValue = "0";
  }
  updateDisplay();
}

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

const decBtn = document.getElementById("decimal");
if (decBtn) decBtn.addEventListener("click", inputDecimal);

const clrBtn = document.getElementById("clear");
if (clrBtn) clrBtn.addEventListener("click", handleClear);

const backBtn = document.getElementById("backspace");
if (backBtn) backBtn.addEventListener("click", handleBackspace);

const eqBtn = document.getElementById("equals");
if (eqBtn) eqBtn.addEventListener("click", handleEquals);

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
