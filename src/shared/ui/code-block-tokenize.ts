export type CodeLanguage =
  | "tsx"
  | "ts"
  | "jsx"
  | "js"
  | "bash"
  | "sh"
  | "json"
  | "plain"

export type CodeTokenType =
  | "keyword"
  | "string"
  | "number"
  | "comment"
  | "property"
  | "type"
  | "punctuation"
  | "plain"

export type CodeToken = { type: CodeTokenType; value: string }

const JS_KEYWORDS = new Set([
  "abstract",
  "as",
  "async",
  "await",
  "break",
  "case",
  "catch",
  "class",
  "const",
  "continue",
  "declare",
  "default",
  "delete",
  "do",
  "else",
  "enum",
  "export",
  "extends",
  "false",
  "finally",
  "for",
  "from",
  "function",
  "if",
  "implements",
  "import",
  "in",
  "instanceof",
  "interface",
  "is",
  "keyof",
  "let",
  "new",
  "null",
  "of",
  "package",
  "private",
  "protected",
  "public",
  "readonly",
  "return",
  "satisfies",
  "static",
  "super",
  "switch",
  "this",
  "throw",
  "true",
  "try",
  "type",
  "typeof",
  "undefined",
  "var",
  "void",
  "while",
  "yield",
])

const JSON_KEYWORDS = new Set(["true", "false", "null"])

const BASH_BUILTINS = new Set([
  "alias",
  "cd",
  "echo",
  "exit",
  "export",
  "kill",
  "let",
  "local",
  "read",
  "return",
  "set",
  "source",
  "test",
  "unset",
])

const COMMON_TYPES = new Set([
  "Array",
  "Boolean",
  "Date",
  "Error",
  "Map",
  "Number",
  "Object",
  "Promise",
  "Record",
  "RegExp",
  "Set",
  "String",
  "Symbol",
])

class TokenStream {
  private readonly tokens: CodeToken[] = []

  push(type: CodeTokenType, value: string) {
    if (!value) return
    const last = this.tokens[this.tokens.length - 1]
    if (last && last.type === type) {
      last.value += value
    } else {
      this.tokens.push({ type, value })
    }
  }

  get out(): CodeToken[] {
    return this.tokens
  }
}

function tokenizeJsLike(code: string): CodeToken[] {
  const stream = new TokenStream()
  const n = code.length
  let i = 0

  while (i < n) {
    const ch = code[i]
    const next = code[i + 1]

    if (ch === "/" && next === "/") {
      const nl = code.indexOf("\n", i)
      const end = nl === -1 ? n : nl
      stream.push("comment", code.slice(i, end))
      i = end
      continue
    }

    if (ch === "/" && next === "*") {
      const close = code.indexOf("*/", i + 2)
      const end = close === -1 ? n : close + 2
      stream.push("comment", code.slice(i, end))
      i = end
      continue
    }

    if (ch === '"' || ch === "'" || ch === "`") {
      let j = i + 1
      while (j < n) {
        if (code[j] === "\\") {
          j += 2
          continue
        }
        if (code[j] === ch) {
          j += 1
          break
        }
        j += 1
      }
      stream.push("string", code.slice(i, j))
      i = j
      continue
    }

    if (ch >= "0" && ch <= "9") {
      let j = i
      while (j < n && /[0-9._a-fA-FxXeE+-]/.test(code[j])) {
        if (code[j] === "+" || code[j] === "-") {
          if (code[j - 1] !== "e" && code[j - 1] !== "E") break
        }
        j += 1
      }
      stream.push("number", code.slice(i, j))
      i = j
      continue
    }

    if (/[A-Za-z_$]/.test(ch)) {
      let j = i
      while (j < n && /[A-Za-z0-9_$]/.test(code[j])) j += 1
      const word = code.slice(i, j)

      if (JS_KEYWORDS.has(word)) {
        stream.push("keyword", word)
      } else if (COMMON_TYPES.has(word) || /^[A-Z]/.test(word)) {
        stream.push("type", word)
      } else {
        let k = j
        while (k < n && (code[k] === " " || code[k] === "\t")) k += 1
        if (code[k] === ":" && code[k + 1] !== ":") {
          stream.push("property", word)
        } else {
          stream.push("plain", word)
        }
      }
      i = j
      continue
    }

    stream.push("plain", ch)
    i += 1
  }

  return stream.out
}

function tokenizeJson(code: string): CodeToken[] {
  const stream = new TokenStream()
  const n = code.length
  let i = 0

  while (i < n) {
    const ch = code[i]

    if (ch === '"') {
      let j = i + 1
      while (j < n) {
        if (code[j] === "\\") {
          j += 2
          continue
        }
        if (code[j] === '"') {
          j += 1
          break
        }
        j += 1
      }
      let k = j
      while (k < n && (code[k] === " " || code[k] === "\t")) k += 1
      if (code[k] === ":") {
        stream.push("property", code.slice(i, j))
      } else {
        stream.push("string", code.slice(i, j))
      }
      i = j
      continue
    }

    if (ch >= "0" && ch <= "9" || (ch === "-" && /[0-9]/.test(code[i + 1] ?? ""))) {
      let j = i
      if (code[j] === "-") j += 1
      while (j < n && /[0-9.eE+-]/.test(code[j])) j += 1
      stream.push("number", code.slice(i, j))
      i = j
      continue
    }

    if (/[a-z]/.test(ch)) {
      let j = i
      while (j < n && /[a-z]/.test(code[j])) j += 1
      const word = code.slice(i, j)
      stream.push(JSON_KEYWORDS.has(word) ? "keyword" : "plain", word)
      i = j
      continue
    }

    stream.push("plain", ch)
    i += 1
  }

  return stream.out
}

function tokenizeBash(code: string): CodeToken[] {
  const stream = new TokenStream()
  const lines = code.split("\n")

  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) stream.push("plain", "\n")

    const commentIdx = (() => {
      let inSingle = false
      let inDouble = false
      for (let p = 0; p < line.length; p += 1) {
        const c = line[p]
        if (c === "\\") {
          p += 1
          continue
        }
        if (!inDouble && c === "'") inSingle = !inSingle
        else if (!inSingle && c === '"') inDouble = !inDouble
        else if (!inSingle && !inDouble && c === "#") return p
      }
      return -1
    })()

    const codePart = commentIdx === -1 ? line : line.slice(0, commentIdx)
    const commentPart = commentIdx === -1 ? "" : line.slice(commentIdx)

    let i = 0
    let firstWord = true
    let leadingDollar = false

    while (i < codePart.length) {
      const ch = codePart[i]

      if (ch === " " || ch === "\t") {
        stream.push("plain", ch)
        i += 1
        continue
      }

      if (ch === "$" && codePart[i + 1] === " ") {
        stream.push("punctuation", "$")
        leadingDollar = true
        i += 1
        continue
      }

      if (ch === '"' || ch === "'") {
        let j = i + 1
        while (j < codePart.length) {
          if (codePart[j] === "\\") {
            j += 2
            continue
          }
          if (codePart[j] === ch) {
            j += 1
            break
          }
          j += 1
        }
        stream.push("string", codePart.slice(i, j))
        i = j
        firstWord = false
        continue
      }

      if (ch === "-") {
        let j = i
        while (j < codePart.length && /[A-Za-z0-9_-]/.test(codePart[j])) j += 1
        stream.push("type", codePart.slice(i, j))
        i = j
        firstWord = false
        continue
      }

      if (/[A-Za-z_]/.test(ch)) {
        let j = i
        while (j < codePart.length && /[A-Za-z0-9_./@-]/.test(codePart[j])) j += 1
        const word = codePart.slice(i, j)
        if (firstWord || leadingDollar) {
          stream.push(BASH_BUILTINS.has(word) ? "keyword" : "property", word)
          leadingDollar = false
        } else {
          stream.push("plain", word)
        }
        firstWord = false
        i = j
        continue
      }

      if (/[0-9]/.test(ch)) {
        let j = i
        while (j < codePart.length && /[0-9.]/.test(codePart[j])) j += 1
        stream.push("number", codePart.slice(i, j))
        i = j
        firstWord = false
        continue
      }

      stream.push("plain", ch)
      i += 1
      firstWord = false
    }

    if (commentPart) {
      stream.push("comment", commentPart)
    }
  })

  return stream.out
}

export function tokenizeCode(
  code: string,
  language: CodeLanguage
): CodeToken[] {
  switch (language) {
    case "tsx":
    case "ts":
    case "jsx":
    case "js":
      return tokenizeJsLike(code)
    case "json":
      return tokenizeJson(code)
    case "bash":
    case "sh":
      return tokenizeBash(code)
    case "plain":
    default:
      return [{ type: "plain", value: code }]
  }
}
