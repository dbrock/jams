JAMS = {}

JAMS.normalize = x => JSON.parse(JSON.stringify(x), (k, v) => (
  typeof v == "object" && v ? v : String(v)
))

JAMS.stringify = x => {
  if (Array.isArray(x)) {
    return `[${[...x].map(JAMS.stringify).join(" ")}]`
  } else if (typeof x == "object" && x != null) {
    return `{${Object.entries(x).map(
      ([k, v]) => `${JAMS.stringify(k)} ${JAMS.stringify(v)}`
    ).join(" ")}}`
  } else if (typeof x == "string") {
    let hush = f => { try { return f() } catch (_) {} }
    return hush(() => JAMS.parse(x)) == x ? x : JSON.stringify(x)
  } else {
    throw new Error(`Found non-string value (${x}); use JAMS.normalize`)
  }
}

JAMS.parse = input => {
  let when = (x, f, g) => x != null ? f(x) : g && g()
  let make = (x, f) => (f(x), x)
  let spot = () => (x => `${x.split("\n").length}:${
    x.replace(/^[.\n]*\n/, "").length + 1
  }`)(input.substr(0, i)), i = 0

  let accept = x => (x.lastIndex = i, when(
    x.exec(input), y => (i = x.lastIndex, y[0])
  )), expect = (x, y) => when(accept(x), x => x, () => {
    throw new Error([
      `Expected ${y}, found ${i < input.length ? "\`" + (
        JSON.stringify(input[i]).replace(/^"|"$/g, "")
      ) + "'" : "eof"} (${spot()})`,
    ].join(" "))
  })

  let parse = () => {
    expect(/^|(?<=[\[\{])|\s+/y, `space`)
    if (accept(/"/y)) {
      let x = expect(/([^"\r\n\\]|\\([bfnrt\\"]|u[0-9a-fA-F]{4}))*/yu)
      return expect(/"/y, `quote`), JSON.parse(`"${x}"`)
    } else if (accept(/\[/y)) return make([], xs => {
      while (!accept(/\s*\]/y)) xs.push(parse())
    }); else if (accept(/\{/y)) {
      return make({}, x => {
        while (!accept(/\s*\}/y)) {
          let [k, i0, v] = [parse(), i, parse()]
          if (k in x) throw new Error(`Duplicate key \`${k}' (${
            i = i0 - k.length, spot()
          })`); else x[k] = v
        }
      })
    } else {
      return expect(/[^\s\[\]{}"\\]+/yu, `value`)
    }
  }

  return make(parse(), () => accept(/\s*/y), expect(/$/y, `eof`))
}
