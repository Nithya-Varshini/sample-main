class AdditionComponent {
    constructor(num1, num2) {
        this.num1 = num1;
        this.num2 = num2;
    }

    add() {
        return this.num1 + this.num2;
    }
}

// Usage example
const addition = new AdditionComponent(5, 3);
console.log(addition.add()); // Output: 8