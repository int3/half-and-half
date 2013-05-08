assert = require 'assert'
ir = require '../ir'
liveness = require '../liveness'

# a = b
body1 = [
  new ir.Move(
    new ir.Ident 'a'
    new ir.Ident 'b'
  )
]

# a = b
# b = c
body2 = [
  new ir.Move(
    new ir.Ident 'a'
    new ir.Ident 'b'
  )
  new ir.Move(
    new ir.Ident 'b'
    new ir.Ident 'c'
  )
]

# b = c
# a = b
body3 = [
  new ir.Move(
    new ir.Ident 'b'
    new ir.Ident 'c'
  )
  new ir.Move(
    new ir.Ident 'a'
    new ir.Ident 'b'
  )
]

# c = a + b + c
body4 = [
  new ir.Move(
    new ir.Ident 'c'
    new ir.BinOp '+', (new ir.Ident 'a'), (new ir.BinOp '+', (new ir.Ident 'b'), (new ir.Ident 'c'))
  )
]

do ->
  block = new ir.Block
  block.body = body1
  genKill = liveness.blockGenKill(block)
  assert.deepEqual genKill.gen, {b:true}
  assert.deepEqual genKill.kill, {a:true}

do ->
  block = new ir.Block
  block.body = body2
  genKill = liveness.blockGenKill(block)
  assert.deepEqual genKill.gen, {b:true, c:true}
  assert.deepEqual genKill.kill, {a:true, b:true}

do ->
  block = new ir.Block
  block.body = body3
  genKill = liveness.blockGenKill(block)
  assert.deepEqual genKill.gen, {c:true}
  assert.deepEqual genKill.kill, {a:true, b:true}

do ->
  block = new ir.Block
  block.body = body4
  genKill = liveness.blockGenKill(block)
  assert.deepEqual genKill.gen, {a:true, b:true, c: true}
  assert.deepEqual genKill.kill, {c:true}

do ->
  block1 = new ir.Block
  block1.body = body1
  block2 = new ir.Block
  block2.body = body2
  block1.jump = new ir.Jump block2
  live = liveness.analyze block1
  expected = {}
  expected[block1.id] = {b:true, c:true}
  expected[block2.id] = {b:true, c:true}
  assert.deepEqual live.in, expected
  expected = {}
  expected[block1.id] = {b:true, c:true}
  expected[block2.id] = {}
  assert.deepEqual live.out, expected

# 2 -> 1 -> 4
do ->
  block1 = new ir.Block
  block1.body = body1
  block2 = new ir.Block
  block2.body = body2
  block4 = new ir.Block
  block4.body = body4

  block2.jump = new ir.Jump block1
  block1.jump = new ir.Jump block4

  live = liveness.analyze block2
  expected = {}
  expected[block2.id] = {b:true, c:true}
  expected[block1.id] = {b:true, c:true}
  expected[block4.id] = {a:true, b:true, c:true}
  assert.deepEqual live.in, expected
  expected = {}
  expected[block2.id] = {b:true, c:true}
  expected[block1.id] = {a:true, b:true, c:true}
  expected[block4.id] = {}
  assert.deepEqual live.out, expected
