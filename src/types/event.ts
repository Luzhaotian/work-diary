/** uni-app 原生组件事件的基础接口 */
export interface UniEvent extends Event {
  detail: {
    value: unknown
  }
}

/** 从 uni-app 事件中安全提取 value */
export function getUniEventValue<T>(e: Event): T {
  return (e as unknown as UniEvent).detail.value as T
}
