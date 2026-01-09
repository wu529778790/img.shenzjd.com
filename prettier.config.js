/**
 * Prettier 配置文件
 * 用于统一项目代码风格
 */
export default {
  // 基本配置
  printWidth: 120, // 每行最大字符数
  tabWidth: 2, // 缩进宽度
  useTabs: false, // 使用空格代替制表符
  semi: false, // 语句末尾添加分号
  singleQuote: true, // 使用单引号
  quoteProps: 'as-needed', // 仅在需要时为对象属性添加引号
  trailingComma: 'none', // 不添加尾随逗号
  bracketSpacing: true, // 对象字面量的括号之间添加空格
  arrowParens: 'always', // 箭头函数参数始终添加括号
  bracketSameLine: false, // 标签的右括号不放在同一行
  htmlWhitespaceSensitivity: 'css', // HTML空白敏感度
  endOfLine: 'lf', // 行结束符
  embeddedLanguageFormatting: 'auto', // 自动格式化嵌入的语言
  vueIndentScriptAndStyle: false, // 不缩进Vue文件中的script和style标签
}
