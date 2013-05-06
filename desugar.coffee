_ = require 'underscore'
ir = require './ir'

desugar = exports ? this.desugar = {}

class Desugarer

  constructor: ->
    @seqBlocks = [] # chunks of Seq lists. first one should be a Label
    @blocks = {} # map of block ID => ir.Block
    @loopExits = [] # for break and continue
    @startId = null # the block ID of the entry block

  toIR: (c) ->
    switch c.type
      when 'Program', 'BlockStatement'
        if c.type is 'Program'
          seq = new ir.Label c.loc.start.line
          @startId = seq.id
        else
          seq = null
        for s in c.body
          seq = new ir.Seq seq, @toIR(s)
        seq
      when 'IfStatement'
        test = (@toIR c.test).asExpr()
        ifTrue = new ir.Label c.consequent.loc.start.line
        done = new ir.Label c.loc.end.line
        @seqBlocks.push (new ir.Seq ifTrue, (@toIR c.consequent), new ir.Jump done)
        if c.alternate?
          ifFalse = new ir.Label c.alternate.loc.start.line
          @seqBlocks.push (new ir.Seq ifFalse, (@toIR c.alternate), new ir.Jump done)
          new ir.Seq (new ir.CJump test, ifTrue, ifFalse), done
        else
          new ir.Seq (new ir.CJump test, ifTrue, done), done
      when 'WhileStatement'
        test = (@toIR c.test).asExpr()
        head = new ir.Label c.test.loc.start.line
        ifTrue = new ir.Label c.body.loc.start.line
        done = new ir.Label c.body.loc.end.line
        @loopExits.push { break: done, continue: head }
        @seqBlocks.push (new ir.Seq ifTrue, (@toIR c.body), new ir.Jump head)
        @loopExits.pop()
        new ir.Seq head, (new ir.CJump test, ifTrue, done), done
      when 'BreakStatement'
        if c.label
          throw new Error 'nyi'
        else
          new ir.Jump (_.last @loopExits).break
      when 'ContinueStatement'
        if c.label
          throw new Error 'nyi'
        else
          new ir.Jump (_.last @loopExits).continue
      when 'ExpressionStatement'
        @toIR c.expression
      when 'CallExpression'
        new ir.Call (@toIR c.callee), c.arguments.map (a) => @toIR(a).asExpr()
      when 'NewExpression'
        new ir.New (@toIR c.callee), c.arguments.map (a) => @toIR(a).asExpr()
      when 'AssignmentExpression'
        if c.left.type in ['Identifier', 'MemberExpression']
          left = (@toIR c.left).asExpr()
        else
          throw new Error('NYI')

        if c.operator == '='
          right = (@toIR c.right).asExpr()
        else if c.operator[-1..] is '='
          right = new ir.BinOp(c.operator[0...-1],
            @toIR(c.left).asExpr(), @toIR(c.right).asExpr())
        else
          throw new Error("Unrecognized operator " + c.operator)

        new ir.Move left, right
      when 'BinaryExpression'
        new ir.BinOp c.operator, @toIR(c.left).asExpr(), @toIR(c.right).asExpr()
      when 'UnaryExpression'
        if c.operator is '-'
          new ir.BinOp '-', (new ir.Lit 0), @toIR(c.argument).asExpr()
        else
          new ir.UnOp c.operator, @toIR(c.argument).asExpr()
      when 'MemberExpression'
        obj = @toIR c.object
        unless c.computed
          new ir.Member obj, new ir.Lit c.property.name
        else
          new ir.Member obj, (@toIR c.property).asExpr()
      when 'Identifier'
        new ir.Ident c.name
      when 'ArrayExpression'
        new ir.ObjectLit c.elements.map (el) => (@toIR el).asExpr()
      when 'Literal'
        new ir.Lit c.value
      else
        console.error c
        throw new Error

  # linearize the tree, creating blocks in the process
  linearize: (start) ->
    block = null
    recur = (c) =>
      switch c.constructor.name
        when 'Seq'
          c.left? && recur c.left
          c.right? && recur c.right
        when 'Label'
          block?.jump = new ir.Jump c
          @blocks[c.id] = block = new ir.Block c.id, c.lineno
        when 'Jump', 'CJump'
          block?.jump = c
          block = null
        else
          # if there's no active block, this should be dead code...
          block?.body.push c
    recur(start)

  desugar: (ast) ->
    @seqBlocks.push @toIR ast
    @seqBlocks.forEach (b) => @linearize bubbleESeqs b
    for k, b of @blocks # 'link' the jumps to their blocks
      if b.jump instanceof ir.Jump
        b.jump.target = @blocks[b.jump.target.id]
      else if b.jump instanceof ir.CJump
        b.jump.ifTrue = @blocks[b.jump.ifTrue.id]
        b.jump.ifFalse = @blocks[b.jump.ifFalse.id]
    @blocks[@startId] # return the entry block

  extractSeqsFromArray = (arr) ->
    arr = arr.map bubbleESeqs
    foundESeq = false
    for a, i in arr by -1
      if foundESeq
        unless a instanceof ir.Lit
          t = new ir.Ident
          if a instanceof ir.ESeq
            arr[i] = new ir.ESeq t,
              new ir.Seq a.stmt, (new ir.Move t, a.expr)
          else
            arr[i] = new ir.ESeq t, new ir.Move t, a
      else
        foundESeq = a instanceof ir.ESeq
    seq = null
    arr = arr.map (a) ->
      if a instanceof ir.ESeq
        seq = new ir.Seq seq, a.stmt
        a.expr
      else
        a
    [arr, seq]

  bubbleESeqs = (c) ->
    switch c.constructor.name
      when 'Seq'
        left = if c.left? then bubbleESeqs c.left else null
        right = if c.right? then bubbleESeqs c.right else null
        if left instanceof ir.ESeq
          left = left.stmt
        if right instanceof ir.ESeq
          right = right.stmt
        new ir.Seq left, right
      when 'ESeq'
        expr = bubbleESeqs c.expr
        stmt = bubbleESeqs c.stmt
        if expr instanceof ir.ESeq
          new ir.ESeq expr.expr, new ir.Seq(stmt, expr.stmt)
        else
          new ir.ESeq expr, stmt
      when 'Move'
        right = bubbleESeqs c.right
        if right instanceof ir.ESeq
          new ir.Seq right.stmt, (new ir.Move c.left, right.expr)
        else
          new ir.Move c.left, right
      when 'Call', 'New'
        seq = null
        callee = bubbleESeqs c.callee
        if callee instanceof ir.ESeq
          seq = callee.stmt
          callee = callee.expr
        [args, argsSeq] = extractSeqsFromArray c.args
        seq = new ir.Seq seq, argsSeq
        call = new c.constructor callee, args
        new ir.Seq seq, call
      when 'CJump'
        test = bubbleESeqs c.test
        if test instanceof ir.ESeq
          new ir.Seq test.stmt, (new ir.CJump test.expr, c.ifTrue, c.ifFalse)
        else
          c
      when 'BinOp'
        seq = null
        left = c.left
        right = bubbleESeqs c.right
        if right instanceof ir.ESeq
          t = new ir.Ident
          left = new ir.ESeq t, new ir.Move t, left
          seq = right.stmt
          right = right.expr

        left = bubbleESeqs left
        if left instanceof ir.ESeq
          seq = new ir.Seq left.stmt, seq
          left = left.expr

        binop = new ir.BinOp c.op, left, right
        if seq? then new ir.ESeq binop, seq else binop
      when 'UnOp'
        seq = null
        arg = bubbleESeqs c.arg
        if arg instanceof ir.ESeq
          new ir.ESeq (new ir.UnOp c.op, arg.expr), arg.stmt
        else
          new ir.UnOp c.op, arg
      when 'Member'
        object = bubbleESeqs c.object
        property = bubbleESeqs c.property
        seq = null
        if object instanceof ir.ESeq
          seq = object.stmt
          object = object.expr
        if property instanceof ir.ESeq
          seq = new ir.Seq seq, property.stmt
          property = property.expr
        member = new ir.Member object, property
        if seq? then new ir.ESeq member, seq else member
      when 'ObjectLit'
        if _.isArray c.v
          [els, seq] = extractSeqsFromArray c.v
          if seq is null
            c
          else
            new ir.ESeq (new ir.ObjectLit els), seq
        else
            c # TODO
      when 'Ident', 'Label', 'Jump', 'Lit'
        c
      else
        console.log c
        throw new Error 'NYI: ' + c.constructor.name

desugar.desugar = (ast) ->
  (new Desugarer).desugar ast

if require.main == module
  fs = require 'fs'
  esprima = require 'esprima'
  console.log ir.toProgram desugar.desugar(
    esprima.parse (fs.readFileSync process.argv[2]), loc: true
  )
