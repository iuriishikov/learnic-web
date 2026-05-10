export type CodeLanguage =
  // JS / TS family
  | "tsx"
  | "ts"
  | "jsx"
  | "js"
  // Backend
  | "python"
  | "go"
  | "rust"
  | "java"
  | "kotlin"
  | "swift"
  | "php"
  | "ruby"
  // Systems
  | "c"
  | "cpp"
  | "csharp"
  // Web markup / styles
  | "html"
  | "xml"
  | "css"
  | "scss"
  // Data / config
  | "json"
  | "yaml"
  | "toml"
  | "sql"
  | "graphql"
  // Markup
  | "markdown"
  // Shell
  | "bash"
  | "sh"
  | "dockerfile"
  // Fallback
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

/* -------------------------------------------------------------------------- */
/* Keyword sets                                                               */
/* -------------------------------------------------------------------------- */

const JS_KEYWORDS = new Set([
  "abstract", "as", "async", "await", "break", "case", "catch", "class",
  "const", "continue", "declare", "default", "delete", "do", "else", "enum",
  "export", "extends", "false", "finally", "for", "from", "function", "if",
  "implements", "import", "in", "instanceof", "interface", "is", "keyof",
  "let", "new", "null", "of", "package", "private", "protected", "public",
  "readonly", "return", "satisfies", "static", "super", "switch", "this",
  "throw", "true", "try", "type", "typeof", "undefined", "var", "void",
  "while", "yield",
])

const PYTHON_KEYWORDS = new Set([
  "False", "None", "True", "and", "as", "assert", "async", "await", "break",
  "class", "continue", "def", "del", "elif", "else", "except", "finally",
  "for", "from", "global", "if", "import", "in", "is", "lambda", "nonlocal",
  "not", "or", "pass", "raise", "return", "try", "while", "with", "yield",
  "match", "case",
])

const PYTHON_BUILTINS = new Set([
  "self", "cls", "print", "len", "range", "enumerate", "zip", "map", "filter",
  "list", "dict", "set", "tuple", "str", "int", "float", "bool", "bytes",
  "open", "input", "isinstance", "issubclass", "super", "type", "id", "hash",
])

const GO_KEYWORDS = new Set([
  "break", "case", "chan", "const", "continue", "default", "defer", "else",
  "fallthrough", "for", "func", "go", "goto", "if", "import", "interface",
  "map", "package", "range", "return", "select", "struct", "switch", "type",
  "var", "true", "false", "nil", "iota",
])

const GO_TYPES = new Set([
  "bool", "byte", "complex64", "complex128", "error", "float32", "float64",
  "int", "int8", "int16", "int32", "int64", "rune", "string", "uint", "uint8",
  "uint16", "uint32", "uint64", "uintptr", "any",
])

const RUST_KEYWORDS = new Set([
  "as", "async", "await", "break", "const", "continue", "crate", "dyn",
  "else", "enum", "extern", "false", "fn", "for", "if", "impl", "in", "let",
  "loop", "match", "mod", "move", "mut", "pub", "ref", "return", "self",
  "Self", "static", "struct", "super", "trait", "true", "type", "unsafe",
  "use", "where", "while", "yield", "box",
])

const RUST_TYPES = new Set([
  "bool", "char", "f32", "f64", "i8", "i16", "i32", "i64", "i128", "isize",
  "str", "u8", "u16", "u32", "u64", "u128", "usize", "Box", "Vec", "String",
  "Option", "Result", "Some", "None", "Ok", "Err",
])

const JAVA_KEYWORDS = new Set([
  "abstract", "assert", "boolean", "break", "byte", "case", "catch", "char",
  "class", "const", "continue", "default", "do", "double", "else", "enum",
  "extends", "false", "final", "finally", "float", "for", "goto", "if",
  "implements", "import", "instanceof", "int", "interface", "long", "native",
  "new", "null", "package", "private", "protected", "public", "record",
  "return", "sealed", "short", "static", "strictfp", "super", "switch",
  "synchronized", "this", "throw", "throws", "transient", "true", "try",
  "var", "void", "volatile", "while", "yield",
])

const KOTLIN_KEYWORDS = new Set([
  "as", "break", "class", "continue", "do", "else", "false", "for", "fun",
  "if", "in", "interface", "is", "null", "object", "package", "return",
  "super", "this", "throw", "true", "try", "typealias", "typeof", "val",
  "var", "when", "while", "by", "catch", "constructor", "delegate", "dynamic",
  "field", "file", "finally", "get", "import", "init", "param", "property",
  "receiver", "set", "setparam", "value", "where", "abstract", "actual",
  "annotation", "companion", "const", "crossinline", "data", "enum",
  "expect", "external", "final", "infix", "inline", "inner", "internal",
  "lateinit", "noinline", "open", "operator", "out", "override", "private",
  "protected", "public", "reified", "sealed", "suspend", "tailrec", "vararg",
])

const SWIFT_KEYWORDS = new Set([
  "associatedtype", "class", "deinit", "enum", "extension", "fileprivate",
  "func", "import", "init", "inout", "internal", "let", "open", "operator",
  "private", "protocol", "public", "rethrows", "static", "struct", "subscript",
  "typealias", "var", "break", "case", "continue", "default", "defer", "do",
  "else", "fallthrough", "for", "guard", "if", "in", "repeat", "return",
  "switch", "where", "while", "as", "Any", "catch", "false", "is", "nil",
  "super", "self", "Self", "throw", "throws", "true", "try", "async", "await",
  "actor", "some", "any",
])

const CSHARP_KEYWORDS = new Set([
  "abstract", "as", "base", "bool", "break", "byte", "case", "catch", "char",
  "checked", "class", "const", "continue", "decimal", "default", "delegate",
  "do", "double", "else", "enum", "event", "explicit", "extern", "false",
  "finally", "fixed", "float", "for", "foreach", "goto", "if", "implicit",
  "in", "int", "interface", "internal", "is", "lock", "long", "namespace",
  "new", "null", "object", "operator", "out", "override", "params", "private",
  "protected", "public", "readonly", "ref", "return", "sbyte", "sealed",
  "short", "sizeof", "stackalloc", "static", "string", "struct", "switch",
  "this", "throw", "true", "try", "typeof", "uint", "ulong", "unchecked",
  "unsafe", "ushort", "using", "var", "virtual", "void", "volatile", "while",
  "async", "await", "record", "yield",
])

const C_KEYWORDS = new Set([
  "auto", "break", "case", "char", "const", "continue", "default", "do",
  "double", "else", "enum", "extern", "float", "for", "goto", "if", "inline",
  "int", "long", "register", "restrict", "return", "short", "signed",
  "sizeof", "static", "struct", "switch", "typedef", "union", "unsigned",
  "void", "volatile", "while", "_Bool", "_Complex", "_Imaginary", "NULL",
])

const CPP_KEYWORDS = new Set([
  "alignas", "alignof", "and", "and_eq", "asm", "auto", "bitand", "bitor",
  "bool", "break", "case", "catch", "char", "char8_t", "char16_t", "char32_t",
  "class", "compl", "concept", "const", "consteval", "constexpr", "constinit",
  "const_cast", "continue", "co_await", "co_return", "co_yield", "decltype",
  "default", "delete", "do", "double", "dynamic_cast", "else", "enum",
  "explicit", "export", "extern", "false", "float", "for", "friend", "goto",
  "if", "inline", "int", "long", "mutable", "namespace", "new", "noexcept",
  "not", "not_eq", "nullptr", "operator", "or", "or_eq", "private",
  "protected", "public", "register", "reinterpret_cast", "requires", "return",
  "short", "signed", "sizeof", "static", "static_assert", "static_cast",
  "struct", "switch", "template", "this", "thread_local", "throw", "true",
  "try", "typedef", "typeid", "typename", "union", "unsigned", "using",
  "virtual", "void", "volatile", "wchar_t", "while", "xor", "xor_eq",
])

const PHP_KEYWORDS = new Set([
  "abstract", "and", "array", "as", "break", "callable", "case", "catch",
  "class", "clone", "const", "continue", "declare", "default", "do", "echo",
  "else", "elseif", "empty", "enddeclare", "endfor", "endforeach", "endif",
  "endswitch", "endwhile", "extends", "final", "finally", "fn", "for",
  "foreach", "function", "global", "goto", "if", "implements", "include",
  "include_once", "instanceof", "insteadof", "interface", "isset", "list",
  "match", "namespace", "new", "or", "print", "private", "protected",
  "public", "readonly", "require", "require_once", "return", "static",
  "switch", "throw", "trait", "try", "unset", "use", "var", "while", "xor",
  "yield", "true", "false", "null",
])

const RUBY_KEYWORDS = new Set([
  "BEGIN", "END", "alias", "and", "begin", "break", "case", "class", "def",
  "defined?", "do", "else", "elsif", "end", "ensure", "false", "for", "if",
  "in", "module", "next", "nil", "not", "or", "redo", "rescue", "retry",
  "return", "self", "super", "then", "true", "undef", "unless", "until",
  "when", "while", "yield",
])

const SQL_KEYWORDS = new Set([
  "select", "from", "where", "and", "or", "not", "in", "exists", "between",
  "like", "is", "null", "true", "false", "as", "join", "inner", "left",
  "right", "full", "cross", "outer", "on", "using", "group", "by", "having",
  "order", "asc", "desc", "limit", "offset", "distinct", "all", "union",
  "intersect", "except", "insert", "into", "values", "update", "set",
  "delete", "create", "alter", "drop", "table", "view", "index", "schema",
  "database", "constraint", "primary", "key", "foreign", "references",
  "unique", "check", "default", "auto_increment", "serial", "if", "case",
  "when", "then", "else", "end", "with", "recursive", "returning", "begin",
  "commit", "rollback", "transaction",
])

const SQL_TYPES = new Set([
  "int", "integer", "bigint", "smallint", "tinyint", "decimal", "numeric",
  "float", "real", "double", "varchar", "char", "text", "nvarchar", "nchar",
  "date", "time", "datetime", "timestamp", "boolean", "bool", "blob", "uuid",
  "json", "jsonb",
])

const GRAPHQL_KEYWORDS = new Set([
  "query", "mutation", "subscription", "fragment", "type", "interface",
  "union", "enum", "input", "schema", "scalar", "directive", "extend", "on",
  "true", "false", "null", "implements",
])

const DOCKERFILE_INSTRUCTIONS = new Set([
  "FROM", "RUN", "CMD", "LABEL", "MAINTAINER", "EXPOSE", "ENV", "ADD", "COPY",
  "ENTRYPOINT", "VOLUME", "USER", "WORKDIR", "ARG", "ONBUILD", "STOPSIGNAL",
  "HEALTHCHECK", "SHELL",
])

const JSON_KEYWORDS = new Set(["true", "false", "null"])

const YAML_KEYWORDS = new Set(["true", "false", "null", "yes", "no", "on", "off", "~"])

const TOML_KEYWORDS = new Set(["true", "false"])

const BASH_BUILTINS = new Set([
  "alias", "cd", "echo", "exit", "export", "kill", "let", "local", "read",
  "return", "set", "source", "test", "unset",
])

const COMMON_TYPES = new Set([
  "Array", "Boolean", "Date", "Error", "Map", "Number", "Object", "Promise",
  "Record", "RegExp", "Set", "String", "Symbol",
])

/* -------------------------------------------------------------------------- */
/* Token stream                                                               */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Generic profile-based tokenizer                                            */
/* -------------------------------------------------------------------------- */

type LanguageProfile = {
  /** Sequence(s) that start a single-line comment, e.g. ['//', '#']. */
  lineComments: string[]
  /** Optional block comment delimiters, e.g. ['/*', '*\/']. */
  blockComment?: [string, string]
  /** Quote characters that start a regular string. */
  stringQuotes: string[]
  /** Triple-quote tokens for languages like Python (``"""`` / ``'''``). */
  tripleStringQuotes?: string[]
  /** Keyword set; matched against the raw identifier text. */
  keywords: ReadonlySet<string>
  /** Builtin types that should be highlighted as ``type``. */
  types?: ReadonlySet<string>
  /** Builtins that highlight as ``property`` (e.g. Python ``self`` / ``print``). */
  builtins?: ReadonlySet<string>
  /** When true, capitalised identifiers default to ``type`` if not a keyword. */
  capitalizedAsType?: boolean
  /** Treat ``$`` / ``@`` etc. as part of identifiers. */
  identifierExtras?: string
}

function tokenizeWithProfile(
  code: string,
  profile: LanguageProfile,
): CodeToken[] {
  const stream = new TokenStream()
  const n = code.length
  let i = 0
  const idStart = profile.identifierExtras
    ? new RegExp(`[A-Za-z_${escapeRegex(profile.identifierExtras)}]`)
    : /[A-Za-z_]/
  const idCont = profile.identifierExtras
    ? new RegExp(`[A-Za-z0-9_${escapeRegex(profile.identifierExtras)}]`)
    : /[A-Za-z0-9_]/

  while (i < n) {
    // ---- block comment ----
    if (profile.blockComment) {
      const [open, close] = profile.blockComment
      if (code.startsWith(open, i)) {
        const end = code.indexOf(close, i + open.length)
        const stop = end === -1 ? n : end + close.length
        stream.push("comment", code.slice(i, stop))
        i = stop
        continue
      }
    }

    // ---- line comment ----
    let matchedLineComment = false
    for (const open of profile.lineComments) {
      if (code.startsWith(open, i)) {
        const nl = code.indexOf("\n", i)
        const stop = nl === -1 ? n : nl
        stream.push("comment", code.slice(i, stop))
        i = stop
        matchedLineComment = true
        break
      }
    }
    if (matchedLineComment) continue

    // ---- triple-quoted string (Python) ----
    if (profile.tripleStringQuotes) {
      let matchedTriple = false
      for (const triple of profile.tripleStringQuotes) {
        if (code.startsWith(triple, i)) {
          const end = code.indexOf(triple, i + triple.length)
          const stop = end === -1 ? n : end + triple.length
          stream.push("string", code.slice(i, stop))
          i = stop
          matchedTriple = true
          break
        }
      }
      if (matchedTriple) continue
    }

    // ---- regular string ----
    const ch = code[i]
    if (profile.stringQuotes.includes(ch)) {
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
        // Single-line strings stop at \n unless the language allows multi-
        // line strings via backticks (template literals) — backticks are
        // handled by the same generic loop, but we don't break on \n for
        // them so they can span lines.
        if (code[j] === "\n" && ch !== "`") break
        j += 1
      }
      stream.push("string", code.slice(i, j))
      i = j
      continue
    }

    // ---- numbers ----
    if (ch >= "0" && ch <= "9") {
      let j = i
      while (j < n && /[0-9._a-fA-FxXoObBeE+-]/.test(code[j])) {
        if (code[j] === "+" || code[j] === "-") {
          if (code[j - 1] !== "e" && code[j - 1] !== "E") break
        }
        j += 1
      }
      stream.push("number", code.slice(i, j))
      i = j
      continue
    }

    // ---- identifiers / keywords ----
    if (idStart.test(ch)) {
      let j = i
      while (j < n && idCont.test(code[j])) j += 1
      const word = code.slice(i, j)

      if (profile.keywords.has(word)) {
        stream.push("keyword", word)
      } else if (profile.types?.has(word)) {
        stream.push("type", word)
      } else if (profile.builtins?.has(word)) {
        stream.push("property", word)
      } else if (
        profile.capitalizedAsType !== false &&
        (COMMON_TYPES.has(word) || /^[A-Z]/.test(word))
      ) {
        stream.push("type", word)
      } else {
        // Property if followed by `:` (used as object key in many langs).
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

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/* -------------------------------------------------------------------------- */
/* JS-like (kept distinct: backtick template strings are special)             */
/* -------------------------------------------------------------------------- */

function tokenizeJsLike(code: string): CodeToken[] {
  return tokenizeWithProfile(code, {
    lineComments: ["//"],
    blockComment: ["/*", "*/"],
    stringQuotes: ['"', "'", "`"],
    keywords: JS_KEYWORDS,
    types: COMMON_TYPES,
    capitalizedAsType: true,
  })
}

/* -------------------------------------------------------------------------- */
/* JSON (keys vs strings disambiguation)                                      */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Bash / Sh                                                                  */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Dockerfile                                                                 */
/* -------------------------------------------------------------------------- */

function tokenizeDockerfile(code: string): CodeToken[] {
  const stream = new TokenStream()
  const lines = code.split("\n")
  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) stream.push("plain", "\n")

    const trimmed = line.trimStart()
    const indent = line.length - trimmed.length
    if (indent > 0) stream.push("plain", line.slice(0, indent))

    if (trimmed.startsWith("#")) {
      stream.push("comment", trimmed)
      return
    }

    // First word is the instruction (FROM / RUN / ...). Highlight if it's
    // a known Dockerfile instruction; otherwise treat the line as plain.
    const firstWordMatch = trimmed.match(/^([A-Za-z]+)/)
    if (!firstWordMatch) {
      stream.push("plain", trimmed)
      return
    }
    const instr = firstWordMatch[1]
    if (DOCKERFILE_INSTRUCTIONS.has(instr.toUpperCase())) {
      stream.push("keyword", instr)
      tokenizeDockerfileArgs(trimmed.slice(instr.length), stream)
    } else {
      stream.push("plain", trimmed)
    }
  })
  return stream.out
}

function tokenizeDockerfileArgs(rest: string, stream: TokenStream): void {
  let i = 0
  while (i < rest.length) {
    const ch = rest[i]
    if (ch === '"' || ch === "'") {
      let j = i + 1
      while (j < rest.length) {
        if (rest[j] === "\\") {
          j += 2
          continue
        }
        if (rest[j] === ch) {
          j += 1
          break
        }
        j += 1
      }
      stream.push("string", rest.slice(i, j))
      i = j
      continue
    }
    if (ch === "$" && rest[i + 1] === "{") {
      const close = rest.indexOf("}", i)
      const stop = close === -1 ? rest.length : close + 1
      stream.push("property", rest.slice(i, stop))
      i = stop
      continue
    }
    stream.push("plain", ch)
    i += 1
  }
}

/* -------------------------------------------------------------------------- */
/* CSS / SCSS                                                                 */
/* -------------------------------------------------------------------------- */

function tokenizeCss(code: string): CodeToken[] {
  const stream = new TokenStream()
  const n = code.length
  let i = 0
  // Track whether we're inside a property-value position (after `:` until
  // `;` / `}`). Properties are highlighted as `property`, values plain;
  // outside braces, identifiers become `type` (selectors).
  let inValue = false
  let braceDepth = 0

  while (i < n) {
    const ch = code[i]

    if (ch === "/" && code[i + 1] === "*") {
      const close = code.indexOf("*/", i + 2)
      const stop = close === -1 ? n : close + 2
      stream.push("comment", code.slice(i, stop))
      i = stop
      continue
    }

    if (ch === '"' || ch === "'") {
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

    if (ch === "{") {
      braceDepth += 1
      inValue = false
      stream.push("punctuation", ch)
      i += 1
      continue
    }
    if (ch === "}") {
      braceDepth = Math.max(0, braceDepth - 1)
      inValue = false
      stream.push("punctuation", ch)
      i += 1
      continue
    }
    if (ch === ":" && braceDepth > 0) {
      inValue = true
      stream.push("punctuation", ch)
      i += 1
      continue
    }
    if (ch === ";") {
      inValue = false
      stream.push("punctuation", ch)
      i += 1
      continue
    }

    if (ch === "@") {
      let j = i + 1
      while (j < n && /[A-Za-z-]/.test(code[j])) j += 1
      stream.push("keyword", code.slice(i, j))
      i = j
      continue
    }

    if (ch === "#" && /[A-Za-z0-9]/.test(code[i + 1] ?? "")) {
      let j = i + 1
      while (j < n && /[A-Za-z0-9_-]/.test(code[j])) j += 1
      // `#abc123` inside a value is a hex colour; outside it's a selector.
      stream.push(inValue ? "number" : "type", code.slice(i, j))
      i = j
      continue
    }

    if (ch === "." && /[A-Za-z]/.test(code[i + 1] ?? "")) {
      let j = i + 1
      while (j < n && /[A-Za-z0-9_-]/.test(code[j])) j += 1
      stream.push("type", code.slice(i, j))
      i = j
      continue
    }

    if (ch === "$" || ch === "-") {
      // SCSS variables / vendor prefixes — treat as identifiers.
      let j = i
      while (j < n && /[A-Za-z0-9_$-]/.test(code[j])) j += 1
      if (j > i + 1) {
        stream.push(inValue ? "property" : "type", code.slice(i, j))
        i = j
        continue
      }
    }

    if (ch >= "0" && ch <= "9") {
      let j = i
      while (j < n && /[0-9.%]/.test(code[j])) j += 1
      // Capture unit suffixes (px, rem, em, etc.).
      while (j < n && /[A-Za-z]/.test(code[j])) j += 1
      stream.push("number", code.slice(i, j))
      i = j
      continue
    }

    if (/[A-Za-z_]/.test(ch)) {
      let j = i
      while (j < n && /[A-Za-z0-9_-]/.test(code[j])) j += 1
      const word = code.slice(i, j)
      if (inValue) {
        stream.push("plain", word)
      } else {
        // After a newline / start, a bare identifier in property position
        // (not yet inside braces) is either a selector OR the start of a
        // property name. Look ahead: if the next non-space char is `:`,
        // it's a property; otherwise it's a tag-name selector.
        let k = j
        while (k < n && (code[k] === " " || code[k] === "\t")) k += 1
        if (braceDepth > 0 && code[k] === ":") {
          stream.push("property", word)
        } else {
          stream.push("type", word)
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

/* -------------------------------------------------------------------------- */
/* HTML / XML                                                                 */
/* -------------------------------------------------------------------------- */

function tokenizeHtml(code: string): CodeToken[] {
  const stream = new TokenStream()
  const n = code.length
  let i = 0

  while (i < n) {
    // Comments
    if (code.startsWith("<!--", i)) {
      const close = code.indexOf("-->", i + 4)
      const stop = close === -1 ? n : close + 3
      stream.push("comment", code.slice(i, stop))
      i = stop
      continue
    }

    // Doctype / processing instructions
    if (code.startsWith("<!", i) || code.startsWith("<?", i)) {
      const end = code.indexOf(">", i)
      const stop = end === -1 ? n : end + 1
      stream.push("keyword", code.slice(i, stop))
      i = stop
      continue
    }

    if (code[i] === "<") {
      // Opening punctuation + optional `/`
      let j = i + 1
      stream.push("punctuation", "<")
      if (code[j] === "/") {
        stream.push("punctuation", "/")
        j += 1
      }
      // Tag name
      let nameEnd = j
      while (nameEnd < n && /[A-Za-z0-9_:-]/.test(code[nameEnd])) nameEnd += 1
      stream.push("type", code.slice(j, nameEnd))
      j = nameEnd

      // Attributes
      while (j < n && code[j] !== ">" && code[j] !== "/") {
        const c = code[j]
        if (c === " " || c === "\t" || c === "\n") {
          stream.push("plain", c)
          j += 1
          continue
        }
        if (/[A-Za-z_]/.test(c)) {
          let k = j
          while (k < n && /[A-Za-z0-9_:-]/.test(code[k])) k += 1
          stream.push("property", code.slice(j, k))
          j = k
          continue
        }
        if (c === "=") {
          stream.push("punctuation", "=")
          j += 1
          continue
        }
        if (c === '"' || c === "'") {
          let k = j + 1
          while (k < n && code[k] !== c) k += 1
          if (k < n) k += 1
          stream.push("string", code.slice(j, k))
          j = k
          continue
        }
        stream.push("plain", c)
        j += 1
      }

      if (code[j] === "/") {
        stream.push("punctuation", "/")
        j += 1
      }
      if (code[j] === ">") {
        stream.push("punctuation", ">")
        j += 1
      }
      i = j
      continue
    }

    // Outside tag — text content
    let j = i
    while (j < n && code[j] !== "<") j += 1
    stream.push("plain", code.slice(i, j))
    i = j
  }

  return stream.out
}

/* -------------------------------------------------------------------------- */
/* YAML                                                                       */
/* -------------------------------------------------------------------------- */

function tokenizeYaml(code: string): CodeToken[] {
  const stream = new TokenStream()
  const lines = code.split("\n")

  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) stream.push("plain", "\n")

    // Leading whitespace
    const indentMatch = line.match(/^[ \t]*/)
    const indent = indentMatch ? indentMatch[0] : ""
    if (indent) stream.push("plain", indent)
    let rest = line.slice(indent.length)

    // Full-line comment
    if (rest.startsWith("#")) {
      stream.push("comment", rest)
      return
    }

    // List marker
    if (rest.startsWith("- ")) {
      stream.push("punctuation", "-")
      stream.push("plain", " ")
      rest = rest.slice(2)
    }

    // Document separators / directives
    if (rest === "---" || rest === "...") {
      stream.push("keyword", rest)
      return
    }

    // Key: value
    const keyMatch = rest.match(/^([A-Za-z_][A-Za-z0-9_-]*|"[^"]*"|'[^']*')\s*:/)
    if (keyMatch) {
      stream.push("property", keyMatch[1])
      rest = rest.slice(keyMatch[1].length)
      // Trailing colon + spaces
      const colon = rest.indexOf(":")
      stream.push("plain", rest.slice(0, colon))
      stream.push("punctuation", ":")
      rest = rest.slice(colon + 1)
    }

    tokenizeYamlValue(rest, stream)
  })

  return stream.out
}

function tokenizeYamlValue(value: string, stream: TokenStream): void {
  // Inline comment
  const commentIdx = (() => {
    let inSingle = false
    let inDouble = false
    for (let i = 0; i < value.length; i += 1) {
      const c = value[i]
      if (!inDouble && c === "'") inSingle = !inSingle
      else if (!inSingle && c === '"') inDouble = !inDouble
      else if (
        !inSingle &&
        !inDouble &&
        c === "#" &&
        (i === 0 || value[i - 1] === " " || value[i - 1] === "\t")
      ) {
        return i
      }
    }
    return -1
  })()
  const valuePart = commentIdx === -1 ? value : value.slice(0, commentIdx)
  const commentPart = commentIdx === -1 ? "" : value.slice(commentIdx)

  let i = 0
  while (i < valuePart.length) {
    const ch = valuePart[i]
    if (ch === " " || ch === "\t") {
      stream.push("plain", ch)
      i += 1
      continue
    }
    if (ch === '"' || ch === "'") {
      let j = i + 1
      while (j < valuePart.length && valuePart[j] !== ch) j += 1
      if (j < valuePart.length) j += 1
      stream.push("string", valuePart.slice(i, j))
      i = j
      continue
    }
    if (/[0-9-]/.test(ch) && /[0-9-]/.test(valuePart[i] ?? "")) {
      let j = i
      while (j < valuePart.length && /[0-9.eE+-]/.test(valuePart[j])) j += 1
      if (j > i) {
        stream.push("number", valuePart.slice(i, j))
        i = j
        continue
      }
    }
    if (/[A-Za-z_]/.test(ch)) {
      let j = i
      while (j < valuePart.length && /[A-Za-z0-9_-]/.test(valuePart[j])) j += 1
      const word = valuePart.slice(i, j)
      stream.push(YAML_KEYWORDS.has(word.toLowerCase()) ? "keyword" : "plain", word)
      i = j
      continue
    }
    stream.push("plain", ch)
    i += 1
  }

  if (commentPart) stream.push("comment", commentPart)
}

/* -------------------------------------------------------------------------- */
/* TOML                                                                       */
/* -------------------------------------------------------------------------- */

function tokenizeToml(code: string): CodeToken[] {
  const stream = new TokenStream()
  const lines = code.split("\n")

  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) stream.push("plain", "\n")

    const trimmed = line.trimStart()
    const indent = line.slice(0, line.length - trimmed.length)
    if (indent) stream.push("plain", indent)

    if (trimmed.startsWith("#")) {
      stream.push("comment", trimmed)
      return
    }

    // Section header `[section]` or `[[array]]`
    if (trimmed.startsWith("[")) {
      const close = trimmed.indexOf("]")
      const stop = close === -1 ? trimmed.length : close + 1
      stream.push("type", trimmed.slice(0, stop))
      tokenizeTomlValue(trimmed.slice(stop), stream)
      return
    }

    // key = value
    const eq = trimmed.indexOf("=")
    if (eq !== -1) {
      stream.push("property", trimmed.slice(0, eq).trimEnd())
      const skipped = trimmed.slice(0, eq).length
      const trailing = eq - skipped
      if (trailing > 0) stream.push("plain", " ".repeat(trailing))
      stream.push("punctuation", "=")
      tokenizeTomlValue(trimmed.slice(eq + 1), stream)
      return
    }

    stream.push("plain", trimmed)
  })

  return stream.out
}

function tokenizeTomlValue(value: string, stream: TokenStream): void {
  let i = 0
  while (i < value.length) {
    const ch = value[i]
    if (ch === " " || ch === "\t") {
      stream.push("plain", ch)
      i += 1
      continue
    }
    if (ch === "#") {
      stream.push("comment", value.slice(i))
      return
    }
    if (ch === '"' || ch === "'") {
      let j = i + 1
      while (j < value.length && value[j] !== ch) {
        if (value[j] === "\\") {
          j += 2
          continue
        }
        j += 1
      }
      if (j < value.length) j += 1
      stream.push("string", value.slice(i, j))
      i = j
      continue
    }
    if (/[0-9-]/.test(ch)) {
      let j = i
      while (j < value.length && /[0-9._eE+-:T]/.test(value[j])) j += 1
      stream.push("number", value.slice(i, j))
      i = j
      continue
    }
    if (/[A-Za-z]/.test(ch)) {
      let j = i
      while (j < value.length && /[A-Za-z0-9_-]/.test(value[j])) j += 1
      const word = value.slice(i, j)
      stream.push(TOML_KEYWORDS.has(word) ? "keyword" : "plain", word)
      i = j
      continue
    }
    stream.push("plain", ch)
    i += 1
  }
}

/* -------------------------------------------------------------------------- */
/* SQL                                                                        */
/* -------------------------------------------------------------------------- */

function tokenizeSql(code: string): CodeToken[] {
  const stream = new TokenStream()
  const n = code.length
  let i = 0

  while (i < n) {
    if (code.startsWith("--", i)) {
      const nl = code.indexOf("\n", i)
      const stop = nl === -1 ? n : nl
      stream.push("comment", code.slice(i, stop))
      i = stop
      continue
    }
    if (code.startsWith("/*", i)) {
      const close = code.indexOf("*/", i + 2)
      const stop = close === -1 ? n : close + 2
      stream.push("comment", code.slice(i, stop))
      i = stop
      continue
    }
    const ch = code[i]
    if (ch === "'" || ch === '"') {
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
      while (j < n && /[0-9.eE+-]/.test(code[j])) j += 1
      stream.push("number", code.slice(i, j))
      i = j
      continue
    }
    if (/[A-Za-z_]/.test(ch)) {
      let j = i
      while (j < n && /[A-Za-z0-9_]/.test(code[j])) j += 1
      const word = code.slice(i, j)
      const lower = word.toLowerCase()
      if (SQL_KEYWORDS.has(lower)) {
        stream.push("keyword", word)
      } else if (SQL_TYPES.has(lower)) {
        stream.push("type", word)
      } else {
        stream.push("plain", word)
      }
      i = j
      continue
    }
    stream.push("plain", ch)
    i += 1
  }

  return stream.out
}

/* -------------------------------------------------------------------------- */
/* Markdown                                                                   */
/* -------------------------------------------------------------------------- */

function tokenizeMarkdown(code: string): CodeToken[] {
  const stream = new TokenStream()
  const lines = code.split("\n")
  let inFence: string | null = null

  lines.forEach((line, lineIdx) => {
    if (lineIdx > 0) stream.push("plain", "\n")

    // Fenced code blocks ```...```
    const fenceMatch = line.match(/^(```+|~~~+)/)
    if (fenceMatch) {
      const fence = fenceMatch[1]
      if (inFence === null) {
        inFence = fence
        stream.push("punctuation", fence)
        stream.push("type", line.slice(fence.length))
      } else if (line.startsWith(inFence)) {
        inFence = null
        stream.push("punctuation", fence)
        stream.push("plain", line.slice(fence.length))
      } else {
        stream.push("string", line)
      }
      return
    }
    if (inFence) {
      stream.push("string", line)
      return
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s/)
    if (headingMatch) {
      stream.push("keyword", headingMatch[0])
      tokenizeMarkdownInline(line.slice(headingMatch[0].length), stream, "type")
      return
    }

    // Block quotes
    if (line.startsWith(">")) {
      stream.push("keyword", ">")
      tokenizeMarkdownInline(line.slice(1), stream)
      return
    }

    // List items
    const listMatch = line.match(/^(\s*)([*+-]|\d+\.)\s/)
    if (listMatch) {
      if (listMatch[1]) stream.push("plain", listMatch[1])
      stream.push("punctuation", listMatch[2])
      stream.push("plain", listMatch[0].slice(listMatch[1].length + listMatch[2].length))
      tokenizeMarkdownInline(line.slice(listMatch[0].length), stream)
      return
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      stream.push("keyword", line)
      return
    }

    tokenizeMarkdownInline(line, stream)
  })

  return stream.out
}

function tokenizeMarkdownInline(
  text: string,
  stream: TokenStream,
  defaultType: CodeTokenType = "plain",
): void {
  let i = 0
  while (i < text.length) {
    const ch = text[i]

    // Inline code `...`
    if (ch === "`") {
      const close = text.indexOf("`", i + 1)
      if (close !== -1) {
        stream.push("string", text.slice(i, close + 1))
        i = close + 1
        continue
      }
    }

    // Bold **...** or __...__
    if (
      (ch === "*" && text[i + 1] === "*") ||
      (ch === "_" && text[i + 1] === "_")
    ) {
      const marker = ch + ch
      const close = text.indexOf(marker, i + 2)
      if (close !== -1) {
        stream.push("keyword", text.slice(i, close + 2))
        i = close + 2
        continue
      }
    }

    // Italic *...* or _..._
    if ((ch === "*" || ch === "_") && /\S/.test(text[i + 1] ?? "")) {
      const close = text.indexOf(ch, i + 1)
      if (close !== -1) {
        stream.push("type", text.slice(i, close + 1))
        i = close + 1
        continue
      }
    }

    // Links [text](url)
    if (ch === "[") {
      const closeBracket = text.indexOf("]", i)
      if (closeBracket !== -1 && text[closeBracket + 1] === "(") {
        const closeParen = text.indexOf(")", closeBracket + 2)
        if (closeParen !== -1) {
          stream.push("property", text.slice(i, closeBracket + 1))
          stream.push("plain", "(")
          stream.push("string", text.slice(closeBracket + 2, closeParen))
          stream.push("plain", ")")
          i = closeParen + 1
          continue
        }
      }
    }

    stream.push(defaultType, ch)
    i += 1
  }
}

/* -------------------------------------------------------------------------- */
/* Profile-driven languages                                                   */
/* -------------------------------------------------------------------------- */

const PROFILES: Partial<Record<CodeLanguage, LanguageProfile>> = {
  python: {
    lineComments: ["#"],
    stringQuotes: ['"', "'"],
    tripleStringQuotes: ['"""', "'''"],
    keywords: PYTHON_KEYWORDS,
    builtins: PYTHON_BUILTINS,
  },
  ruby: {
    lineComments: ["#"],
    stringQuotes: ['"', "'"],
    keywords: RUBY_KEYWORDS,
    identifierExtras: "?!",
  },
  go: {
    lineComments: ["//"],
    blockComment: ["/*", "*/"],
    stringQuotes: ['"', "`"],
    keywords: GO_KEYWORDS,
    types: GO_TYPES,
  },
  rust: {
    lineComments: ["//"],
    blockComment: ["/*", "*/"],
    stringQuotes: ['"'],
    keywords: RUST_KEYWORDS,
    types: RUST_TYPES,
  },
  java: {
    lineComments: ["//"],
    blockComment: ["/*", "*/"],
    stringQuotes: ['"', "'"],
    keywords: JAVA_KEYWORDS,
  },
  kotlin: {
    lineComments: ["//"],
    blockComment: ["/*", "*/"],
    stringQuotes: ['"', "'"],
    keywords: KOTLIN_KEYWORDS,
  },
  swift: {
    lineComments: ["//"],
    blockComment: ["/*", "*/"],
    stringQuotes: ['"'],
    keywords: SWIFT_KEYWORDS,
  },
  csharp: {
    lineComments: ["//"],
    blockComment: ["/*", "*/"],
    stringQuotes: ['"', "'"],
    keywords: CSHARP_KEYWORDS,
  },
  c: {
    lineComments: ["//"],
    blockComment: ["/*", "*/"],
    stringQuotes: ['"', "'"],
    keywords: C_KEYWORDS,
  },
  cpp: {
    lineComments: ["//"],
    blockComment: ["/*", "*/"],
    stringQuotes: ['"', "'"],
    keywords: CPP_KEYWORDS,
  },
  php: {
    lineComments: ["//", "#"],
    blockComment: ["/*", "*/"],
    stringQuotes: ['"', "'"],
    keywords: PHP_KEYWORDS,
    identifierExtras: "$",
  },
  graphql: {
    lineComments: ["#"],
    stringQuotes: ['"'],
    keywords: GRAPHQL_KEYWORDS,
    capitalizedAsType: true,
  },
}

/* -------------------------------------------------------------------------- */
/* Public entry point                                                         */
/* -------------------------------------------------------------------------- */

export function tokenizeCode(
  code: string,
  language: CodeLanguage,
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
    case "dockerfile":
      return tokenizeDockerfile(code)
    case "css":
    case "scss":
      return tokenizeCss(code)
    case "html":
    case "xml":
      return tokenizeHtml(code)
    case "yaml":
      return tokenizeYaml(code)
    case "toml":
      return tokenizeToml(code)
    case "sql":
      return tokenizeSql(code)
    case "markdown":
      return tokenizeMarkdown(code)
    case "plain":
      return [{ type: "plain", value: code }]
    default: {
      const profile = PROFILES[language]
      if (profile) return tokenizeWithProfile(code, profile)
      return [{ type: "plain", value: code }]
    }
  }
}
