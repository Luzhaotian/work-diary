/// <reference types="@dcloudio/types" />

export {}

declare module 'vue' {
  interface ComponentCustomProperties {
    $options?: Record<string, unknown>
  }
}
