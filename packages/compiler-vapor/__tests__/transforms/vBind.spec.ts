import { ErrorCodes, NodeTypes } from '@vue/compiler-dom'
import {
  DynamicFlag,
  IRNodeTypes,
  transformElement,
  transformVBind,
} from '../../src'
import { makeCompile } from './_utils'

const compileWithVBind = makeCompile({
  nodeTransforms: [transformElement],
  directiveTransforms: {
    bind: transformVBind,
  },
})

describe('compiler v-bind', () => {
  test('basic', () => {
    const { ir, code } = compileWithVBind(`<div v-bind:id="id"/>`)

    expect(ir.dynamic.children[0]).toMatchObject({
      id: 1,
      dynamicFlags: DynamicFlag.REFERENCED,
    })
    expect(ir.template[0]).toMatchObject({
      type: IRNodeTypes.TEMPLATE_FACTORY,
      template: '<div></div>',
    })
    expect(ir.effect).lengthOf(1)
    expect(ir.effect[0].expressions).lengthOf(1)
    expect(ir.effect[0].operations).lengthOf(1)
    expect(ir.effect[0]).toMatchObject({
      expressions: [
        {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'id',
          isStatic: false,
        },
      ],
      operations: [
        {
          type: IRNodeTypes.SET_PROP,
          element: 1,
          key: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: 'id',
            isStatic: true,
            loc: {
              start: { line: 1, column: 13, offset: 12 },
              end: { line: 1, column: 15, offset: 14 },
              source: 'id',
            },
          },
          value: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: 'id',
            isStatic: false,
            loc: {
              source: 'id',
              start: { line: 1, column: 17, offset: 16 },
              end: { line: 1, column: 19, offset: 18 },
            },
          },
        },
      ],
    })

    expect(code).matchSnapshot()
    expect(code).contains('_setDynamicProp(n1, "id", _ctx.id)')
  })

  test('no expression', () => {
    const { ir, code } = compileWithVBind(`<div v-bind:id />`)

    expect(ir.effect[0].operations[0]).toMatchObject({
      type: IRNodeTypes.SET_PROP,
      key: {
        content: `id`,
        isStatic: true,
        loc: {
          start: { line: 1, column: 13, offset: 12 },
          end: { line: 1, column: 15, offset: 14 },
        },
      },
      value: {
        content: `id`,
        isStatic: false,
        loc: {
          start: { line: 1, column: 13, offset: 12 },
          end: { line: 1, column: 15, offset: 14 },
        },
      },
    })

    expect(code).matchSnapshot()
    expect(code).contains('_setDynamicProp(n1, "id", _ctx.id)')
  })

  test('no expression (shorthand)', () => {
    const { ir, code } = compileWithVBind(`<div :camel-case />`)

    expect(ir.effect[0].operations[0]).toMatchObject({
      type: IRNodeTypes.SET_PROP,
      key: {
        content: `camel-case`,
        isStatic: true,
      },
      value: {
        content: `camelCase`,
        isStatic: false,
      },
    })

    expect(code).matchSnapshot()
    expect(code).contains('_setDynamicProp(n1, "camel-case", _ctx.camelCase)')
  })

  test('dynamic arg', () => {
    const { ir, code } = compileWithVBind(`<div v-bind:[id]="id"/>`)
    expect(ir.effect[0].operations[0]).toMatchObject({
      type: IRNodeTypes.SET_PROP,
      element: 1,
      key: {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: 'id',
        isStatic: false,
      },
      value: {
        type: NodeTypes.SIMPLE_EXPRESSION,
        content: 'id',
        isStatic: false,
      },
    })

    expect(code).matchSnapshot()
    expect(code).contains('_setDynamicProp(n1, _ctx.id, _ctx.id)')
  })

  test('should error if empty expression', () => {
    const onError = vi.fn()
    const { ir, code } = compileWithVBind(`<div v-bind:arg="" />`, {
      onError,
    })

    expect(onError.mock.calls[0][0]).toMatchObject({
      code: ErrorCodes.X_V_BIND_NO_EXPRESSION,
      loc: {
        start: { line: 1, column: 6 },
        end: { line: 1, column: 19 },
      },
    })
    expect(ir.template[0]).toMatchObject({
      type: IRNodeTypes.TEMPLATE_FACTORY,
      template: '<div arg=""></div>',
    })

    expect(code).matchSnapshot()
    expect(code).contains(JSON.stringify('<div arg=""></div>'))
  })

  test('.camel modifier', () => {
    const { ir, code } = compileWithVBind(`<div v-bind:foo-bar.camel="id"/>`)

    expect(ir.effect[0].operations[0]).toMatchObject({
      key: {
        content: `fooBar`,
        isStatic: true,
      },
      value: {
        content: `id`,
        isStatic: false,
      },
      runtimeCamelize: false,
      modifier: undefined,
    })

    expect(code).matchSnapshot()
    expect(code).contains('_setDynamicProp(n1, "fooBar", _ctx.id)')
  })

  test('.camel modifier w/ no expression', () => {
    const { ir, code } = compileWithVBind(`<div v-bind:foo-bar.camel />`)

    expect(ir.effect[0].operations[0]).toMatchObject({
      key: {
        content: `fooBar`,
        isStatic: true,
      },
      value: {
        content: `fooBar`,
        isStatic: false,
      },
      runtimeCamelize: false,
      modifier: undefined,
    })

    expect(code).matchSnapshot()
    expect(code).contains('renderEffect')
    expect(code).contains('_setDynamicProp(n1, "fooBar", _ctx.fooBar)')
  })

  test('.camel modifier w/ dynamic arg', () => {
    const { ir, code } = compileWithVBind(`<div v-bind:[foo].camel="id"/>`)

    expect(ir.effect[0].operations[0]).toMatchObject({
      key: {
        content: `foo`,
        isStatic: false,
      },
      value: {
        content: `id`,
        isStatic: false,
      },
      runtimeCamelize: true,
      modifier: undefined,
    })

    expect(code).matchSnapshot()
    expect(code).contains('renderEffect')
    expect(code).contains(`_setDynamicProp(n1, _camelize(_ctx.foo), _ctx.id)`)
  })

  test.todo('.camel modifier w/ dynamic arg + prefixIdentifiers')

  test('.prop modifier', () => {
    const { ir, code } = compileWithVBind(`<div v-bind:fooBar.prop="id"/>`)

    expect(ir.effect[0].operations[0]).toMatchObject({
      key: {
        content: `fooBar`,
        isStatic: true,
      },
      value: {
        content: `id`,
        isStatic: false,
      },
      runtimeCamelize: false,
      modifier: '.',
    })

    expect(code).matchSnapshot()
    expect(code).contains('renderEffect')
    expect(code).contains('_setDOMProp(n1, "fooBar", _ctx.id)')
  })

  test('.prop modifier w/ no expression', () => {
    const { ir, code } = compileWithVBind(`<div v-bind:fooBar.prop />`)

    expect(ir.effect[0].operations[0]).toMatchObject({
      key: {
        content: `fooBar`,
        isStatic: true,
      },
      value: {
        content: `fooBar`,
        isStatic: false,
      },
      runtimeCamelize: false,
      modifier: '.',
    })

    expect(code).matchSnapshot()
    expect(code).contains('renderEffect')
    expect(code).contains('_setDOMProp(n1, "fooBar", _ctx.fooBar)')
  })

  test('.prop modifier w/ dynamic arg', () => {
    const { ir, code } = compileWithVBind(`<div v-bind:[fooBar].prop="id"/>`)

    expect(ir.effect[0].operations[0]).toMatchObject({
      key: {
        content: `fooBar`,
        isStatic: false,
      },
      value: {
        content: `id`,
        isStatic: false,
      },
      runtimeCamelize: false,
      modifier: '.',
    })

    expect(code).matchSnapshot()
    expect(code).contains('renderEffect')
    expect(code).contains('_setDynamicProp(n1, `.${_ctx.fooBar}`, _ctx.id)')
  })

  test.todo('.prop modifier w/ dynamic arg + prefixIdentifiers')

  test('.prop modifier (shorthand)', () => {
    const { ir, code } = compileWithVBind(`<div .fooBar="id"/>`)

    expect(ir.effect[0].operations[0]).toMatchObject({
      key: {
        content: `fooBar`,
        isStatic: true,
      },
      value: {
        content: `id`,
        isStatic: false,
      },
      runtimeCamelize: false,
      modifier: '.',
    })

    expect(code).matchSnapshot()
    expect(code).contains('renderEffect')
    expect(code).contains('_setDOMProp(n1, "fooBar", _ctx.id)')
  })

  test('.prop modifier (shortband) w/ no expression', () => {
    const { ir, code } = compileWithVBind(`<div .fooBar />`)

    expect(ir.effect[0].operations[0]).toMatchObject({
      key: {
        content: `fooBar`,
        isStatic: true,
      },
      value: {
        content: `fooBar`,
        isStatic: false,
      },
      runtimeCamelize: false,
      modifier: '.',
    })

    expect(code).matchSnapshot()
    expect(code).contains('renderEffect')
    expect(code).contains('_setDOMProp(n1, "fooBar", _ctx.fooBar)')
  })

  test('.attr modifier', () => {
    const { ir, code } = compileWithVBind(`<div v-bind:foo-bar.attr="id"/>`)

    expect(ir.effect[0].operations[0]).toMatchObject({
      key: {
        content: `foo-bar`,
        isStatic: true,
      },
      value: {
        content: `id`,
        isStatic: false,
      },
      runtimeCamelize: false,
      modifier: '^',
    })

    expect(code).matchSnapshot()
    expect(code).contains('renderEffect')
    expect(code).contains('_setAttr(n1, "foo-bar", _ctx.id)')
  })

  test('.attr modifier w/ no expression', () => {
    const { ir, code } = compileWithVBind(`<div v-bind:foo-bar.attr />`)

    expect(ir.effect[0].operations[0]).toMatchObject({
      key: {
        content: `foo-bar`,
        isStatic: true,
      },
      value: {
        content: `fooBar`,
        isStatic: false,
      },
      runtimeCamelize: false,
      modifier: '^',
    })

    expect(code).matchSnapshot()
    expect(code).contains('renderEffect')
    expect(code).contains('_setAttr(n1, "foo-bar", _ctx.fooBar)')
  })
})
