half-and-half
=============

A simple partial evaluator for JavaScript.

Disclaimer: This is currently a hackish prototype. It only supports a subset of
JavaScript syntax, and only deals with code written in the global environment.

Setup & Usage
-------------

    npm install
    ./half-and-half <filename>

Examples
--------

The following example is an `if` statement in a `while` loop that emulates gotos
using a `label` variable. The underlying control flow can be written much more
simply as an if-else statement, though, and half-and-half is able to figure that
out:

    ./half-and-half examples/while_if.js

More interestingly, here is a brainfuck program that does the equivalent of
`cat`. (It reads from a file named 'input' because node doesn't allow
synchronous reading from stdin, and async code would make the interpreter harder
to specialize.)

    echo "123450" > input
    ./half-and-half examples/brainfuck.js

The brainfuck code is assigned to a `program` variable at the top of
`brainfuck.js`. There is also a commented-out "hello world" program in the same
file, though I think it makes a less interesting example since no control flow
statements are produced in the specialized code.

Debugging
---------

The control-flow graph of the compiled source can be visualized using GraphViz.

    coffee peval.coffee --cfg <filename> | dot -Tpdf -o dot.pdf

You can also see the result of the desugaring + basic block conversion process
via

    coffee desugar.coffee <filename>
