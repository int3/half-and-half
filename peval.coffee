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
        copy.scope[k] = new v.constructor v.v
      else
        copy.scope[k] = v
    copy

  equals: (sc) ->
    return unless (Object.keys @scope).length == (Object.keys sc.scope).length
    for k, v of @scope
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
  startBlock = new ir.Block start.id
  startEnv = new ScopeChain
  pending = [block: start, newBlock: startBlock, r: startEnv]
  seen = {} # block id => array of seen environments
  seen[start.id] = [block: startBlock, r: startEnv]

  while current = pending.pop()
    {block,r} = current
    emit = (s) -> current.newBlock.body.push s
    createBlockFor = (id) ->
      nextBlock = new ir.Block id
      seen[id] ?= []
      seen[id].push block: nextBlock, r: r
      nextBlock
    for c in block.body
      switch c.constructor.name
        when 'Move'
          if c.left instanceof ir.Member
            prop = evalExpr c.left.property, r

          right = evalExpr c.right, r
          unless ir.isStatic right
            if c.left instanceof ir.Ident
              emit new ir.Move c.left, right
            else if c.left instanceof ir.Member
              emit new ir.Move (new ir.Member c.left.object, prop), right
            else
              throw new Error 'nyi'
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

    if jump instanceof ir.Jump
      pending.push { block: jump.target, newBlock: current.newBlock, r: r }
    else if jump instanceof ir.CJump
      test = evalExpr jump.test, r
      unless ir.isStatic test
        findSpecBlock = (blockId) ->
          if (specializedPoints = seen[blockId])?
            for point in specializedPoints
              if point.r.equals r
                return point.block
          null
        trueBlock = findSpecBlock jump.ifTrue.id
        falseBlock = findSpecBlock jump.ifFalse.id
        unless trueBlock?
          trueBlock = createBlockFor jump.ifTrue.id
          pending.push { block: jump.ifTrue, newBlock: trueBlock, r: r.copy() }
        unless falseBlock?
          falseBlock = createBlockFor jump.ifFalse.id
          pending.push { block: jump.ifFalse, newBlock: falseBlock, r: r.copy() }
        current.newBlock.jump = new ir.CJump test, trueBlock, falseBlock
      else
        if test.v
          pending.push { block: jump.ifTrue, newBlock: current.newBlock, r: r }
        else
          pending.push { block: jump.ifFalse, newBlock: current.newBlock, r: r }
    else
      throw new Error 'wat'

  startBlock

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

if require.main is module
  esprima = require 'esprima'
  fs = require 'fs'
  {desugar} = require './desugar'
  console.log ir.toProgram peval desugar esprima.parse fs.readFileSync process.argv[2]
