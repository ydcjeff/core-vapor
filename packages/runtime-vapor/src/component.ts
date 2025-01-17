import { EffectScope } from '@vue/reactivity'

import { EMPTY_OBJ } from '@vue/shared'
import type { Block } from './render'
import type { DirectiveBinding } from './directive'
import {
  type ComponentPropsOptions,
  type NormalizedPropsOptions,
  normalizePropsOptions,
} from './componentProps'

import type { Data } from '@vue/shared'
import { VaporLifecycleHooks } from './enums'

export type Component = FunctionalComponent | ObjectComponent

export type SetupFn = (props: any, ctx: any) => Block | Data
export type FunctionalComponent = SetupFn & {
  props: ComponentPropsOptions
  render(ctx: any): Block
}
export interface ObjectComponent {
  props: ComponentPropsOptions
  setup?: SetupFn
  render(ctx: any): Block
}

type LifecycleHook<TFn = Function> = TFn[] | null

export interface ElementMetadata {
  props: Data
}

export interface ComponentInternalInstance {
  uid: number
  container: ParentNode
  block: Block | null
  scope: EffectScope
  component: FunctionalComponent | ObjectComponent
  propsOptions: NormalizedPropsOptions

  parent: ComponentInternalInstance | null

  // state
  props: Data
  setupState: Data
  refs: Data
  metadata: WeakMap<Node, ElementMetadata>

  vapor: true

  /** directives */
  dirs: Map<Node, DirectiveBinding[]>

  // lifecycle
  isMounted: boolean
  isUnmounted: boolean
  isUpdating: boolean
  // TODO: registory of provides, lifecycles, ...
  /**
   * @internal
   */
  [VaporLifecycleHooks.BEFORE_CREATE]: LifecycleHook
  /**
   * @internal
   */
  [VaporLifecycleHooks.CREATED]: LifecycleHook
  /**
   * @internal
   */
  [VaporLifecycleHooks.BEFORE_MOUNT]: LifecycleHook
  /**
   * @internal
   */
  [VaporLifecycleHooks.MOUNTED]: LifecycleHook
  /**
   * @internal
   */
  [VaporLifecycleHooks.BEFORE_UPDATE]: LifecycleHook
  /**
   * @internal
   */
  [VaporLifecycleHooks.UPDATED]: LifecycleHook
  /**
   * @internal
   */
  [VaporLifecycleHooks.BEFORE_UNMOUNT]: LifecycleHook
  /**
   * @internal
   */
  [VaporLifecycleHooks.UNMOUNTED]: LifecycleHook
  /**
   * @internal
   */
  [VaporLifecycleHooks.RENDER_TRACKED]: LifecycleHook
  /**
   * @internal
   */
  [VaporLifecycleHooks.RENDER_TRIGGERED]: LifecycleHook
  /**
   * @internal
   */
  [VaporLifecycleHooks.ACTIVATED]: LifecycleHook
  /**
   * @internal
   */
  [VaporLifecycleHooks.DEACTIVATED]: LifecycleHook
  /**
   * @internal
   */
  [VaporLifecycleHooks.ERROR_CAPTURED]: LifecycleHook
  /**
   * @internal
   */
  // [VaporLifecycleHooks.SERVER_PREFETCH]: LifecycleHook<() => Promise<unknown>>
}

// TODO
export let currentInstance: ComponentInternalInstance | null = null

export const getCurrentInstance: () => ComponentInternalInstance | null = () =>
  currentInstance

export const setCurrentInstance = (instance: ComponentInternalInstance) => {
  const prev = currentInstance
  currentInstance = instance
  instance.scope.on()
  return () => {
    instance.scope.off()
    currentInstance = prev
  }
}

export const unsetCurrentInstance = () => {
  currentInstance?.scope.off()
  currentInstance = null
}

let uid = 0
export const createComponentInstance = (
  component: ObjectComponent | FunctionalComponent,
): ComponentInternalInstance => {
  const instance: ComponentInternalInstance = {
    uid: uid++,
    block: null,
    container: null!, // set on mountComponent
    scope: new EffectScope(true /* detached */)!,
    component,

    // TODO: registory of parent
    parent: null,

    // resolved props and emits options
    propsOptions: normalizePropsOptions(component),
    // emitsOptions: normalizeEmitsOptions(type, appContext), // TODO:

    // state
    props: EMPTY_OBJ,
    setupState: EMPTY_OBJ,
    refs: EMPTY_OBJ,
    metadata: new WeakMap(),
    vapor: true,

    dirs: new Map(),

    // lifecycle
    isMounted: false,
    isUnmounted: false,
    isUpdating: false,
    // TODO: registory of provides, appContext, lifecycles, ...
    /**
     * @internal
     */
    [VaporLifecycleHooks.BEFORE_CREATE]: null,
    /**
     * @internal
     */
    [VaporLifecycleHooks.CREATED]: null,
    /**
     * @internal
     */
    [VaporLifecycleHooks.BEFORE_MOUNT]: null,
    /**
     * @internal
     */
    [VaporLifecycleHooks.MOUNTED]: null,
    /**
     * @internal
     */
    [VaporLifecycleHooks.BEFORE_UPDATE]: null,
    /**
     * @internal
     */
    [VaporLifecycleHooks.UPDATED]: null,
    /**
     * @internal
     */
    [VaporLifecycleHooks.BEFORE_UNMOUNT]: null,
    /**
     * @internal
     */
    [VaporLifecycleHooks.UNMOUNTED]: null,
    /**
     * @internal
     */
    [VaporLifecycleHooks.RENDER_TRACKED]: null,
    /**
     * @internal
     */
    [VaporLifecycleHooks.RENDER_TRIGGERED]: null,
    /**
     * @internal
     */
    [VaporLifecycleHooks.ACTIVATED]: null,
    /**
     * @internal
     */
    [VaporLifecycleHooks.DEACTIVATED]: null,
    /**
     * @internal
     */
    [VaporLifecycleHooks.ERROR_CAPTURED]: null,
    /**
     * @internal
     */
    // [VaporLifecycleHooks.SERVER_PREFETCH]: null,
  }
  return instance
}
