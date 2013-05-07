_ = require 'underscore'
ir = require './ir'

class ScopeChain
  constructor: ->
    @scope = Object.create null
    @globals = global

  get: (k) ->
    if k of @scope then @scope[k]
    else if k of @globals then new ir.ObjectLit @globals[k]
    else new ir.Ident k

  set: (k, v) ->
    @scope[k] = v

  copy: ->
    copy = new ScopeChain
    for k, v of @scope
      if ir.isStatic v
        copy.scope[k] = new v.constructor _.clone v.v
      else
        copy.scope[k] = v
    copy

  equals: (sc) ->
    return unless (Object.keys @scope).length == (Object.keys sc.scope).length
    for k, v of @scope
      return false unless k of sc.scope
      vp = sc.scope[k]
      if v.prototype isnt vp.prototype
        return false
      if v instanceof ir.Lit
        return false if v.v isnt vp.v
      else if v instanceof ir.ObjectLit
        return false unless _.isEqual v.v, vp.v
      # v and vp are both dynamic, then.
      # XXX need to revise this if we store any non-trivial dynamic values.
    true

DYNAMIC = { type: 'DYNAMIC' }

String.__nonConstructible__ = 'String'
String.fromCharCode.__pure__ = true
Buffer.__nonConstructible__ = 'Buffer'
console.__nonConstructible__ = 'console'
process.stdout.__nonConstructible__ = 'process.stdout'

peval = (start) ->
  startBlock = new ir.Block null, start.lineno
  startEnv = new ScopeChain
  pending = [block: start, newBlock: startBlock, r: startEnv]
  seen = {} # block id => array of seen environments
  seen[start.id] = [block: startBlock, r: startEnv]

  while current = pending.pop()
    {block,r} = current
    emit = (s) -> current.newBlock.body.push s
    createBlockFor = (originalBlock) ->
      nextBlock = new ir.Block null, originalBlock.lineno
      seen[originalBlock.id] ?= []
      seen[originalBlock.id].push block: nextBlock, r: r
      nextBlock
    for c in block.body
      switch c.constructor.name
        when 'Move'
          if c.left instanceof ir.Member
            prop = evalExpr c.left.property, r

          right = evalExpr c.right, r
          unless right instanceof ir.Lit
            # XXX emitting for static ObjectLit as a temporary hack
            if c.left instanceof ir.Ident
              emit new ir.Move c.left, right
            else if c.left instanceof ir.Member
              emit new ir.Move (new ir.Member c.left.object, prop), right
            else
              throw new Error 'nyi'

          unless ir.isStatic right
            right = DYNAMIC

          if c.left instanceof ir.Ident
            r.set c.left.name, right
          else if c.left instanceof ir.Member
            unless prop instanceof ir.Lit
              throw new Error 'NYI'
            obj = evalExpr c.left.object, r
            if ir.isStatic obj
              obj.v[prop.v] = right
        when 'Call', 'New' # XXX mostly NYI for 'New'
          allStatic = true
          args = c.args.map (a) ->
            a = evalExpr a, r
            allStatic &= ir.isStatic a
            a
          if c.callee instanceof ir.Ident
            fn = evalExpr c.callee, r
            allStatic &= fn instanceof ir.Lit
            if allStatic && fn.__pure__
              r.set ir.Ident.rvTemp.name, new ir.Lit fn.apply(null, args.map((a) -> a.v))
            else
              emit new c.constructor fn, args
          else if c.callee instanceof ir.Member
            obj = evalExpr c.callee.object, r
            prop = evalExpr c.callee.property, r
            allStatic &&= obj instanceof ir.ObjectLit and prop instanceof ir.Lit
            if allStatic && obj.v[prop.v].__pure__
              r.set ir.Ident.rvTemp.name, new ir.Lit(
                obj.v[prop.v].apply(obj.v, args.map((a) -> a.v)))
            else
              emit new c.constructor(new ir.Member(obj, prop), args)
          else
            throw new Error 'wat'
        else
          throw new Error 'NYI'

    continue unless (jump = block.jump)?

    findOrCreateSpecBlock = (target) ->
      if (specializedPoints = seen[target.id])?
        for point in specializedPoints
          if point.r.equals r
            targetBlock = point.block
            break
      unless targetBlock?
        targetBlock = createBlockFor target
        pending.push { block: target, newBlock: targetBlock, r: r.copy() }
      targetBlock

    if jump instanceof ir.Jump
      current.newBlock.jump = new ir.Jump findOrCreateSpecBlock jump.target
    else if jump instanceof ir.CJump
      test = evalExpr jump.test, r
      unless ir.isStatic test
        trueBlock = findOrCreateSpecBlock jump.ifTrue
        falseBlock = findOrCreateSpecBlock jump.ifFalse
        current.newBlock.jump = new ir.CJump test, trueBlock, falseBlock
      else
        if test.v
          target = jump.ifTrue
        else
          target = jump.ifFalse
        current.newBlock.jump = new ir.Jump findOrCreateSpecBlock target
    else
      throw new Error 'wat'

  compressTransitions startBlock

  startBlock

compressTransitions = (startBlock) ->
  inCount = {} # block id => number of incoming edges
  countIncoming = (block) ->
    if block.id of inCount
      inCount[block.id]++
      return
    inCount[block.id] = 0
    if block.jump instanceof ir.Jump
      countIncoming block.jump.target
    else if block.jump instanceof ir.CJump
      countIncoming block.jump.ifTrue
      countIncoming block.jump.ifFalse
  countIncoming(startBlock)

  pending = [startBlock]
  seen = {}
  while block = pending.pop()
    continue if block.id of seen
    seen[block.id] = true

    headBlock = block
    seenJoin = false
    while block.jump instanceof ir.Jump and
       (!(seenJoin |= inCount[block.jump.target.id] != 0) or
       block.jump.target.body.length == 0)
      block = block.jump.target
      Array::push.apply headBlock.body, block.body

    contractEmptyJumps = (b) ->
      while b.jump instanceof ir.Jump and b.body.length == 0
        b = b.jump.target
      b

    headBlock.jump = block.jump
    if block.jump instanceof ir.CJump
      block.jump.ifTrue = contractEmptyJumps block.jump.ifTrue
      block.jump.ifFalse = contractEmptyJumps block.jump.ifFalse
      pending.push block.jump.ifTrue, block.jump.ifFalse
    else if block.jump instanceof ir.Jump
      pending.push block.jump.target

  null # don't accumulate results

evalExpr = (c, r) ->
  switch c.constructor.name
    when 'BinOp'
      left = evalExpr c.left, r
      right = evalExpr c.right, r
      if left instanceof ir.Lit and right instanceof ir.Lit
        new ir.Lit(
          switch c.op
            when '+'
              left.v + right.v
            when '-'
              left.v - right.v
            when '*'
              left.v * right.v
            when '/'
              left.v / right.v
            when '>'
              left.v > right.v
            when '<'
              left.v < right.v
            when '!=='
              left.v != right.v
            when '==='
              left.v == right.v
            else
              throw new Error "Operator NYI: #{c.op}"
        )
      else
        new ir.BinOp c.op, left, right
    when 'UnOp'
      arg = evalExpr c.arg, r
      if arg instanceof ir.Lit
        if c.op is '!'
          new ir.Lit !arg.v
        else
          throw new Error 'nyi'
      else
        new ir.UnOp c.op, arg
    when 'Member'
      obj = evalExpr c.object, r
      prop = evalExpr c.property, r
      if ir.isStatic(obj) and ir.isStatic(prop)
        v = obj.v[prop.v]
        if v is DYNAMIC
          new ir.Member c.object, prop
        else if v not instanceof ir.IRNode
          # probably some native property like array length
          ir.lift v
        else
          v
      else
        new ir.Member obj, prop
    when 'Ident'
      v = r.get c.name
      if v is DYNAMIC then new ir.Ident c.name else v
    when 'ObjectLit', 'Lit'
      c
    else
      console.error c
      throw new Error 'NYI'

debugPrintCFG = (block) ->
  seen = {}
  recur = (block) ->
    return if block.id of seen
    seen[block.id] = true
    if block.jump instanceof ir.Jump
      console.log "#{block.id} -> #{block.jump.target.id};"
      recur block.jump.target
    else if block.jump instanceof ir.CJump
      console.log "#{block.id} -> #{block.jump.ifTrue.id} [label=T];"
      console.log "#{block.id} -> #{block.jump.ifFalse.id} [label=F];"
      recur block.jump.ifTrue
      recur block.jump.ifFalse
  console.log "digraph cfg {"
  recur block
  console.log "}"

if require.main is module
  {argv} = require 'optimist'
  esprima = require 'esprima'
  fs = require 'fs'
  {desugar} = require './desugar'
  cfg = peval desugar esprima.parse (fs.readFileSync argv._[0]), loc: true
  if argv.cfg
    debugPrintCFG cfg
  else
    console.log ir.toProgram cfg
