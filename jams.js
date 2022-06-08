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
  let aifn = (x, f, g) => x != null ? f(x) : g && g()
  let make = (x, f) => (f(x), x)

  let i = 0, location = () => (x => `line ${
    x.split("\n").length
  }, column ${
    x.replace(/^[.\n]*\n/, "").length + 1
  }`)(input.substr(0, i))

  let accept = x => (x.lastIndex = i, aifn(
    x.exec(input), y => (i = x.lastIndex, y[0])
  )), expect = (x, y) => aifn(accept(x), x => x, () => {
    throw new Error([
      `Expected ${y || `/${x.source}/`},`,
      `found ${i < input.length ? "\`" + (
        JSON.stringify(input[i]).replace(/^"|"$/g, "")
      ) + "'" : "end of file"} (${location()})`,
    ].join(" "))
  })

  let parse = () => {
    expect(/^|(?<=[\[\{])|\s+/y, `whitespace`)
    if (accept(/"/y)) {
      let x = expect(/([^"\r\n\\]|\\([bfnrt\\"]|u[0-9a-fA-F]{4}))*/yu)
      return expect(/"/y, `end quote`), JSON.parse(`"${x}"`)
    } else if (accept(/\[/y)) return make([], xs => {
      while (!accept(/\s*\]/y)) xs.push(parse())
    }); else if (accept(/\{/y)) {
      return parse_object(/\s*\}/y)
    } else {
      return expect(/[^\s\[\]{}"\\]+/yu, `expression`)
    }
  }

  let parse_object = end => make({}, x => {
    while (accept(end) == null) {
      let [k, i0, v] = [parse(), i, parse()]
      if (k in x) throw new Error(`Duplicate key \`${k}' (${
        i = i0 - k.length, location()
      })`); else x[k] = v
    }
  })

  let x = parse()
  if (typeof x == "string" && accept(/\s*$/y) == null) {
    return i = 0, parse_object(/\s*$/y)
  } else {
    return accept(/\s*/y), expect(/$/y, `end of file`), x
  }
}
