b = 0;
c = 0;
label = 0;

while (true) {
  if (label === 0) {
    b += 1;
    if (u) {
      label = 1;
    } else {
      label = 2;
    }
  } else if (label === 1) {
    c += 2;
    label = 2;
  } else if (label === 2) {
    c += 3;
    break;
  }
}

console.log(b, c);
