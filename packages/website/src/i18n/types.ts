/**
 * i18n 类型定义文件 (v2)
 * 
 * 采用「宽松 Record 类型」策略：
 * - 允许任意嵌套结构
 * - 值为 string、string[]、嵌套对象或嵌套数组
 * - 完全避免字面量类型推导导致的跨语言类型冲突
 */

// 定义一个宽松的递归消息类型
type MessageValue =
  | string
  | string[]
  | MessageObject
  | MessageObject[];

interface MessageObject {
  [key: string]: MessageValue;
}

// 导出宽松类型的 MessageSchema
export type MessageSchema = MessageObject;
