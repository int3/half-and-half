a = 2;
b = (a += 1) + 2;
c = 1 + (a += 2);
d = (a += 1) + (a += 2);

console.log(a, b, c, d);
