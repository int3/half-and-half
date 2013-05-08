'use strict'

_ = require 'underscore'
escodegen = require 'escodegen'
require('./vendor/relooper')
Relooper = Module.Relooper

ir = exports ? this.ir = {}

idCount = 0

class ir.Block
  constructor: (@id, @lineno = null) ->
    @body = []
    @jump = null
    @id ?= idCount++

class ir.IRNode
  constructor: ->
    @type = @.constructor.name
    @id = idCount++

  asExpr: -> throw new Error 'Not expression-able'

class ir.Jump extends ir.IRNode
  constructor: (@target) ->

class ir.CJump extends ir.IRNode
  constructor: (@test, @ifTrue, @ifFalse) ->

class ir.Label extends ir.IRNode
  constructor: (@lineno) -> super()

ir.isJump = (node) -> node instanceof ir.Jump or node instanceof ir.CJump

class ir.Seq extends ir.IRNode
  constructor: ->
    super()
    if arguments.length < 2
      throw new Error 'That\'s not how to call Seq'
    else if arguments.length == 2
      @left = arguments[0]
      @right = arguments[1]
    else
      @left = arguments[0]
      @right = Object.create ir.Seq.prototype
      ir.Seq.apply @right, Array::slice.call(arguments, 1)

class ir.Move extends ir.IRNode
  constructor: (@left, @right) -> super()

  asExpr: -> new ir.ESeq(@left, @)

class ir.Call extends ir.IRNode
  constructor: (@callee, @args) -> super()

  asExpr: ->
    t = new ir.Ident
    new ir.ESeq t, (new ir.Seq @, (new ir.Move t, ir.Ident.rvTemp))

class ir.New extends ir.Call
  constructor: (callee, args) -> super(callee, args)

class ir.Expr extends ir.IRNode
  asExpr: -> @

class ir.ESeq extends ir.Expr
  constructor: (@expr, @stmt) -> super()

class ir.BinOp extends ir.Expr
  constructor: (@op, @left, @right) -> super()

class ir.UnOp extends ir.Expr
  constructor: (@op, @arg) -> super()

class ir.Member extends ir.Expr
  constructor: (@object, @property) -> super()

class ir.Ident extends ir.Expr
  @tempCount = 0

  constructor: (name) ->
    super()
    if arguments.length == 0
      @name = "$t#{ir.Ident.tempCount++}"
    else
      @name = name

ir.Ident.rvTemp = new ir.Ident

class ir.ObjectLit extends ir.Expr
  constructor: (@v) -> super()

class ir.Lit extends ir.Expr
  constructor: (@v) -> super()

ir.isStatic = (c) -> c instanceof ir.Lit or c instanceof ir.ObjectLit

ir.lift = (v) ->
  if _.isObject v
    new ir.ObjectLit v
  else
    new ir.Lit v

toAST = (node) ->
  switch name = node.constructor.name
    when 'Move'
      if node.left instanceof ir.Ident
        type: 'VariableDeclaration'
        declarations: [
          type: 'VariableDeclarator'
          id: toAST(node.left)
          init: toAST(node.right)
        ]
        kind: 'var'
      else if node.left instanceof ir.Member
        type: 'ExpressionStatement'
        expression:
          type: 'AssignmentExpression'
          operator: '='
          left: toAST(node.left)
          right: toAST(node.right)
      else
        throw new Error
    when 'Label'
      type: 'EmptyStatement'
    when 'Call', 'New'
      type: 'VariableDeclaration'
      declarations: [
        type: 'VariableDeclarator'
        id: toAST ir.Ident.rvTemp
        init:
          type: "#{name}Expression"
          callee: toAST(node.callee)
          arguments: node.args.map(toAST)
      ]
      kind: 'var'
    when 'New'
      type: 'VariableDeclaration'
      declarations: [
        type: 'VariableDeclarator'
        id: toAST ir.Ident.rvTemp
        init:
          type: 'NewExpression'
          callee: toAST(node.callee)
          arguments: node.args.map(toAST)
      ]
      kind: 'var'
    when 'BinOp'
      type: 'BinaryExpression'
      operator: node.op
      left: toAST(node.left)
      right: toAST(node.right)
    when 'UnOp'
      type: 'UnaryExpression'
      operator: node.op
      argument: toAST(node.arg)
    when 'Member'
      type: 'MemberExpression'
      computed: true
      object: toAST(node.object)
      property: toAST(node.property)
    when 'Ident'
      type: 'Identifier'
      name: node.name
    when 'ObjectLit'
      if node.v.__nonConstructible__
        type: 'Identifier'
        name: node.v.__nonConstructible__
      else if _.isArray(node.v)
        type: 'ArrayExpression'
        elements: node.v.map(toAST)
      else if _.isObject(node.v)
        props =
          for k of node.v
            type: 'Property',
            key: { type: 'Literal', name: k },
            value: toAST(node.v[k])
            kind: 'init'
        type: 'ObjectExpression'
        properties: props
      else
        throw new Error 'wat'
    when 'Lit'
      if node.v is null
        type: 'Literal'
        value: node.v
      else if node.v is undefined
        type: 'Identifier'
        name: 'undefined'
      else if _.isNumber(node.v)
        numLit =
          type: 'Literal'
          value: Math.abs(node.v)
        if node.v < 0
          type: 'UnaryExpression'
          operator: '-'
          argument: numLit
        else
          numLit
      else
          type: 'Literal',
          value: node.v
    else
      console.error node
      throw new Error 'Unexpected node'

toASTBlock = (block) ->
  body = []
  for s in block.body
    ast = toAST(s)
    if s instanceof ir.Expr
      ast =
        type: 'ExpressionStatement'
        expression: ast
    body.push ast
  type: 'Program'
  body: body

ir.toProgram = (start) ->
  labels = {}
  Relooper.init()
  recur = (block) ->
    return if labels[block.id]?
    blockString = escodegen.generate toASTBlock(block)
    commentString = "id: #{block.id} lineno: #{block.lineno}"
    if block.jump instanceof ir.CJump
      commentString += " jump: #{block.jump.ifTrue.id} (T) #{block.jump.ifFalse.id} (F)"
    else if block.jump instanceof ir.Jump
      commentString += " jump: #{block.jump.target.id}"
    else
      blockString += "return;"
    #blockString = "/* #{commentString} */\n#{blockString}"
    labels[block.id] = Relooper.addBlock blockString
    return unless (jump = block.jump)?

    if jump instanceof ir.Jump
      recur jump.target
      Relooper.addBranch labels[block.id], labels[jump.target.id]
    else if jump instanceof ir.CJump
      recur jump.ifTrue
      recur jump.ifFalse
      Relooper.addBranch labels[block.id], labels[jump.ifTrue.id],
        (escodegen.generate toAST jump.test)
      Relooper.addBranch labels[block.id], labels[jump.ifFalse.id]
    else
      throw new Error 'wat'
  recur(start)
  "(function(){#{Relooper.render(labels[start.id])}}());"

if require.main == module
  l1 = new ir.Label
  l2 = new ir.Label
  block = new ir.Block(l1.id, [
    new ir.Move(
      new ir.Ident 'a'
      new ir.BinOp(
        '+'
        new ir.Lit 1
        new ir.Lit 2
      )
    )
    new ir.Call(
      new ir.Member(
        new ir.Ident 'b'
        new ir.Lit 'c'
      )
      [new ir.Ident 'd']
    )
  ])
  test = new ir.BinOp '<', new ir.Ident('a'), new ir.Ident('b')
  otherBlock = new ir.Block l2.id, [new ir.Call(new ir.Ident('a'), [])]
  block.jump = new ir.CJump test, block, otherBlock

  console.log(ir.toProgram(block))
