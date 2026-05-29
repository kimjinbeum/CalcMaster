const resultInput = document.getElementById('result');
const historyList = document.getElementById('history-list');

function appendNumber(number) {
    resultInput.value += number;
}

function appendOperator(operator) {
    resultInput.value += operator;
}

function clearDisplay() {
    resultInput.value = '';
}

function deleteChar() {
    resultInput.value = resultInput.value.slice(0, -1);
}

function evaluateExpression() {
    try {
        const expression = resultInput.value;
        // Replace ^ with ** for power calculation before evaluating
        let evalExpression = expression.replace(/\^/g, '**');
        const result = eval(evalExpression);
        resultInput.value = result;

        // Add to history
        addToHistory(expression, result);
    } catch (error) {
        resultInput.value = 'Error';
    }
}

function calculate(fn) {
    const value = parseFloat(resultInput.value);
    
    // Pi and e can be added without a preceding number
    if (fn === 'pi') {
        resultInput.value += Math.PI;
        return;
    }
    if (fn === 'e') {
        resultInput.value += Math.E;
        return;
    }

    if (isNaN(value) && resultInput.value !== '') {
        resultInput.value = 'Error';
        return;
    }

    let result;
    let expression;
    switch (fn) {
        case 'sin':
            expression = `sin(${value})`;
            result = Math.sin(value);
            break;
        case 'cos':
            expression = `cos(${value})`;
            result = Math.cos(value);
            break;
        case 'tan':
            expression = `tan(${value})`;
            result = Math.tan(value);
            break;
        case 'asin':
            expression = `asin(${value})`;
            result = Math.asin(value);
            break;
        case 'acos':
            expression = `acos(${value})`;
            result = Math.acos(value);
            break;
        case 'atan':
            expression = `atan(${value})`;
            result = Math.atan(value);
            break;
        case 'log':
            expression = `log(${value})`;
            result = Math.log10(value);
            break;
        case 'ln':
            expression = `ln(${value})`;
            result = Math.log(value);
            break;
        case 'sqrt':
            expression = `sqrt(${value})`;
            result = Math.sqrt(value);
            break;
        case 'pow':
            resultInput.value += '^';
            return;
        case 'exp':
            expression = `exp(${value})`;
            result = Math.exp(value);
            break;
        default:
            result = 'Error';
    }
    
    if (result !== undefined) {
         resultInput.value = result;
         addToHistory(expression, result);
    }
}

function addToHistory(expression, result) {
    const listItem = document.createElement('li');
    listItem.innerHTML = `${expression} = <b>${result}</b>`;
    historyList.appendChild(listItem);
    historyList.scrollTop = historyList.scrollHeight; // Scroll to the bottom
}

function clearHistory() {
    historyList.innerHTML = '';
}

// 키보드 입력 이벤트 리스너 추가
document.addEventListener('keydown', function(event) {
    const key = event.key;
    
    // 숫자 및 소수점 입력
    if (/^[0-9.]$/.test(key)) {
        appendNumber(key);
    } 
    // 사칙연산 및 괄호, 제곱 입력
    else if (['+', '-', '*', '/', '(', ')', '^'].includes(key)) {
        appendOperator(key);
    } 
    // 엔터(=) 키: 결과 계산
    else if (key === 'Enter' || key === '=') {
        event.preventDefault(); // 폼 제출 등 기본 동작 방지
        evaluateExpression();
    } 
    // 백스페이스 키: 마지막 글자 삭제
    else if (key === 'Backspace') {
        deleteChar();
    } 
    // ESC 키: 전체 지우기(초기화)
    else if (key === 'Escape') {
        clearDisplay();
    }
});