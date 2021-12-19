/**
 * Compiler 模块：获取模板元素，将模板中的指令和 mustache 模板语法转换为相应的属性值和变量值
 * 
 * 思路：根据节点类型判断需要处理指令还是 mustache 模板语法
 *   如果是节点是：
 *     1.元素类型：获取节点属性，匹配指令，处理相应指令逻辑
 *     2.文本类型：获取节点内容，匹配 mustache 内变量名称，将其变更为变量值
 */


// 编译类
class Compiler {
  constructor(el, vm) {
    // 获取模板元素  
    // 判断传递进来的 el 是元素节点还是字符串
    this.$el = this.isElementNode(el) ? el : document.querySelector(el);
    this.$vm = vm;

    // todo 将模板元素放入内存中 fragment  为啥这样做？

    // 执行编译函数
    this.compile(this.$el);
  }

  /**
   * 判断是否为元素节点
   */
  isElementNode(node) {
    // 常用节点：元素节点 1，文本节点 3，注释节点 8
    return node.nodeType === 1;
  }

  /**
   * 判断是否为文本节点
   */
  isTextNode(node) {
    return node.nodeType === 3;
  }

  /**
   * 判断是否为指令
   */
  isDirective(attrName) {
    return attrName.startsWith('v-');
  }

  /**
   * 编译元素节点
   * 思路：获取节点属性，匹配指令，处理相应指令逻辑
   */
  compileElementNode(node) {
    // 获取节点属性列表
    const attributes = node.attributes;

    // 判断并匹配指令处理规则
    Array.from(attributes).forEach((attr) => {
      const { name, value: expression } = attr;
      // 判断是不是指令 v- 开头的属性
      if (this.isDirective(name)) {
        // 获取指令名称
        const [, directive] = name.split('-');
        
        // 调用不同的指令规则来处理
        CompileUtil[directive](node, expression, this.$vm);
      }
    })
  }

  /**
   * 编译文本节点
   * 思路：获取节点内容，匹配 mustache 内变量名称，替换为相应的值
   */
   compileTextNode(node) {
    // 获取节点内容
    const content = (node.textContent)?.trim();

    // 判断并处理变量名称
    if (/\{\{(.+?)\}\}/.test(content)) {
      CompileUtil['text'](node, content, this.$vm);
    }
  }

  /**
   * 编译主函数
   * 分类处理模板中的指令与 mustache 语法
   */
  compile(el) {
    const childNodes = el.childNodes;
    Array.from(childNodes).forEach((node) => {
      if (this.isElementNode(node)) {
        this.compileElementNode(node);
        // 遍历处理元素节点的所有子节点
        this.compile(node);
      } else if (this.isTextNode(node)) {
        this.compileTextNode(node);
      }
    });
  }
}

// 指令编译工具对象
const CompileUtil = {
  getVal(vm, expression) {
    return expression.split('.').reduce((data, current) => {
      return data[current];
    }, vm.$data);
  },

  // node 节点，expression 表达式，vm 当前实例
  model(node,expression, vm) {
    // 给输入框赋予 value 属性
    const fn = this.updater['modelUpdater'];
    const value = this.getVal(vm, expression);
    fn(node, value);
  },

  // 处理文本节点
  text(node, expression, vm) {
    let fn = this.updater['textUpdater'];
    const value = expression.replace(/\{\{(.+?)\}\}/g, (...args) => {
      // 根据表达式获取并返回变量对应的值
      return this.getVal(vm, args[1]);
    });
    fn(node, value);    
  },

  updater: {
    modelUpdater(node, value) {
      node.value = value;
    }, 

    textUpdater(node, value) {
      node.textContent = value
    }
  }
}

// 基类
class MVVM {
  constructor(options) {
    this.$el = options.el;
    this.$data = options.data;
    // 根元素存在 编译模板
    if (this.$el) {
      new Compiler(this.$el, this);
    }
  }
}