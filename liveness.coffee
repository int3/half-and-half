_ = require 'underscore'
ir = require './ir'

liveness = exports ? this.liveness = {}

setDiff = (a, b) ->
  for k,v of b
    delete a[k]
  a

exprGen = (c) ->
  gen = {}
  recur = (c) ->
    switch c.constructor.name
      when 'BinOp'
        recur c.left
        recur c.right
      when 'UnOp'
        recur c.arg
      when 'Member'
        # XXX less than optimal
        recur c.object
        recur c.property
      when 'Ident'
        gen[c.name] = true
      when 'ObjectLit', 'Lit'
        ``
      else
        throw new Error 'NYI'
  recur c
  gen

liveness.blockGenKill = (block) ->
  blockKill = {}
  blockGen = {}
  nextGen = {}
  nextKill = {}
  gen = {}
  kill = {}
  for c in block.body by -1
    switch c.constructor.name
      when 'Move'
        gen = exprGen c.right
        if c.left instanceof ir.Ident
          kill[c.left.name] = true
        else if c.left instanceof ir.Member
          _.extend(gen, exprGen(c.left))
        else
          throw new Error 'nyi'
      when 'Call', 'New'
        gen = exprGen c.callee
        for a in c.args
          _.extend gen, exprGen(a)
      else
        throw new Error 'NYI'
    _.extend (setDiff blockGen, kill), gen
    _.extend blockKill, kill
    nextGen = gen
    nextKill = kill
    gen = {}
    kill = {}

  {gen:blockGen, kill:blockKill}

getTargets = (block) ->
  if block.jump instanceof ir.Jump
    [block.jump.target]
  else if block.jump instanceof ir.CJump
    [block.jump.ifTrue, block.jump.ifFalse]
  else
    []

reverseTopoSort = (start) ->
  result = []
  seen = {}
  recur = (block) ->
    return if block.id of seen
    seen[block.id] = true
    for target in getTargets block
      recur target
    result.push block
  recur start
  result

liveness.analyze = (start) ->
  liveIn = {}
  liveOut = {}
  genKills = {}
  dirty = true
  sorted = reverseTopoSort start
  for block in sorted
    genKills[block.id] = liveness.blockGenKill block
    liveIn[block.id] = genKills[block.id].gen
    liveOut[block.id] = {}

  while dirty
    dirty = false
    for block in sorted
      outChanged = false
      for target in getTargets block
        for k of liveIn[target.id] when k not of liveOut[block.id]
          liveOut[block.id][k] = true
          outChanged = true

      if outChanged
        gk = genKills[block.id]
        oldLiveIn = liveIn[block.id]
        liveIn[block.id] = _.extend (setDiff (_.clone liveOut[block.id]), gk.kill), gk.gen
        dirty ||= (Object.keys oldLiveIn) < (Object.keys liveIn[block.id])

  {in:liveIn, out:liveOut}

if require.main is module
  esprima = require 'esprima'
  fs = require 'fs'
  {desugar} = require './desugar'
  live = liveness.analyze desugar esprima.parse (fs.readFileSync process.argv[2]), loc: true
  console.log JSON.stringify live, null, 4
