/**
  * Hello world!
  */
//program = "++++++++++[>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>.";

/**
  * cat
  */
program = ",[.[-],]";

arr = [];
i = -1;
while ((i += 1) < 500) {
    arr[i] = 0;
}

i = 0;
j = 0;

fs = require('fs');
input = fs.openSync('input', 'r');

while (i < program.length) {
    if (program[i] === '>') {
        j += 1;
    } else if (program[i] === '<') {
        j -= 1;
    } else if (program[i] === '+') {
        arr[j] += 1;
    } else if (program[i] === '-') {
        arr[j] -= 1;
    } else if (program[i] === '.') {
        process.stdout.write(String.fromCharCode(arr[j]));
    } else if (program[i] === ',') {
        data = new Buffer(1);
        bytesRead = fs.readSync(input, data, 0, 1, null);
        if (bytesRead === 0) {
          arr[j] = 0;
        } else {
          arr[j] = data[0];
        }
    } else if (program[i] === '[') {
        if (arr[j] === 0) {
            open = 1;
            i += 1;
            while (open > 0) {
                if (program[i] === '[')
                    open += 1;
                else if (program[i] === ']')
                    open -= 1;
                i += 1;
            }
            i -= 1;
        }
    } else if (program[i] === ']') {
        if (arr[j] !== 0) {
            open = 1;
            i -= 1;
            while (open > 0) {
                if (program[i] === ']')
                    open += 1;
                else if (program[i] === '[')
                    open -= 1;
                i -= 1;
            }
            i += 1;
        }
    }
    i += 1;
}
